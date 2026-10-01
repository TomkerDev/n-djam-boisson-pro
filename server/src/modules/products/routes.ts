import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../plugins/auth.js";
import { listProducts } from "./service.js";

export async function productRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Catalogue public aux authentifies.
   *
   * Aucun filtre de depot n'est accepte en parametre : la liste renvoie les
   * produits actifs de tous les depots, ce qui correspond au besoin du client
   * qui compare les offres. Les prix de gros et les stocks internes restent
   * hors de cette reponse.
   */
  app.get("/", { preHandler: requirePermission("product:read") }, async () => {
    return listProducts();
  });
}