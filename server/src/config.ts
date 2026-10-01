import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { z } from "zod";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Chargement du .env avec l'API native de Node (>= 20.6), sans dependance.
 *
 * `loadEnvFile` n'ecrase pas les variables deja presentes dans
 * l'environnement : la CI peut donc surcharger la configuration via ses
 * secrets, et les tests via des variables definees a la volee.
 */
const envPath = resolve(here, "..", ".env");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

/**
 * Configuration de l'API. L'echec doit survenir au demarrage : une variable
 * manquante ne doit jamais decouvrir une erreur en production, en cours de
 * requete, avec des consequences metier.
 */
const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL est obligatoire"),
  CORS_ORIGINS: z.string().default("http://localhost:8080"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET doit faire au moins 32 caracteres")
    .refine(
      (value) => !value.includes("remplacez-moi"),
      "JWT_SECRET est encore la valeur d'exemple : generez un secret reel",
    ),

  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  PLATFORM_COMMISSION_PERCENT: z.coerce.number().min(0).max(100).default(10),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `Configuration invalide.\n${details}\n\nCopiez .env.example vers .env et renseignez les variables manquantes.`,
  );
}

export const config = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  isTest: parsed.data.NODE_ENV === "test",
  corsOrigins: parsed.data.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  /** Commission en fraction : 10 % -> 0.1 */
  commissionRate: parsed.data.PLATFORM_COMMISSION_PERCENT / 100,
};