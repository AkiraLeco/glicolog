@AGENTS.md

# Glicolog

Diário web responsivo de glicemia e insulina para uma pessoa com diabetes tipo 1.
**`PROJETO.md` é a fonte de verdade** de escopo, regras de domínio e decisões — leia antes de implementar e atualize quando uma decisão mudar.

## Sobre o usuário
O dono do projeto não é desenvolvedor. Faça todo o código e comandos; quando ele precisar agir (contas, login, testes no navegador), dê instruções passo a passo em português simples.

## Stack
- Next.js 16 (App Router, `src/`) + TypeScript + Tailwind CSS v4 + shadcn/ui (Radix).
- Supabase (Postgres + Auth) na nuvem — **sem banco local** (não há Docker). Migrations em `supabase/migrations/`, aplicadas com `npx supabase db push`.
- Zod (validação), Recharts (gráficos), PapaParse (CSV), date-fns + `@date-fns/tz` (fuso `America/Sao_Paulo`).

## Convenções
- Interface, nomes de domínio e mensagens em **português**; código em português para conceitos de domínio (`glicemia`, `insulina`, `faixas`).
- Regras de domínio puras em `src/lib/dominio/`, sempre com testes Vitest (`*.test.ts` ao lado).
- Datas: gravar `timestamptz` (UTC), exibir em `America/Sao_Paulo`.
- Segurança do paciente: **nunca** sugerir/calcular doses de insulina.
- Acessibilidade: classificação de glicemia nunca só por cor (cor + ícone + texto).
- Mobile-first; funcionar de 320px a desktop largo, sem rolagem horizontal.

## Comandos
- `npm run dev` — servidor local em http://localhost:3000
- `npm run lint` / `npm run typecheck` / `npm test`
- `npm run test:e2e` — Playwright em 320/768/1440px; loga com usuários de teste
  (`teste-a@` e `teste-b@glicolog.test`, criados direto no banco, confirmados) cujas
  credenciais ficam em `.env.test.local` (fora do git). Capturas em `e2e/.capturas/`.
- `npm run db:types` — regenera os tipos após mudar migrations
