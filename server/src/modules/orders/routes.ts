import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createOrderSchema, uuidSchema } from "@ndjam/shared";
import { parseOrThrow } from "../../lib/validation.js";
import {
  requireAnyPermission,
  requirePermission,
  requireSession,
} from "../../plugins/auth.js";
import { createOrder, getOrder, listOrders } from "./service.js";

const idParamSchema = z.object({ orderId: uuidSchema });

/**
 * Lecture des commandes pour CLIENT comme pour SUPPLIER.
 *
 * Une seule route pour les deux roles : la portee est determinee par la
 * session, jamais par l'URL. C'est ce qui rend impossible d'oublier un filtre
 * de cloisonnement en ajoutant un nouvel ecran.
 *
 * `requireAnyPermission` verifie seulement que l'appelant est l'un des deux
 * roles autorises ; la portee exacte (`clientId` ou `depotId`) est tranchee
 * ensuite par le service, qui est le seul a connaitre les regles metier.
 */
const readOrders = requireAnyPermission("order:read:own", "order:read:depot");

export async function orderRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", { preHandler: readOrders }, async (request) => {
    return listOrders(requireSession(request));
  });

  app.get("/:orderId", { preHandler: readOrders }, async (request) => {
    const session = requireSession(request);
    const { orderId } = parseOrThrow(idParamSchema, request.params);
    return getOrder(session, orderId);
  });

  app.post("/", { preHandler: requirePermission("order:create") }, async (request, reply) => {
    const session = requireSession(request);
    const input = parseOrThrow(createOrderSchema, request.body);
    const order = await createOrder(session, input);
    return reply.code(201).send(order);
  });
}