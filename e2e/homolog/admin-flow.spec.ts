import { test, expect } from "@playwright/test";
import path from "node:path";

/**
 * Suíte E2E contra o ambiente de homologação REAL (Supabase configurado,
 * RLS ativa). Ver e2e/README.md.
 *
 * Não roda por padrão: cada teste começa com test.skip(!hasHomologEnv, ...)
 * e só executa de fato quando E2E_BASE_URL, E2E_ADMIN_EMAIL e
 * E2E_ADMIN_PASSWORD estão definidas no ambiente. Isso evita tanto rodar
 * contra produção por acidente quanto reportar "passou" sem ter validado
 * nada real.
 */
const BASE_URL = process.env.E2E_BASE_URL;
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const hasHomologEnv = Boolean(BASE_URL && ADMIN_EMAIL && ADMIN_PASSWORD);

test.use({ baseURL: BASE_URL });

async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByPlaceholder(/e-mail/i).fill(ADMIN_EMAIL!);
  await page.getByPlaceholder(/senha/i).fill(ADMIN_PASSWORD!);
  await page.getByRole("button", { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/admin\/musicas/);
}

test.describe("Homologação real — Supabase + RLS", () => {
  test.beforeEach(() => {
    test.skip(!hasHomologEnv, "Defina E2E_BASE_URL/E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD para rodar esta suíte.");
  });

  test("/admin/* redireciona para /admin/login sem sessão (RLS/middleware reais)", async ({ page }) => {
    await page.goto("/admin/musicas");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("login de Editor/Admin funciona e abre /admin/musicas", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: /músicas/i })).toBeVisible();
  });

  test("importar TXT: preview mostra título, tom sugerido e acordes; detecta duplicidade", async ({ page }) => {
    await login(page);
    await page.goto("/admin/importar");

    const filePath = path.join(__dirname, "../../txt/01_a_alegria.txt");
    await page.locator("input[type=file]").setInputFiles(filePath);

    await expect(page.getByText(/prévia|preview/i)).toBeVisible();
    await expect(page.getByText(/tom sugerido|sugerido, confirme/i)).toBeVisible();

    // Reimportar o mesmo arquivo deve acusar duplicidade.
    await page.locator("input[type=file]").setInputFiles(filePath);
    await expect(page.getByText(/duplicad/i)).toBeVisible();
  });

  test("salvar como rascunho não publica; publicar faz a música aparecer no Livro EAC", async ({ page, context }) => {
    await login(page);
    await page.goto("/admin/importar");
    const filePath = path.join(__dirname, "../../txt/02_e_impossivel.txt");
    await page.locator("input[type=file]").setInputFiles(filePath);
    await page.getByRole("button", { name: /salvar como rascunho/i }).click();

    const publicPage = await context.newPage();
    await publicPage.goto("/livro-eac");
    await expect(publicPage.getByText("É impossível", { exact: false })).toHaveCount(0);

    await page.goto("/admin/musicas");
    await page.getByRole("row", { name: /impossível/i }).getByRole("button", { name: /publicar/i }).click();

    await publicPage.reload();
    await expect(publicPage.getByText("É impossível", { exact: false })).toBeVisible();
  });
});
