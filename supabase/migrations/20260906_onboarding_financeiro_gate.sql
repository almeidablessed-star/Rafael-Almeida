-- Fase 3a: colunas de controle do onboarding financeiro obrigatorio
-- (spec "Minha Empresa", Parte 3).
--
-- Duas colunas, propositos diferentes:
--
--   - onboarding_financeiro_passo_atual: em qual dos 8 passos a usuaria
--     parou. Existe para o fluxo poder RETOMAR de onde parou (Parte 3, item
--     2), mesmo que ela feche o app no meio. Nao da para inferir isso pelos
--     valores dos campos (cmv_target_percent ja nasce com default 34 mesmo
--     sem a usuaria ter confirmado nada) — precisa de um marcador explicito.
--
--   - onboarding_financeiro_completo_em: NULL enquanto o onboarding nao foi
--     concluido. So recebe timestamp na tela de resumo final (Parte 3, item
--     3, etapa 8), quando a usuaria confirma. E este campo, e nao o passo
--     atual, que decide se o app libera o resto das telas.
--
-- Aditiva e idempotente: pode rodar mais de uma vez sem erro.

ALTER TABLE public.administrative_costs
  ADD COLUMN IF NOT EXISTS onboarding_financeiro_passo_atual smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS onboarding_financeiro_completo_em timestamptz NULL;

ALTER TABLE public.administrative_costs
  DROP CONSTRAINT IF EXISTS administrative_costs_onboarding_passo_check,
  ADD CONSTRAINT administrative_costs_onboarding_passo_check
    CHECK (onboarding_financeiro_passo_atual BETWEEN 1 AND 8);

COMMENT ON COLUMN public.administrative_costs.onboarding_financeiro_passo_atual IS 'Passo (1-8) onde a usuaria parou no onboarding financeiro obrigatorio. Usado so para retomar o fluxo.';
COMMENT ON COLUMN public.administrative_costs.onboarding_financeiro_completo_em IS 'NULL = onboarding financeiro ainda nao concluido (app bloqueado nas demais telas). Preenchido so na confirmacao da tela de resumo final.';
