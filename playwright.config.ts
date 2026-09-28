import { defineConfig, devices } from "@playwright/test";

// Credenciais dos usuários de teste (arquivo local, fora do git).
try {
  process.loadEnvFile(".env.test.local");
} catch {
  // Sem o arquivo, os testes que precisam de login falham com uma mensagem clara.
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
