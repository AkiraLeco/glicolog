import { expect, test } from "@playwright/test";
import { apagarGlicemiasEntre } from "./apoio";

const ARQUIVO = "exemplos/teste-importacao.csv";

// O arquivo de exemplo cobre 20 a 22/09/2026; começa cada largura de tela sem esses dados.
test.beforeEach(async () => {
  await apagarGlicemiasEntre(
    process.env.E2E_EMAIL_A,
    "2026-09-20T03:00:00Z",
    "2026-09-23T03:00:00Z",
  );
});

test("importa o arquivo de exemplo e não duplica na segunda vez", async ({ page }, info) => {
  await page.goto("/importar");
  await expect(page.getByRole("heading", { name: "Importar glicemias" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Baixar modelo" })).toHaveAttribute(
    "href",
    "/modelo-glicemias.csv",
  );

  await page.getByLabel("Escolher arquivo CSV").setInputFiles(ARQUIVO);
  await expect(page.getByRole("heading", { name: /Pré-visualização de teste-importacao\.csv/ })).toBeVisible();

  const contagem = (rotulo: string) =>
    page.locator("div").filter({ has: page.getByText(rotulo, { exact: true }) }).last();
  await expect(contagem("novas, serão importadas")).toContainText("11");
  await expect(contagem("já existem")).toContainText("0");
  await expect(contagem("repetidas no arquivo")).toContainText("1");
  await expect(contagem("com erro")).toContainText("3");

  const erros = page.getByRole("table", { name: "Linhas com erro" });
  await expect(erros).toContainText("mostrou HI");
  await expect(erros).toContainText("glicemia 700 fora do intervalo");
  await expect(erros).toContainText("não existem no calendário");
  await page.screenshot({ path: `e2e/.capturas/importar-previa-${info.project.name}.png`, fullPage: true });

  await page.getByRole("button", { name: "Importar 11 glicemias" }).click();
  await expect(page.getByText("11 glicemias importadas.")).toBeVisible();

  // Aparecem no histórico
  await page.getByRole("link", { name: "Ver no histórico" }).click();
  await expect(page.getByRole("heading", { name: /20 de setembro/ })).toBeVisible();

  // Mesmo arquivo de novo: tudo já existe
  await page.goto("/importar");
  await page.getByLabel("Escolher arquivo CSV").setInputFiles(ARQUIVO);
  await expect(contagem("já existem")).toContainText("11");
  await expect(page.getByRole("button", { name: "Nada novo para importar" })).toBeDisabled();
});

test("arquivo sem o cabeçalho esperado mostra o erro", async ({ page }) => {
  await page.goto("/importar");
  await page.getByLabel("Escolher arquivo CSV").setInputFiles({
    name: "errado.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("dia,valor\n2026-09-20,100\n"),
  });
  await expect(page.getByText(/precisa ter as colunas data, hora, glicemia_mgdl/)).toBeVisible();
});
