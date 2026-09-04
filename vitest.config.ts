import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // e2e/ contém specs do Playwright (test.describe próprio) — nunca deve
    // ser coletado pelo Vitest, que roda os testes unitários de lib/.
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
  },
});
