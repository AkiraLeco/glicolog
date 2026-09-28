import { expect, test as setup } from "@playwright/test";
import { limparDadosDeTeste } from "./apoio";

/**
 * Começa cada execução com o usuário de teste A zerado, faz login com ele e
 * salva a sessão para os outros testes.
 */
setup("login do usuário de teste", async ({ page }) => {
  await limparDadosDeTeste(process.env.E2E_EMAIL_A);

  const email = process.env.E2E_EMAIL_A;
  const senha = process.env.E2E_SENHA;
  if (!email || !senha) {
    throw new Error("Defina E2E_EMAIL_A e E2E_SENHA em .env.test.local");
  }

  await page.goto("/");
  await expect(page).toHaveURL(/\/entrar/);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Última glicemia" })).toBeVisible();

  await page.context().storageState({ path: "e2e/.auth/usuario-a.json" });
});
