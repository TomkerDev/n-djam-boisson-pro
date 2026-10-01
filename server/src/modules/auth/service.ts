import argon2 from "argon2";
import type {
  LoginInput,
  RegisterClientInput,
  RegisterDriverInput,
  RegisterSupplierInput,
} from "@ndjam/shared";
import { config } from "../../config.js";
import { conflict, unauthorized } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { generateRefreshToken, hashToken, signAccessToken } from "../../lib/tokens.js";

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: { id: string; role: string; fullName: string };
}

interface TokenSubject {
  id: string;
  role: string;
  fullName: string;
  depot: { id: string } | null;
}

/**
 * Parametres de hachage argon2id.
 *
 * `memoryCost: 19456` suit les recommandations OWASP pour argon2id. En dessous,
 * un attaquant disposant de la base pourrait bruteforcer les mots de passe dans
 * un budget raisonnable.
 */
const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

const subjectSelect = {
  id: true,
  role: true,
  fullName: true,
  depot: { select: { id: true } },
} as const;

export const hashPassword = (plain: string): Promise<string> =>
  argon2.hash(plain, HASH_OPTIONS);

/**
 * Verifie un mot de passe en temps constant.
 *
 * Argon2 compare en temps constant par construction, mais un compte inexistant
 * doit tout de meme declencher un hachage factice : sans cela, le temps de
 * reponse permettrait d'enumerer les comptes existants.
 */
async function verifyPassword(hash: string | null, plain: string): Promise<boolean> {
  if (hash === null) {
    await argon2.hash(plain, HASH_OPTIONS);
    return false;
  }
  return argon2.verify(hash, plain);
}

async function issueTokens(user: TokenSubject): Promise<AuthResult> {
  const accessToken = await signAccessToken(
    { sub: user.id, role: user.role, depotId: user.depot?.id ?? null },
    config.JWT_SECRET,
    config.ACCESS_TOKEN_TTL_MINUTES,
  );

  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + config.REFRESH_TOKEN_TTL_DAYS * 86_400_000);

  await prisma.refreshToken.create({
    data: { tokenHash: hashToken(refreshToken), userId: user.id, expiresAt },
  });

  return {
    accessToken,
    refreshToken,
    expiresInSeconds: config.ACCESS_TOKEN_TTL_MINUTES * 60,
    user: { id: user.id, role: user.role, fullName: user.fullName },
  };
}

async function ensurePhoneIsFree(phone: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) throw conflict("Un compte existe deja avec ce numero");
}
export async function registerClient(input: RegisterClientInput): Promise<AuthResult> {
  await ensurePhoneIsFree(input.phone);

  const user = await prisma.user.create({
    data: {
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      fullName: input.managerName,
      role: "CLIENT",
      client: {
        create: {
          establishmentName: input.establishmentName,
          latitude: input.latitude,
          longitude: input.longitude,
        },
      },
    },
    select: subjectSelect,
  });

  return issueTokens(user);
}

export async function registerSupplier(input: RegisterSupplierInput): Promise<AuthResult> {
  await ensurePhoneIsFree(input.phone);

  const user = await prisma.user.create({
    data: {
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      fullName: input.managerName,
      role: "SUPPLIER",
      depot: { create: { name: input.depotName } },
    },
    select: subjectSelect,
  });

  return issueTokens(user);
}

/**
 * Inscrit un livreur dans un depot choisi par un ADMIN.
 *
 * Le depot cible n'est pas fourni par le livreur lui-meme : sinon il pourrait
 * s'attribuer n'importe quel perimetre commercial.
 */
export async function registerDriver(
  input: RegisterDriverInput,
  depotId: string,
): Promise<AuthResult> {
  await ensurePhoneIsFree(input.phone);

  const depot = await prisma.depot.findUnique({ where: { id: depotId } });
  if (!depot) throw conflict("Depot introuvable");

  const user = await prisma.user.create({
    data: {
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      fullName: input.fullName,
      role: "DRIVER",
      driver: { create: { vehicleNumber: input.vehicleNumber, depotId } },
    },
    select: subjectSelect,
  });

  return issueTokens(user);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { phone: input.phone },
    select: { ...subjectSelect, passwordHash: true, isActive: true },
  });

  if (!user || !user.isActive) {
    // Hachage factice pour egaliser le temps de reponse.
    await verifyPassword(null, input.password);
    throw unauthorized("Identifiants invalides");
  }

  const valid = await verifyPassword(user.passwordHash, input.password);
  if (!valid) throw unauthorized("Identifiants invalides");

  return issueTokens(user);
}

/**
 * Rotation du refresh token : l'ancien est revoque et remplace.
 *
 * Si un jeton deja consomme est represente, c'est le signe qu'il a fuite : on
 * revoque alors toute la famille de jetons de cet utilisateur plutot que de
 * simplement echouer.
 */
export async function refresh(refreshToken: string): Promise<AuthResult> {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: { user: { select: { ...subjectSelect, isActive: true } } },
  });

  if (!stored) throw unauthorized("Jeton de rafraichissement invalide");

  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw unauthorized("Jeton de rafraichissement invalide");
  }

  if (stored.expiresAt.getTime() <= Date.now() || !stored.user.isActive) {
    throw unauthorized("Jeton de rafraichissement expire");
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return issueTokens(stored.user);
}

export async function logout(refreshToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}