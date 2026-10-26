-- Limpeza automatica do historico de movimentacoes de estoque.
--
-- Cada baixa, devolucao e entrada de insumo vira uma linha em
-- `estoque_movimentos` (~300 bytes). Numa confeitaria com 20 pedidos por
-- semana sao ~8 mil linhas/ano (~2,5 MB); com 300 contas, ~750 MB/ano
-- crescendo sem parar. A pedido do Rafael (26/10/2026), so os ultimos 3 meses
-- ficam guardados.
--
-- A quantidade em estoque NAO depende disto (fica em `produtos`). O que se
-- perde e o rastro de pedidos com mais de 3 meses: editar ou excluir um deles
-- nao mexe mais no estoque, e o app avisa (ver `pedidoTemRastroDeEstoque`).
--
-- Roda todo dia as 07:00 UTC (3h/4h no Brasil). Ja aplicada pelo Rafael no
-- Supabase em 26/10/2026 (job id 1).

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'limpar-historico-estoque',
  '0 7 * * *',
  $$DELETE FROM public.estoque_movimentos WHERE created_at < now() - interval '3 months'$$
);
