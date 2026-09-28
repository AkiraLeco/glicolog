# Glicolog — Definição do Projeto

> Documento de premissas do projeto. Serve como referência para decisões de produto e implementação.
> Criado em 27/09/2026 a partir de entrevista de levantamento de requisitos.

## 1. Visão

**Glicolog** é uma aplicação web **responsiva** para uma pessoa com **diabetes tipo 1** registrar e acompanhar suas medições de glicemia e doses de insulina, visualizando a evolução ao longo do tempo. Deve funcionar bem em qualquer tamanho de tela — de celulares pequenos a monitores grandes.

**Motivação:** projeto de aprendizado e portfólio. A qualidade de código, arquitetura e boas práticas importa tanto quanto as funcionalidades.

## 2. Premissas

| Tema | Decisão |
|---|---|
| Público | Uso pessoal — **um usuário** por conta (sem compartilhamento, sem perfis de cuidador/médico) |
| Tipo de diabetes | Tipo 1 |
| Entrada de dados | Digitação manual + importação de CSV em formato próprio |
| O que registrar | Glicemia e doses de insulina |
| Contexto da medição | Apenas data e hora (sem "momento" como jejum/pós-refeição) |
| Unidade | Somente **mg/dL** |
| Idioma | Somente português (pt-BR) |
| Faixas de referência | Padrão 70–180 mg/dL, **editável** pelo usuário |
| Visualização | Gráfico da glicemia ao longo do tempo |
| Alertas | Apenas destaque visual de valores fora da faixa |
| Sugestão de dose | **Não.** O app apenas registra, nunca calcula nem sugere insulina |
| Armazenamento | Nuvem, com login — dados sincronizados entre dispositivos |
| Autenticação | E-mail e senha |
| Plataforma | Site responsivo (sem PWA, sem modo offline) |
| Stack | Next.js + TypeScript + Supabase |
| Hospedagem | Somente planos gratuitos |
| Prazo | Sem prazo definido — desenvolvimento incremental |

## 3. Glossário (para quem não é da área)

- **Glicemia:** concentração de glicose (açúcar) no sangue, medida em mg/dL.
- **Glicosímetro:** aparelho que mede a glicemia a partir de uma gota de sangue da ponta do dedo. A maioria mede entre ~20 e ~600 mg/dL; fora disso mostra "LO" ou "HI".
- **CGM (monitor contínuo de glicose):** sensor na pele que mede a glicemia a cada poucos minutos (ex.: FreeStyle Libre, Dexcom). *Fora do escopo* por enquanto.
- **Diabetes tipo 1:** o pâncreas não produz insulina; a pessoa depende de insulina injetável todos os dias e mede a glicemia várias vezes ao dia.
- **Insulina basal:** insulina de ação lenta, geralmente aplicada 1–2x/dia; mantém o nível "de fundo".
- **Insulina bolus (rápida/ultrarrápida):** aplicada nas refeições ou para corrigir uma glicemia alta.
- **U (unidades):** unidade de dose de insulina. Canetas permitem doses de 1 U ou 0,5 U.
- **Hipoglicemia:** glicemia baixa (< 70 mg/dL). É perigosa: pode causar tremor, confusão e desmaio. Abaixo de 54 mg/dL é considerada grave (nível 2).
- **Hiperglicemia:** glicemia alta (> 180 mg/dL). Acima de 250 mg/dL é considerada nível 2.
- **Tempo no Alvo (TIR):** % das medições dentro da faixa-alvo. Meta usual: > 70%.
- **HbA1c (hemoglobina glicada):** exame de laboratório que reflete a média glicêmica dos últimos ~3 meses.

## 4. Escopo do MVP

### 4.1 Conta e acesso
- Cadastro com e-mail e senha (mínimo 8 caracteres), com confirmação por e-mail.
- Login e logout.
- Recuperação de senha por e-mail.
- Cada usuário só acessa os próprios dados.

### 4.2 Tela inicial

```
Celular                          Desktop
┌─────────────────────┐         ┌──────────────────────┬─────────────┐
│ Última: 142 mg/dL ● │         │ Última: 142 mg/dL ●  │ Registros   │
│ No alvo · há 35 min │         │ No alvo · há 35 min  │ de hoje     │
├─────────────────────┤         │ [+ Glicemia][+ Insul]│ 12:15  165  │
│ [+ Glicemia]        │         ├──────────────────────┤ 12:10  4U B │
│ [+ Insulina]        │         │ Gráfico últimas 24h  │ 07:30  112  │
├─────────────────────┤         │  ~~~~/\~~~~          │ 07:25 18U Ba│
│ Gráfico 24h         │         │                      │             │
├─────────────────────┤         └──────────────────────┴─────────────┘
│ Registros de hoje   │
└─────────────────────┘
```

- Última glicemia em destaque: valor grande, classificação por extenso ("No alvo", "Hipoglicemia") e há quanto tempo foi medida.
- Botões "+ Glicemia" e "+ Insulina" no topo; no celular, podem ficar fixos no rodapé (alcance do polegar).
- Gráfico das últimas 24h e lista dos registros de hoje.
- Desktop: duas colunas (resumo + gráfico à esquerda, registros do dia à direita).

