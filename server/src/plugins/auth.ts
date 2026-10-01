import type { FastifyReply, FastifyRequest } from "fastify";
import { can, isRole, type Permission, type Role } from "@ndjam/shared";
import { config } from "../config.js";
import { forbidden, unauthorized } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/tokens.js";

/**
 * Session etablie par `authenticate`, jamais fournie par le client.
 *
 * `depotId` est resolu en base a chaque requete et non relu dans le jeton : si
 * un livreur change de depot, il perd l'acces a l'ancien perimetre
 * immediatement, sans attendre l'expiration du jeton.
 */
export interface Session {
  userId: string;
  role: Role;
  depotId: string | null;
}

declare module "fastify" {
  interface FastifyRequest {
    session?: Session;
  }

  /**
   * Declaration d'extension du contexte de route : autorise
   * `{ public: true }` sur une route sans erreur de typage.
   */
  interface FastifyContextConfig {
    public?: boolean;
  }
}

const BEARER_PREFIX = "Bearer ";

function extractBearer(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith(BEARER_PREFIX)) return null;

  const token = header.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
}

/**
 * PreHook global : refuse toute requete sans jeton valide.
 *
 * Etre global garantit qu'aucune route ne puisse oublier la protection par
 * simple oubli de declaration. Les routes publiques (`/auth/login`,
 * `/auth/register`, `/health`) se declarent via `{ public: true }`.
 */
export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  if (request.routeOptions.config.public === true) return;

  const token = extractBearer(request);
  if (!token) {
    throw unauthorized("Jeton d'acces manquant");
  }

  const claims = await verifyAccessToken(token, config.JWT_SECRET);
  if (!claims || !isRole(claims.role)) {
    throw unauthorized("Jeton d'acces invalide ou expire");
  }

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: {
      id: true,
      role: true,
      isActive: true,
      depot: { select: { id: true } },
    },
  });

  if (!user || !user.isActive) {
    throw unauthorized("Compte introuvable ou desactive");
  }

  // Le role provient de la base et non du jeton : un jeton signe avec un ancien
  // role ne peut pas elever les privileges apres un changement de role.
  if (user.role !== claims.role) {
    throw unauthorized("Jeton d'acces perime, veuillez vous reconnecter");
  }

  request.session = {
    userId: user.id,
    role: user.role,
    depotId: user.depot?.id ?? null,
  };
}

type Authorize = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

/**
 * PreHook de route : exige une permission precise.
 *
 * Refus par defaut. Une route declaree sans permission reste protegee par
 * `authenticate`, mais ne dispose d'aucun acces metier : il faut l'ecrire
 * explicitement, ce qui rend chaque autorisation visible a la relecture.
 */
export function requirePermission(permission: Permission): Authorize {
  return async (request) => {
    const session = request.session;
    if (!session) throw unauthorized();

    if (!can(session.role, permission)) {
      throw forbidden(
        `Le role ${session.role} ne dispose pas de la permission ${permission}`,
      );
    }
  };
}

/**
 * PreHook de route : exige qu'au moins UNE des permissions soit posee.
 *
 * Indispensable des qu'une meme route sert plusieurs roles qui n'ont pas la
 * meme permission de lecture : exiger `order:read:own` seul refuserait les
 * fournisseurs, exiger `order:read:depot` seul refuserait les clients. La
 * portee exacte reste ensuite tranchee par le service, a partir de la session.
 */
export function requireAnyPermission(...permissions: Permission[]): Authorize {
  return async (request) => {
    const session = request.session;
    if (!session) throw unauthorized();

    if (!permissions.some((permission) => can(session.role, permission))) {
      throw forbidden(
        `Le role ${session.role} ne dispose d'aucune permission parmi ${permissions.join(", ")}`,
      );
    }
  };
}

/** Recupere la session ou leve une erreur : a utiliser dans les handlers. */
export function requireSession(request: FastifyRequest): Session {
  if (!request.session) throw unauthorized();
  return request.session;
}

/**
 * Verifie qu'un compte appartient a l'un des roles autorises.
 *
 * Complement de `requirePermission` : utile quand plusieurs roles partagent la
 * meme permission mais que la route doit restreindre a l'un d'eux.
 */
export function requireRoles(...roles: Role[]): Authorize {
  return async (request) => {
    const session = request.session;
    if (!session) throw unauthorized();

    if (!roles.includes(session.role)) {
      throw forbidden("Ce role n'accede pas a cette ressource");
    }
  };
}