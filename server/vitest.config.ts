import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Les tests partagent une seule base : ils ne doivent pas s'executer en
    // parallele, sous peine de se voler mutuellement leurs donnees.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});