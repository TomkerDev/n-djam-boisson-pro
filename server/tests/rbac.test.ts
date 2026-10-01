import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import {
  createDepot,
  createDriver,
  createProduct,
  createUser,
  depotIdOf,
  truncateAll,
  type TestUser,
} from "./helpers.js";

type App = Awaited<ReturnType<typeof buildApp>>;

let app: App;

const auth = (user: TestUser) => ({ authorization: `Bearer ${user.accessToken}` });

/** Cree une commande pour un client et renvoie son id et sa reference. */
async function createOrderFor(
  client: TestUser,
  productId: string,
  quantity = 1,
): Promise<{ id: string; reference: string }> {
  const response = await app.inject({
    method: "POST",
    url: "/api/orders",
    headers: auth(client),
    payload: {
      items: [{ productId, quantity }],
      paymentMethod: "cod",
    },
  });

  if (response.statusCode !== 201) {
    throw new Error(`Creation de commande impossible : ${response.statusCode} ${response.body}`);
  }

  return response.json() as { id: string; reference: string };
}

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await truncateAll();
});

describe("Authentification", () => {
  it("refuse une requete sans jeton", async () => {
    const response = await app.inject({ method: "GET", url: "/api/orders" });
    expect(response.statusCode).toBe(401);
  });

  it("refuse un jeton de signature invalide", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/orders",
      headers: { authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.e30.invalide" },
    });
    expect(response.statusCode).toBe(401);
  });

  it("laisse la sonde de sante publique", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
  });

  it("rejette un mot de passe trop court a l inscription", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register/client",
      payload: {
        establishmentName: "Bar Test",
        managerName: "Gerant",
        phone: "+23566112233",
        password: "court",
      },
    });
    expect(response.statusCode).toBe(400);
  });
});

