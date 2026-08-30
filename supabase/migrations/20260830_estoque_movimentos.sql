-- Cria a tabela de movimentacoes de estoque.
--
-- Motivo: ate aqui o app tinha DOIS estoques que nunca se falavam. A aba
-- Estoque lia e gravava a tabela `estoque` no Supabase; a baixa automatica do
-- pedido debitava um segundo estoque, em localStorage
-- (`carula_ingredient_stocks`), junto com um historico proprio
-- (`carula_stock_movements`). Na pratica: lancar pedido nunca mexia no estoque
-- que a confeiteira ve, e o "Historico de Movimentacoes" exibido DENTRO da aba
-- Estoque mostrava os movimentos do estoque errado.
--
-- A quantidade em si ja tem casa: e a coluna `estoque.quantidade_atual`. O que
-- faltava era onde registrar o RASTRO — quem debitou, por causa de qual pedido,
-- quando. Sem esse rastro nao ha como estornar um pedido cancelado com
-- seguranca, nem explicar para a confeiteira por que o saldo caiu.
--
-- Idempotente: pode rodar mais de uma vez sem erro.

CREATE TABLE IF NOT EXISTS public.estoque_movimentos (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuaria_id   uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,

  -- Item afetado. ON DELETE SET NULL, e nao CASCADE: apagar um insumo do
  -- estoque nao pode apagar o historico de que ele ja foi consumido. O nome
  -- fica desnormalizado em `item_nome` justamente para o rastro sobreviver.
  estoque_id   bigint REFERENCES public.estoque (id) ON DELETE SET NULL,
  item_nome    text NOT NULL,

  tipo         text NOT NULL CHECK (tipo IN ('consumo', 'devolucao', 'entrada')),

  -- Sempre POSITIVA. O sinal e dado por `tipo`, nao pela quantidade: guardar
  -- negativo aqui obrigaria toda leitura a lembrar da convencao, e a primeira
  -- que esquecesse somaria o que devia subtrair.
  quantidade   numeric NOT NULL CHECK (quantidade > 0),
  unidade      text NOT NULL,

  -- Qual venda/compra gerou o movimento. Texto, nao FK: as transacoes ainda
  -- vivem no localStorage (ids tipo "tx-1788116314136-m66h6"). Quando o passo 6
  -- levar as transacoes para o banco, isto vira FK de verdade.
  transacao_id text,
  ficha_id     bigint REFERENCES public.fichas_tecnicas (id) ON DELETE SET NULL,

  descricao    text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- O historico e sempre lido por usuaria, do mais recente para o mais antigo.
CREATE INDEX IF NOT EXISTS estoque_movimentos_usuaria_data_idx
  ON public.estoque_movimentos (usuaria_id, created_at DESC);

-- O estorno de um pedido cancelado busca por transacao.
CREATE INDEX IF NOT EXISTS estoque_movimentos_transacao_idx
  ON public.estoque_movimentos (transacao_id)
  WHERE transacao_id IS NOT NULL;

ALTER TABLE public.estoque_movimentos ENABLE ROW LEVEL SECURITY;

-- Mesma politica das demais tabelas do app: cada confeiteira enxerga e mexe
-- apenas no proprio movimento.
DROP POLICY IF EXISTS "movimentos proprios" ON public.estoque_movimentos;
CREATE POLICY "movimentos proprios" ON public.estoque_movimentos
  FOR ALL
  USING (auth.uid() = usuaria_id)
  WITH CHECK (auth.uid() = usuaria_id);

COMMENT ON TABLE  public.estoque_movimentos          IS 'Rastro de cada entrada e saida de insumo. A quantidade vigente fica em estoque.quantidade_atual; aqui fica o porque de ela ter mudado.';
COMMENT ON COLUMN public.estoque_movimentos.tipo     IS 'consumo = baixa por pedido; devolucao = estorno de pedido editado/cancelado; entrada = compra registrada na aba Compras.';
COMMENT ON COLUMN public.estoque_movimentos.quantidade IS 'Sempre positiva. O sentido vem de `tipo`.';
