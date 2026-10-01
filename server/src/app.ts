import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { config } from "./config.js";
import { AppError } from "./lib/errors.js";
import { authenticate } from "./plugins/auth.js";
import { authRoutes } from "./modules/auth/routes.js";
import { orderRoutes } from "./modules/orders/routes.js";
import { deliveryRoutes } from "./modules/deliveries/routes.js";
import { adminRoutes, supplierRoutes } from "./modules/supplier/routes.js";
import { productRoutes } from "./modules/products/routes.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.isProduction
      ? { level: "info" }
      : { level: "info", transport: undefined },
    // Le corps est limite a 1 Mo : un depot de boissons se decrit en quelques
    // lignes, au-dela c'est tres probablement une attaque.
    bodyLimit: 1_048_576,
    trustProxy: true,
  });

  await app.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });

  /**
   * Sonde de disponibilite. Publique : un orchestrateur ne peut pas s'authentifier.
   */
  app.get("/health", { config: { public: true } }, async () => ({ status: "ok" }));

  /**
   * Gestionnaires d'erreurs et de 404.
   *
   * Enregistres AVANT les routes, et sur l'instance racine : Fastify capture
   * le gestionnaire au moment du `register`, si bien qu'un gestionnaire pose
   * apres l'enregistrement des routes n'est jamais appele par celles-ci.
   */
  app.setNotFoundHandler(async (_request, reply) => {
    await reply.code(404).send({
      error: { code: "ROUTE_NOT_FOUND", message: "Ressource inexistante" },
    });
  });

  /**
   * Authentification globale.
   *
   * Enregistree AVANT les routes metier, elle s'applique a toutes. Les routes
   * publiques s'y exemptent via `{ public: true }`.
   */
  app.addHook("preHandler", authenticate);

  app.setErrorHandler(async (error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: { code: "VALIDATION_ERROR", message: error.message },
      });
    }

    if (error instanceof AppError) {
      if (error.statusCode >= 500) request.log.error(error);
      return reply.code(error.statusCode).send({
        error: { code: error.code, message: error.message },
      });
    }

    // Corps envoye avec un Content-Type non gere par Fastify.
    if ((error as { code?: string }).code === "FST_ERR_CTP_INVALID_MEDIA_TYPE") {
      return reply.code(415).send({
        error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Content-Type non supporte" },
      });
    }

    if ((error as { statusCode?: number }).statusCode === 429) {
      return reply.code(429).send({
        error: { code: "RATE_LIMITED", message: "Trop de requetes" },
      });
    }

    request.log.error(error);

    // Le detail n'est renvoye qu'hors production : une stack revele
    // l'arborescence du projet et les requetes SQL exactes.
    const detail =
      config.isProduction || !(error instanceof Error) ? undefined : error.message;

    return reply.code(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Erreur interne",
        ...(detail ? { detail } : {}),
      },
    });
  });

  /**
   * Routes metier.
   *
   * Le prefixe `/api` les regroupe et reserve `/health` au sonde.
   */
  await app.register(
    async (api) => {
      await api.register(authRoutes, { prefix: "/auth" });
      await api.register(productRoutes, { prefix: "/products" });
      await api.register(orderRoutes, { prefix: "/orders" });
      await api.register(deliveryRoutes, { prefix: "/deliveries" });
      await api.register(supplierRoutes, { prefix: "/supplier" });
      await api.register(adminRoutes, { prefix: "/admin" });
    },
    { prefix: "/api" },
  );

  return app;
}