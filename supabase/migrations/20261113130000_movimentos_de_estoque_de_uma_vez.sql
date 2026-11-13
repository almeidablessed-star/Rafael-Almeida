-- Baixa e devolucao de estoque de um pedido numa gravacao so.
--
-- RODADO pelo Rafael no SQL Editor em 13/11/2026, antes de publicar
-- o app que usa a funcao.
--
-- Hoje o app faz isso em varias gravacoes separadas, a partir do celular: para
-- cada insumo, uma para mudar o saldo e outra para registrar o movimento. Dois
-- problemas:
--   1. Se a internet cai no meio, parte dos insumos baixa e parte nao. O app
--      tenta desfazer, mas o desfazer tambem depende da internet.
--   2. O saldo novo e calculado no celular (saldo lido - quantidade). Com a
--      mesma conta em dois aparelhos, ou uma compra lancada no mesmo instante,
--      a segunda gravacao apaga a primeira.
--
-- Aqui tudo acontece dentro do banco, numa transacao: ou todos os insumos do
-- pedido mudam, ou nenhum. E o saldo e somado/subtraido em cima do valor que
-- esta no banco naquele instante, nao de um valor lido antes.
--
-- SECURITY INVOKER: roda com as permissoes de quem chama, entao as regras de
-- acesso das tabelas (so a dona, com assinatura ativa) continuam valendo.
--
-- Cada item de `p_movimentos`:
--   { "tipo": "consumo" | "devolucao", "produto_id": 12 | null,
--     "item_nome": "...", "quantidade": 300, "unidade": "g",
--     "transacao_id": "251" (a coluna e bigint; a funcao converte), "ficha_id": 7 | null, "descricao": "..." }
-- `quantidade` ja vem na unidade do estoque. Sem `produto_id` (movimento
-- antigo, da tabela de estoque que nao existe mais) so o historico e gravado.
--
-- Devolve os saldos novos: { "12": 700, ... }.

CREATE OR REPLACE FUNCTION public.aplicar_movimentos_de_estoque(p_movimentos jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  m jsonb;
  v_tipo text;
  v_quantidade numeric;
  v_produto bigint;
  v_saldo numeric;
  v_saldos jsonb := '{}'::jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sem sessao: entre de novo e tente outra vez.';
  END IF;
  IF p_movimentos IS NULL OR jsonb_typeof(p_movimentos) <> 'array' THEN
    RAISE EXCEPTION 'Lista de movimentos invalida.';
  END IF;

  FOR m IN SELECT * FROM jsonb_array_elements(p_movimentos) LOOP
    v_tipo := m->>'tipo';
    v_quantidade := (m->>'quantidade')::numeric;
    v_produto := NULLIF(m->>'produto_id', '')::bigint;

    IF v_tipo NOT IN ('consumo', 'devolucao') THEN
      RAISE EXCEPTION 'Tipo de movimento invalido: %', v_tipo;
    END IF;
    IF v_quantidade IS NULL OR v_quantidade <= 0 THEN
      RAISE EXCEPTION 'Quantidade invalida para "%".', m->>'item_nome';
    END IF;

    IF v_produto IS NOT NULL THEN
      UPDATE public.produtos
         SET quantidade_atual = COALESCE(quantidade_atual, 0)
                                + CASE WHEN v_tipo = 'consumo' THEN -v_quantidade ELSE v_quantidade END
       WHERE id = v_produto AND usuaria_id = v_uid
       RETURNING quantidade_atual INTO v_saldo;

      IF NOT FOUND THEN
        -- Produto apagado do catalogo: na devolucao nao ha onde devolver, e o
        -- movimento tambem nao e gravado (igual ao app de hoje). No consumo e
        -- erro: desfaz tudo.
        IF v_tipo = 'devolucao' THEN CONTINUE; END IF;
        RAISE EXCEPTION 'O produto "%" nao foi encontrado no estoque.', m->>'item_nome';
      END IF;

      v_saldos := v_saldos || jsonb_build_object(v_produto::text, v_saldo);
    END IF;

    INSERT INTO public.estoque_movimentos
      (usuaria_id, produto_id, item_nome, tipo, quantidade, unidade, transacao_id, ficha_id, descricao)
    VALUES
      (v_uid, v_produto, m->>'item_nome', v_tipo, v_quantidade, m->>'unidade',
       NULLIF(m->>'transacao_id', '')::bigint, NULLIF(m->>'ficha_id', '')::bigint, m->>'descricao');
  END LOOP;

  RETURN v_saldos;
END;
$$;

REVOKE ALL ON FUNCTION public.aplicar_movimentos_de_estoque(jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.aplicar_movimentos_de_estoque(jsonb) TO authenticated;

-- Para desfazer: DROP FUNCTION public.aplicar_movimentos_de_estoque(jsonb);
