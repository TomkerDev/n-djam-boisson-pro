import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { Role } from "@ndjam/shared/rbac";
import { useAuth } from "@/context/AuthContext";

/**
 * Garde de routes cote client.
 *
 * Avertissement important : ce composant n'est PAS une barriere de securite.
 * Le RBAC reel est applique par l'API (voir `server/tests/rbac.test.ts`) ; un
 * utilisateur malveillant peut modifier l'URL et appeler l'API directement.
 *
 * Ce que la garde apporte est donc ergonomique et non normatif : elle evite
 * d'afficher un écran vide quand le role ne correspond pas, et elle oriente
 * l'utilisateur vers la bonne page d'accueil.
 */
export function RequireRole({
  roles,
  children,
}: {
  roles: readonly Role[];
  children: ReactNode;
}) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // On memorise la destination pour y revenir apres connexion.
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (role === null || !roles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/** Chemin d'accueil correspondant au role, apres connexion. */
export function homePathFor(role: Role | null): string {
  switch (role) {
    case "CLIENT":
      return "/client/dashboard";
    case "SUPPLIER":
      return "/fournisseur/dashboard";
    case "DRIVER":
      return "/livreur/dashboard";
    default:
      return "/";
  }
}