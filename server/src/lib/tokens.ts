import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify, errors as joseErrors } from "jose";

const ISSUER = "ndjam-api";
const AUDIENCE = "ndjam-web";

export interface AccessTokenClaims {
  sub: string;
  role: string;
  depotId: string | null;
}

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/**
 * Signe un jeton d'acces.
 *
 * La signature passe par la bibliotheque `jose` et non par du code local :
 * l'algorithme est impose par l'appel, et `jwtVerify` refuse par defaut tout
 * jeton dont l'en-tete `alg` ne correspond pas. Cela ferme la confusion
 * d'algorithme et la variante `alg: none`.
 *
 * Le jeton ne porte aucune donnee metier au-dela du role et du depot : il
 * authentifie, il n'autorise pas. Desactiver un compte exige donc une
 * revalidation en base ou une liste de revocation.
 */
export async function signAccessToken(
  claims: AccessTokenClaims,
  secret: string,
  ttlMinutes: number,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ role: claims.role, depotId: claims.depotId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + ttlMinutes * 60)
    .sign(secretKey(secret));
}

/** Verifie signature, expiration, issuer et audience. */
export async function verifyAccessToken(
  token: string,
  secret: string,
): Promise<AccessTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(secret), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string" || payload.sub.length === 0) return null;
    if (typeof payload.role !== "string") return null;

    return {
      sub: payload.sub,
      role: payload.role,
      depotId: typeof payload.depotId === "string" ? payload.depotId : null,
    };
  } catch (error) {
    // Seules les erreurs attendues (signature, expiration, format) sont
    // transformees en `null`. Une panne inattendue doit remonter.
    if (error instanceof joseErrors.JOSEError) return null;
    throw error;
  }
}

/**
 * Refresh token : jeton opaque aleatoire. Seul son hash SHA-256 est stocke en
 * base, donc une fuite de la base ne permet pas de rejouer des sessions.
 */
export function generateRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}