### 4.3 Registro de glicemia
- Campos: **valor (mg/dL)** e **data/hora** (padrão: agora).
- Validação: número inteiro entre **20 e 600**.
- **Registro rápido:** acessível direto da tela inicial, em poucos toques, com teclado numérico no celular.
- Editar e excluir registros (com confirmação antes de excluir).

### 4.4 Registro de insulina
- Campos: **tipo** (basal ou bolus), **dose em U** e **data/hora**.
- Validação: dose > 0, múltiplos de 0,5, limite superior de sanidade (ex.: 100 U) com pedido de confirmação para valores altos.
- Editar e excluir registros.

### 4.5 Histórico
- Lista cronológica (mais recente primeiro) com glicemias e insulinas, agrupada por dia.
- Valores de glicemia coloridos conforme a faixa (ver 5.1).
- Mostra os últimos 30 dias; "Ver dias anteriores" amplia de 30 em 30, até 365 dias.
- Cada registro tem um menu "⋯" com Editar e Excluir (este com confirmação).

### 4.6 Gráfico
- Gráfico de linha da glicemia ao longo do tempo.
- Períodos: dia, 7 dias, 30 dias (e navegação entre períodos).
- Faixa-alvo destacada como área sombreada.
- Pontos fora da faixa destacados.
- Deve ser legível e utilizável em telas pequenas (toque para ver o valor exato).

### 4.7 Configurações
- Limites das faixas editáveis (ver 5.1), com validação: `hipo grave < hipo < hiper < hiper grave`.
- Botão "restaurar padrão".

### 4.8 Importação de CSV
- Formato próprio e documentado (ver 6.2).
- Pré-visualização antes de confirmar: quantas linhas válidas, quantas com erro e o motivo.
- Linhas com valor fora de 20–600 são **rejeitadas** (nunca ajustadas ao limite, para não falsificar o dado), com o motivo exibido. Ex.: *"Linha 14: valor 720 fora do intervalo aceito (20–600)"*.
- Textos `LO`/`HI` recebem mensagem específica: o aparelho não conseguiu medir o valor.
- O usuário pode importar só as linhas válidas e ignorar as rejeitadas.
- Duplicatas (mesma data/hora e mesmo valor de um registro existente) são ignoradas.
- Linhas repetidas dentro do próprio arquivo também são mostradas e ignoradas.
- Limites: 1 MB e 5.000 linhas por arquivo. O servidor valida o arquivo de novo antes de gravar.

## 5. Regras de domínio

### 5.1 Faixas (valores padrão, editáveis)

| Classificação | Faixa (mg/dL) | Destaque |
|---|---|---|
| Hipoglicemia grave | < 54 | vinho + ícone ⌄⌄ |
| Hipoglicemia | 54–69 | vermelho-alaranjado + ícone ⌄ |
| **No alvo** | **70–180** | verde-azulado + ícone ✓ |
| Hiperglicemia | 181–250 | laranja + ícone ⌃ |
| Hiperglicemia grave | > 250 | roxo + ícone ⌃⌃ |

> Os destaques **nunca dependem só da cor** (acessibilidade): usar também ícone e/ou rótulo textual.
> As cores foram validadas para daltonismo (o alvo é verde-azulado, e não verde puro, para não se
> confundir com o laranja da hiper). No gráfico, a forma do ponto também indica a faixa:
> círculo = alvo, triângulo para baixo = hipo, triângulo para cima = hiper.

### 5.2 Segurança do paciente
- O app **não sugere, calcula nem recomenda doses** de insulina.
- Exibir aviso (rodapé ou "Sobre"): *"Este app é apenas um diário de registros e não substitui orientação médica."*
- Não exibir mensagens que pareçam diagnóstico ou conduta clínica.

## 6. Dados

### 6.1 Modelo (rascunho)

```
User
  id, email, senha_hash, criado_em

Configuracao (1:1 com User)
  limite_hipo_grave = 54
  limite_hipo       = 70
  limite_hiper      = 180
  limite_hiper_grave = 250

Glicemia
  id, user_id, valor_mgdl (int), medido_em (timestamp com fuso),
  origem ('manual' | 'importacao'), criado_em, atualizado_em

Insulina
  id, user_id, tipo ('basal' | 'bolus'), unidades (decimal),
  aplicado_em (timestamp com fuso), criado_em, atualizado_em
```

- Datas armazenadas em UTC; exibidas no fuso do usuário (padrão `America/Sao_Paulo`).

### 6.2 Formato de importação (CSV)

```csv
data,hora,glicemia_mgdl
2026-09-27,07:30,112
2026-09-27,12:15,165
```

- Separador: vírgula ou ponto e vírgula (Excel em pt-BR costuma exportar com `;`).
- `data` em `AAAA-MM-DD` ou `DD/MM/AAAA`; `hora` em `HH:MM`.
- Codificação UTF-8. Primeira linha é o cabeçalho.
- Importa **apenas glicemias** no MVP. Se no futuro for preciso importar insulina, adicionar uma coluna opcional `tipo` sem quebrar o formato atual.

