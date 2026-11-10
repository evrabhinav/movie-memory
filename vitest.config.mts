import "dotenv/config"; // tests talk to the real Postgres in DATABASE_URL
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { environment: "node", testTimeout: 20_000 },
});
