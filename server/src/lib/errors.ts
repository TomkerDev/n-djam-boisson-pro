/**
 * Erreurs metier portant un code HTTP.
 *
 * Le choix entre 403 et 404 a une consquence de securite : renvoyer 403 sur une
 * ressource qui appartient a autrui confirme au demandeur que la ressource
 * existe. On repond donc 404 par defaut, et 403 uniquement quand la ressource
 * est bien visible mais que l'action est refusee au role.
 */
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const unauthorized = (message = "Authentification requise") =>
  new AppError(401, "UNAUTHORIZED", message);

export const forbidden = (message = "Acces refuse pour ce role") =>
  new AppError(403, "FORBIDDEN", message);

/**
 * Absence de droits OU ressource inexistante : indistinguable pour l'appelant,
 * c'est le comportement souhaite pour ne pas divulguer l'existence de la
 * ressource d'autrui.
 */
export const notFound = (message = "Ressource introuvable") =>
  new AppError(404, "NOT_FOUND", message);

export const badRequest = (message: string) =>
  new AppError(400, "BAD_REQUEST", message);

export const conflict = (message: string) => new AppError(409, "CONFLICT", message);