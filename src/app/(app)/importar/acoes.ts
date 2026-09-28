"use server";

import { revalidatePath } from "next/cache";
import { buscarTodas } from "@/lib/dados/paginar";
import { chaveGlicemia, lerCsv, type LinhaValida } from "@/lib/dominio/csv";
import { criarClienteServidor, obterUsuario } from "@/lib/supabase/servidor";

export type Previa =
  | { ok: false; erro: string }
  | {
      ok: true;
      novas: number;
      existentes: number;
      repetidas: { linha: number; igualA: number }[];
      rejeitadas: { linha: number; motivo: string }[];
      /** Primeira e última data das linhas válidas (ISO), para exibir o intervalo. */
      periodo: [string, string] | null;
    };

export type ResultadoImportacao =
  | { ok: false; erro: string }
  | { ok: true; importadas: number; ignoradas: number };

/** Chaves das glicemias do usuário que já existem no intervalo das linhas válidas. */
async function chavesExistentes(validas: LinhaValida[]): Promise<Set<string>> {
  if (!validas.length) return new Set();
  const tempos = validas.map((v) => v.medidoEm.getTime());
  const desde = new Date(Math.min(...tempos)).toISOString();
  const ate = new Date(Math.max(...tempos)).toISOString();

  const supabase = await criarClienteServidor();
  const linhas = await buscarTodas((de, ate_) =>
    supabase
      .from("glicemias")
      .select("id, medido_em, valor_mgdl")
      .gte("medido_em", desde)
      .lte("medido_em", ate)
      .order("id")
      .range(de, ate_),
  );
  return new Set(linhas.map((l) => chaveGlicemia(new Date(l.medido_em), l.valor_mgdl)));
}

/** Lê o CSV e diz o que acontecerá na importação, sem gravar nada. */
export async function previsualizarImportacao(texto: string): Promise<Previa> {
  const leitura = lerCsv(texto);
  if (!leitura.ok) return leitura;

  let existentes: Set<string>;
  try {
    existentes = await chavesExistentes(leitura.validas);
  } catch {
    return { ok: false, erro: "Não foi possível consultar seus registros. Tente de novo." };
  }
  const jaExistem = leitura.validas.filter((v) =>
    existentes.has(chaveGlicemia(v.medidoEm, v.valor)),
  ).length;

  const tempos = leitura.validas.map((v) => v.medidoEm.getTime());
  return {
    ok: true,
    novas: leitura.validas.length - jaExistem,
    existentes: jaExistem,
    repetidas: leitura.repetidas,
    rejeitadas: leitura.rejeitadas,
    periodo: tempos.length
      ? [new Date(Math.min(...tempos)).toISOString(), new Date(Math.max(...tempos)).toISOString()]
      : null,
  };
}

const LOTE = 500;

/**
 * Importa as linhas válidas. O arquivo é lido e validado de novo aqui no
 * servidor — nunca confiamos no que veio pronto do navegador.
 */
export async function importarGlicemias(texto: string): Promise<ResultadoImportacao> {
  const leitura = lerCsv(texto);
  if (!leitura.ok) return leitura;
  if (!leitura.validas.length) return { ok: false, erro: "Nenhuma linha válida para importar." };

  const usuario = await obterUsuario();
  if (!usuario) return { ok: false, erro: "Sua sessão expirou. Entre de novo." };

  const supabase = await criarClienteServidor();
  let importadas = 0;
  for (let i = 0; i < leitura.validas.length; i += LOTE) {
    const lote = leitura.validas.slice(i, i + LOTE).map((v) => ({
      // Explícito porque faz parte da restrição única usada no onConflict;
      // o RLS garante que só pode ser o próprio usuário.
      user_id: usuario.id,
      valor_mgdl: v.valor,
      medido_em: v.medidoEm.toISOString(),
      origem: "importacao",
    }));
    // Conflito na restrição única (mesmo horário e valor) = já existe → ignora.
    const { data, error } = await supabase
      .from("glicemias")
      .upsert(lote, { onConflict: "user_id,medido_em,valor_mgdl", ignoreDuplicates: true })
      .select("id");
    if (error) {
      if (importadas) revalidatePath("/", "layout");
      return {
        ok: false,
        erro:
          importadas > 0
            ? `A importação parou no meio: ${importadas} glicemias foram salvas. Tente de novo — as já salvas serão ignoradas.`
            : "Não foi possível importar. Verifique sua conexão e tente de novo.",
      };
    }
    importadas += data.length;
  }

  revalidatePath("/", "layout");
  return { ok: true, importadas, ignoradas: leitura.validas.length - importadas };
}
