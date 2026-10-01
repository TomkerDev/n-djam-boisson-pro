import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { assignOrderSchema, uuidSchema } from "@ndjam/shared";
import { parseOrThrow } from "../../lib/validation.js";
import { requirePermission, requireSession } from "../../plugins/auth.js";
import { assignOrder, listDepotDrivers } from "../deliveries/service.js";

const idParamSchema = z.object({ orderId: uuidSchema });

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
      const { orderId } = parseOrThrow(idParamSchema, request.params);
      const input = parseOrThrow(assignOrderSchema, request.body);
      const delivery = await assignOrder(session, orderId, input);
      return reply.code(201).send(delivery);
    },
  );
}