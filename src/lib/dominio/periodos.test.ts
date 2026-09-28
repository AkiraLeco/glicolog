import { describe, expect, it } from "vitest";
import { FAIXAS_PADRAO } from "./faixas";
import {
  calcularIntervalo,
  lerPeriodo,
  marcasDoEixo,
  marcasUltimas24h,
  pontosDoGrafico,
  resumirPeriodo,
} from "./periodos";

// 27/09/2026, 15:00 em Brasília
const agora = new Date("2026-09-27T18:00:00Z");

describe("lerPeriodo", () => {
  it("aceita os períodos conhecidos e usa 'dia' como padrão", () => {
    expect(lerPeriodo("7d")).toBe("7d");
    expect(lerPeriodo("30d")).toBe("30d");
    expect(lerPeriodo("1ano")).toBe("dia");
    expect(lerPeriodo(undefined)).toBe("dia");
  });
});

describe("calcularIntervalo", () => {
  it("dia atual: meia-noite a meia-noite de Brasília, sem próximo", () => {
    const i = calcularIntervalo("dia", undefined, agora);
    expect(i.inicio.toISOString()).toBe("2026-09-27T03:00:00.000Z");
    expect(i.fim.toISOString()).toBe("2026-09-28T03:00:00.000Z");
    expect(i.anterior).toBe("2026-09-26");
    expect(i.proximo).toBeNull();
    expect(i.rotulo).toBe("domingo, 27 de setembro");
  });

  it("7 dias terminando hoje", () => {
    const i = calcularIntervalo("7d", undefined, agora);
    expect(i.inicio.toISOString()).toBe("2026-09-21T03:00:00.000Z");
    expect(i.anterior).toBe("2026-09-20");
    expect(i.rotulo).toBe("21 a 27 de setembro");
  });

  it("30 dias atravessando meses", () => {
    const i = calcularIntervalo("30d", "2026-09-10", agora);
    expect(i.inicio.toISOString()).toBe("2026-08-12T03:00:00.000Z");
    expect(i.fim.toISOString()).toBe("2026-09-11T03:00:00.000Z");
    expect(i.rotulo).toBe("12 de agosto a 10 de setembro");
    // o próximo não passa de hoje
    expect(i.proximo).toBe("2026-09-27");
  });

  it("período no passado tem próximo", () => {
    expect(calcularIntervalo("dia", "2026-09-20", agora).proximo).toBe("2026-09-21");
  });

  it("datas futuras ou inválidas voltam para hoje", () => {
    expect(calcularIntervalo("dia", "2026-12-01", agora).rotulo).toBe("domingo, 27 de setembro");
    expect(calcularIntervalo("dia", "2026-02-31", agora).rotulo).toBe("domingo, 27 de setembro");
    expect(calcularIntervalo("dia", "ontem", agora).rotulo).toBe("domingo, 27 de setembro");
  });

  it("rótulo com anos diferentes", () => {
    const i = calcularIntervalo("7d", "2026-01-03", agora);
    expect(i.rotulo).toBe("28 de dezembro de 2025 a 3 de janeiro de 2026");
  });
});

describe("marcas do eixo", () => {
  it("dia: a cada 3 h, de 00:00 a 24:00", () => {
    const marcas = marcasDoEixo(calcularIntervalo("dia", undefined, agora));
    expect(marcas).toHaveLength(9);
    expect(new Date(marcas[1]).toISOString()).toBe("2026-09-27T06:00:00.000Z"); // 03:00 Brasília
  });

  it("7 dias: uma por dia; 30 dias: a cada 5 dias", () => {
    expect(marcasDoEixo(calcularIntervalo("7d", undefined, agora))).toHaveLength(7);
    expect(marcasDoEixo(calcularIntervalo("30d", undefined, agora))).toHaveLength(6);
  });

  it("últimas 24 h: horas múltiplas de 6 no horário de Brasília", () => {
    const marcas = marcasUltimas24h(agora).map((t) => new Date(t).toISOString());
    // 15:00 de ontem → 15:00 de hoje: 18h, 00h, 06h, 12h
    expect(marcas).toEqual([
      "2026-09-26T21:00:00.000Z",
      "2026-09-27T03:00:00.000Z",
      "2026-09-27T09:00:00.000Z",
      "2026-09-27T15:00:00.000Z",
    ]);
  });
});

describe("pontos e resumo", () => {
  const glicemias = [
    { em: new Date("2026-09-27T15:00:00Z"), valor: 210 },
    { em: new Date("2026-09-27T10:00:00Z"), valor: 65 },
    { em: new Date("2026-09-27T12:00:00Z"), valor: 120 },
  ];

  it("ordena e classifica", () => {
    const pontos = pontosDoGrafico(glicemias, FAIXAS_PADRAO);
    expect(pontos.map((p) => [p.valor, p.classificacao])).toEqual([
      [65, "hipo"],
      [120, "alvo"],
      [210, "hiper"],
    ]);
  });

  it("resume quantidade e extremos", () => {
    const resumo = resumirPeriodo(pontosDoGrafico(glicemias, FAIXAS_PADRAO));
    expect(resumo?.quantidade).toBe(3);
    expect(resumo?.menor.valor).toBe(65);
    expect(resumo?.maior.valor).toBe(210);
    expect(resumirPeriodo([])).toBeNull();
  });
});
