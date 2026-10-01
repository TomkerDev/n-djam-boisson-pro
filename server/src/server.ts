import { buildApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./lib/prisma.js";

const app = await buildApp();

/**
 * Arret propre : l'application cesse d'accepter de nouvelles connexions, puis
 * la connexion Prisma est fermee. Sans cela, un redemarrage en local laisse
 * behind des connexions PostgreSQL orphelines.
 */
async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, "Arret en cours");
  try {
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    app.log.error(error, "Erreur lors de l'arret");
    process.exit(1);
  }
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ port: config.PORT, host: config.HOST });
  app.log.info(
    `API demarree sur http://${config.HOST}:${config.PORT} (${config.NODE_ENV})`,
  );
} catch (error) {
  app.log.error(error, "Demarrage impossible");
  await prisma.$disconnect();
  process.exit(1);
}