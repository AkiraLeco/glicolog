import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function semViolacoes(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const resumo = violations.map((v) => ({
    regra: v.id,
    impacto: v.impact,
    ajuda: v.help,
    elementos: v.nodes.slice(0, 3).map((n) => `${n.target.join(" ")} → ${n.failureSummary}`),
  }));
  expect(resumo, JSON.stringify(resumo, null, 2)).toEqual([]);
}

async function semRolagemHorizontal(page: Page) {
  const larguras = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(larguras[0], "a página não pode rolar para os lados").toBeLessThanOrEqual(larguras[1]);
}

const PAGINAS_LOGADAS = [
  "/",
  "/historico",
  "/grafico",
  "/grafico?periodo=7d",
  "/importar",
  "/configuracoes",
  "/sobre",
];

for (const caminho of PAGINAS_LOGADAS) {
  test(`página ${caminho} sem violações de acessibilidade`, async ({ page }) => {
    await page.goto(caminho);
    await page.waitForLoadState("networkidle");
    await semViolacoes(page);
    await semRolagemHorizontal(page);
  });
}

/** Espera o diálogo terminar a animação de abertura (o texto surge com fade). */
async function abrirDialogo(page: Page, botao: string) {
  await page.getByRole("button", { name: botao, exact: true }).click();
  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  await dialogo.evaluate((el) =>
    Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)),
  );
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))),
  );
}

test("diálogos de registro sem violações", async ({ page }) => {
  await page.goto("/");
  await abrirDialogo(page, "Glicemia");
  await semViolacoes(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();

  await abrirDialogo(page, "Insulina");
  await semViolacoes(page);
});

test("teclado: pular para o conteúdo, Esc fecha o diálogo e devolve o foco", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const pular = page.getByRole("link", { name: "Pular para o conteúdo" });
  await expect(pular).toBeFocused();
  await expect(pular).toBeVisible();

  const botao = page.getByRole("button", { name: "Glicemia", exact: true });
  await botao.focus();
  await page.keyboard.press("Enter");
  const dialogo = page.getByRole("dialog", { name: "Registrar glicemia" });
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByLabel("Valor")).toBeFocused();

  // O foco fica preso dentro do diálogo
  for (let i = 0; i < 6; i++) await page.keyboard.press("Tab");
  expect(await dialogo.evaluate((el) => el.contains(document.activeElement))).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();
  await expect(botao).toBeFocused();
});

test.describe("páginas públicas", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const caminho of ["/entrar", "/cadastro", "/recuperar-senha", "/entrar?erro=link-invalido"]) {
    test(`página ${caminho} sem violações de acessibilidade`, async ({ page }) => {
      await page.goto(caminho);
      await semViolacoes(page);
      await semRolagemHorizontal(page);
    });
  }
});
