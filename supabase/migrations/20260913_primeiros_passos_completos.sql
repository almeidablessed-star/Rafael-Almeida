-- Checklist persistente de primeiros passos (Produto -> Ficha -> Pedido),
-- exibido no Dashboard depois que o tour guiado (ver migration
-- 20260913_tour_primeiros_passos.sql) termina.
--
-- Mesmo padrao das duas migrations anteriores (onboarding financeiro e tour):
-- NULL enquanto os 3 itens (produto cadastrado, ficha criada, pedido lancado)
-- nao estiverem todos completos; recebe timestamp na primeira vez que os 3
-- ficam verdadeiros, e dali em diante o card nunca mais reaparece — mesmo que
-- a usuaria apague depois todos os produtos/fichas/pedidos (o objetivo e nao
-- incomodar quem ja passou dessa fase).
--
-- Aditiva e idempotente: pode rodar mais de uma vez sem erro.

ALTER TABLE public.administrative_costs
  ADD COLUMN IF NOT EXISTS primeiros_passos_completos_em timestamptz NULL;

COMMENT ON COLUMN public.administrative_costs.primeiros_passos_completos_em IS 'NULL enquanto o checklist de primeiros passos (produto + ficha + pedido) ainda nao foi completado. Preenchido uma unica vez, na primeira vez que os 3 itens ficam verdadeiros; nao e limpo de volta se os dados forem apagados depois.';
