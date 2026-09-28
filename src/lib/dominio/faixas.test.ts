import { describe, expect, it } from "vitest";
import { classificar, FAIXAS_PADRAO, faixasDaConfiguracao } from "./faixas";

describe("classificar (faixas padrão 54/70/180/250)", () => {
  it.each([
    [20, "hipo_grave"],
    [53, "hipo_grave"],
    [54, "hipo"],
    [69, "hipo"],
    [70, "alvo"],
    [120, "alvo"],
    [180, "alvo"],
    [181, "hiper"],
    [250, "hiper"],
    [251, "hiper_grave"],
    [600, "hiper_grave"],
  ] as const)("%i mg/dL → %s", (valor, esperado) => {
    expect(classificar(valor)).toBe(esperado);
  });
});

describe("classificar com faixas personalizadas", () => {
  const faixas = { hipoGrave: 60, hipo: 80, hiper: 140, hiperGrave: 200 };

  it("usa os limites do usuário", () => {
    expect(classificar(75, faixas)).toBe("hipo");
    expect(classificar(80, faixas)).toBe("alvo");
    expect(classificar(150, faixas)).toBe("hiper");
    expect(classificar(201, faixas)).toBe("hiper_grave");
  });
});

describe("faixasDaConfiguracao", () => {
  it("converte a linha do banco", () => {
    expect(
      faixasDaConfiguracao({
        limite_hipo_grave: 60,
        limite_hipo: 80,
        limite_hiper: 140,
        limite_hiper_grave: 200,
      }),
    ).toEqual({ hipoGrave: 60, hipo: 80, hiper: 140, hiperGrave: 200 });
  });

  it("usa o padrão quando não há configuração", () => {
    expect(faixasDaConfiguracao(null)).toEqual(FAIXAS_PADRAO);
  });
});
