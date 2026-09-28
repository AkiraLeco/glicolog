import Papa from "papaparse";
import { deDatetimeLocal } from "./datas";
import { GLICEMIA_MAX, GLICEMIA_MIN } from "./validacao";

/**
 * Leitura do CSV de importação de glicemias (PROJETO.md, seções 4.8 e 6.2).
 *
 *   data,hora,glicemia_mgdl
 *   2026-09-27,07:30,112
 *
 * - separador vírgula, ponto e vírgula ou tab (detectado automaticamente);
 * - data AAAA-MM-DD ou DD/MM/AAAA; hora HH:MM ou HH:MM:SS (horário de Brasília);
 * - linhas com problema são rejeitadas com o motivo — nunca "corrigidas".
 */

export const CSV_TAMANHO_MAXIMO = 1024 * 1024; // 1 MB
export const CSV_LINHAS_MAXIMO = 5000;
export const CSV_COLUNAS = ["data", "hora", "glicemia_mgdl"] as const;

const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000;

export type LinhaValida = {
  /** Número da linha no arquivo (o cabeçalho é a linha 1). */
  linha: number;
  medidoEm: Date;
  valor: number;
};
export type LinhaRejeitada = { linha: number; motivo: string };
export type LinhaRepetida = { linha: number; igualA: number };

export type ResultadoCsv =
  | { ok: true; validas: LinhaValida[]; rejeitadas: LinhaRejeitada[]; repetidas: LinhaRepetida[] }
  | { ok: false; erro: string };

/** Chave que identifica uma glicemia (mesma regra da restrição única do banco). */
export function chaveGlicemia(medidoEm: Date, valor: number): string {
  return `${medidoEm.toISOString()}|${valor}`;
}

function normalizarData(texto: string): string | null {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(texto);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto);
  if (br) return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
  return null;
}

function normalizarHora(texto: string): string | null {
  const h = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(texto);
  return h ? `${h[1].padStart(2, "0")}:${h[2]}` : null;
}

function motivoDoValor(texto: string): string | null {
  const valor = texto.toUpperCase();
  if (valor === "LO") {
    return "o glicosímetro mostrou LO: o valor estava abaixo do que o aparelho consegue medir";
  }
  if (valor === "HI") {
    return "o glicosímetro mostrou HI: o valor estava acima do que o aparelho consegue medir";
  }
  if (valor === "") return "glicemia vazia";
  if (!/^\d+$/.test(valor)) return `glicemia "${texto}" não é um número inteiro`;
  const n = Number(valor);
  if (n < GLICEMIA_MIN || n > GLICEMIA_MAX) {
    return `glicemia ${n} fora do intervalo aceito (${GLICEMIA_MIN}–${GLICEMIA_MAX} mg/dL)`;
  }
  return null;
}

export function lerCsv(texto: string, agora: Date = new Date()): ResultadoCsv {
  if (texto.length > CSV_TAMANHO_MAXIMO) {
    return { ok: false, erro: "O arquivo é maior que 1 MB. Divida em arquivos menores." };
  }

  const conteudo = texto.replace(/^﻿/, ""); // BOM do Excel
  const { data } = Papa.parse<string[]>(conteudo, {
    delimitersToGuess: [",", ";", "\t"],
    skipEmptyLines: false, // mantém a numeração das linhas
  });
  const linhas = data.map((colunas) => colunas.map((c) => c.trim()));
  const vazia = (l: string[]) => l.every((c) => c === "");

  const indiceCabecalho = linhas.findIndex((l) => !vazia(l));
  if (indiceCabecalho === -1) return { ok: false, erro: "O arquivo está vazio." };

  const cabecalho = linhas[indiceCabecalho].map((c) => c.toLowerCase());
  const indices = CSV_COLUNAS.map((coluna) => cabecalho.indexOf(coluna));
  if (indices.some((i) => i === -1)) {
    return {
      ok: false,
      erro:
        `A primeira linha precisa ter as colunas ${CSV_COLUNAS.join(", ")}. ` +
        `Encontrado: ${linhas[indiceCabecalho].join(", ") || "(nada)"}. Baixe o modelo para ver o formato.`,
    };
  }
  const [iData, iHora, iValor] = indices;

  const corpo = linhas
    .map((colunas, i) => ({ colunas, linha: i + 1 }))
    .slice(indiceCabecalho + 1)
    .filter(({ colunas }) => !vazia(colunas));

  if (corpo.length === 0) return { ok: false, erro: "O arquivo não tem nenhuma linha de dados." };
  if (corpo.length > CSV_LINHAS_MAXIMO) {
    return {
      ok: false,
      erro: `O arquivo tem ${corpo.length} linhas; o máximo é ${CSV_LINHAS_MAXIMO}. Divida em arquivos menores.`,
    };
  }

  const validas: LinhaValida[] = [];
  const rejeitadas: LinhaRejeitada[] = [];
  const repetidas: LinhaRepetida[] = [];
  const vistas = new Map<string, number>();

  for (const { colunas, linha } of corpo) {
    const rejeitar = (motivo: string) => rejeitadas.push({ linha, motivo });
    const textoData = colunas[iData] ?? "";
    const textoHora = colunas[iHora] ?? "";

    const data = normalizarData(textoData);
    if (!data) {
      rejeitar(`data "${textoData}" inválida (use AAAA-MM-DD ou DD/MM/AAAA)`);
      continue;
    }
    const hora = normalizarHora(textoHora);
    if (!hora) {
      rejeitar(`hora "${textoHora}" inválida (use HH:MM)`);
      continue;
    }
    const medidoEm = deDatetimeLocal(`${data}T${hora}`);
    if (!medidoEm) {
      rejeitar(`data e hora "${textoData} ${textoHora}" não existem no calendário`);
      continue;
    }
    if (medidoEm.getTime() > agora.getTime() + TOLERANCIA_FUTURO_MS) {
      rejeitar(`data e hora "${textoData} ${textoHora}" estão no futuro`);
      continue;
    }
    const motivo = motivoDoValor(colunas[iValor] ?? "");
    if (motivo) {
      rejeitar(motivo);
      continue;
    }

    const valor = Number(colunas[iValor]);
    const chave = chaveGlicemia(medidoEm, valor);
    const anterior = vistas.get(chave);
    if (anterior !== undefined) {
      repetidas.push({ linha, igualA: anterior });
      continue;
    }
    vistas.set(chave, linha);
    validas.push({ linha, medidoEm, valor });
  }

  return { ok: true, validas, rejeitadas, repetidas };
}
