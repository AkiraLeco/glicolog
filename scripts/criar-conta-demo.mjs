// Cria (ou recria) a conta de demonstração com ~60 dias de dados FICTÍCIOS.
//
//   node scripts/criar-conta-demo.mjs          → gera o SQL e aplica no projeto ligado (supabase link)
//   node scripts/criar-conta-demo.mjs --so-sql → só imprime o SQL
//
// A senha é pública de propósito (fica no README para visitantes do portfólio).
// Rodar de novo apaga os registros da demo e gera tudo outra vez — útil se algum
// visitante bagunçar ou excluir a conta.

import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EMAIL = "demo@glicolog.test";
const SENHA = "demo-glicolog";
const DIAS = 60;
const FUSO_OFFSET_H = 3; // Brasília = UTC−3 (sem horário de verão)

// Gerador pseudoaleatório com semente fixa: os mesmos dados a cada execução.
let semente = 20260927;
function aleatorio() {
  semente = (semente * 1664525 + 1013904223) % 4294967296;
  return semente / 4294967296;
}
const entre = (min, max) => min + aleatorio() * (max - min);
const normal = (media, desvio) => {
  const u = 1 - aleatorio();
  const v = aleatorio();
  return media + desvio * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// Horários típicos de medição (hora local) e glicemia média esperada em cada um.
const MEDICOES = [
  { hora: 7.0, media: 115, desvio: 30 }, // jejum
  { hora: 9.5, media: 165, desvio: 45 }, // após café
  { hora: 12.25, media: 120, desvio: 35 }, // antes do almoço
  { hora: 14.75, media: 170, desvio: 50 }, // após almoço
  { hora: 19.25, media: 125, desvio: 40 }, // antes do jantar
  { hora: 22.5, media: 150, desvio: 45 }, // antes de dormir
];
const BOLUS = [
  { hora: 7.25, min: 3, max: 6 },
  { hora: 12.5, min: 5, max: 9 },
  { hora: 19.5, min: 4, max: 8 },
];

const agora = Date.now();
const hojeLocal = new Date(agora - FUSO_OFFSET_H * 3600_000);
const inicioHojeUtc = Date.UTC(
  hojeLocal.getUTCFullYear(),
  hojeLocal.getUTCMonth(),
  hojeLocal.getUTCDate(),
  FUSO_OFFSET_H,
);

const glicemias = [];
const insulinas = [];
const meiaUnidade = (x) => Math.round(x * 2) / 2;
const instante = (dia, hora, jitterMin) =>
  new Date(inicioHojeUtc - dia * 86_400_000 + (hora * 60 + entre(-jitterMin, jitterMin)) * 60_000);

for (let dia = DIAS - 1; dia >= 0; dia--) {
  for (const m of MEDICOES) {
    if (aleatorio() < 0.08) continue; // às vezes a pessoa esquece de medir
    const em = instante(dia, m.hora, 25);
    if (em.getTime() > agora) continue;
    let valor = normal(m.media, m.desvio);
    if (aleatorio() < 0.04) valor = entre(45, 68); // hipoglicemia ocasional
    if (aleatorio() < 0.03) valor = entre(260, 340); // hiperglicemia ocasional
    glicemias.push({ em, valor: Math.round(Math.min(600, Math.max(40, valor))) });
  }
  for (const b of BOLUS) {
    const em = instante(dia, b.hora, 15);
    if (em.getTime() > agora) continue;
    insulinas.push({ em, tipo: "bolus", unidades: meiaUnidade(entre(b.min, b.max)) });
  }
  const basal = instante(dia, 22, 10);
  if (basal.getTime() <= agora) insulinas.push({ em: basal, tipo: "basal", unidades: 18 });
}

const iso = (d) => new Date(Math.floor(d.getTime() / 60_000) * 60_000).toISOString();
const valoresGlicemia = glicemias
  .map((g) => `(uid, ${g.valor}, '${iso(g.em)}', 'manual')`)
  .join(",\n      ");
const valoresInsulina = insulinas
  .map((i) => `(uid, '${i.tipo}', ${i.unidades}, '${iso(i.em)}')`)
  .join(",\n      ");

const sql = `
do $$
declare uid uuid;
begin
  select id into uid from auth.users where email = '${EMAIL}';
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', '${EMAIL}',
      extensions.crypt('${SENHA}', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, uid::text,
      jsonb_build_object('sub', uid::text, 'email', '${EMAIL}', 'email_verified', true),
      'email', now(), now(), now());
  else
    -- recria do zero: senha, faixas padrão e registros
    update auth.users set encrypted_password = extensions.crypt('${SENHA}', extensions.gen_salt('bf'))
      where id = uid;
    update public.configuracao
      set limite_hipo_grave = 54, limite_hipo = 70, limite_hiper = 180, limite_hiper_grave = 250
      where user_id = uid;
    delete from public.glicemias where user_id = uid;
    delete from public.insulinas where user_id = uid;
  end if;

  insert into public.glicemias (user_id, valor_mgdl, medido_em, origem) values
      ${valoresGlicemia}
    on conflict do nothing;
  insert into public.insulinas (user_id, tipo, unidades, aplicado_em) values
      ${valoresInsulina};
end $$;
select
  (select count(*) from public.glicemias g join auth.users u on u.id = g.user_id where u.email = '${EMAIL}') as glicemias,
  (select count(*) from public.insulinas i join auth.users u on u.id = i.user_id where u.email = '${EMAIL}') as insulinas;
`;

if (process.argv.includes("--so-sql")) {
  process.stdout.write(sql);
} else {
  const arquivo = join(tmpdir(), `glicolog-demo-${Date.now()}.sql`);
  writeFileSync(arquivo, sql);
  try {
    execFileSync("npx", ["supabase", "db", "query", "--linked", "-f", arquivo], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    console.log(`\nConta demo pronta: ${EMAIL} / ${SENHA}`);
  } finally {
    rmSync(arquivo, { force: true });
  }
}
