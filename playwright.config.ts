import { defineConfig, devices } from "@playwright/test";

// URL/chave do Supabase e credenciais dos usuários de teste (arquivos locais, fora do git).
for (const arquivo of [".env.local", ".env.test.local"]) {
  try {
    process.loadEnvFile(arquivo);
  } catch {
    // Sem o arquivo, os testes que precisam de login falham com uma mensagem clara.
  }
}

const LARGURAS = {
  "celular-320": { width: 320, height: 640 },
  "tablet-768": { width: 768, height: 1024 },
  "desktop-1440": { width: 1440, height: 900 },
};

export default defineConfig({
  testDir: "e2e",
  outputDir: "e2e/.resultados",
  fullyParallel: false,
  workers: 1,
  // O servidor de desenvolvimento às vezes demora a responder; uma nova tentativa
  // evita falsos negativos (o relatório marca esses testes como "flaky").
  retries: 1,
  // Na primeira visita, o servidor de desenvolvimento compila a página (pode passar de 5 s).
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "login", testMatch: /login\.setup\.ts/ },
    ...Object.entries(LARGURAS).map(([name, viewport]) => ({
      name,
      dependencies: ["login"],
      use: {
        ...devices["Desktop Chrome"],
        viewport,
        hasTouch: name.startsWith("celular"),
        isMobile: false,
        storageState: "e2e/.auth/usuario-a.json",
      },
    })),
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/entrar",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
