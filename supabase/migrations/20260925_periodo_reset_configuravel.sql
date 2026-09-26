-- Periodo de reset das metas financeiras: semanal (atual), quinzenal ou mensal.
-- Etapa 2 de docs/plano-periodo-reset-configuravel.md.
--
-- ADITIVA E NO-OP POR CONSTRUCAO. Apenas cria a coluna com default igual ao
-- comportamento de hoje. Nenhuma conta existente muda de numero no dia em que
-- isto rodar: todas continuam 'semanal' ate a usuaria escolher outra coisa, o
-- que so sera possivel na Etapa 3.
--
-- Idempotente: pode rodar mais de uma vez sem erro.


-- ============================================================================
-- Coluna, em administrative_costs
-- ============================================================================
--
-- Mesma tabela e mesmo molde de `working_days_per_week` (migration 20260906):
-- e configuracao financeira global da conta, 1 linha por usuaria, nao dado por
-- produto.
--
-- `text` + CHECK, e nao um tipo ENUM do Postgres: nenhuma migration deste
-- repositorio cria enum, entao text com CHECK e o padrao da casa — e e mais
-- facil de estender depois (por exemplo "a cada 10 dias") sem `ALTER TYPE`,
-- que trava a tabela e nao roda dentro de transacao em versoes mais antigas.

ALTER TABLE public.administrative_costs
  ADD COLUMN IF NOT EXISTS periodo_reset text NOT NULL DEFAULT 'semanal';

ALTER TABLE public.administrative_costs
  DROP CONSTRAINT IF EXISTS administrative_costs_periodo_reset_check,
  ADD CONSTRAINT administrative_costs_periodo_reset_check
    CHECK (periodo_reset IN ('semanal', 'quinzenal', 'mensal'));

COMMENT ON COLUMN public.administrative_costs.periodo_reset IS
  'Periodo de reset das metas financeiras: semanal, quinzenal (dias 1-15 e 16 ao fim do mes) ou mensal. NAO afeta a meta de horas, que e sempre semanal por ser ancorada em working_days_per_week.';


-- ============================================================================
-- O que esta migration deliberadamente NAO faz
-- ============================================================================
--
-- O plano previa, junto desta coluna, um UPDATE empurrando
-- `onboarding_financeiro_passo_atual` em +1 para quem esta no meio do
-- onboarding, por causa do passo novo que pergunta o periodo.
--
-- Esse UPDATE NAO pode vir aqui. Ele so faz sentido na mesma migration que
-- introduz o passo novo (Etapa 3): aplicado agora, empurraria quem esta no
-- passo 4 ou adiante para um passo que ainda nao existe, pulando uma pergunta
-- real do fluxo atual. Fica registrado para a Etapa 3.
