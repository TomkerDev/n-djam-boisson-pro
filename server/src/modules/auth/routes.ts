import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { loginSchema, registerClientSchema, registerSupplierSchema } from "@ndjam/shared";
import { parseOrThrow } from "../../lib/validation.js";
import { requireSession } from "../../plugins/auth.js";
import { login, logout, refresh, registerClient, registerSupplier } from "./service.js";

const refreshSchema = z.object({ refreshToken: z.string().min(1) });

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Routes publiques : declarees explicitement, jamais implicitement.
  app.post(
    "/login",
    { config: { public: true } },
    async (request) => login(parseOrThrow(loginSchema, request.body)),
  );

  app.post(
    "/register/client",
    { config: { public: true } },
    async (request) => registerClient(parseOrThrow(registerClientSchema, request.body)),
  );

  app.post(
    "/register/supplier",
    { config: { public: true } },
    async (request) => registerSupplier(parseOrThrow(registerSupplierSchema, request.body)),
  );

  app.post(
    "/refresh",
    { config: { public: true } },
    async (request) => refresh(parseOrThrow(refreshSchema, request.body).refreshToken),
  );

  app.post(
    "/logout",
    { config: { public: true } },
    async (request, reply) => {
      await logout(parseOrThrow(refreshSchema, request.body).refreshToken);
      return reply.code(204).send();
    },
  );

  // Sonde la session courante : sert au front a savoir s'il doit rediriger.
  // Ne renvoie aucune donnee sensible.
  app.get("/me", async (request) => {
    const session = requireSession(request);
    return { id: session.userId, role: session.role, depotId: session.depotId };
  });
}