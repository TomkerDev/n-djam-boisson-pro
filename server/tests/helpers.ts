import { randomBytes } from "node:crypto";
import { buildApp } from "../src/app.js";
import { config } from "../src/config.js";
import { prisma } from "../src/lib/prisma.js";
import { signAccessToken } from "../src/lib/tokens.js";

export interface TestUser {
  userId: string;
  accessToken: string;
  phone: string;
}

export interface TestDriver extends TestUser {
  /**
   * Identifiant de la ligne `Driver`, et non de l'utilisateur.
   *
   * L'API d'attribution attend l'identifiant du livreur au sens metier ; les
   * confondre avec `userId` est une erreur frequente, d'ou un type distinct.
   */
  driverId: string;
}

export const PASSWORD = "MotDePasseTest2024";

/** Hachage factice : aucun test ne se connecte par mot de passe a un livreur. */
const PLACEHOLDER_HASH = "argon2id$v=19$m=19456,t=2,p=1$placeholder$placeholder";

/**
 * Numero de test au format `+235XXXXXXXX` (8 chiffres apres l'indicatif).
 *
 * Le compteur a un seul chiffre suffit : au-dela de 9 creations dans la meme
 * milliseconde, l'unicite n'est plus garantie, ce qui est acceptable pour une
 * base de test remise a zero avant chaque cas.
 */
let phoneCounter = 0;
export const uniquePhone = (): string => {
  phoneCounter = (phoneCounter + 1) % 10;
  const stamp = String(Date.now()).slice(-6);
  return `+2356${stamp}${phoneCounter}`;
};

type App = Awaited<ReturnType<typeof buildApp>>;

/** Vide les tables metier sans toucher au schema. */
export async function truncateAll(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "Delivery", "OrderItem", "Order", "Product", "Driver", "Depot", "Client", "RefreshToken", "User" RESTART IDENTITY CASCADE`,
  );
}

async function tokenFor(user: {
  id: string;
  role: string;
  depot: { id: string } | null;
}): Promise<string> {
  return signAccessToken(
    { sub: user.id, role: user.role, depotId: user.depot?.id ?? null },
    config.JWT_SECRET,
    config.ACCESS_TOKEN_TTL_MINUTES,
  );
}

/**
 * Cree un client ou un fournisseur via les routes HTTP.
 *
 * On passe par l'API et non par une insertion directe : le hachage du mot de
 * passe et la creation du depot sont alors exercised par le meme chemin que la
 * production.
 */
export async function createUser(app: App, role: "client" | "supplier"): Promise<TestUser> {
  const phone = uniquePhone();

  const path =
    role === "client" ? "/api/auth/register/client" : "/api/auth/register/supplier";

  const payload =
    role === "client"
      ? {
          establishmentName: `Bar ${phone.slice(-4)}`,
          managerName: "Gerant Test",
          phone,
          password: PASSWORD,
        }
      : {
          depotName: `Depot ${phone.slice(-4)}`,
          managerName: "Fournisseur Test",
          phone,
          password: PASSWORD,
        };

  const response = await app.inject({ method: "POST", url: path, payload });
  if (response.statusCode !== 200) {
    throw new Error(`Creation ${role} impossible : ${response.statusCode} ${response.body}`);
  }

  const body = response.json() as { accessToken: string; user: { id: string } };
  return { userId: body.user.id, accessToken: body.accessToken, phone };
}

/** Cree un depot sans passer par l'API, pour_tests d'isolation multi-depots. */
export async function createDepot(name: string): Promise<string> {
  const user = await prisma.user.create({
    data: {
      phone: uniquePhone(),
      passwordHash: PLACEHOLDER_HASH,
      fullName: "Gestionnaire",
      role: "ADMIN",
      depot: { create: { name } },
    },
    select: { depot: { select: { id: true } } },
  });

  const depot = user.depot;
  if (!depot) throw new Error("Creation du depot impossible");
  return depot.id;
}

/** Livreur rattache au depot, avec un jeton d'acces signe. */
export async function createDriver(depotId: string): Promise<TestDriver> {
  const phone = uniquePhone();

  const user = await prisma.user.create({
    data: {
      phone,
      passwordHash: PLACEHOLDER_HASH,
      fullName: "Livreur Test",
      role: "DRIVER",
      driver: {
        create: {
          vehicleNumber: `TD-${randomBytes(2).toString("hex").toUpperCase()}`,
          depotId,
        },
      },
    },
    select: {
      id: true,
      role: true,
      depot: { select: { id: true } },
      driver: { select: { id: true } },
    },
  });

  // `id` de Driver et `id` de User coincident : on verifie que le livreur a
  // bien ete cree, pas que les deux identifiants soient distincts.
  if (!user.driver) throw new Error("Creation du livreur impossible");

  return {
    userId: user.id,
    accessToken: await tokenFor(user),
    phone,
    driverId: user.id,
  };
}

/** Depot associe a un fournisseur, pour y rattacher ses produits. */
export async function depotIdOf(supplier: TestUser): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: supplier.userId },
    select: { depot: { select: { id: true } } },
  });

  const depot = user?.depot;
  if (!depot) throw new Error("Depot du fournisseur introuvable");
  return depot.id;
}

export async function createProduct(depotId: string, name: string, priceFcfa: number) {
  return prisma.product.create({
    data: { depotId, name, priceFcfa, unit: "casier" },
    select: { id: true },
  });
}

export { prisma };