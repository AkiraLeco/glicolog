import { TZDate } from "@date-fns/tz";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { chaveDoDia, FUSO } from "./datas";
import { classificar, type Classificacao, type Faixas } from "./faixas";

export const PERIODOS = {
  dia: { dias: 1, rotulo: "Dia" },
  "7d": { dias: 7, rotulo: "7 dias" },
  "30d": { dias: 30, rotulo: "30 dias" },
} as const;

export type Periodo = keyof typeof PERIODOS;

export function lerPeriodo(valor: unknown): Periodo {
  return typeof valor === "string" && valor in PERIODOS ? (valor as Periodo) : "dia";
}

const PADRAO_CHAVE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "AAAA-MM-DD" → meia-noite desse dia em Brasília (ou null). */
function diaDaChave(chave: string): TZDate | null {
  const partes = PADRAO_CHAVE.exec(chave);
  if (!partes) return null;
  const [ano, mes, dia] = partes.slice(1).map(Number);
  const data = new TZDate(ano, mes - 1, dia, FUSO);
  if (data.getMonth() !== mes - 1 || data.getDate() !== dia) return null;
  return data;
}

export type Intervalo = {
  periodo: Periodo;
  /** Início (inclusive) e fim (exclusive) do intervalo. */
  inicio: Date;
  fim: Date;
  /** Valor de ?fim= para o intervalo anterior e o próximo (null = não há próximo). */
  anterior: string;
  proximo: string | null;
  /** Texto do intervalo, ex.: "domingo, 27 de setembro" ou "21 a 27 de setembro". */
  rotulo: string;
};

/**
 * Intervalo de um período que termina no dia `fim` (AAAA-MM-DD, inclusive).
 * Sem `fim`, ou com `fim` no futuro, o intervalo termina hoje.
 */
export function calcularIntervalo(
  periodo: Periodo,
  fim: string | undefined,
  agora: Date = new Date(),
): Intervalo {
  const { dias } = PERIODOS[periodo];
  const hoje = diaDaChave(chaveDoDia(agora))!;
  let ultimoDia = (fim && diaDaChave(fim)) || hoje;
  if (ultimoDia > hoje) ultimoDia = hoje;

  const primeiroDia = addDays(ultimoDia, -(dias - 1));
  const depois = addDays(ultimoDia, 1);
  const proximoFim = addDays(ultimoDia, dias);

  return {
    periodo,
    inicio: new Date(primeiroDia.getTime()),
    fim: new Date(depois.getTime()),
    anterior: format(addDays(ultimoDia, -dias), "yyyy-MM-dd"),
    proximo:
      ultimoDia.getTime() >= hoje.getTime()
        ? null
        : format(proximoFim > hoje ? hoje : proximoFim, "yyyy-MM-dd"),
    rotulo: rotularIntervalo(primeiroDia, ultimoDia),
  };
}

function rotularIntervalo(primeiro: Date, ultimo: Date): string {
  const opcoes = { locale: ptBR };
  if (primeiro.getTime() === ultimo.getTime()) return format(ultimo, "EEEE, d 'de' MMMM", opcoes);
  if (primeiro.getMonth() === ultimo.getMonth()) {
    return `${format(primeiro, "d", opcoes)} a ${format(ultimo, "d 'de' MMMM", opcoes)}`;
  }
  const mesmoAno = primeiro.getFullYear() === ultimo.getFullYear();
  return `${format(primeiro, mesmoAno ? "d 'de' MMMM" : "d 'de' MMMM 'de' yyyy", opcoes)} a ${format(
    ultimo,
    mesmoAno ? "d 'de' MMMM" : "d 'de' MMMM 'de' yyyy",
    opcoes,
  )}`;
}

const HORA = 3600_000;

/** Marcações do eixo X: a cada 3 h (dia), todo dia (7 dias) ou a cada 5 dias (30 dias). */
export function marcasDoEixo(intervalo: Pick<Intervalo, "periodo" | "inicio">): number[] {
  const inicio = intervalo.inicio.getTime();
  if (intervalo.periodo === "dia") return Array.from({ length: 9 }, (_, k) => inicio + k * 3 * HORA);
  const passo = intervalo.periodo === "7d" ? 1 : 5;
  const dias = PERIODOS[intervalo.periodo].dias;
  const marcas: number[] = [];
  for (let d = 0; d < dias; d += passo) {
    marcas.push(addDays(new TZDate(inicio, FUSO), d).getTime());
  }
  return marcas;
}

/** Marcações das últimas 24 h, em horas cheias múltiplas de 6 (00h, 06h, 12h, 18h). */
export function marcasUltimas24h(agora: Date): number[] {
  const marcas: number[] = [];
  const inicio = agora.getTime() - 24 * HORA;
  const hora = new TZDate(inicio, FUSO);
  hora.setMinutes(0, 0, 0);
  for (let t = hora.getTime() + HORA; t <= agora.getTime(); t += HORA) {
    if (new TZDate(t, FUSO).getHours() % 6 === 0) marcas.push(t);
  }
  return marcas;
}

export type PontoGrafico ={ t: number; valor: number; classificacao: Classificacao };

/** Converte glicemias em pontos do gráfico, em ordem cronológica. */
export function pontosDoGrafico(
  glicemias: { em: Date; valor: number }[],
  faixas: Faixas,
): PontoGrafico[] {
  return glicemias
    .map((g) => ({ t: g.em.getTime(), valor: g.valor, classificacao: classificar(g.valor, faixas) }))
    .sort((a, b) => a.t - b.t);
}

export type ResumoPeriodo = { quantidade: number; menor: PontoGrafico; maior: PontoGrafico };

/** Quantidade de medições e os extremos do período, ou null se não houver medições. */
export function resumirPeriodo(pontos: PontoGrafico[]): ResumoPeriodo | null {
  if (!pontos.length) return null;
  let menor = pontos[0];
  let maior = pontos[0];
  for (const p of pontos) {
    if (p.valor < menor.valor) menor = p;
    if (p.valor > maior.valor) maior = p;
  }
  return { quantidade: pontos.length, menor, maior };
}
