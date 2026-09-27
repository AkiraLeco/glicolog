-- Glicolog — estrutura inicial
-- Tabelas: configuracao (faixas do usuário), glicemias, insulinas.
-- Todas protegidas por Row Level Security: cada usuário só acessa os próprios dados.

-- Atualiza a coluna atualizado_em em todo UPDATE.
create function public.definir_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- configuracao: limites das faixas de glicemia (mg/dL), um registro por usuário
-- Classificação: < hipo_grave | < hipo | <= hiper (alvo) | <= hiper_grave | acima
-- ---------------------------------------------------------------------------
create table public.configuracao (
  user_id uuid primary key references auth.users (id) on delete cascade,
  limite_hipo_grave integer not null default 54,
  limite_hipo integer not null default 70,
  limite_hiper integer not null default 180,
  limite_hiper_grave integer not null default 250,
  atualizado_em timestamptz not null default now(),
  constraint faixas_em_ordem check (
    20 <= limite_hipo_grave
    and limite_hipo_grave < limite_hipo
    and limite_hipo < limite_hiper
    and limite_hiper < limite_hiper_grave
    and limite_hiper_grave <= 600
  )
);

create trigger configuracao_atualizado_em
  before update on public.configuracao
  for each row execute function public.definir_atualizado_em();

-- Cria a configuração padrão quando um usuário se cadastra.
create function public.criar_configuracao_padrao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.configuracao (user_id) values (new.id);
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_configuracao_padrao();

-- ---------------------------------------------------------------------------
-- glicemias
-- ---------------------------------------------------------------------------
create table public.glicemias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  valor_mgdl integer not null check (valor_mgdl between 20 and 600),
  medido_em timestamptz not null,
  origem text not null default 'manual' check (origem in ('manual', 'importacao')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  -- evita registros duplicados (ex.: importar o mesmo arquivo duas vezes);
  -- também serve de índice para consultas por período
  constraint glicemia_unica unique (user_id, medido_em, valor_mgdl)
);

create trigger glicemias_atualizado_em
  before update on public.glicemias
  for each row execute function public.definir_atualizado_em();

-- ---------------------------------------------------------------------------
-- insulinas
-- ---------------------------------------------------------------------------
create table public.insulinas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('basal', 'bolus')),
  -- doses em múltiplos de 0,5 U; o limite de 300 U é só uma trava de sanidade
  unidades numeric(5, 1) not null check (unidades > 0 and unidades <= 300 and mod(unidades * 2, 1) = 0),
  aplicado_em timestamptz not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index insulinas_user_aplicado_em on public.insulinas (user_id, aplicado_em);

create trigger insulinas_atualizado_em
  before update on public.insulinas
  for each row execute function public.definir_atualizado_em();

-- ---------------------------------------------------------------------------
-- Permissões e Row Level Security
-- ---------------------------------------------------------------------------
revoke all on public.configuracao, public.glicemias, public.insulinas from anon, authenticated;
grant select, update on public.configuracao to authenticated;
grant select, insert, update, delete on public.glicemias, public.insulinas to authenticated;

alter table public.configuracao enable row level security;
alter table public.glicemias enable row level security;
alter table public.insulinas enable row level security;

create policy "ver a própria configuração" on public.configuracao
  for select to authenticated using (user_id = (select auth.uid()));
create policy "alterar a própria configuração" on public.configuracao
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "ver as próprias glicemias" on public.glicemias
  for select to authenticated using (user_id = (select auth.uid()));
create policy "registrar glicemias" on public.glicemias
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "alterar as próprias glicemias" on public.glicemias
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "excluir as próprias glicemias" on public.glicemias
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "ver as próprias insulinas" on public.insulinas
  for select to authenticated using (user_id = (select auth.uid()));
create policy "registrar insulinas" on public.insulinas
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "alterar as próprias insulinas" on public.insulinas
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "excluir as próprias insulinas" on public.insulinas
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Exclusão da própria conta (apaga o usuário e, em cascata, todos os dados)
-- ---------------------------------------------------------------------------
create function public.excluir_minha_conta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;

-- funções internas não devem ser chamáveis pela API
revoke execute on function public.criar_configuracao_padrao() from public, anon, authenticated;
revoke execute on function public.definir_atualizado_em() from public, anon, authenticated;
