import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test.describe("Geração de PDF da seleção/repertório", () => {
  test("adicionar músicas à seleção e gerar PDF do repertório baixa um PDF real com várias músicas", async ({
    page,
  }) => {
    await page.goto("/livro-eac");
    const cards = page.locator("a[href^='/musica/']");
    const count = await cards.count();
    expect(count).toBeGreaterThan(1);

    // adiciona as duas primeiras músicas do catálogo à seleção
    for (let i = 0; i < 2; i++) {
      await page.goto("/livro-eac");
      await page.locator("a[href^='/musica/']").nth(i).click();
      await page.getByRole("button", { name: "Adicionar à seleção" }).click();
    }

    await page.goto("/selecao");
    await expect(page.getByRole("button", { name: "Gerar PDF do repertório" })).toBeVisible();

    await page.getByLabel(/Nome do encontro/).fill("EAC de Teste");
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 20000 }),
      page.getByRole("button", { name: "Gerar PDF do repertório" }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    const path = await download.path();
    expect(path).toBeTruthy();
    const bytes = readFileSync(path!);
    expect(bytes.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    // capa + índice + pelo menos 2 músicas geram um arquivo maior que um PDF de 1 música só.
    expect(bytes.byteLength).toBeGreaterThan(4000);
  });

  test("reordenar a seleção move as músicas de posição", async ({ page }) => {
    await page.goto("/livro-eac");
    for (let i = 0; i < 2; i++) {
      await page.goto("/livro-eac");
      await page.locator("a[href^='/musica/']").nth(i).click();
      await page.getByRole("button", { name: "Adicionar à seleção" }).click();
    }
    await page.goto("/selecao");
    const firstTitleBefore = await page.locator(".text-sm.font-semibold.truncate").first().innerText();
    await page.getByRole("button", { name: "Mover para baixo" }).first().click();
    const firstTitleAfter = await page.locator(".text-sm.font-semibold.truncate").first().innerText();
    expect(firstTitleAfter).not.toBe(firstTitleBefore);
  });
});
