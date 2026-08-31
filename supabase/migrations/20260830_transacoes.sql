-- Cria a tabela de transacoes: pedidos, compras, custos, mao de obra e
-- investimentos. Tudo o que o app chama de "lancamento".
--
-- Motivo: ate aqui NADA disso tinha banco. Pedidos, faturamento, lucro e
-- despesas viviam so no `localStorage` do navegador, na chave
-- `carulaconfeitaria_transacoes_v3`. Consequencias praticas:
--
--   - Trocar de celular, trocar de navegador ou limpar dados do site apagava o
--     historico financeiro inteiro, sem aviso e sem recuperacao.
--   - A mesma conta em dois aparelhos tinha DOIS conjuntos de pedidos que nunca
--     se encontravam: o que a confeiteira lancava no celular dela nao existia no
--     do marido, e vice-versa.
--   - As telas Inicio, Pedidos, Compras, Custos, Semana e Historico liam desse
--     armazenamento local enquanto Fichas, Estoque e Clientes ja liam do
--     Supabase — metade do app num lugar, metade no outro.
--
-- Nenhum dado e migrado: nao ha lancamento real: o app ainda nao entrou em uso.
--
-- Idempotente: pode rodar mais de uma vez sem erro.

CREATE TABLE IF NOT EXISTS public.transacoes (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuaria_id  uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,

  tipo        text NOT NULL CHECK (tipo IN ('venda','reposicao','maodeobra','custo','investimento')),
  descricao   text NOT NULL,

  -- `data` e a data do FATO (dia da entrega/da compra), escolhida pela
  -- confeiteira. `created_at` e quando a linha foi gravada. Sao coisas
  -- diferentes: um pedido para a semana que vem e lancado hoje, e todo filtro
  -- de periodo do app usa a primeira.
  data        date NOT NULL,

  quantidade    numeric NOT NULL DEFAULT 1,
  valor_unitario numeric NOT NULL DEFAULT 0,
  valor_total    numeric NOT NULL DEFAULT 0,
  -- Sinal/entrada. NULL (e nao 0) quando nao houve: zero significaria "pagou
  -- nada", e o resumo trata os dois casos de formas diferentes.
  valor_sinal    numeric,

  status_pagamento text CHECK (status_pagamento IN ('pago','pendente')),
  forma_pagamento  text,

  -- Dados da cliente ficam desnormalizados de proposito. O pedido e um registro
  -- historico: se a cliente trocar de telefone depois, o orcamento ja emitido
  -- nao pode mudar junto. A tabela `clientes` serve para o cadastro; isto aqui
  -- e a foto do que valia no dia.
  cliente_nome      text,
  cliente_telefone  text,
  cliente_foto_url  text,

  data_evento       date,
  horario_entrega   text,
  endereco_entrega  text,
  observacoes       text,
  imagem_inspiracao text,
  notas             text,

  fornecedor            text,
  periodo_mao_de_obra   text,
  categoria             text,

  -- Composicao financeira congelada no lancamento. Ver [[SaleBreakdown]]:
  -- antes disto cada tela reconstruia o numero de um jeito e as tres erravam.
  breakdown         jsonb,
  -- Vinculo com as fichas do pedido, com quantidade e tamanho de cada item.
  ficha_itens       jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Copia do que foi baixado do estoque. O rastro autoritativo esta em
  -- `estoque_movimentos`; isto e conveniencia de leitura.
  insumos_consumidos jsonb NOT NULL DEFAULT '[]'::jsonb,

  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Toda tela lista por usuaria e ordena por data do fato, da mais recente.
CREATE INDEX IF NOT EXISTS transacoes_usuaria_data_idx
  ON public.transacoes (usuaria_id, data DESC);

-- Inicio, Custos e Compras filtram por tipo dentro do periodo.
CREATE INDEX IF NOT EXISTS transacoes_usuaria_tipo_idx
  ON public.transacoes (usuaria_id, tipo);

ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transacoes proprias" ON public.transacoes;
CREATE POLICY "transacoes proprias" ON public.transacoes
  FOR ALL
  USING (auth.uid() = usuaria_id)
  WITH CHECK (auth.uid() = usuaria_id);

COMMENT ON TABLE  public.transacoes      IS 'Pedidos, compras, custos, mao de obra e investimentos. Antes vivia so no localStorage do navegador.';
COMMENT ON COLUMN public.transacoes.data IS 'Data do fato (entrega/compra), escolhida pela usuaria. Nao confundir com created_at.';
COMMENT ON COLUMN public.transacoes.valor_sinal IS 'Entrada paga. NULL = nao houve sinal; 0 seria "pagou nada", que e outra coisa.';


-- `estoque_movimentos.transacao_id` era text porque as transacoes ainda viviam
-- no localStorage, com ids do tipo "tx-1788124352483-sfpu5". Agora que existe
-- tabela, vira chave estrangeira de verdade.
--
-- ON DELETE SET NULL, e nao CASCADE: excluir um pedido nao pode apagar o
-- historico de que ele consumiu estoque. A descricao do movimento guarda o
-- contexto legivel, entao a linha continua fazendo sentido sem o vinculo.
--
-- Seguro recriar a coluna: a tabela esta vazia (nenhum lancamento real).
DROP INDEX IF EXISTS estoque_movimentos_transacao_idx;
ALTER TABLE public.estoque_movimentos DROP COLUMN IF EXISTS transacao_id;
ALTER TABLE public.estoque_movimentos
  ADD COLUMN transacao_id bigint REFERENCES public.transacoes (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS estoque_movimentos_transacao_idx
  ON public.estoque_movimentos (transacao_id)
  WHERE transacao_id IS NOT NULL;
