import { defineConfig, devices } from "@playwright/test";

/**
 * Config dos testes E2E do Livro de Músicas EAC.
 *
 * IMPORTANTE: esta config roda o app local (`next build && next start`) sem
 * variáveis do Supabase configuradas, ou seja, em modo "demo" (sampleData).
 * Isso é suficiente para validar toda a interação de UI (navegação,
 * transposição, busca, favoritos, seleção, responsividade, PWA, bloqueio de
 * /admin), mas NÃO valida Supabase/RLS de verdade — ver e2e/README.md e a
 * suíte separada em e2e/homolog/ para isso.
 */
export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/homolog/**"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Ambientes com poucos núcleos/memória (ex.: sandbox de CI restrito)
  // sofrem timeout por contenção de recursos ao subir Chromium demais em
  // paralelo. workers pode ser elevado em máquinas com mais recursos.
  workers: process.env.CI ? 2 : 4,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Ambiente traz o binário completo do Chromium (não o headless_shell,
    // que está numa revisão diferente da instalada) em /opt/pw-browsers.
    launchOptions: { executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" },
  },
  projects: [
    {
      name: "mobile-360",
      use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 740 } },
    },
    {
      name: "mobile-390",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "mobile-430",
      use: { ...devices["Desktop Chrome"], viewport: { width: 430, height: 932 } },
    },
    {
      name: "tablet",
      use: { ...devices["Desktop Chrome"], viewport: { width: 834, height: 1112 } },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: "npm run build && npm run start -- -p 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    },
  },
});
