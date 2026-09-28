import { describe, expect, it } from "vitest";
import {
  esquemaCadastro,
  esquemaEntrar,
  esquemaRedefinirSenha,
} from "./esquemas";
import { validarFormulario } from "../formulario";

function form(dados: Record<string, string>) {
  const fd = new FormData();
  Object.entries(dados).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("esquemaEntrar", () => {
  it("normaliza o e-mail (espaços e maiúsculas)", () => {
    const r = esquemaEntrar.parse({ email: "  Ana@Exemplo.COM ", senha: "x" });
    expect(r.email).toBe("ana@exemplo.com");
  });

  it("exige e-mail válido e senha", () => {
    const r = validarFormulario(esquemaEntrar, form({ email: "ana", senha: "" }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erros.email).toEqual(["E-mail inválido."]);
      expect(r.erros.senha).toEqual(["Informe sua senha."]);
    }
  });

  it("aponta campos ausentes", () => {
    const r = validarFormulario(esquemaEntrar, form({}));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erros.email?.[0]).toBe("Informe seu e-mail.");
      expect(r.erros.senha?.[0]).toBe("Informe sua senha.");
    }
  });
});

describe("esquemaCadastro", () => {
  const valido = { email: "ana@exemplo.com", senha: "12345678", confirmacao: "12345678" };

  it("aceita dados válidos", () => {
    expect(validarFormulario(esquemaCadastro, form(valido)).ok).toBe(true);
  });

  it("exige senha com pelo menos 8 caracteres", () => {
    const r = validarFormulario(
      esquemaCadastro,
      form({ ...valido, senha: "1234567", confirmacao: "1234567" }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.senha?.[0]).toMatch(/pelo menos 8/);
  });

  it("recusa senha acima de 72 caracteres", () => {
    const longa = "a".repeat(73);
    const r = validarFormulario(
      esquemaCadastro,
      form({ ...valido, senha: longa, confirmacao: longa }),
    );
    expect(r.ok).toBe(false);
  });

  it("exige que a confirmação seja igual à senha", () => {
    const r = validarFormulario(esquemaCadastro, form({ ...valido, confirmacao: "87654321" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.confirmacao).toEqual(["As senhas não são iguais."]);
  });
});

describe("esquemaRedefinirSenha", () => {
  it("não pede e-mail", () => {
    const r = validarFormulario(
      esquemaRedefinirSenha,
      form({ senha: "senhanova1", confirmacao: "senhanova1" }),
    );
    expect(r.ok).toBe(true);
  });
});
