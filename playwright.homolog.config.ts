import { defineConfig, devices } from "@playwright/test";

/**
 * Config da suíte de homologação real (Supabase configurado, RLS ativa).
 * Ver e2e/README.md. Não sobe webServer próprio — aponta para
 * E2E_BASE_URL (local com .env.local real, ou o preview do Vercel).
 */
export default defineConfig({
  testDir: "./e2e/homolog",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" },
    ...devices["Desktop Chrome"],
  },
});
