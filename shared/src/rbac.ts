/**
 * Roles applicatifs. Chaque compte appartient a exactement un role.
 */
export const ROLES = ["CLIENT", "SUPPLIER", "DRIVER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

/**
 * Permissions atomiques, exprimees sous la forme `ressource:action`.
 *
 * Le suffixe `own` designe une ressource attachee a l'utilisateur authentifie,
 * dont la portee est determinee par la session. Le suffixe `depot` designe une
 * ressource rattachee au perimetre du fournisseur. Ces deux formes sont les
 * seuls cloisonnements reellement appliques cote serveur.
 */
export const PERMISSIONS = [
  // Catalogue
  "product:read",
  "product:manage",
  // Commandes
  "order:create",
  "order:read:own",
  "order:read:depot",
  "order:update:status",
  "order:assign",
  "order:cancel:own",
  // Livraisons
  "delivery:read:own",
  "delivery:read:depot",
  "delivery:confirm",
  // Livreurs
  "driver:read:depot",
  "driver:update:status",
  // Comptes
  "user:read:own",
  "user:manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/**
 * Matrice role -> permissions.
 *
 * Point de vigilance : `order:read:own` et `order:read:depot` sont deux
 * permissions DISTINCTES. Un fournisseur n'herite pas de `own`, ce qui garantit
 * qu'aucune requete de liste ne puisse reutiliser un filtre client.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  CLIENT: [
    "product:read",
    "order:create",
    "order:read:own",
    "order:cancel:own",
    "user:read:own",
  ],
  SUPPLIER: [
    "product:read",
    "product:manage",
    "order:read:depot",
    "order:update:status",
    "order:assign",
    "driver:read:depot",
    "driver:update:status",
    "user:read:own",
  ],
  DRIVER: ["product:read", "delivery:read:own", "delivery:confirm", "user:read:own"],
  ADMIN: PERMISSIONS,
};

/** Verifie qu'un role dispose d'une permission. */
export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Verifie qu'une valeur arbitraire correspond a un Role connu. */
export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Portee de lecture d'un role sur les commandes.
 *
 * Cette fonction est la source de verite utilisee par les services : elle
 * traduit un role et une session en filtre Prisma. Aucun filtre issu du client
 * (query string ou body) ne doit etre combine a ce resultat.
 *
 * Retourne `null` lorsque le role n'a aucune portee sur les commandes, ce qui
 * doit se traduire par un refus et non par une liste vide cote appelant.
 */
export function orderScopeFor(
  role: Role,
  session: { userId: string; depotId?: string | null },
): { clientId?: string; depotId?: string } | null {
  switch (role) {
    case "CLIENT":
      return { clientId: session.userId };
    case "SUPPLIER":
      return session.depotId ? { depotId: session.depotId } : null;
    case "ADMIN":
      return {};
    case "DRIVER":
      // Un livreur n'a pas de portee directe sur les commandes : il passe par
      // les livraisons qui lui sont attribuees.
      return null;
  }
}