import { expect, test } from "@playwright/test";
import { clienteDeTeste } from "./apoio";

const HORA = 3600_000;

// Glicemias fictícias nos últimos 7 dias, cobrindo todas as faixas.
test.beforeAll(async () => {
  const { supabase, userId } = await clienteDeTeste(process.env.E2E_EMAIL_A);
  const valores = [48, 65, 95, 140, 178, 210, 290, 120, 88, 160];
  // Base na hora cheia: os mesmos horários em todas as larguras de tela, sem duplicar.
  const agora = Math.floor(Date.now() / HORA) * HORA;
  const linhas = [];
  for (let dia = 0; dia < 7; dia++) {
    for (let i = 0; i < 5; i++) {
      linhas.push({
        user_id: userId,
        valor_mgdl: valores[(dia * 5 + i) % valores.length],
        // 4 h entre medições, começando 1 h antes de agora (nunca no futuro)
        medido_em: new Date(agora - HORA - (dia * 24 + i * 4) * HORA).toISOString(),
      });
    }
  }
  const { error } = await supabase.from("glicemias").upsert(linhas, {
    onConflict: "user_id,medido_em,valor_mgdl",
    ignoreDuplicates: true,
  });
  if (error) throw error;
});

test("gráfico mostra resumo, troca de período e tabela de valores", async ({ page }, info) => {
  await page.goto("/grafico");
  await expect(page.getByRole("heading", { name: "Gráfico", level: 1 })).toBeVisible();
  await expect(page.locator("figcaption")).toContainText(/mediç(ão|ões)\. Menor: \d+ mg\/dL/);
  await expect(page.locator(".recharts-surface").first()).toBeVisible();

  // O próximo período fica indisponível no período atual
  await expect(page.getByRole("link", { name: /Próximo período/ })).toHaveAttribute(
    "aria-disabled",
    "true",
  );

  await page.getByRole("navigation", { name: "Período" }).getByRole("link", { name: "7 dias" }).click();
  await expect(page).toHaveURL(/periodo=7d/);
  await expect(page.locator("figcaption")).toContainText("Menor: 48 mg/dL");
  await expect(page.locator("figcaption")).toContainText("hipoglicemia grave");
  await page.screenshot({ path: `e2e/.capturas/grafico-7d-${info.project.name}.png`, fullPage: true });

  // Tabela acessível com os valores
  await page.getByText("Ver valores em tabela").click();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("cell", { name: "290" }).first()).toBeVisible();

  // Período anterior e volta
  await page.getByRole("link", { name: "Período anterior" }).click();
  await expect(page).toHaveURL(/fim=\d{4}-\d{2}-\d{2}/);
  await page.getByRole("link", { name: "Próximo período" }).click();
  await expect(page.getByRole("link", { name: /Próximo período/ })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
});

test("tooltip mostra valor e faixa ao passar sobre um ponto", async ({ page }, info) => {
  await page.goto("/grafico?periodo=7d");
  const ponto = page.locator(".recharts-line-dots > *").first();
  await ponto.hover({ force: true });
  await expect(page.locator(".recharts-tooltip-wrapper")).toContainText("mg/dL");
  await page.screenshot({ path: `e2e/.capturas/grafico-dica-${info.project.name}.png` });
});

test("tela inicial mostra o mini gráfico das últimas 24 horas", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Últimas 24 horas" })).toBeVisible();
  await expect(page.locator(".recharts-surface").first()).toBeVisible();
  await page.screenshot({ path: `e2e/.capturas/inicio-grafico-${info.project.name}.png`, fullPage: true });
});
