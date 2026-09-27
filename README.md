# Glicolog

Diário web de glicemia e insulina para pessoas com diabetes tipo 1. Funciona em computadores e celulares.

> ⚠️ Projeto de estudo/portfólio. Este app é apenas um diário de registros e **não substitui orientação médica**. Ele não sugere nem calcula doses de insulina.

Definição completa do projeto: [PROJETO.md](PROJETO.md).

## Tecnologias

Next.js · TypeScript · Tailwind CSS · shadcn/ui · Supabase (Postgres + Auth + Row Level Security) · Recharts · Zod · Vitest

## Rodando localmente

Requisitos: Node.js 24+ e um projeto no [Supabase](https://supabase.com).

```bash
npm install
cp .env.example .env.local   # preencha com a URL e a publishable key do seu projeto
npx supabase login
npx supabase link --project-ref <id-do-projeto>
npx supabase db push         # cria as tabelas
npm run dev                  # http://localhost:3000
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | Checagem de tipos |
| `npm test` | Testes unitários (Vitest) |
