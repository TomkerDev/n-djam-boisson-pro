import { PrismaClient } from "@prisma/client";
import { config } from "../config.js";

/**
 * Instance Prisma unique. En développement, `tsx watch` recharge le module a
 * chaque modification : sans ce cache, chaque rechargement ouvrirait un pool de
 * connexions supplementaire jusqu'a saturation de PostgreSQL.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.isProduction ? ["warn", "error"] : ["warn", "error"],
  });

if (!config.isProduction) {
  globalForPrisma.prisma = prisma;
}