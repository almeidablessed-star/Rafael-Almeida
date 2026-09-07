-- Fase 2 do motor financeiro (Parte 2/3 do spec "Minha Empresa"): estrutura
-- para recebimento desejado, valor/hora, metas de CMV/investimento/lucro e
-- despesas como lista livre com rateio percentual por item.
--
-- ADITIVA DE PROPOSITO. Nao remove nem renomeia nada que ja existe. As 7
-- colunas fixas de despesa (agua, aluguel, energia, gas, gasolina, internet,
-- limpeza) continuam vivas em `administrative_costs` — sao copiadas para a
-- nova `despesas_empresa`, mas so serao removidas numa migration B separada,
-- depois do fluxo de onboarding (Parte 3) estar validado em uso real.
--
-- Idempotente: pode rodar mais de uma vez sem erro nem duplicar dado.


-- ============================================================================
-- 1. Metas e configuracao global da conta, em administrative_costs
-- ============================================================================
--
-- Ficam na mesma tabela (1 linha por usuaria) por ser exatamente o mesmo tipo
-- de dado que ja mora ali: configuracao financeira global da conta, nao por
-- produto. `hora_trabalho` ja segue esse padrao.

ALTER TABLE public.administrative_costs
  ADD COLUMN IF NOT EXISTS monthly_income_target      numeric  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS working_days_per_week       smallint NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS cmv_target_percent          numeric  NOT NULL DEFAULT 34,
  ADD COLUMN IF NOT EXISTS investment_target_percent   numeric  NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS profit_target_percent       numeric  NOT NULL DEFAULT 13,
  -- Guarda de uso interno: marca se a linha ja teve suas despesas fixas
  -- copiadas para `despesas_empresa` (secao 4). Sem isso, rodar esta migration
  -- duas vezes duplicaria as despesas migradas. Sera removida na migration B,
  -- junto com as colunas fixas que ela protege.
  ADD COLUMN IF NOT EXISTS migrado_de_colunas_fixas    boolean  NOT NULL DEFAULT false;

ALTER TABLE public.administrative_costs
  DROP CONSTRAINT IF EXISTS administrative_costs_working_days_check,
  ADD CONSTRAINT administrative_costs_working_days_check
    CHECK (working_days_per_week BETWEEN 1 AND 7);

ALTER TABLE public.administrative_costs
  DROP CONSTRAINT IF EXISTS administrative_costs_cmv_target_check,
  ADD CONSTRAINT administrative_costs_cmv_target_check
    CHECK (cmv_target_percent >= 0 AND cmv_target_percent < 100);

ALTER TABLE public.administrative_costs
  DROP CONSTRAINT IF EXISTS administrative_costs_investment_target_check,
  ADD CONSTRAINT administrative_costs_investment_target_check
    CHECK (investment_target_percent >= 0 AND investment_target_percent < 100);

ALTER TABLE public.administrative_costs
  DROP CONSTRAINT IF EXISTS administrative_costs_profit_target_check,
  ADD CONSTRAINT administrative_costs_profit_target_check
    CHECK (profit_target_percent >= 0 AND profit_target_percent < 100);

COMMENT ON COLUMN public.administrative_costs.monthly_income_target IS 'Quanto a proprietaria quer receber por mes pelo proprio trabalho. NAO e lucro da empresa (ver spec Parte 2, item 2).';
COMMENT ON COLUMN public.administrative_costs.working_days_per_week IS 'Dias de trabalho por semana informados pela usuaria. So alimenta a meta de horas exibida como referencia, nunca uma obrigacao.';
COMMENT ON COLUMN public.administrative_costs.cmv_target_percent IS 'Meta maxima de CMV/reposicao sobre o preco do produto. Default 34, editavel por conta.';
COMMENT ON COLUMN public.administrative_costs.investment_target_percent IS 'Reserva da empresa para equipamento, curso, expansao. Default 5, editavel por conta.';
COMMENT ON COLUMN public.administrative_costs.profit_target_percent IS 'Meta MINIMA de lucro da empresa, nunca um teto (spec Parte 2, item 22). Default 13, editavel por conta.';
COMMENT ON COLUMN public.administrative_costs.migrado_de_colunas_fixas IS 'Uso interno da migration: true quando as despesas fixas desta linha ja foram copiadas para despesas_empresa. Removida na migration B.';

-- Reforco defensivo: a tabela original nao tem RLS rastreada em nenhuma
-- migration deste repo (foi criada antes de existir controle de migration).
-- ENABLE ROW LEVEL SECURITY e idempotente — nao da erro se ja estava
-- habilitado. A politica e recriada do zero para garantir que existe
-- exatamente uma, com a regra correta.
ALTER TABLE public.administrative_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custos proprios" ON public.administrative_costs;
CREATE POLICY "custos proprios" ON public.administrative_costs
  FOR ALL
  USING (auth.uid() = usuaria_id)
  WITH CHECK (auth.uid() = usuaria_id);


-- ============================================================================
-- 2. Despesas como lista livre, com rateio percentual por item
-- ============================================================================
--
-- Substitui as 7 colunas fixas. Uma usuaria pode ter zero, uma ou vinte
-- despesas — o spec pede adicionar/remover categorias livremente (Parte 2,
-- item 6), o que colunas fixas nunca permitiriam.
--
-- O valor CONSIDERADO (valor x percentual_rateio / 100) nao e armazenado:
-- e calculado no engine. Guardar aqui repetiria o erro que a coluna fantasma
-- `administrative_costs.total` ja cometeu — uma coluna sempre desatualizada
-- competindo com o calculo real.

