-- Tour guiado de primeiros passos (Produtos -> Fichas -> Pedidos), mostrado
-- uma unica vez logo apos o onboarding financeiro obrigatorio.
--
-- Mesmo padrao do onboarding financeiro (ver migration
-- 20260906_onboarding_financeiro_gate.sql): NULL enquanto a usuaria nao viu
-- (ou pulou) o tour; recebe timestamp assim que ela conclui ou pula, e nunca
-- mais e usado para decidir exibicao automatica dali em diante. Rever o tour
-- manualmente (item no Perfil) NAO limpa este campo de volta para NULL.
--
-- Aditiva e idempotente: pode rodar mais de uma vez sem erro.

ALTER TABLE public.administrative_costs
  ADD COLUMN IF NOT EXISTS tour_primeiros_passos_visto_em timestamptz NULL;

COMMENT ON COLUMN public.administrative_costs.tour_primeiros_passos_visto_em IS 'NULL = tour guiado de primeiros passos ainda nao foi visto nem pulado. Preenchido na conclusao ou ao pular; nao decide bloqueio de tela, so se o tour aparece sozinho.';
