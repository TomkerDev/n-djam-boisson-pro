/**
 * Client HTTP de l'API.
 *
 * Responsabilites :
 *  - joindre le jeton d'acces ;
 *  - renouveler le jeton de maniere transparente sur un 401, une seule fois
 *    par rafraichissement (les rafraichissements concurrents partagent la
 *    meme promesse, sinon dix requetes simultanees en declenchent dix
 *    rotations, dont neuf se font revoquer) ;
 *  - normaliser les erreurs en `ApiError`.
 */

const STORAGE_KEY = "ndjam.session.v1";

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: { id: string; role: string; fullName: string };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** 401 definitif : le refresh a echoue, la session doit etreFermee. */
  get isAuthFailure(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }
}

function readSession(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function getStoredSession(): StoredSession | null {
  return readSession();
}

export function clearStoredSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

function writeSession(session: StoredSession): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/** Notifie l'AuthContext qu'une session a ete remplacee apres rotation. */
let onSessionRefreshed: ((session: StoredSession) => void) | null = null;
export function setSessionListener(listener: ((s: StoredSession) => void) | null): void {
  onSessionRefreshed = listener;
}

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

/** Promesse de rotation partagee : evite N refreshs pour N requetes en 401. */
let refreshInFlight: Promise<StoredSession | null> | null = null;

async function performRefresh(): Promise<StoredSession | null> {
  const current = readSession();
  if (!current?.refreshToken) return null;

  try {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });

    if (!response.ok) {
      clearStoredSession();
      return null;
    }

    const data = (await response.json()) as Omit<StoredSession, "user"> & {
      user: StoredSession["user"];
    };

    const next: StoredSession = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    };

    writeSession(next);
    onSessionRefreshed?.(next);
    return next;
  } catch {
    // Erreur reseau : on ne deconnecte pas, la session peut encore etre valide.
    return null;
  }
}

function refresh(): Promise<StoredSession | null> {
  refreshInFlight ??= performRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Requete ne devant pas declencher de rotation (login, refresh). */
  skipAuth?: boolean;
}

async function send(path: string, options: RequestOptions, token?: string): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;

  return fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const data = (await response.json()) as { error?: { code?: string; message?: string } };
    return new ApiError(
      response.status,
      data.error?.code ?? "UNKNOWN",
      data.error?.message ?? "Une erreur est survenue",
    );
  } catch {
    return new ApiError(response.status, "UNKNOWN", `Erreur ${response.status}`);
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = options.skipAuth ? null : readSession();

  let response = await send(path, options, session?.accessToken);

  if (response.status === 401 && !options.skipAuth && session?.refreshToken) {
    const renewed = await refresh();
    if (!renewed) throw new ApiError(401, "SESSION_EXPIRED", "Session expiree");

    response = await send(path, options, renewed.accessToken);
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}