CREATE TABLE IF NOT EXISTS public.despesas_empresa (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuaria_id         uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,

  nome               text NOT NULL,
  valor              numeric NOT NULL DEFAULT 0 CHECK (valor >= 0),

  -- Percentual da despesa que pertence ao negocio (spec Parte 2, item 7:
  -- rateio de despesa compartilhada, ex: aluguel 50% pessoal / 50% negocio).
  -- 100 = despesa inteiramente do negocio, o caso mais comum.
  percentual_rateio  numeric NOT NULL DEFAULT 100 CHECK (percentual_rateio > 0 AND percentual_rateio <= 100),

  ordem              integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS despesas_empresa_usuaria_idx
  ON public.despesas_empresa (usuaria_id, ordem);

ALTER TABLE public.despesas_empresa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "despesas proprias" ON public.despesas_empresa;
CREATE POLICY "despesas proprias" ON public.despesas_empresa
  FOR ALL
  USING (auth.uid() = usuaria_id)
  WITH CHECK (auth.uid() = usuaria_id);

COMMENT ON TABLE  public.despesas_empresa                    IS 'Despesas mensais fixas da empresa, em lista livre. Substitui as colunas fixas de administrative_costs (migradas na secao 4 desta migration).';
COMMENT ON COLUMN public.despesas_empresa.percentual_rateio  IS 'Percentual da despesa considerado do negocio (100 = despesa inteira). Usado quando a despesa e compartilhada com uso pessoal, ex: aluguel.';
COMMENT ON COLUMN public.despesas_empresa.valor              IS 'Valor mensal cheio informado pela usuaria, ANTES do rateio. O valor considerado no calculo e valor * percentual_rateio / 100, calculado no engine.';


-- ============================================================================
-- 3. Historico de alteracoes da configuracao da empresa
-- ============================================================================
--
-- Spec Parte 2 item 29 / Parte 5 item 4: nunca apagar configuracao anterior
-- sem deixar rastro de data, campo, valor antigo e valor novo.

CREATE TABLE IF NOT EXISTS public.configuracao_empresa_historico (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuaria_id   uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,

  campo        text NOT NULL,
  valor_antigo text,
  valor_novo   text,

  changed_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS configuracao_empresa_historico_usuaria_idx
  ON public.configuracao_empresa_historico (usuaria_id, changed_at DESC);

ALTER TABLE public.configuracao_empresa_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "historico proprio" ON public.configuracao_empresa_historico;
CREATE POLICY "historico proprio" ON public.configuracao_empresa_historico
  FOR ALL
  USING (auth.uid() = usuaria_id)
  WITH CHECK (auth.uid() = usuaria_id);

COMMENT ON TABLE public.configuracao_empresa_historico IS 'Rastro de cada alteracao na configuracao financeira da empresa (recebimento desejado, metas, despesas). Nao apaga nada, so registra o antes/depois.';


-- ============================================================================
-- 4. Backfill: copia as 7 colunas fixas de despesa para despesas_empresa
-- ============================================================================
--
-- So roda para linhas ainda nao migradas (migrado_de_colunas_fixas = false),
-- o que torna esta migration segura de rodar mais de uma vez. So gera linha
-- para despesa com valor > 0 — despesa zerada/nao preenchida nao vira item
-- fantasma na lista nova.
--
-- Rateio sempre 100%: esse dado simplesmente nao existe hoje. Quem tinha uma
-- despesa compartilhada (ex: aluguel) precisara ajustar o percentual
-- manualmente na primeira vez que abrir "Minha Empresa" apos esta migration —
-- inevitavel, mas nenhum valor e perdido.

INSERT INTO public.despesas_empresa (usuaria_id, nome, valor, percentual_rateio, ordem)
SELECT usuaria_id, 'Água', agua, 100, 1
FROM public.administrative_costs
WHERE migrado_de_colunas_fixas = false AND agua > 0;

INSERT INTO public.despesas_empresa (usuaria_id, nome, valor, percentual_rateio, ordem)
SELECT usuaria_id, 'Aluguel', aluguel, 100, 2
FROM public.administrative_costs
WHERE migrado_de_colunas_fixas = false AND aluguel > 0;

INSERT INTO public.despesas_empresa (usuaria_id, nome, valor, percentual_rateio, ordem)
SELECT usuaria_id, 'Energia', energia, 100, 3
FROM public.administrative_costs
WHERE migrado_de_colunas_fixas = false AND energia > 0;

INSERT INTO public.despesas_empresa (usuaria_id, nome, valor, percentual_rateio, ordem)
SELECT usuaria_id, 'Gás', gas, 100, 4
FROM public.administrative_costs
WHERE migrado_de_colunas_fixas = false AND gas > 0;

INSERT INTO public.despesas_empresa (usuaria_id, nome, valor, percentual_rateio, ordem)
SELECT usuaria_id, 'Gasolina', gasolina, 100, 5
FROM public.administrative_costs
WHERE migrado_de_colunas_fixas = false AND gasolina > 0;

INSERT INTO public.despesas_empresa (usuaria_id, nome, valor, percentual_rateio, ordem)
SELECT usuaria_id, 'Internet', internet, 100, 6
FROM public.administrative_costs
WHERE migrado_de_colunas_fixas = false AND internet > 0;

INSERT INTO public.despesas_empresa (usuaria_id, nome, valor, percentual_rateio, ordem)
SELECT usuaria_id, 'Limpeza', limpeza, 100, 7
FROM public.administrative_costs
WHERE migrado_de_colunas_fixas = false AND limpeza > 0;

UPDATE public.administrative_costs
SET migrado_de_colunas_fixas = true
WHERE migrado_de_colunas_fixas = false;
