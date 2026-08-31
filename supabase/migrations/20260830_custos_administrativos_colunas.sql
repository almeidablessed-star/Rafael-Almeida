-- Cria as colunas que faltavam em `administrative_costs`.
--
-- Motivo: a tela de Custos Administrativos SEMPRE falhou ao salvar. O
-- `saveCosts` monta um upsert com `gasolina` e `hora_trabalho`, e nenhuma das
-- duas existia na tabela. O PostgREST recusa a linha inteira nesse caso
-- ("Could not find the 'gasolina' column ... in the schema cache"), entao nada
-- era gravado — nem os campos que existiam.
--
-- O efeito ia alem da tela: os custos fixos alimentam a meta de faturamento
-- semanal do Inicio. Sem nunca conseguir salvar, aquele numero jamais teria
-- como aparecer, e a tabela permanecia vazia — o que fazia o erro parecer
-- "ainda nao preencheu" em vez de "nao consegue preencher".
--
-- Idempotente: pode rodar mais de uma vez sem erro.

ALTER TABLE public.administrative_costs
  ADD COLUMN IF NOT EXISTS gasolina      numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hora_trabalho numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.administrative_costs.gasolina IS 'Despesa mensal com combustivel (entregas).';
COMMENT ON COLUMN public.administrative_costs.hora_trabalho IS
  'Tarifa por hora da confeiteira (R$/hora). NAO e despesa mensal e NAO entra no total de custos fixos: ela multiplica pelas horas do bolo para achar a mao de obra daquele bolo.';


-- A coluna `total` nunca foi gravada pelo app — so lida. Ficava sempre nula
-- enquanto a tela somava os campos por conta propria, ou seja: duas respostas
-- para a mesma pergunta, e a do banco sempre errada.
--
-- O app agora calcula o total no codigo, EXCLUINDO `hora_trabalho` (que e
-- tarifa, nao despesa). Manter aqui uma coluna chamada exatamente `total`, e
-- permanentemente vazia, e uma armadilha para quem consultar o banco direto.
ALTER TABLE public.administrative_costs DROP COLUMN IF EXISTS total;
