import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

/**
 * Cria (se ainda não existir) um usuário confirmado direto no banco, pela CLI do
 * Supabase, com a senha dos testes. Usado para testar a exclusão de conta sem
 * mexer nos usuários de teste principais.
 */
export function criarUsuarioDescartavel(email: string) {
  const senha = process.env.E2E_SENHA;
  if (!senha || !/^[\w.+-]+@glicolog\.test$/.test(email) || /'/.test(senha)) {
    throw new Error("Usuário descartável precisa ser @glicolog.test e ter E2E_SENHA definida.");
  }
  const sql = `
    do $$
    declare uid uuid := gen_random_uuid();
    begin
      if not exists (select 1 from auth.users where email = '${email}') then
        insert into auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
          confirmation_token, recovery_token, email_change_token_new, email_change
        ) values (
          '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', '${email}',
          extensions.crypt('${senha}', extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
        );
        insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
        values (gen_random_uuid(), uid, uid::text,
          jsonb_build_object('sub', uid::text, 'email', '${email}', 'email_verified', true),
          'email', now(), now(), now());
      end if;
    end $$;`;
  // Via arquivo: passar o SQL como argumento quebra as aspas no shell do Windows.
  const arquivo = join(tmpdir(), `glicolog-usuario-${Date.now()}.sql`);
  writeFileSync(arquivo, sql);
  try {
    execFileSync("npx", ["supabase", "db", "query", "--linked", "-f", arquivo], {
      stdio: ["ignore", "ignore", "inherit"],
      shell: process.platform === "win32",
    });
  } finally {
    rmSync(arquivo, { force: true });
  }
}

/** Apaga as glicemias do usuário de teste entre duas datas (ISO). */
export async function apagarGlicemiasEntre(email: string | undefined, desde: string, ate: string) {
  const { supabase, userId } = await clienteDeTeste(email);
  const { error } = await supabase
    .from("glicemias")
    .delete()
    .eq("user_id", userId)
    .gte("medido_em", desde)
    .lt("medido_em", ate);
  if (error) throw error;
  await supabase.auth.signOut();
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
