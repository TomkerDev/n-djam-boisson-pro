import type { z } from "zod";
import { AppError } from "./errors.js";

/**
 * Valide une entree et leve une `AppError` 400 exploitable par le gestionnaire
 * d'erreurs global.
 *
 * Centraliser ici evite que chaque route redemande une classe d'erreur
 * differente, et garantit un format de message identique partout.
 */
export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join(".") || "corps"}: ${issue.message}`)
      .join(" ; ");

    throw new AppError(400, "VALIDATION_ERROR", message);
  }

  return result.data;
}

/** Meme chose pour un parametre de requete (`params`, `query`). */
export const parseParamOrThrow = parseOrThrow;