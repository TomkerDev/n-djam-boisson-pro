import type { AssignOrderInput, ConfirmDeliveryInput } from "@ndjam/shared";
import { badRequest, conflict, forbidden, notFound } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

interface Actor {
  userId: string;
  role: string;
  depotId: string | null;
}

const deliveryInclude = {
  order: {
    select: {
      reference: true,
      clientId: true,
      depotId: true,
      totalFcfa: true,
      deliveryAddress: true,
      deliveryPhone: true,
      paymentMethod: true,
    },
  },
  driver: {
    select: {
      id: true,
      vehicleNumber: true,
      user: { select: { fullName: true, phone: true } },
    },
  },
  product: { select: { name: true, unit: true } },
} as const;

/**
 * Tournee du livreur authentifie.
 *
 * Le filtre `driverId` provient de la session. Aucun identifiant de livreur ne
 * peut etre fourni par l'appelant : un livreur ne voit donc jamais la tournee
 * d'un collegue, meme en changeant l'identifiant dans l'URL.
 */
export async function listMyDeliveries(actor: Actor) {
  if (actor.role !== "DRIVER") {
    throw forbidden("Espace reserve aux livreurs");
  }

  return prisma.delivery.findMany({
    where: { driverId: actor.userId },
    include: deliveryInclude,
    orderBy: { stopOrder: "asc" },
  });
}

/** Detail d'une livraison, avec le meme cloisonnement que la liste. */
export async function getMyDelivery(actor: Actor, deliveryId: string) {
  if (actor.role !== "DRIVER") {
    throw forbidden("Espace reserve aux livreurs");
  }

  const delivery = await prisma.delivery.findFirst({
    where: { AND: [{ id: deliveryId }, { driverId: actor.userId }] },
    include: deliveryInclude,
  });

  if (!delivery) throw notFound("Livraison introuvable");
  return delivery;
}

/**
 * Livreurs du depot, exposes au fournisseur pour lui permettre d'attribuer.
 *
 * Le filtre `depotId` vient de la session : un fournisseur ne voit pas les
 * livreurs des depots concurrents.
 */
export async function listDepotDrivers(actor: Actor) {
  if (actor.role !== "SUPPLIER" || !actor.depotId) {
    throw forbidden("Espace reserve aux fournisseurs");
  }

  return prisma.driver.findMany({
    where: { depotId: actor.depotId, user: { isActive: true } },
    select: {
      id: true,
      vehicleNumber: true,
      isAvailable: true,
      user: { select: { fullName: true, phone: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
/**
 * Attribue une commande a un livreur du meme depot.
 *
 * Deux garde-fous :
 *  1. le filtre `depotId` sur la commande interdit d'attribuer la commande
 *     d'un autre fournisseur ;
 *  2. le filtre `depotId` sur le livreur interdit de choisir un livreur
 *     d'un autre depot.
 *
 * Une commande introuvable ET une commande d'autrui produisent le meme 404 :
 * l'appelant ne peut pas confirmer l'existence d'une commande tierce.
 */
export async function assignOrder(
  actor: Actor,
  orderId: string,
  input: AssignOrderInput,
) {
  if (actor.role !== "SUPPLIER" || !actor.depotId) {
    throw forbidden("Espace reserve aux fournisseurs");
  }

  const driver = await prisma.driver.findFirst({
    where: { id: input.driverId, depotId: actor.depotId },
    select: { id: true },
  });
  if (!driver) throw notFound("Livreur introuvable dans ce depot");

  const order = await prisma.order.findFirst({
    where: { id: orderId, depotId: actor.depotId },
    select: {
      id: true,
      status: true,
      items: { select: { productId: true }, take: 1 },
    },
  });
  if (!order) throw notFound("Commande introuvable");
  if (order.status !== "PENDING") {
    throw conflict("Cette commande a deja ete attribuee");
  }

  const firstItem = order.items[0];
  if (!firstItem) throw conflict("Commande sans article");

  const pendingStops = await prisma.delivery.count({
    where: { driverId: driver.id, completedAt: null },
  });

  return prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.create({
      data: {
        orderId: order.id,
        driverId: driver.id,
        productId: firstItem.productId,
        stopOrder: pendingStops + 1,
        amountToCollect: 0,
      },
      include: deliveryInclude,
    });

    await tx.order.update({ where: { id: order.id }, data: { status: "ASSIGNED" } });

    return delivery;
  });
}

/**
 * Confirme la livraison et encaisse le paiement.
 *
 * Regles appliquees :
 *  - la livraison doit appartenir au livreur connecte ;
 *  - en especes, le montant recu doit couvrir le montant a collecter ;
 *  - le code de verification est normalise avant comparaison.
 */
export async function confirmDelivery(
  actor: Actor,
  deliveryId: string,
  input: ConfirmDeliveryInput,
) {
  if (actor.role !== "DRIVER") {
    throw forbidden("Espace reserve aux livreurs");
  }

  const delivery = await prisma.delivery.findFirst({
    where: { AND: [{ id: deliveryId }, { driverId: actor.userId }] },
    include: { order: { select: { totalFcfa: true } } },
  });

  if (!delivery) throw notFound("Livraison introuvable");
  if (delivery.completedAt) throw conflict("Livraison deja confirmee");

  const expected = delivery.order.totalFcfa;
  const received = input.amountReceived ?? 0;

  if (input.paymentMethod === "cash") {
    if (received <= 0) {
      throw badRequest("Le montant recu est obligatoire pour un paiement en especes");
    }
    if (received < expected) {
      throw badRequest(`Montant insuffisant : il manque ${expected - received} FCFA`);
    }
  }

  const normalizedCode = input.verificationCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{4}$/.test(normalizedCode)) {
    throw badRequest("Code de verification invalide");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.delivery.update({
      where: { id: delivery.id },
      data: {
        cashReceived: input.paymentMethod === "cash" ? received : null,
        changeGiven: input.paymentMethod === "cash" ? received - expected : null,
        completedAt: new Date(),
      },
      include: deliveryInclude,
    });

    await tx.order.update({
      where: { id: delivery.orderId },
      data: { status: "DELIVERED", paymentStatus: "PAID" },
    });

    return updated;
  });
}