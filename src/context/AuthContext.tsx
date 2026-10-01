import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  clearStoredSession,
  getStoredSession,
  request,
  setSessionListener,
  type StoredSession,
} from "@/lib/api";
import type { Role } from "@ndjam/shared/rbac";

export interface AuthState {
  session: StoredSession | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (phone: string, password: string) => Promise<void>;
  registerClient: (input: {
    establishmentName: string;
    managerName: string;
    phone: string;
    password: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
  registerSupplier: (input: {
    depotName: string;
    managerName: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  /** Verifie le role courant ; renvoie false et redirige si insuffisant. */
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface Credentials {
  accessToken: string;
  refreshToken: string;
  user: StoredSession["user"];
}

const isRole = (value: string): value is Role =>
  ["CLIENT", "SUPPLIER", "DRIVER", "ADMIN"].includes(value);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => getStoredSession());
  const [isLoading, setIsLoading] = useState(true);

  /**
   * La session est stockee par `lib/api` lors de la connexion et de chaque
   * rotation. On s'y abonne pour que l'interface reste synchronisee sans
   * que les composants aient a relire le stockage.
   */
  useEffect(() => {
    setSessionListener((next) => setSession(next));
    return () => setSessionListener(null);
  }, []);

  /**
   * Verification de la session au chargement.
   *
   * Un jeton present peut avoir expire depuis la derniere visite : sans cette
   * verification, l'utilisateur atterrit sur un écran protege qui echoue
   * silencieusement sur sa premiere requete.
   */
  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!getStoredSession()) {
        setIsLoading(false);
        return;
      }

      try {
        const me = await request<{ id: string; role: Role }>("/api/auth/me");
        if (!cancelled) setSession((prev) => (prev ? { ...prev, user: { ...prev.user, id: me.id, role: me.role } } : prev));
      } catch (error) {
        // Seul un echec d'authentification invalide la session : une coupure
        // reseau ne doit pas deconnecter l'utilisateur.
        if (error instanceof ApiError && error.isAuthFailure && !cancelled) {
          clearStoredSession();
          setSession(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const data = await request<Credentials>("/api/auth/login", {
      method: "POST",
      body: { phone, password },
      skipAuth: true,
    });
    setSession(data);
  }, []);

  const registerClient = useCallback(
    async (input: {
      establishmentName: string;
      managerName: string;
      phone: string;
      password: string;
      latitude?: number;
      longitude?: number;
    }) => {
      const data = await request<Credentials>("/api/auth/register/client", {
        method: "POST",
        body: input,
        skipAuth: true,
      });
      setSession(data);
    },
    [],
  );

  const registerSupplier = useCallback(
    async (input: { depotName: string; managerName: string; phone: string; password: string }) => {
      const data = await request<Credentials>("/api/auth/register/supplier", {
        method: "POST",
        body: input,
        skipAuth: true,
      });
      setSession(data);
    },
    [],
  );

  const logout = useCallback(async () => {
    const current = getStoredSession();
    clearStoredSession();
    setSession(null);
    if (current?.refreshToken) {
      // Le jeton est deja invalide cote front : un echec ici n'a pas d'impact.
      await request("/api/auth/logout", {
        method: "POST",
        body: { refreshToken: current.refreshToken },
        skipAuth: true,
      }).catch(() => undefined);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role = session && isRole(session.user.role) ? session.user.role : null;

    return {
      session,
      role,
      isAuthenticated: session !== null,
      isLoading,
      login,
      registerClient,
      registerSupplier,
      logout,
      hasRole: (...roles: Role[]) => role !== null && roles.includes(role),
    };
  }, [session, isLoading, login, registerClient, registerSupplier, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un <AuthProvider>");
  }
  return context;
}