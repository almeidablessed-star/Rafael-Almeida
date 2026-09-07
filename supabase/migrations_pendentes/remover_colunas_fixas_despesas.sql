-- MIGRATION B — NAO APLICAR AINDA.
--
-- So rodar depois que o onboarding obrigatorio (Parte 3 do spec) estiver em
-- uso real e a lista `despesas_empresa` (criada na migration
-- 20260906_minha_empresa_configuracao.sql) estiver validada como a unica
-- fonte de despesa consultada pelo app.
--
-- Quando estiver pronta para aplicar: renomear este arquivo com um prefixo de
-- data (padrao AAAAMMDD_descricao.sql) e move-lo para supabase/migrations/.
--
-- Remove as 7 colunas fixas de despesa de `administrative_costs`, ja copiadas
-- para `despesas_empresa` pela migration A, e a coluna de guarda que so
-- servia para tornar aquele backfill idempotente.

ALTER TABLE public.administrative_costs
  DROP COLUMN IF EXISTS agua,
  DROP COLUMN IF EXISTS aluguel,
  DROP COLUMN IF EXISTS energia,
  DROP COLUMN IF EXISTS gas,
  DROP COLUMN IF EXISTS gasolina,
  DROP COLUMN IF EXISTS internet,
  DROP COLUMN IF EXISTS limpeza,
  DROP COLUMN IF EXISTS migrado_de_colunas_fixas;
