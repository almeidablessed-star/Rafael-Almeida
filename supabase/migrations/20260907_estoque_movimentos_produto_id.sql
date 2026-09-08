-- Adiciona produto_id a estoque_movimentos, para a baixa/devolucao de
-- pedido poder referenciar o catalogo Produtos em vez de so a tabela
-- estoque antiga.
--
-- Motivo: consumirParaPedido/devolverPedido (stockConsumption.ts +
-- EstoqueContext.tsx) so sabiam gravar em estoque_movimentos.estoque_id,
-- que tem FK para public.estoque. Um Produto cadastrado direto no catalogo
-- novo (fluxo guiado na Ficha, ou Compras criando um item novo) tem um id
-- que NUNCA existiu em estoque — gravar ali violaria a FK. Sem uma coluna
-- propria, a venda de uma ficha com insumo so-no-catalogo-novo nunca
-- conseguiria dar baixa em lugar nenhum.
--
-- estoque_id continua existindo e sendo usado por movimentos ja gravados
-- (ex: consumo de pedidos antigos, que debitaram itens que so existem na
-- tabela estoque). produto_id e o caminho novo, usado a partir de agora
-- pela baixa/devolucao ligada ao catalogo Produtos. Um movimento so
-- preenche UM dos dois, nunca os dois.
--
-- Idempotente: pode rodar mais de uma vez sem erro.

ALTER TABLE public.estoque_movimentos
  ADD COLUMN IF NOT EXISTS produto_id bigint REFERENCES public.produtos (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS estoque_movimentos_produto_idx
  ON public.estoque_movimentos (produto_id)
  WHERE produto_id IS NOT NULL;

COMMENT ON COLUMN public.estoque_movimentos.produto_id IS 'Produto do catalogo novo afetado por este movimento. Mutuamente exclusivo com estoque_id: cada movimento preenche um ou outro, nunca os dois.';
