import { TZDate } from "@date-fns/tz";
import { differenceInMinutes, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Fuso usado para exibir e interpretar datas. Ver PROJETO.md, seção 6.1. */
export const FUSO = "America/Sao_Paulo";

const FORMATO_DATETIME_LOCAL = "yyyy-MM-dd'T'HH:mm";
const PADRAO_DATETIME_LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** Data → valor para <input type="datetime-local"> no fuso do app. */
export function paraDatetimeLocal(data: Date): string {
  return format(new TZDate(data, FUSO), FORMATO_DATETIME_LOCAL);
}

/** Valor de <input type="datetime-local"> (horário de Brasília) → Date, ou null se inválido. */
export function deDatetimeLocal(valor: string): Date | null {
  const partes = PADRAO_DATETIME_LOCAL.exec(valor);
  if (!partes) return null;
  const [ano, mes, dia, hora, minuto] = partes.slice(1).map(Number);
  const data = new TZDate(ano, mes - 1, dia, hora, minuto, FUSO);
  // Rejeita datas "roladas" (ex.: 31/02 vira 03/03).
  if (data.getMonth() !== mes - 1 || data.getDate() !== dia) return null;
  return new Date(data.getTime());
}

/** Início do dia (00:00, horário de Brasília) que contém a data informada. */
export function inicioDoDia(data: Date): Date {
  return new Date(startOfDay(new TZDate(data, FUSO)).getTime());
}

/** Chave "AAAA-MM-DD" do dia (horário de Brasília) de uma data. */
export function chaveDoDia(data: Date): string {
  return format(new TZDate(data, FUSO), "yyyy-MM-dd");
}

/**
 * Agrupa itens pelo dia de Brasília, mantendo a ordem de entrada
 * (tanto dos dias quanto dos itens dentro de cada dia).
 */
export function agruparPorDia<T extends { em: Date }>(itens: T[]): { dia: Date; itens: T[] }[] {
  const grupos = new Map<string, { dia: Date; itens: T[] }>();
  for (const item of itens) {
    const chave = chaveDoDia(item.em);
    const grupo = grupos.get(chave);
    if (grupo) grupo.itens.push(item);
    else grupos.set(chave, { dia: inicioDoDia(item.em), itens: [item] });
  }
  return [...grupos.values()];
}

/** "14:35" no fuso do app. */
export function formatarHora(data: Date): string {
  return format(new TZDate(data, FUSO), "HH:mm");
}

/** "sábado, 27 de setembro" no fuso do app. */
export function formatarDiaExtenso(data: Date): string {
  return format(new TZDate(data, FUSO), "EEEE, d 'de' MMMM", { locale: ptBR });
}

/** "agora mesmo", "há 35 min", "há 2 h 10 min", "há 3 dias". */
export function tempoDecorrido(data: Date, agora: Date = new Date()): string {
  const minutos = Math.max(0, differenceInMinutes(agora, data));
  if (minutos < 1) return "agora mesmo";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) {
    const resto = minutos % 60;
    return resto ? `há ${horas} h ${resto} min` : `há ${horas} h`;
  }
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "há 1 dia" : `há ${dias} dias`;
}
