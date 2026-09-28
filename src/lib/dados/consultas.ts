import "server-only";
import { faixasDaConfiguracao, type Faixas } from "@/lib/dominio/faixas";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Registro, RegistroGlicemia, RegistroInsulina } from "./tipos";

export type { Registro, RegistroGlicemia, RegistroInsulina } from "./tipos";

// As consultas dependem do RLS: o banco só devolve linhas do usuário logado.

export async function obterFaixas(): Promise<Faixas> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("configuracao")
    .select("limite_hipo_grave, limite_hipo, limite_hiper, limite_hiper_grave")
    .maybeSingle();
  return faixasDaConfiguracao(data);
}

export async function obterUltimaGlicemia(): Promise<RegistroGlicemia | null> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("glicemias")
    .select("id, valor_mgdl, medido_em")
    .order("medido_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { tipo: "glicemia", id: data.id, em: new Date(data.medido_em), valor: data.valor_mgdl };
}

/** Glicemias entre `desde` (inclusive) e `ate` (exclusive), em ordem cronológica. */
export async function obterGlicemiasEntre(desde: Date, ate: Date): Promise<RegistroGlicemia[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("glicemias")
    .select("id, valor_mgdl, medido_em")
    .gte("medido_em", desde.toISOString())
    .lt("medido_em", ate.toISOString())
    .order("medido_em", { ascending: true })
    // o limite padrão da API é 1000 linhas; 30 dias raramente passam disso
    .limit(5000);
  if (error) throw error;
  return data.map((g) => ({
    tipo: "glicemia",
    id: g.id,
    em: new Date(g.medido_em),
    valor: g.valor_mgdl,
  }));
}

/**
 * Glicemias e insulinas entre `desde` (inclusive) e `ate` (exclusive),
 * da mais recente para a mais antiga.
 */
export async function obterRegistrosEntre(desde: Date, ate: Date): Promise<Registro[]> {
  const supabase = await criarClienteServidor();
  const [glicemias, insulinas] = await Promise.all([
    obterGlicemiasEntre(desde, ate),
    supabase
      .from("insulinas")
      .select("id, tipo, unidades, aplicado_em")
      .gte("aplicado_em", desde.toISOString())
      .lt("aplicado_em", ate.toISOString())
      .limit(5000),
  ]);
  if (insulinas.error) throw insulinas.error;

  const registros: Registro[] = [
    ...glicemias,
    ...insulinas.data.map(
      (i): RegistroInsulina => ({
        tipo: "insulina",
        id: i.id,
        em: new Date(i.aplicado_em),
        tipoInsulina: i.tipo as "basal" | "bolus",
        unidades: Number(i.unidades),
      }),
    ),
  ];
  return registros.sort((a, b) => b.em.getTime() - a.em.getTime());
}

/** Registros de `desde` até agora (com folga para relógios adiantados). */
export async function obterRegistrosDesde(desde: Date): Promise<Registro[]> {
  return obterRegistrosEntre(desde, new Date(Date.now() + 24 * 3600_000));
}
