-- Script A da Etapa 4 — a RLS passa a exigir assinatura ativa.
--
-- APLICADO EM PRODUCAO pelo Rafael, no SQL Editor, em 2026-10-07, DEPOIS do
-- Script B (20261007_1). Este arquivo existe para o repositorio refletir o
-- banco; nao precisa ser rodado de novo.
--
-- Ate aqui `usuarias.acesso_status` era so um campo que o webhook gravava e
-- ninguem lia. Agora a recusa acontece no banco: um token valido de uma conta
-- inativa nao le nem grava nada, e nenhuma checagem no React pode ser
-- contornada.
--
-- POLITICAS SE SOMAM. `administrative_costs`, `clientes` e `fichas_tecnicas`
-- tinham cinco politicas permissivas cada (quatro por comando mais uma ALL):
-- trocar so uma deixaria as outras liberando o acesso. Por isso cada tabela
-- fica com EXATAMENTE UMA politica, e todas as antigas sao removidas.
--
-- `FOR ALL` cobre os quatro comandos: `USING` governa SELECT/UPDATE/DELETE (o
-- que a pessoa enxerga) e `WITH CHECK` governa INSERT/UPDATE (o que ela grava).
--
-- `(SELECT public.tem_acesso_ativo())` com o SELECT em volta, e nao a chamada
-- solta: assim o Postgres avalia uma vez por consulta, como InitPlan, em vez de
-- uma vez por linha.
--
-- `usuarias` NAO entra: a tela de assinatura pausada precisa ler o proprio
-- status para existir. `parceiros` e `assinatura_eventos` ja estao fechadas sem
-- policy. `otp_codes` fica de fora — e o fluxo de login, anterior a sessao, e
-- sua investigacao segue pendente.
--
-- `pedidos` e `saldos_semanais` entram mesmo sem o codigo usa-las: bloqueio
-- pela metade e o que se esquece depois. Apaga-las e pendencia separada.

BEGIN;

-- ============================================================================
-- A funcao de checagem
-- ============================================================================
--
-- SECURITY DEFINER para nao depender da RLS da propria `usuarias`; STABLE para
-- o plano poder reaproveitar o resultado dentro da consulta.
--
-- O EXECUTE vai tambem para `anon`: a politica e avaliada para qualquer papel,
-- e sem esse GRANT a consulta de um visitante estouraria "permission denied for
-- function" em vez de simplesmente voltar vazia. Com ele a funcao devolve falso,
-- porque `auth.uid()` e nulo.

CREATE OR REPLACE FUNCTION public.tem_acesso_ativo()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarias u
     WHERE u.id = auth.uid() AND u.acesso_status = 'ativo'
  )
$$;

REVOKE ALL ON FUNCTION public.tem_acesso_ativo() FROM public;
GRANT EXECUTE ON FUNCTION public.tem_acesso_ativo() TO authenticated, anon;

-- ============================================================================
-- Tabelas que tinham politicas empilhadas
-- ============================================================================

DROP POLICY IF EXISTS administrative_costs_delete_own ON public.administrative_costs;
DROP POLICY IF EXISTS administrative_costs_insert_own ON public.administrative_costs;
DROP POLICY IF EXISTS administrative_costs_select_own ON public.administrative_costs;
DROP POLICY IF EXISTS administrative_costs_update_own ON public.administrative_costs;
DROP POLICY IF EXISTS "custos proprios" ON public.administrative_costs;
CREATE POLICY "custos proprios" ON public.administrative_costs FOR ALL
  USING (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()))
  WITH CHECK (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()));

DROP POLICY IF EXISTS clientes_delete_own ON public.clientes;
DROP POLICY IF EXISTS clientes_insert_own ON public.clientes;
DROP POLICY IF EXISTS clientes_select_own ON public.clientes;
DROP POLICY IF EXISTS clientes_update_own ON public.clientes;
DROP POLICY IF EXISTS usuaria_acessa_seus_clientes ON public.clientes;
CREATE POLICY usuaria_acessa_seus_clientes ON public.clientes FOR ALL
  USING (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()))
  WITH CHECK (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()));

DROP POLICY IF EXISTS fichas_tecnicas_delete_own ON public.fichas_tecnicas;
DROP POLICY IF EXISTS fichas_tecnicas_insert_own ON public.fichas_tecnicas;
DROP POLICY IF EXISTS fichas_tecnicas_select_own ON public.fichas_tecnicas;
DROP POLICY IF EXISTS fichas_tecnicas_update_own ON public.fichas_tecnicas;
DROP POLICY IF EXISTS usuaria_acessa_suas_fichas ON public.fichas_tecnicas;
CREATE POLICY usuaria_acessa_suas_fichas ON public.fichas_tecnicas FOR ALL
  USING (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()))
  WITH CHECK (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()));

-- ============================================================================
-- Tabelas que ja tinham uma politica so
-- ============================================================================

DROP POLICY IF EXISTS "transacoes proprias" ON public.transacoes;
CREATE POLICY "transacoes proprias" ON public.transacoes FOR ALL
  USING (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()))
  WITH CHECK (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()));

DROP POLICY IF EXISTS "produtos proprios" ON public.produtos;
CREATE POLICY "produtos proprios" ON public.produtos FOR ALL
  USING (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()))
  WITH CHECK (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()));

DROP POLICY IF EXISTS "movimentos proprios" ON public.estoque_movimentos;
CREATE POLICY "movimentos proprios" ON public.estoque_movimentos FOR ALL
  USING (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()))
  WITH CHECK (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()));

DROP POLICY IF EXISTS "despesas proprias" ON public.despesas_empresa;
CREATE POLICY "despesas proprias" ON public.despesas_empresa FOR ALL
  USING (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()))
  WITH CHECK (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()));

DROP POLICY IF EXISTS "historico proprio" ON public.configuracao_empresa_historico;
CREATE POLICY "historico proprio" ON public.configuracao_empresa_historico FOR ALL
  USING (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()))
  WITH CHECK (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()));

DROP POLICY IF EXISTS usuaria_acessa_seus_pedidos ON public.pedidos;
CREATE POLICY usuaria_acessa_seus_pedidos ON public.pedidos FOR ALL
  USING (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()))
  WITH CHECK (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()));

DROP POLICY IF EXISTS usuaria_acessa_seus_saldos ON public.saldos_semanais;
CREATE POLICY usuaria_acessa_seus_saldos ON public.saldos_semanais FOR ALL
  USING (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()))
  WITH CHECK (auth.uid() = usuaria_id AND (SELECT public.tem_acesso_ativo()));

COMMIT;

-- Verificado apos aplicar: 10 linhas, uma politica por tabela, todas cmd = ALL.
--   SELECT tablename, policyname, cmd,
--          count(*) OVER (PARTITION BY tablename) AS politicas_na_tabela
--     FROM pg_policies WHERE schemaname = 'public' AND tablename IN
--     ('administrative_costs','clientes','fichas_tecnicas','transacoes','produtos',
--      'estoque_movimentos','despesas_empresa','configuracao_empresa_historico',
--      'pedidos','saldos_semanais') ORDER BY tablename;
