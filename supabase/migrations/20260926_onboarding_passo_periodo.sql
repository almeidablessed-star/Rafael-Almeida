-- Passo novo no onboarding financeiro: "Com que frequencia voce quer resetar
-- suas metas?", inserido como passo 4, logo depois de "dias por semana".
-- Etapa 3 de docs/plano-periodo-reset-configuravel.md.
--
-- A ORDEM DAS DUAS OPERACOES IMPORTA. Alargar o CHECK vem primeiro: o UPDATE
-- pode empurrar alguem do passo 8 para o 9, e com o CHECK antigo (1..8) essa
-- linha seria recusada e a migration abortaria no meio.
--
-- Idempotente: pode rodar mais de uma vez sem erro. O UPDATE nao e idempotente
-- por natureza (rodar duas vezes empurraria o passo duas vezes), por isso ele
-- e protegido pela guarda descrita na secao 2.


-- ============================================================================
-- 1. O CHECK do passo precisa aceitar 9
-- ============================================================================
--
-- A constraint original (migration 20260906_onboarding_financeiro_gate.sql,
-- linha 26) fixava `BETWEEN 1 AND 8`. Com o passo novo o fluxo tem 9, e sem
-- alargar isto a usuaria conseguiria navegar ate o resumo na tela mas o
-- `salvarPassoOnboarding(9, ...)` seria recusado pelo banco — ela ficaria
-- presa no passo 8 com um erro generico de gravacao.

ALTER TABLE public.administrative_costs
  DROP CONSTRAINT IF EXISTS administrative_costs_onboarding_passo_check,
  ADD CONSTRAINT administrative_costs_onboarding_passo_check
    CHECK (onboarding_financeiro_passo_atual BETWEEN 1 AND 9);

COMMENT ON COLUMN public.administrative_costs.onboarding_financeiro_passo_atual IS
  'Passo (1-9) onde a usuaria parou no onboarding financeiro obrigatorio. Usado so para retomar o fluxo.';


-- ============================================================================
-- 2. Quem esta no meio do onboarding precisa escorregar um passo
-- ============================================================================
--
-- O passo novo entra na posicao 4. Sem este UPDATE, quem parou no antigo passo
-- 4 (Despesas) reabriria o app no passo 4 e veria a pergunta de periodo — com
-- as despesas puladas, e o conteudo de todos os passos seguintes deslocado.
--
-- `>= 4` porque so quem ja passou da posicao de insercao e afetado; quem parou
-- nos passos 1, 2 ou 3 continua exatamente onde estava e vera a pergunta nova
-- na hora certa.
--
-- `completo_em IS NULL` protege quem ja concluiu: essas contas nao sao tocadas.
-- Elas ficam com o default 'semanal' e mudam em Minha Empresa se quiserem — o
-- campo tem default valido, entao nao ha buraco de dado.
--
-- Esta guarda tambem torna o UPDATE seguro para rodar de novo por engano: quem
-- ja concluiu esta fora, e quem esta no meio seria empurrado de novo. Portanto
-- RODE ESTE BLOCO UMA VEZ SO. Em caso de duvida, confira antes com:
--   SELECT usuaria_id, onboarding_financeiro_passo_atual
--     FROM public.administrative_costs
--    WHERE onboarding_financeiro_completo_em IS NULL;

UPDATE public.administrative_costs
   SET onboarding_financeiro_passo_atual = onboarding_financeiro_passo_atual + 1
 WHERE onboarding_financeiro_passo_atual >= 4
   AND onboarding_financeiro_completo_em IS NULL;
