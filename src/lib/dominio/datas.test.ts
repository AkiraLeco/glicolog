import { describe, expect, it } from "vitest";
import {
  agruparPorDia,
  deDatetimeLocal,
  formatarDiaExtenso,
  formatarHora,
  inicioDoDia,
  paraDatetimeLocal,
  tempoDecorrido,
} from "./datas";

describe("datetime-local ↔ Date (horário de Brasília, UTC−3)", () => {
  it("interpreta o valor digitado como horário de Brasília", () => {
    expect(deDatetimeLocal("2026-09-27T07:30")?.toISOString()).toBe("2026-09-27T10:30:00.000Z");
  });

  it("converte de volta para o formato do campo", () => {
    expect(paraDatetimeLocal(new Date("2026-09-27T10:30:00Z"))).toBe("2026-09-27T07:30");
  });

  it("rejeita valores inválidos", () => {
    expect(deDatetimeLocal("")).toBeNull();
    expect(deDatetimeLocal("27/09/2026 07:30")).toBeNull();
    expect(deDatetimeLocal("2026-02-31T07:30")).toBeNull();
    expect(deDatetimeLocal("2026-09-27T25:00")).toBeNull();
  });
});

describe("formatação", () => {
  const data = new Date("2026-09-28T02:15:00Z"); // 27/09 às 23:15 em Brasília

  it("usa o fuso de Brasília para hora e dia", () => {
    expect(formatarHora(data)).toBe("23:15");
    expect(formatarDiaExtenso(data)).toBe("domingo, 27 de setembro");
  });

  it("início do dia é meia-noite em Brasília", () => {
    expect(inicioDoDia(data).toISOString()).toBe("2026-09-27T03:00:00.000Z");
  });
});

describe("agruparPorDia", () => {
  it("agrupa pelo dia de Brasília, mantendo a ordem", () => {
    const itens = [
      { id: 1, em: new Date("2026-09-28T02:30:00Z") }, // 27/09 23:30 em Brasília
      { id: 2, em: new Date("2026-09-27T12:00:00Z") }, // 27/09 09:00
      { id: 3, em: new Date("2026-09-27T02:59:00Z") }, // 26/09 23:59
    ];
    const grupos = agruparPorDia(itens);
    expect(grupos.map((g) => g.itens.map((i) => i.id))).toEqual([[1, 2], [3]]);
    expect(grupos[0].dia.toISOString()).toBe("2026-09-27T03:00:00.000Z");
    expect(grupos[1].dia.toISOString()).toBe("2026-09-26T03:00:00.000Z");
  });

  it("devolve lista vazia sem itens", () => {
    expect(agruparPorDia([])).toEqual([]);
  });
});

describe("tempoDecorrido", () => {
  const agora = new Date("2026-09-27T12:00:00Z");
  const antes = (min: number) => new Date(agora.getTime() - min * 60_000);

  it.each([
    [0, "agora mesmo"],
    [35, "há 35 min"],
    [60, "há 1 h"],
    [130, "há 2 h 10 min"],
    [60 * 24, "há 1 dia"],
    [60 * 24 * 3, "há 3 dias"],
  ])("%i min → %s", (min, esperado) => {
    expect(tempoDecorrido(antes(min), agora)).toBe(esperado);
  });

  it("não mostra tempo negativo para registros no futuro próximo", () => {
    expect(tempoDecorrido(new Date(agora.getTime() + 60_000), agora)).toBe("agora mesmo");
  });
});
