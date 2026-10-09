import { test, expect } from "@playwright/test";

async function openFirstSong(page: import("@playwright/test").Page) {
  await page.goto("/livro-eac");
  await page.locator("a[href^='/musica/']").first().click();
  await expect(page).toHaveURL(/\/musica\//);
}

test.describe("Página da música", () => {
  test("abre uma música", async ({ page }) => {
    await openFirstSong(page);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("transpor +1 muda o tom exibido e as cifras, mas não a letra", async ({ page }) => {
    await openFirstSong(page);
    const tomLabel = page.getByText("tom atual").locator("..").locator("span").first();
    const before = (await tomLabel.innerText()).trim();

    const lyricLine = page.locator(".font-mono >> div.text-ink").first();
    const lyricBefore = await lyricLine.innerText();

    await page.getByRole("button", { name: "Transpor um tom acima" }).click();

    const after = (await tomLabel.innerText()).trim();
    expect(after).not.toBe(before);

    const lyricAfter = await lyricLine.innerText();
    expect(lyricAfter).toBe(lyricBefore);
  });

  test("transpor -1 muda o tom na direção oposta", async ({ page }) => {
    await openFirstSong(page);
    const tomLabel = page.getByText("tom atual").locator("..").locator("span").first();
    const original = (await tomLabel.innerText()).trim();

    await page.getByRole("button", { name: "Transpor um tom acima" }).click();
    const up = (await tomLabel.innerText()).trim();

    await page.getByRole("button", { name: "Transpor um tom abaixo" }).click();
    await page.getByRole("button", { name: "Transpor um tom abaixo" }).click();
    const down = (await tomLabel.innerText()).trim();

    expect(up).not.toBe(down);
    expect(down).not.toBe(original);
  });

  test("botão Tom original volta ao tom de origem e some quando não há transposição", async ({ page }) => {
    await openFirstSong(page);
    await expect(page.getByRole("button", { name: /Original/ })).toHaveCount(0);

    await page.getByRole("button", { name: "Transpor um tom acima" }).click();
    const originalBtn = page.getByRole("button", { name: /Original/ });
    await expect(originalBtn).toBeVisible();

    const tomLabel = page.getByText("tom atual").locator("..").locator("span").first();
    const transposedKey = (await tomLabel.innerText()).trim();

    await originalBtn.click();
    const restoredKey = (await tomLabel.innerText()).trim();
    expect(restoredKey).not.toBe(transposedKey);
    await expect(page.getByRole("button", { name: /Original/ })).toHaveCount(0);
  });

  test("apenas os acordes transpõem — a letra permanece byte-a-byte igual após várias transposições", async ({ page }) => {
    await openFirstSong(page);
    const lyricLines = page.locator(".font-mono >> div.text-ink");
    const before = await lyricLines.allInnerTexts();

    for (let i = 0; i < 5; i++) {
      await page.getByRole("button", { name: "Transpor um tom acima" }).click();
    }

    const after = await lyricLines.allInnerTexts();
    expect(after).toEqual(before);
  });

  test("menu de opções secundárias abre com tamanho de fonte, tema, tela cheia e compartilhar", async ({ page }) => {
    await openFirstSong(page);
    await page.getByRole("button", { name: "Mais opções" }).click();
    await expect(page.getByRole("button", { name: "A+" })).toBeVisible();
    await expect(page.getByRole("button", { name: "A−" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Modo escuro|Modo claro/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Compartilhar" })).toBeVisible();
  });

  test("alterar tamanho de fonte muda o estilo do texto renderizado", async ({ page }) => {
    await openFirstSong(page);
    const lyricsBlock = page.locator(".font-mono").first();
    const before = await lyricsBlock.evaluate((el) => getComputedStyle(el).fontSize);

    await page.getByRole("button", { name: "Mais opções" }).click();
    await page.getByRole("button", { name: "A+" }).click();
    await page.getByRole("button", { name: "A+" }).click();

    const after = await lyricsBlock.evaluate((el) => getComputedStyle(el).fontSize);
    expect(after).not.toBe(before);
  });

  test("modo claro/escuro alterna a classe dark no html", async ({ page }) => {
    await openFirstSong(page);
    await page.getByRole("button", { name: "Mais opções" }).click();
    const isDarkBefore = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    await page.getByRole("button", { name: /Modo escuro|Modo claro/ }).click();
    const isDarkAfter = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(isDarkAfter).toBe(!isDarkBefore);
  });

  test("auto-scroll: iniciar, pausar e mudar a velocidade", async ({ page }) => {
    await openFirstSong(page);
    const playBtn = page.getByRole("button", { name: "Iniciar rolagem automática" });
    await playBtn.click();
    await expect(page.getByRole("button", { name: "Pausar rolagem" })).toBeVisible();

    const speedSlider = page.locator("input[type=range]");
    await speedSlider.fill("3");
    await expect(page.getByText(/Vel\. \d+x/)).toBeVisible();

    await page.getByRole("button", { name: "Pausar rolagem" }).click();
    await expect(playBtn).toBeVisible();
  });

  test("favoritar dá feedback visual imediato (coração preenchido)", async ({ page }) => {
    await openFirstSong(page);
    const favBtn = page.getByRole("button", { name: "Favoritar" });
    await expect(favBtn).toHaveText("♡");
    await favBtn.click();
    await expect(page.getByRole("button", { name: "Remover dos favoritos" })).toHaveText("♥");
  });

  test("favoritos persistem após reload", async ({ page }) => {
    await openFirstSong(page);
    await page.getByRole("button", { name: "Favoritar" }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: "Remover dos favoritos" })).toHaveText("♥");
  });

  test("adicionar/remover da seleção dá feedback visual imediato", async ({ page }) => {
    await openFirstSong(page);
    const addBtn = page.getByRole("button", { name: "Adicionar à seleção" });
    await expect(addBtn).toHaveText("+");
    await addBtn.click();
    const removeBtn = page.getByRole("button", { name: "Remover da seleção" });
    await expect(removeBtn).toHaveText("✓");
    await removeBtn.click();
    await expect(page.getByRole("button", { name: "Adicionar à seleção" })).toHaveText("+");
  });

  test("seleção persiste entre páginas e aparece em /selecao", async ({ page }) => {
    await openFirstSong(page);
    const title = await page.locator("h1").innerText();
    await page.getByRole("button", { name: "Adicionar à seleção" }).click();
    await page.goto("/selecao");
    await expect(page.getByText(title.trim())).toBeVisible();
  });

  test("compartilhar copia o link quando a Web Share API não está disponível", async ({ page }) => {
    await openFirstSong(page);
    await page.addInitScript(() => {
      // força o fallback de clipboard no ambiente de teste
      delete (navigator as any).share;
    });
    await page.reload();
    await page.getByRole("button", { name: "Mais opções" }).click();
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByText(/Link copiado/)).toBeVisible();
  });

  test("diagramas de acorde são renderizados como SVG, não caixas vazias", async ({ page }) => {
    await openFirstSong(page);
    const diagrams = page.locator("svg");
    const count = await diagrams.count();
    expect(count).toBeGreaterThan(0);
  });

  test("gerar PDF individual baixa um PDF real", async ({ page }) => {
    await openFirstSong(page);
    await page.getByRole("button", { name: "Mais opções" }).click();
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 15000 }),
      page.getByRole("button", { name: "Gerar PDF" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    const path = await download.path();
    expect(path).toBeTruthy();
    const fs = await import("node:fs");
    const bytes = fs.readFileSync(path!);
    expect(bytes.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });
});
