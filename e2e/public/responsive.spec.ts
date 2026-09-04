import { test, expect } from "@playwright/test";

/**
 * Roda em todos os projetos configurados em playwright.config.ts:
 * mobile-360, mobile-390, mobile-430, tablet, desktop.
 * Garante que não há overflow horizontal na Home, no catálogo e,
 * principalmente, na letra/cifra da música (onde o bug original foi
 * reportado pelo usuário).
 */

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1); // tolerância de 1px por arredondamento
}

test("Home sem overflow horizontal", async ({ page }) => {
  await page.goto("/");
  await assertNoHorizontalOverflow(page);
});

test("Livro EAC sem overflow horizontal", async ({ page }) => {
  await page.goto("/livro-eac");
  await assertNoHorizontalOverflow(page);
});

test("Música sem overflow horizontal (letra/cifra ajustadas à tela)", async ({ page }) => {
  await page.goto("/livro-eac");
  await page.locator("a[href^='/musica/']").first().click();
  await expect(page).toHaveURL(/\/musica\//);
  await assertNoHorizontalOverflow(page);
});

test("alinhamento cifra/letra é preservado (mesma quantidade de linhas antes/depois)", async ({ page }) => {
  await page.goto("/livro-eac");
  await page.locator("a[href^='/musica/']").first().click();
  await expect(page.locator(".font-mono > div").first()).toBeVisible();
  const linesBefore = await page.locator(".font-mono > div").count();
  expect(linesBefore).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Transpor um tom acima" }).click();
  const linesAfter = await page.locator(".font-mono > div").count();
  expect(linesAfter).toBe(linesBefore);
});