describe("Cloisonnement des commandes entre clients", () => {
  it("ne renvoie a un client que ses propres commandes", async () => {
    const supplier = await createUser(app, "supplier");
    const depotId = await depotIdOf(supplier);
    const product = await createProduct(depotId, "Casier Flag", 12_000);

    const alice = await createUser(app, "client");
    const bob = await createUser(app, "client");

    await createOrderFor(alice, product.id);

    const aliceList = await app.inject({
      method: "GET",
      url: "/api/orders",
      headers: auth(alice),
    });
    const bobList = await app.inject({
      method: "GET",
      url: "/api/orders",
      headers: auth(bob),
    });

    expect(aliceList.json()).toHaveLength(1);
    expect(bobList.json()).toHaveLength(0);
  });

  it("renvoie 404 et non 403 sur la commande d'un autre client", async () => {
    const supplier = await createUser(app, "supplier");
    const depotId = await depotIdOf(supplier);
    const product = await createProduct(depotId, "Casier Gala", 11_000);

    const alice = await createUser(app, "client");
    const mallory = await createUser(app, "client");
    const order = await createOrderFor(alice, product.id);

    const response = await app.inject({
      method: "GET",
      url: `/api/orders/${order.id}`,
      headers: auth(mallory),
    });

    // 404 et non 403 : un 403 confirmerait que la commande existe.
    expect(response.statusCode).toBe(404);
  });

  it("ignore les filtres de cloisonnement injectes dans l'URL", async () => {
    const supplier = await createUser(app, "supplier");
    const depotId = await depotIdOf(supplier);
    const product = await createProduct(depotId, "Casier 33 Export", 11_500);

    const alice = await createUser(app, "client");
    const bob = await createUser(app, "client");
    const order = await createOrderFor(alice, product.id);

    // Bob tente de forcer le filtrage par l'identifiant de Alice.
    const response = await app.inject({
      method: "GET",
      url: `/api/orders?clientId=${encodeURIComponent(alice.userId)}&depotId=${encodeURIComponent(depotId)}`,
      headers: auth(bob),
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(0);
    void order;
  });
});
describe("Cloisonnement entre depots (fournisseurs)", () => {
  it("ne montre a un fournisseur que les commandes de son depot", async () => {
    const supplierA = await createUser(app, "supplier");
    const supplierB = await createUser(app, "supplier");
    const depotA = await depotIdOf(supplierA);
    const depotB = await depotIdOf(supplierB);

    const productA = await createProduct(depotA, "Casier A", 10_000);
    const productB = await createProduct(depotB, "Casier B", 20_000);

    const client = await createUser(app, "client");
    const orderA = await createOrderFor(client, productA.id);
    const orderB = await createOrderFor(client, productB.id);

    const listA = await app.inject({ method: "GET", url: "/api/orders", headers: auth(supplierA) });
    const listB = await app.inject({ method: "GET", url: "/api/orders", headers: auth(supplierB) });

    const idsA = (listA.json() as Array<{ id: string }>).map((order) => order.id);
    const idsB = (listB.json() as Array<{ id: string }>).map((order) => order.id);

    expect(idsA).toContain(orderA.id);
    expect(idsA).not.toContain(orderB.id);
    expect(idsB).toContain(orderB.id);
    expect(idsB).not.toContain(orderA.id);
  });

  it("interdit d'attribuer la commande d'un depot concurrent", async () => {
    const supplierA = await createUser(app, "supplier");
    const supplierB = await createUser(app, "supplier");
    const depotA = await depotIdOf(supplierA);
    const depotB = await depotIdOf(supplierB);

    const productA = await createProduct(depotA, "Casier A", 10_000);
    const client = await createUser(app, "client");
    const orderA = await createOrderFor(client, productA.id);

    // Livreur du depot B, tentant d'attribuer la commande du depot A.
    const driverB = await createDriver(depotB);

    const response = await app.inject({
      method: "POST",
      url: `/api/supplier/orders/${orderA.id}/assign`,
      headers: auth(supplierB),
      payload: { driverId: driverB.driverId },
    });

    expect(response.statusCode).toBe(404);
  });

  it("interdit de choisir un livreur d'un autre depot", async () => {
    const supplierA = await createUser(app, "supplier");
    const otherDepot = await createDepot("Depot Tiers");

    const depotA = await depotIdOf(supplierA);
    const productA = await createProduct(depotA, "Casier A", 10_000);
    const client = await createUser(app, "client");
    const orderA = await createOrderFor(client, productA.id);

    const foreignDriver = await createDriver(otherDepot);

    const response = await app.inject({
      method: "POST",
      url: `/api/supplier/orders/${orderA.id}/assign`,
      headers: auth(supplierA),
      payload: { driverId: foreignDriver.driverId },
    });

    expect(response.statusCode).toBe(404);
  });

  it("n'expose aux fournisseurs que les livreurs de leur depot", async () => {
    const supplierA = await createUser(app, "supplier");
    const depotA = await depotIdOf(supplierA);
    const ownDriver = await createDriver(depotA);

    const otherDepot = await createDepot("Depot Tiers 2");
    const foreignDriver = await createDriver(otherDepot);

    const response = await app.inject({
      method: "GET",
      url: "/api/supplier/drivers",
      headers: auth(supplierA),
    });

    expect(response.statusCode).toBe(200);
    const drivers = response.json() as Array<{ id: string }>;
    const driverIds = drivers.map((driver) => driver.id);
    expect(drivers).toHaveLength(1);
    expect(driverIds).toContain(ownDriver.userId);
    // Le livreur du depot tiers n'apparait pas dans la liste.
    expect(driverIds).not.toContain(foreignDriver.userId);
  });
});
describe("Cloisonnement des tournees (livreurs)", () => {
  it("refuse l'espace livreur a un client", async () => {
    const client = await createUser(app, "client");
    const response = await app.inject({
      method: "GET",
      url: "/api/deliveries",
      headers: auth(client),
    });
    expect(response.statusCode).toBe(403);
  });

  it("ne montre a un livreur que ses propres livraisons", async () => {
    const supplier = await createUser(app, "supplier");
    const depotId = await depotIdOf(supplier);
    const product = await createProduct(depotId, "Casier Test", 12_000);

    const client = await createUser(app, "client");
    const driverOne = await createDriver(depotId);
    const driverTwo = await createDriver(depotId);

    const order = await createOrderFor(client, product.id);

    await app.inject({
      method: "POST",
      url: `/api/supplier/orders/${order.id}/assign`,
      headers: auth(supplier),
      payload: { driverId: driverOne.driverId },
    });

    const listOne = await app.inject({
      method: "GET",
      url: "/api/deliveries",
      headers: auth(driverOne),
    });
    const listTwo = await app.inject({
      method: "GET",
      url: "/api/deliveries",
      headers: auth(driverTwo),
    });

    expect(listOne.json() as unknown[]).toHaveLength(1);
    expect(listTwo.json() as unknown[]).toHaveLength(0);
  });

  it("refuse a un livreur de confirmer la livraison d'un collegue", async () => {
    const supplier = await createUser(app, "supplier");
    const depotId = await depotIdOf(supplier);
    const product = await createProduct(depotId, "Casier Test", 12_000);

    const client = await createUser(app, "client");
    const owner = await createDriver(depotId);
    const colleague = await createDriver(depotId);

    const order = await createOrderFor(client, product.id, 2);

    await app.inject({
      method: "POST",
      url: `/api/supplier/orders/${order.id}/assign`,
      headers: auth(supplier),
      payload: { driverId: owner.driverId },
    });

    const delivery = await prisma.delivery.findFirstOrThrow();

    const response = await app.inject({
      method: "POST",
      url: `/api/deliveries/${delivery.id}/confirm`,
      headers: auth(colleague),
      payload: { paymentMethod: "cash", amountReceived: 100_000, verificationCode: "A1B2" },
    });

    expect(response.statusCode).toBe(404);
  });
});
describe("Encaissement", () => {
  it("refuse un montant especes insuffisant", async () => {
    const supplier = await createUser(app, "supplier");
    const depotId = await depotIdOf(supplier);
    const product = await createProduct(depotId, "Casier Flag", 12_000);

    const client = await createUser(app, "client");
    const driver = await createDriver(depotId);
    // 12 000 + 10 % de commission = 13 200 FCFA a collecter.
    const order = await createOrderFor(client, product.id);

    await app.inject({
      method: "POST",
      url: `/api/supplier/orders/${order.id}/assign`,
      headers: auth(supplier),
      payload: { driverId: driver.driverId },
    });

    const delivery = await prisma.delivery.findFirstOrThrow();

    const response = await app.inject({
      method: "POST",
      url: `/api/deliveries/${delivery.id}/confirm`,
      headers: auth(driver),
      payload: { paymentMethod: "cash", amountReceived: 10_000, verificationCode: "A1B2" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.message).toContain("insuffisant");
  });

  it("refuse un code de verification mal forme", async () => {
    const supplier = await createUser(app, "supplier");
    const depotId = await depotIdOf(supplier);
    const product = await createProduct(depotId, "Casier Flag", 12_000);

    const client = await createUser(app, "client");
    const driver = await createDriver(depotId);
    const order = await createOrderFor(client, product.id);

    await app.inject({
      method: "POST",
      url: `/api/supplier/orders/${order.id}/assign`,
      headers: auth(supplier),
      payload: { driverId: driver.driverId },
    });

    const delivery = await prisma.delivery.findFirstOrThrow();

    const response = await app.inject({
      method: "POST",
      url: `/api/deliveries/${delivery.id}/confirm`,
      headers: auth(driver),
      payload: { paymentMethod: "cash", amountReceived: 20_000, verificationCode: "x" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("enregistre le paiement et calcule la monnaie rendue", async () => {
    const supplier = await createUser(app, "supplier");
    const depotId = await depotIdOf(supplier);
    const product = await createProduct(depotId, "Casier Flag", 12_000);

    const client = await createUser(app, "client");
    const driver = await createDriver(depotId);
    const order = await createOrderFor(client, product.id);

    await app.inject({
      method: "POST",
      url: `/api/supplier/orders/${order.id}/assign`,
      headers: auth(supplier),
      payload: { driverId: driver.driverId },
    });

    const delivery = await prisma.delivery.findFirstOrThrow();

    const response = await app.inject({
      method: "POST",
      url: `/api/deliveries/${delivery.id}/confirm`,
      headers: auth(driver),
      payload: { paymentMethod: "cash", amountReceived: 20_000, verificationCode: " a1b2 " },
    });

    expect(response.statusCode).toBe(200);

    const saved = await prisma.delivery.findUniqueOrThrow({
      where: { id: delivery.id },
      include: { order: { select: { totalFcfa: true, status: true, paymentStatus: true } } },
    });

    expect(saved.cashReceived).toBe(20_000);
    expect(saved.order.totalFcfa).toBe(13_200);
    expect(saved.changeGiven).toBe(6_800);
    expect(saved.order.status).toBe("DELIVERED");
    expect(saved.order.paymentStatus).toBe("PAID");
  });
});