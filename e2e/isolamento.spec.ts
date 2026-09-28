import { expect, test } from "@playwright/test";
import { clienteDeTeste } from "./apoio";

/**
 * Garante, direto na API do Supabase, que um usuário não enxerga nem altera os
 * dados de outro (Row Level Security). Não usa o navegador.
 */
test("usuário B não lê, não altera e não apaga os dados do usuário A", async ({}, info) => {
  test.skip(info.project.name !== "desktop-1440", "não depende da largura da tela");

  const a = await clienteDeTeste(process.env.E2E_EMAIL_A);
  const b = await clienteDeTeste(process.env.E2E_EMAIL_B);

  // A cria uma glicemia e uma insulina
  const medidoEm = new Date(Math.floor(Date.now() / 60_000) * 60_000 - 3600_000).toISOString();
  const glicemia = await a.supabase
    .from("glicemias")
    .insert({ valor_mgdl: 321, medido_em: medidoEm })
    .select("id")
    .single();
  expect(glicemia.error).toBeNull();
  const insulina = await a.supabase
    .from("insulinas")
    .insert({ tipo: "basal", unidades: 12, aplicado_em: medidoEm })
    .select("id")
    .single();
  expect(insulina.error).toBeNull();
  const idGlicemia = glicemia.data!.id;
  const idInsulina = insulina.data!.id;

  try {
    // B não lê
    const leitura = await b.supabase.from("glicemias").select("id").eq("id", idGlicemia);
    expect(leitura.data).toEqual([]);
    const config = await b.supabase.from("configuracao").select("user_id").eq("user_id", a.userId);
    expect(config.data).toEqual([]);

    // B não altera
    const alteracao = await b.supabase
      .from("glicemias")
      .update({ valor_mgdl: 100 })
      .eq("id", idGlicemia)
      .select("id");
    expect(alteracao.data).toEqual([]);
    const configAlterada = await b.supabase
      .from("configuracao")
      .update({ limite_hiper: 300, limite_hiper_grave: 400 })
      .eq("user_id", a.userId)
      .select("user_id");
    expect(configAlterada.data).toEqual([]);

    // B não apaga
    const exclusao = await b.supabase.from("insulinas").delete().eq("id", idInsulina).select("id");
    expect(exclusao.data).toEqual([]);

    // B não cria registros em nome de A
    const intrusa = await b.supabase
      .from("glicemias")
      .insert({ user_id: a.userId, valor_mgdl: 100, medido_em: medidoEm });
    expect(intrusa.error?.code).toBe("42501");

    // Os dados de A continuam intactos
    const deA = await a.supabase.from("glicemias").select("valor_mgdl").eq("id", idGlicemia).single();
    expect(deA.data?.valor_mgdl).toBe(321);
    const insulinaDeA = await a.supabase.from("insulinas").select("id").eq("id", idInsulina);
    expect(insulinaDeA.data).toHaveLength(1);
  } finally {
    await a.supabase.from("glicemias").delete().eq("id", idGlicemia);
    await a.supabase.from("insulinas").delete().eq("id", idInsulina);
  }
});

test("sem login, nada é acessível", async ({}, info) => {
  test.skip(info.project.name !== "desktop-1440", "não depende da largura da tela");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  for (const tabela of ["glicemias", "insulinas", "configuracao"]) {
    const resposta = await fetch(`${url}/rest/v1/${tabela}?select=*`, { headers: { apikey: chave } });
    expect(resposta.status, tabela).toBe(401);
  }
});
