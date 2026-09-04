import { test, expect } from "@playwright/test";

test.describe("PWA", () => {
  test("manifest está acessível e referenciado pela página", async ({ page, request }) => {
    await page.goto("/");
    const href = await page.locator("link[rel=manifest]").getAttribute("href");
    expect(href).toBeTruthy();
    const res = await request.get(href!);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.name || json.short_name).toBeTruthy();
    expect(Array.isArray(json.icons)).toBe(true);
    expect(json.icons.length).toBeGreaterThan(0);
  });

  test("ícone do app está presente (favicon/apple-icon)", async ({ page }) => {
    await page.goto("/");
    const icons = await page.locator("link[rel*=icon]").count();
    expect(icons).toBeGreaterThan(0);
  });
});

test.describe("/admin sem autenticação (modo demonstração)", () => {
  // Em modo demonstração (Supabase não configurado), o middleware
  // deliberadamente deixa a rota carregar (ver e2e/README.md), mas o
  // próprio layout do admin (app/admin/layout.tsx) intercepta TODA rota
  // /admin/* — incluindo /admin/login — e mostra só um aviso de que o
  // Supabase não está configurado, nunca dados reais nem o formulário de
  // login funcional. O redirecionamento de fato para /admin/login com
  // sessão real é validado com Supabase de verdade na suíte e2e/homolog/.
  test("/admin/musicas não lista músicas reais sem Supabase configurado", async ({ page }) => {
    await page.goto("/admin/musicas");
    await expect(page.getByText(/Supabase ainda não está configurado/i)).toBeVisible();
    await expect(page.locator("table")).toHaveCount(0);
  });

  test("/admin/login também não expõe o formulário sem Supabase configurado", async ({ page }) => {
    const res = await page.goto("/admin/login");
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByText(/Supabase ainda não está configurado/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /entrar/i })).toHaveCount(0);
  });
});
