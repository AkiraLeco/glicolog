import { expect, test } from "@playwright/test";
import { criarUsuarioDescartavel } from "./apoio";

test("mudar as faixas altera a classificação, e restaurar volta ao padrão", async ({
  page,
}, info) => {
  await page.goto("/configuracoes");
  await expect(page.getByRole("heading", { name: "Ajustes", level: 1 })).toBeVisible();

  // Validação de ordem
  await page.getByLabel("Alvo até").fill("60");
  await page.getByRole("button", { name: "Salvar faixas" }).click();
  await expect(page.getByText("Precisa ser maior que o limite de hipoglicemia (70).")).toBeVisible();

  // Alvo até 150
  await page.getByLabel("Alvo até").fill("150");
  await expect(page.getByText("151 a 250")).toBeVisible(); // pré-visualização
  await page.getByRole("button", { name: "Salvar faixas" }).click();
  await expect(page.getByText("Faixas salvas.")).toBeVisible();
  await page.screenshot({ path: `e2e/.capturas/ajustes-${info.project.name}.png`, fullPage: true });

  // 160 agora é hiperglicemia
  await page.goto("/");
  await page.getByRole("button", { name: "Glicemia", exact: true }).click();
  const dialogo = page.getByRole("dialog", { name: "Registrar glicemia" });
  await dialogo.getByLabel("Valor").fill("160");
  await expect(dialogo.getByText("Hiperglicemia", { exact: true })).toBeVisible();
  await dialogo.getByRole("button", { name: "Fechar" }).click();

  // Restaurar padrão
  await page.goto("/configuracoes");
  await expect(page.getByLabel("Alvo até")).toHaveValue("150");
  await page.getByRole("button", { name: "Restaurar padrão" }).click();
  await expect(page.getByLabel("Alvo até")).toHaveValue("180");
  await page.getByRole("button", { name: "Salvar faixas" }).click();
  await expect(page.getByText("Faixas salvas.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Alvo até")).toHaveValue("180");
});

test("página Sobre mostra o aviso médico", async ({ page }) => {
  await page.goto("/sobre");
  await expect(page.getByRole("heading", { name: "Sobre o Glicolog" })).toBeVisible();
  await expect(page.getByText(/não substitui orientação médica/).first()).toBeVisible();
});

test.describe("exclusão de conta", () => {
  // Sessão limpa: este teste entra com um usuário descartável, não com o de teste principal.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("apaga a conta depois de digitar EXCLUIR", async ({ page }, info) => {
    // Criar usuários pela CLI é lento; basta rodar em uma largura de tela.
    test.skip(info.project.name !== "desktop-1440", "roda só no desktop");
    test.setTimeout(120_000);

    const email = "teste-excluir@glicolog.test";
    criarUsuarioDescartavel(email);

    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(process.env.E2E_SENHA!);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("heading", { name: "Última glicemia" })).toBeVisible();

    await page.goto("/configuracoes");
    await page.getByRole("button", { name: "Excluir minha conta" }).click();
    const confirmacao = page.getByRole("alertdialog", { name: "Excluir sua conta?" });
    const botao = confirmacao.getByRole("button", { name: "Excluir conta" });
    await expect(botao).toBeDisabled();
    await confirmacao.getByLabel(/Para confirmar, digite/).fill("excluir");
    await expect(botao).toBeEnabled();
    await botao.click();

    await expect(page).toHaveURL(/\/entrar\?conta=excluida/);
    await expect(page.getByText("Sua conta e todos os seus dados foram excluídos.")).toBeVisible();

    // A conta não existe mais
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(process.env.E2E_SENHA!);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
  });
});
