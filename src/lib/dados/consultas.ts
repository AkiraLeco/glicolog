import "server-only";
import { faixasDaConfiguracao, type Faixas } from "@/lib/dominio/faixas";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export type RegistroGlicemia = { tipo: "glicemia"; id: string; em: Date; valor: number };
export type RegistroInsulina = {
  tipo: "insulina";
  id: string;
  em: Date;
  tipoInsulina: "basal" | "bolus";
  unidades: number;
};
export type Registro = RegistroGlicemia | RegistroInsulina;

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

/** Glicemias e insulinas a partir de `desde`, da mais recente para a mais antiga. */
export async function obterRegistrosDesde(desde: Date): Promise<Registro[]> {
  const supabase = await criarClienteServidor();
  const [glicemias, insulinas] = await Promise.all([
    supabase
      .from("glicemias")
      .select("id, valor_mgdl, medido_em")
      .gte("medido_em", desde.toISOString()),
    supabase
      .from("insulinas")
      .select("id, tipo, unidades, aplicado_em")
      .gte("aplicado_em", desde.toISOString()),
  ]);
  if (glicemias.error) throw glicemias.error;
  if (insulinas.error) throw insulinas.error;

  const registros: Registro[] = [
    ...glicemias.data.map(
      (g): RegistroGlicemia => ({
        tipo: "glicemia",
        id: g.id,
        em: new Date(g.medido_em),
        valor: g.valor_mgdl,
      }),
    ),
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