## 7. Requisitos não funcionais

### 7.1 Responsividade
- Abordagem **mobile-first**.
- Funcionar de ~320px de largura (celulares pequenos) até monitores grandes, sem rolagem horizontal.
- Alvos de toque de pelo menos 44×44px.
- Em telas grandes, aproveitar o espaço (ex.: gráfico e histórico lado a lado) em vez de só esticar o layout.

### 7.2 Acessibilidade
- Meta: WCAG 2.2 nível AA.
- Contraste adequado; informação nunca transmitida só por cor.
- Navegação completa por teclado, com foco visível.
- Rótulos corretos para leitores de tela, inclusive um resumo textual do gráfico.

### 7.3 Privacidade e segurança (LGPD)
- Dados de saúde são **dados pessoais sensíveis** pela LGPD.
- HTTPS obrigatório; senhas com hash forte (bcrypt/argon2) ou delegadas a um provedor de autenticação.
- Isolamento por usuário garantido no banco via Row Level Security (Supabase).
- O usuário pode **excluir a própria conta e todos os dados**.
- Não usar dados reais de saúde de terceiros em demonstrações do portfólio: criar uma conta demo com dados fictícios.

### 7.4 Custo
- Somente serviços com plano gratuito.

## 8. Stack

**Decidido:**
- Next.js (App Router) + TypeScript.
- **Supabase** para banco (Postgres), autenticação (e-mail/senha, confirmação de cadastro e recuperação de senha prontas) e isolamento por usuário via **Row Level Security**.
  - Motivo: evita implementar login por senha e envio de e-mail na mão (necessário com Neon + Auth.js), sem deixar de usar Postgres e SQL de verdade.
  - Atenção: no plano gratuito o projeto **pausa após 1 semana sem uso** (reativar manualmente antes de mostrar no portfólio), e o e-mail embutido tem limite baixo de envios por hora (suficiente para uso pessoal).

**Sugestões a confirmar** (compatíveis com hospedagem gratuita):
- Hospedagem: Vercel.
- Estilo: Tailwind CSS.
- Gráficos: Recharts ou Chart.js.
- Validação: Zod (compartilhada entre formulário e backend).
- Testes: Vitest (regras de domínio, parser de CSV) + Playwright (fluxos principais em viewport mobile e desktop).

## 9. Fora do escopo (por enquanto)

- Calculadora ou sugestão de dose de insulina.
- Integração com sensores CGM ou glicosímetros.
- Registro de carboidratos, refeições, atividade física, notas.
- "Momento" da medição (jejum, pós-refeição etc.).
- Estatísticas (média, TIR, HbA1c estimada) e exportação de relatórios PDF/CSV.
- Lembretes e notificações.
- PWA, instalação e uso offline.
- mmol/L, outros idiomas.
- Múltiplos usuários por paciente (cuidadores, médicos).
- Login social.
- Modo escuro.

## 10. Ideias para versões futuras

Candidatas naturais, em ordem sugerida:
1. Estatísticas do período: média, mínimo/máximo, **Tempo no Alvo (%)**, número de hipoglicemias.
2. Doses de insulina como marcadores no gráfico de glicemia.
3. Exportação CSV/PDF para levar à consulta médica.
4. Modo escuro.
5. Notas livres por registro.
6. Registro de carboidratos.
7. HbA1c estimada (GMI).
8. PWA instalável.
9. Serviço de e-mail próprio (ex.: Resend, plano grátis) no Supabase: o e-mail embutido tem limite muito baixo de envios por hora e só envia em inglês. Fazer junto com a publicação (Etapa 10), com modelos de e-mail em português.

## 11. Decisões registradas

| # | Questão | Decisão |
|---|---|---|
| 1 | Supabase ou Neon + Auth.js | **Supabase** (ver seção 8) |
| 2 | Importar insulina via CSV? | **Não no MVP**; formato extensível com coluna `tipo` no futuro (ver 6.2) |
| 3 | Valores fora de 20–600 na importação | **Rejeitar a linha** com motivo; nunca ajustar ao limite (ver 4.8) |
| 4 | Tela inicial | Última glicemia + registro rápido + gráfico 24h + registros do dia (ver 4.2) |
| 5 | Nome do app | **Glicolog** |
| 6 | Histórico longo | Paginação por período: 30 dias por vez, até 365 (ver 4.5) |
| 7 | Cores das faixas | Revalidadas para daltonismo; alvo verde-azulado (ver 5.1) |
| 8 | Nome no menu | "Configurações" aparece como **Ajustes** (cabe na barra do celular) |
| 9 | Exclusão de conta | Pede para digitar EXCLUIR; apaga todos os dados de uma vez |

## 12. Situação

- **MVP completo** (seções 4.1 a 4.8), testado automaticamente em 320, 768 e 1440 px, com
  verificação de acessibilidade (WCAG 2.2 AA, sem violações) e de isolamento de dados entre contas.
- Falta: publicar na internet (Etapa 10) e, junto, o serviço de e-mail próprio (ideia 9).

## 13. Questões em aberto

- Nenhuma no momento.
