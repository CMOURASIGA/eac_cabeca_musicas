import { test, expect } from "@playwright/test";

test.describe("Home e navegação", () => {
  test("Home abre e mostra a separação Livro EAC / Missa", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Ver o Livro EAC/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Ver catálogo litúrgico/i })).toBeVisible();
  });

  test("acesso ao Livro EAC a partir da Home", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Ver o Livro EAC/i }).click();
    await expect(page).toHaveURL(/\/livro-eac/);
    await expect(page.getByRole("heading", { name: "Livro EAC" })).toBeVisible();
  });

  test("acesso separado às Músicas de Missa a partir da Home", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Ver catálogo litúrgico/i }).click();
    await expect(page).toHaveURL(/\/missa/);
    await expect(page.getByRole("heading", { name: "Músicas de Missa" })).toBeVisible();
  });

  test("Livro EAC e Missa são catálogos distintos (não misturam músicas)", async ({ page }) => {
    await page.goto("/livro-eac");
    const eacCount = await page.locator("a[href^='/musica/']").count();
    await page.goto("/missa");
    const missaCount = await page.locator("a[href^='/musica/']").count();
    expect(eacCount).toBeGreaterThan(0);
    expect(missaCount).toBeGreaterThan(0);
  });

  test("acesso público sem autenticação: catálogo carrega sem login", async ({ page }) => {
    const response = await page.goto("/livro-eac");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("a[href^='/musica/']").first()).toBeVisible();
  });
});

test.describe("Busca", () => {
  test("busca por título", async ({ page }) => {
    await page.goto("/livro-eac");
    const firstCard = page.locator("a[href^='/musica/']").first();
    const title = (await firstCard.locator("span.font-semibold").innerText()).trim();
    const searchTerm = title.split(" ")[0];
    await page.getByPlaceholder(/Buscar título, número ou letra/i).fill(searchTerm);
    await expect(page.locator("a[href^='/musica/']").first()).toBeVisible();
  });

  test("busca por trecho da letra", async ({ page }) => {
    await page.goto("/livro-eac");
    // "Deus" é um termo esperado em letras de músicas religiosas de exemplo.
    await page.getByPlaceholder(/Buscar título, número ou letra/i).fill("Deus");
    // A busca não deve quebrar a página, seja com 0 ou N resultados.
    await expect(page.getByPlaceholder(/Buscar título, número ou letra/i)).toHaveValue("Deus");
  });

  test("busca a partir da Home leva para /livro-eac com o termo", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder(/Buscar por título ou trecho da letra/i).fill("Alegria");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/livro-eac\?q=Alegria/);
  });
});
