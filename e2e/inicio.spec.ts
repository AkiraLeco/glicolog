import { expect, test, type Page } from "@playwright/test";

async function semRolagemHorizontal(page: Page) {
  const largura = await page.evaluate(() => ({
    documento: document.documentElement.scrollWidth,
    janela: window.innerWidth,
  }));
  expect(largura.documento, "a página não pode rolar para os lados").toBeLessThanOrEqual(
    largura.janela,
  );
}

test("tela inicial mostra última glicemia, botões de registro e registros de hoje", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Última glicemia" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hoje" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Glicemia", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Insulina", exact: true })).toBeVisible();
  await semRolagemHorizontal(page);
  await page.screenshot({ path: `e2e/.capturas/inicio-${info.project.name}.png`, fullPage: true });
});

test("registrar glicemia mostra a classificação e aparece na lista de hoje", async ({
  page,
}, info) => {
  // Valor aleatório para não colidir com registros de execuções anteriores.
  const valor = String(200 + Math.floor(Math.random() * 50)); // 200–249 → hiperglicemia

  await page.goto("/");
  await page.getByRole("button", { name: "Glicemia", exact: true }).click();
  const dialogo = page.getByRole("dialog", { name: "Registrar glicemia" });
  await expect(dialogo).toBeVisible();

  // Validação: valor fora do intervalo
  await dialogo.getByLabel("Valor").fill("700");
  await dialogo.getByRole("button", { name: "Salvar" }).click();
  await expect(dialogo.getByText("O valor máximo é 600 mg/dL.")).toBeVisible();

  await dialogo.getByLabel("Valor").fill(valor);
  await expect(dialogo.getByText("Hiperglicemia", { exact: true })).toBeVisible();
  // O erro antigo some quando o campo é corrigido
  await expect(dialogo.getByText("O valor máximo é 600 mg/dL.")).toBeHidden();
  await semRolagemHorizontal(page);
  await page.screenshot({ path: `e2e/.capturas/dialogo-glicemia-${info.project.name}.png` });

  await dialogo.getByRole("button", { name: "Salvar" }).click();
  await expect(dialogo).toBeHidden();
  await expect(page.getByText("Glicemia registrada.")).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: `${valor} mg/dL` }).first()).toBeVisible();
});

test("registrar insulina exige tipo e confirma doses altas", async ({ page }, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Insulina", exact: true }).click();
  const dialogo = page.getByRole("dialog", { name: "Registrar insulina" });

  await dialogo.getByLabel("Dose", { exact: true }).fill("4,5");
  await dialogo.getByRole("button", { name: "Salvar" }).click();
  await expect(dialogo.getByText("Escolha o tipo de insulina.")).toBeVisible();
  // O valor digitado continua no campo depois do erro
  await expect(dialogo.getByLabel("Dose", { exact: true })).toHaveValue("4,5");

  await dialogo.getByText("Bolus").click();
  await expect(dialogo.getByText("Escolha o tipo de insulina.")).toBeHidden();
  await dialogo.getByLabel("Dose", { exact: true }).fill("120");
  await expect(dialogo.getByText(/Confirmo a dose de 120 U/)).toBeVisible();
  await page.screenshot({ path: `e2e/.capturas/dialogo-insulina-${info.project.name}.png` });

  await dialogo.getByLabel("Dose", { exact: true }).fill("4,5");
  await dialogo.getByRole("button", { name: "Salvar" }).click();
  await expect(dialogo).toBeHidden();
  await expect(page.getByText("Insulina registrada.")).toBeVisible();
});

test("navegação leva às seções", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Principal" }).filter({ visible: true });
  await nav.getByRole("link", { name: "Histórico" }).click();
  await expect(page.getByRole("heading", { name: "Histórico" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Histórico" })).toHaveAttribute("aria-current", "page");
});
