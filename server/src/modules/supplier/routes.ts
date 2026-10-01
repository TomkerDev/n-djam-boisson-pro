import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { assignOrderSchema, registerDriverSchema, uuidSchema } from "@ndjam/shared";
import { parseOrThrow } from "../../lib/validation.js";
import {
  requirePermission,
  requireRoles,
  requireSession,
} from "../../plugins/auth.js";
import { registerDriver } from "../auth/service.js";
import { assignOrder, listDepotDrivers } from "../deliveries/service.js";

const orderParamSchema = z.object({ orderId: uuidSchema });
const depotParamSchema = z.object({ depotId: uuidSchema });

/** Espace fournisseur : consultation des commandes et attribution. */
export async function supplierRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Livreurs du depot, pour attribution.
   * Le filtre `depotId` est applique dans le service a partir de la session.
   */
  app.get(
    "/drivers",
    { preHandler: requirePermission("driver:read:depot") },
    async (request) => listDepotDrivers(requireSession(request)),
  );

  app.post(
    "/orders/:orderId/assign",
    { preHandler: requirePermission("order:assign") },
    async (request, reply) => {
      const session = requireSession(request);
      const { orderId } = parseOrThrow(orderParamSchema, request.params);
      const input = parseOrThrow(assignOrderSchema, request.body);
      const delivery = await assignOrder(session, orderId, input);
      return reply.code(201).send(delivery);
    },
  );
}

/**
 * Routes d'administration.
 *
 * Reservees a ADMIN : c'est la seule voie pour creer un livreur. Un livreur
 * qui s'inscrivrait lui-meme choisirait son depot, donc son perimetre
 * commercial.
 */
export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/depot/:depotId/drivers",
    { preHandler: requireRoles("ADMIN") },
    async (request, reply) => {
      requireSession(request);
      const input = parseOrThrow(registerDriverSchema, request.body);
      const { depotId } = parseOrThrow(depotParamSchema, request.params);

      const result = await registerDriver(input, depotId);
      return reply.code(201).send(result);
    },
  );
}