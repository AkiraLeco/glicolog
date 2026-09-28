import { describe, expect, it } from "vitest";
import { validarFormulario } from "../formulario";
import { paraDatetimeLocal } from "./datas";
import { esquemaGlicemia, esquemaInsulina, formatarUnidades } from "./validacao";

function form(dados: Record<string, string>) {
  const fd = new FormData();
  Object.entries(dados).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

const agora = () => paraDatetimeLocal(new Date());

describe("esquemaGlicemia", () => {
  it("aceita um valor válido e converte a data", () => {
    const r = esquemaGlicemia.parse({ valor: " 112 ", medidoEm: "2026-09-27T07:30" });
    expect(r.valor).toBe(112);
    expect(r.medidoEm.toISOString()).toBe("2026-09-27T10:30:00.000Z");
  });

  it.each([
    ["", "Informe o valor da glicemia."],
    ["abc", "Use apenas números inteiros (ex.: 112)."],
    ["112,5", "Use apenas números inteiros (ex.: 112)."],
    ["-50", "Use apenas números inteiros (ex.: 112)."],
    ["19", "O valor mínimo é 20 mg/dL."],
    ["601", "O valor máximo é 600 mg/dL."],
  ])("valor %j → %s", (valor, mensagem) => {
    const r = validarFormulario(esquemaGlicemia, form({ valor, medidoEm: agora() }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.valor?.[0]).toBe(mensagem);
  });

  it("aceita os extremos 20 e 600", () => {
    expect(esquemaGlicemia.safeParse({ valor: "20", medidoEm: agora() }).success).toBe(true);
    expect(esquemaGlicemia.safeParse({ valor: "600", medidoEm: agora() }).success).toBe(true);
  });

  it("recusa data no futuro", () => {
    const amanha = paraDatetimeLocal(new Date(Date.now() + 24 * 3600_000));
    const r = validarFormulario(esquemaGlicemia, form({ valor: "100", medidoEm: amanha }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.medidoEm?.[0]).toMatch(/futuro/);
  });

  it("recusa data vazia ou inválida", () => {
    const r = validarFormulario(esquemaGlicemia, form({ valor: "100", medidoEm: "" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.medidoEm?.[0]).toBe("Informe a data e a hora.");
  });
});

describe("esquemaInsulina", () => {
  const base = { tipo: "bolus", unidades: "4", aplicadoEm: agora() };

  it("aceita dose com vírgula ou ponto", () => {
    expect(esquemaInsulina.parse({ ...base, unidades: "4,5" }).unidades).toBe(4.5);
    expect(esquemaInsulina.parse({ ...base, unidades: "4.5" }).unidades).toBe(4.5);
  });

  it("exige o tipo", () => {
    const r = validarFormulario(esquemaInsulina, form({ unidades: "4", aplicadoEm: agora() }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.tipo?.[0]).toBe("Escolha o tipo de insulina.");
  });

  it.each([
    ["0", "A dose precisa ser maior que zero."],
    ["4,3", "Use doses inteiras ou de meia unidade (ex.: 4,5)."],
    ["301", "A dose máxima aceita é 300 U."],
    ["quatro", "Use um número, como 4 ou 4,5."],
  ])("dose %j → %s", (unidades, mensagem) => {
    const r = validarFormulario(esquemaInsulina, form({ ...base, unidades }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.unidades?.[0]).toBe(mensagem);
  });

  it("pede confirmação para doses acima de 100 U", () => {
    const semConfirmar = validarFormulario(esquemaInsulina, form({ ...base, unidades: "120" }));
    expect(semConfirmar.ok).toBe(false);
    if (!semConfirmar.ok) expect(semConfirmar.erros.confirmarDoseAlta?.[0]).toMatch(/acima de 100/);

    const confirmado = validarFormulario(
      esquemaInsulina,
      form({ ...base, unidades: "120", confirmarDoseAlta: "on" }),
    );
    expect(confirmado.ok).toBe(true);
  });

  it("100 U exatas não pedem confirmação", () => {
    expect(esquemaInsulina.safeParse({ ...base, unidades: "100" }).success).toBe(true);
  });
});

describe("formatarUnidades", () => {
  it("usa vírgula decimal", () => {
    expect(formatarUnidades(4.5)).toBe("4,5");
    expect(formatarUnidades(18)).toBe("18");
  });
});
