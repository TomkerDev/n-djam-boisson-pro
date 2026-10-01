import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { confirmDeliverySchema, uuidSchema } from "@ndjam/shared";
import { parseOrThrow } from "../../lib/validation.js";
import { requirePermission, requireSession } from "../../plugins/auth.js";
import { confirmDelivery, listMyDeliveries } from "./service.js";

const deliveryParamSchema = z.object({ deliveryId: uuidSchema });

export async function deliveryRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/",
    { preHandler: requirePermission("delivery:read:own") },
    async (request) => listMyDeliveries(requireSession(request)),
  );

  app.post(
    "/:deliveryId/confirm",
    { preHandler: requirePermission("delivery:confirm") },
    async (request) => {
      const session = requireSession(request);
      const { deliveryId } = parseOrThrow(deliveryParamSchema, request.params);
      const input = parseOrThrow(confirmDeliverySchema, request.body);
      return confirmDelivery(session, deliveryId, input);
    },
  );
}