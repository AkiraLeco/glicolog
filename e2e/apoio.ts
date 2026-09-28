import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

/** Cliente do Supabase logado como um dos usuários de teste (fora do navegador). */
export async function clienteDeTeste(email: string | undefined) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const senha = process.env.E2E_SENHA;
  if (!url || !chave || !email || !senha) {
    throw new Error("Configure .env.local e .env.test.local para os testes.");
  }
  const supabase = createClient<Database>(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) throw error;
  return { supabase, userId: data.user.id };
}

/** Apaga os registros do usuário de teste e volta as faixas ao padrão. */
export async function limparDadosDeTeste(email: string | undefined) {
  const { supabase, userId } = await clienteDeTeste(email);
  // O filtro por user_id é redundante com o RLS, mas deixa a intenção explícita.
  await supabase.from("glicemias").delete().eq("user_id", userId);
  await supabase.from("insulinas").delete().eq("user_id", userId);
  await supabase
    .from("configuracao")
    .update({ limite_hipo_grave: 54, limite_hipo: 70, limite_hiper: 180, limite_hiper_grave: 250 })
    .eq("user_id", userId);
  await supabase.auth.signOut();
}
