import { describe, expect, it } from "vitest";
import { MENSAGEM_GENERICA, mensagemDeErro } from "./mensagens";

describe("mensagemDeErro", () => {
  it("traduz códigos conhecidos", () => {
    expect(mensagemDeErro({ code: "invalid_credentials" })).toBe("E-mail ou senha incorretos.");
    expect(mensagemDeErro({ code: "email_not_confirmed" })).toMatch(/Confirme seu e-mail/);
  });

  it("usa mensagem genérica para códigos desconhecidos ou ausentes", () => {
    expect(mensagemDeErro({ code: "algo_novo" })).toBe(MENSAGEM_GENERICA);
    expect(mensagemDeErro({})).toBe(MENSAGEM_GENERICA);
    expect(mensagemDeErro(null)).toBe(MENSAGEM_GENERICA);
  });
});
