import type { CreateOrderInput } from "@ndjam/shared";
import { orderScopeFor, type Role } from "@ndjam/shared";
import type { Prisma } from "@prisma/client";
import { config } from "../../config.js";
import { badRequest, conflict, forbidden, notFound } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

/** Depot sert a deux choses : choisir le fournisseur et garantir le cloisonnement. */
interface Actor {
  userId: string;
  role: Role;
  depotId: string | null;
}

const orderInclude = {
  items: { include: { product: { select: { name: true, unit: true } } } },
  depot: { select: { id: true, name: true } },
} as const;

export interface OrderReference {
  id: string;
  reference: string;
  clientId: string;
  depotId: string;
  status: string;
  subtotalFcfa: number;
  commissionFcfa: number;
  totalFcfa: number;
}

/**
 * Liste les commandes visibles par l'acteur.
 *
 * Le filtre est construit UNIQUEMENT a partir de la session. Aucun parametre
 * de requete ne participe au cloisonnement : passer `?clientId=` ou
 * `?depotId=` dans l'URL n'a donc aucun effet, ce qui est la seule maniere
 * fiable de ne pas dependre d'un oubli de filtrage.
 */
export async function listOrders(actor: Actor): Promise<OrderReference[]> {
  const scope = orderScopeFor(actor.role, actor);

  if (scope === null) {
    // Un livreur n'a pas de portee sur les commandes : refus explicite plutot
    // qu'une liste vide, qui serait indiscernable d'un bug.
    throw forbidden("Les livraisons se consultent via l'espace livreur");
  }

  return prisma.order.findMany({
    where: scope,
    select: {
      id: true,
      reference: true,
      clientId: true,
      depotId: true,
      status: true,
      subtotalFcfa: true,
      commissionFcfa: true,
      totalFcfa: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Recupere une commande en appliquant le meme cloisonnement que `listOrders`.
 *
 * Renvoie 404 et non 403 pour une commande qui existe mais appartient a autrui :
 * repondre 403 confirmerait a l'appelant que la ressource existe.
 */
export async function getOrder(actor: Actor, orderId: string) {
  const scope = orderScopeFor(actor.role, actor);
  if (scope === null) throw forbidden("Acces refuse");

  const order = await prisma.order.findFirst({
    where: { AND: [{ id: orderId }, scope] },
    include: orderInclude,
  });

  if (!order) throw notFound("Commande introuvable");
  return order;
}

/** Paiement declare par le client -> enum Prisma. */
const PAYMENT_METHOD_MAP = {
  cod: "COD",
  moov: "MOOV",
  airtel: "AIRTEL",
} as const;

/**
 * Reference lisible et stable.
 *
 * Une sequence PostgreSQL est utilisee plutot qu'un `count() + 1` : deux
 * commandes creees simultanement obtenaient sinon la meme reference, et la
 * contrainte d'unicite ferait echouer une des deux requetes.
 */
async function nextOrderReference(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const rows = (await tx.$queryRawUnsafe(
    `SELECT nextval('order_reference_seq')::bigint AS value`,
  )) as Array<{ value: bigint }>;

  const value = rows[0]?.value;
  if (value === undefined) throw new Error("Sequence de reference indisponible");
  return `CMD-${String(value).padStart(4, "0")}`;
}

/**
 * Cree une commande pour le client authentifie.
 *
 * Le `clientId` provient de la session : un client ne peut pas commander pour
 * un autre etablissement, meme en forgeant le corps de la requete.
 */
export async function createOrder(actor: Actor, input: CreateOrderInput) {
  if (actor.role !== "CLIENT") {
    throw forbidden("Seul un client peut creer une commande");
  }

  // `Client.id` vaut `User.id` : la recherche se fait directement par
  // l'identifiant de session.
  const client = await prisma.client.findUnique({
    where: { id: actor.userId },
    include: { user: { select: { phone: true } } },
  });
  if (!client) throw notFound("Profil client introuvable");

  if (client.quotaUsed >= client.monthlyOrderQuota) {
    throw conflict("Quota de commandes mensuel atteint");
  }

  const productIds = input.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  const found = new Map(products.map((product) => [product.id, product]));
  for (const item of input.items) {
    if (!found.has(item.productId)) {
      throw badRequest(`Produit indisponible : ${item.productId}`);
    }
  }

  // Une commande ne peut concerner qu'un seul depot : sinon la livraison et la
  // commission deposees chez plusieurs fournisseurs deviendraient ambigues.
  const depotIds = new Set(products.map((product) => product.depotId));
  if (depotIds.size !== 1) {
    throw badRequest("Une commande doit concerner les produits d'un seul depot");
  }
  const depotId = [...depotIds][0]!;

  const subtotalFcfa = input.items.reduce((sum, item) => {
    const product = found.get(item.productId)!;
    return sum + product.priceFcfa * item.quantity;
  }, 0);

  const commissionFcfa = Math.round(subtotalFcfa * config.commissionRate);
  const totalFcfa = subtotalFcfa + commissionFcfa;

  const order = await prisma.$transaction(async (tx) => {
    const reference = await nextOrderReference(tx);

    const created = await tx.order.create({
      data: {
        reference,
        clientId: client.id,
        depotId,
        status: "PENDING",
        paymentMethod: PAYMENT_METHOD_MAP[input.paymentMethod],
        subtotalFcfa,
        commissionFcfa,
        totalFcfa,
        deliveryAddress: client.establishmentName,
        deliveryPhone: client.user.phone,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPriceFcfa: found.get(item.productId)!.priceFcfa,
          })),
        },
      },
      include: orderInclude,
    });

    await tx.client.update({
      where: { id: client.id },
      data: { quotaUsed: { increment: 1 } },
    });

    return created;
  });

  return order;
}