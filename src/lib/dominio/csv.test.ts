import { describe, expect, it } from "vitest";
import { CSV_LINHAS_MAXIMO, chaveGlicemia, lerCsv } from "./csv";

// 27/09/2026, 15:00 em Brasília
const agora = new Date("2026-09-27T18:00:00Z");

function ler(texto: string) {
  const r = lerCsv(texto, agora);
  if (!r.ok) throw new Error(`esperava sucesso, veio: ${r.erro}`);
  return r;
}

describe("lerCsv — formato", () => {
  it("lê o formato padrão (vírgula, datas ISO)", () => {
    const r = ler("data,hora,glicemia_mgdl\n2026-09-27,07:30,112\n2026-09-27,12:15,165\n");
    expect(r.validas).toEqual([
      { linha: 2, medidoEm: new Date("2026-09-27T10:30:00Z"), valor: 112 },
      { linha: 3, medidoEm: new Date("2026-09-27T15:15:00Z"), valor: 165 },
    ]);
    expect(r.rejeitadas).toEqual([]);
  });

  it("aceita ponto e vírgula, datas DD/MM/AAAA, BOM, CRLF e cabeçalho em maiúsculas", () => {
    const r = ler("﻿Data;Hora;Glicemia_mgdl\r\n27/09/2026;7:30;112\r\n");
    expect(r.validas).toHaveLength(1);
    expect(r.validas[0].medidoEm.toISOString()).toBe("2026-09-27T10:30:00.000Z");
  });

  it("aceita tab, colunas em outra ordem, colunas extras e segundos na hora", () => {
    const r = ler("glicemia_mgdl\tobs\thora\tdata\n98\tjejum\t06:05:59\t2026-09-26\n");
    expect(r.validas[0]).toMatchObject({ valor: 98 });
    expect(r.validas[0].medidoEm.toISOString()).toBe("2026-09-26T09:05:00.000Z");
  });

  it("ignora linhas vazias mantendo a numeração original", () => {
    const r = ler("data,hora,glicemia_mgdl\n\n2026-09-27,07:30,112\n,,\n2026-09-27,08:00,abc\n");
    expect(r.validas[0].linha).toBe(3);
    expect(r.rejeitadas[0].linha).toBe(5);
  });
});

describe("lerCsv — rejeições", () => {
  const cab = "data,hora,glicemia_mgdl\n";

  it.each([
    ["2026-09-27,07:30,19", /fora do intervalo aceito \(20–600 mg\/dL\)/],
    ["2026-09-27,07:30,700", /glicemia 700 fora do intervalo/],
    ["2026-09-27,07:30,112.5", /não é um número inteiro/],
    ["2026-09-27,07:30,", /glicemia vazia/],
    ["2026-09-27,07:30,HI", /mostrou HI: .*acima/],
    ["2026-09-27,07:30,lo", /mostrou LO: .*abaixo/],
    ["27-09-2026,07:30,112", /data "27-09-2026" inválida/],
    ["2026-02-31,07:30,112", /não existem no calendário/],
    ["2026-09-27,7h30,112", /hora "7h30" inválida/],
    ["2026-09-27,25:00,112", /não existem no calendário/],
    ["2026-09-28,07:30,112", /estão no futuro/],
  ])("%s → %s", (linha, motivo) => {
    const r = ler(cab + linha);
    expect(r.validas).toEqual([]);
    expect(r.rejeitadas).toHaveLength(1);
    expect(r.rejeitadas[0].linha).toBe(2);
    expect(r.rejeitadas[0].motivo).toMatch(motivo);
  });

  it("aceita os extremos 20 e 600", () => {
    expect(ler(cab + "2026-09-27,07:30,20\n2026-09-27,07:31,600").validas).toHaveLength(2);
  });

  it("marca linhas repetidas dentro do próprio arquivo", () => {
    const r = ler(cab + "2026-09-27,07:30,112\n27/09/2026,07:30,112\n2026-09-27,07:30,113");
    expect(r.validas.map((v) => v.linha)).toEqual([2, 4]);
    expect(r.repetidas).toEqual([{ linha: 3, igualA: 2 }]);
  });
});

describe("lerCsv — arquivo inválido", () => {
  it("vazio", () => {
    expect(lerCsv("", agora)).toEqual({ ok: false, erro: "O arquivo está vazio." });
    expect(lerCsv("\n\n", agora)).toMatchObject({ ok: false });
  });

  it("sem cabeçalho esperado", () => {
    const r = lerCsv("dia,valor\n2026-09-27,112", agora);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toMatch(/precisa ter as colunas data, hora, glicemia_mgdl/);
  });

  it("só cabeçalho", () => {
    const r = lerCsv("data,hora,glicemia_mgdl\n", agora);
    expect(r).toEqual({ ok: false, erro: "O arquivo não tem nenhuma linha de dados." });
  });

  it("linhas demais", () => {
    const linhas = Array.from({ length: CSV_LINHAS_MAXIMO + 1 }, () => "2026-09-27,07:30,112");
    const r = lerCsv("data,hora,glicemia_mgdl\n" + linhas.join("\n"), agora);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toMatch(/máximo é 5000/);
  });

  it("maior que 1 MB", () => {
    const r = lerCsv("x".repeat(1024 * 1024 + 1), agora);
    expect(r).toMatchObject({ ok: false, erro: expect.stringMatching(/maior que 1 MB/) });
  });
});

describe("chaveGlicemia", () => {
  it("combina horário e valor", () => {
    expect(chaveGlicemia(new Date("2026-09-27T10:30:00Z"), 112)).toBe(
      "2026-09-27T10:30:00.000Z|112",
    );
  });
});
