import { expect, test, type Page } from "@playwright/test";

/** Registra uma glicemia pela tela inicial e devolve o valor usado. */
async function registrarGlicemia(page: Page, valor: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Glicemia", exact: true }).click();
  const dialogo = page.getByRole("dialog", { name: "Registrar glicemia" });
  await dialogo.getByLabel("Valor").fill(valor);
  await dialogo.getByRole("button", { name: "Salvar" }).click();
  await expect(dialogo).toBeHidden();
}

// Valores entre 300 e 599: fáceis de achar e sem colidir com outros testes.
const valorAleatorio = () => String(300 + Math.floor(Math.random() * 300));

test("editar e excluir uma glicemia pelo histórico", async ({ page }, info) => {
  const valor = valorAleatorio();
  const novoValor = String(Number(valor) === 599 ? 598 : Number(valor) + 1);
  await registrarGlicemia(page, valor);

  await page.goto("/historico");
  await expect(page.getByRole("heading", { name: "Histórico", level: 1 })).toBeVisible();

  // Editar
  await page.getByRole("button", { name: new RegExp(`Ações: glicemia de ${valor} mg/dL`) }).click();
  await page.getByRole("menuitem", { name: "Editar" }).click();
  const dialogo = page.getByRole("dialog", { name: "Editar glicemia" });
  await expect(dialogo.getByLabel("Valor")).toHaveValue(valor);
  await dialogo.getByLabel("Valor").fill(novoValor);
  await dialogo.getByRole("button", { name: "Salvar" }).click();
  await expect(dialogo).toBeHidden();
  await expect(page.getByText("Glicemia atualizada.")).toBeVisible();
  const botaoNovo = page.getByRole("button", {
    name: new RegExp(`Ações: glicemia de ${novoValor} mg/dL`),
  });
  await expect(botaoNovo).toBeVisible();
  await page.screenshot({ path: `e2e/.capturas/historico-${info.project.name}.png`, fullPage: true });

  // Excluir (cancelar primeiro, depois confirmar)
  await botaoNovo.click();
  await page.getByRole("menuitem", { name: "Excluir" }).click();
  const confirmacao = page.getByRole("alertdialog", { name: "Excluir registro?" });
  await expect(confirmacao).toContainText(`${novoValor} mg/dL`);
  await confirmacao.getByRole("button", { name: "Cancelar" }).click();
  await expect(botaoNovo).toBeVisible();

  await botaoNovo.click();
  await page.getByRole("menuitem", { name: "Excluir" }).click();
  await confirmacao.getByRole("button", { name: "Excluir" }).click();
  await expect(page.getByText("Glicemia excluída.")).toBeVisible();
  await expect(botaoNovo).toBeHidden();
});

test("ver dias anteriores amplia o período", async ({ page }) => {
  await page.goto("/historico");
  await expect(page.getByText(/Últimos 30 dias/)).toBeVisible();
  await page.getByRole("link", { name: "Ver dias anteriores" }).click();
  await expect(page).toHaveURL(/dias=60/);
  await expect(page.getByText(/Últimos 60 dias/)).toBeVisible();
});

test("editar insulina mantém o tipo selecionado", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Insulina", exact: true }).click();
  const novo = page.getByRole("dialog", { name: "Registrar insulina" });
  await novo.getByText("Basal").click();
  await novo.getByLabel("Dose", { exact: true }).fill("17,5");
  await novo.getByRole("button", { name: "Salvar" }).click();
  await expect(novo).toBeHidden();

  const botao = page.getByRole("button", { name: /Ações: insulina basal de 17,5 U/ }).first();
  await botao.click();
  await page.getByRole("menuitem", { name: "Editar" }).click();
  const edicao = page.getByRole("dialog", { name: "Editar insulina" });
  await expect(edicao.getByRole("radio", { name: /Basal/ })).toBeChecked();
  await expect(edicao.getByLabel("Dose", { exact: true })).toHaveValue("17,5");
  await edicao.getByRole("button", { name: "Fechar" }).click();

  // limpeza
  await botao.click();
  await page.getByRole("menuitem", { name: "Excluir" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Excluir" }).click();
  await expect(page.getByText("Insulina excluída.")).toBeVisible();
});
