-- Restauracao de backup em UMA transacao.
--
-- Antes o app fazia duas chamadas separadas: apagava todos os lancamentos da
-- conta e so depois gravava os do arquivo. Se a gravacao falhasse (arquivo
-- velho, item sem `tipo`/`descricao`/`data`, internet caindo no meio), os
-- lancamentos ja tinham sido apagados e nada voltava.
--
-- Dentro desta funcao o DELETE e o INSERT sao uma coisa so: qualquer erro em
-- qualquer linha desfaz tudo, e a conta fica exatamente como estava.
--
-- SECURITY INVOKER de proposito: a funcao roda com as permissoes de quem chama,
-- entao a politica "transacoes proprias" (dona + `tem_acesso_ativo()`) continua
-- valendo para o DELETE e para o INSERT. A conta vem SEMPRE de `auth.uid()`;
-- nenhum `usuaria_id` do arquivo e lido.
--
-- As chaves de `linhas` sao as que `mapTransactionToSupabase` gera
-- (src/context/TransacoesContext.tsx), mais `created_at`. Chave que nao estiver
-- na lista do `jsonb_to_recordset` e ignorada sem erro — ao criar coluna nova
-- em `transacoes`, acrescentar aqui tambem.
--
-- `created_at` vem do arquivo para o lancamento restaurado nao contar como
-- "lancado hoje" nos numeros da semana (o Inicio filtra por ele).
--
-- `produto_id` so e mantido se o produto ainda existir e for da mesma conta;
-- senao vira NULL, em vez de a chave estrangeira derrubar a restauracao toda.
--
-- Limitacao aceita: os pedidos restaurados nascem com id novo, e os movimentos
-- de estoque que apontavam para os antigos ficam sem vinculo (ON DELETE SET
-- NULL). A tela de confirmacao avisa disso.
--
-- Rodar no SQL Editor. Desfazer:
--   DROP FUNCTION IF EXISTS public.restaurar_backup_transacoes(jsonb);
-- (o app voltaria a falhar na restauracao ate o codigo antigo ser reposto).

CREATE OR REPLACE FUNCTION public.restaurar_backup_transacoes(linhas jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  gravadas integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Sem sessao: entre de novo e tente outra vez.';
  END IF;

  IF linhas IS NULL OR jsonb_typeof(linhas) <> 'array' OR jsonb_array_length(linhas) = 0 THEN
    RAISE EXCEPTION 'Backup vazio ou em formato invalido. Nada foi alterado.';
  END IF;

  DELETE FROM transacoes WHERE usuaria_id = uid;

  INSERT INTO transacoes (
    usuaria_id, tipo, descricao, data, quantidade, valor_unitario, valor_total,
    valor_sinal, status_pagamento, forma_pagamento, cliente_nome, cliente_telefone,
    cliente_foto_url, data_evento, horario_entrega, endereco_entrega, observacoes,
    imagem_inspiracao, notas, fornecedor, periodo_mao_de_obra, categoria, breakdown,
    ficha_itens, insumos_consumidos, produto_id, created_at
  )
  SELECT
    uid, r.tipo, r.descricao, r.data,
    COALESCE(r.quantidade, 1), COALESCE(r.valor_unitario, 0), COALESCE(r.valor_total, 0),
    r.valor_sinal, r.status_pagamento, r.forma_pagamento, r.cliente_nome, r.cliente_telefone,
    r.cliente_foto_url, r.data_evento, r.horario_entrega, r.endereco_entrega, r.observacoes,
    r.imagem_inspiracao, r.notas, r.fornecedor, r.periodo_mao_de_obra, r.categoria, r.breakdown,
    COALESCE(r.ficha_itens, '[]'::jsonb), COALESCE(r.insumos_consumidos, '[]'::jsonb),
    (SELECT p.id FROM produtos p WHERE p.id = r.produto_id AND p.usuaria_id = uid),
    COALESCE(r.created_at, now())
  FROM jsonb_to_recordset(linhas) AS r(
    tipo text, descricao text, data date,
    quantidade numeric, valor_unitario numeric, valor_total numeric, valor_sinal numeric,
    status_pagamento text, forma_pagamento text, cliente_nome text, cliente_telefone text,
    cliente_foto_url text, data_evento date, horario_entrega text, endereco_entrega text,
    observacoes text, imagem_inspiracao text, notas text, fornecedor text,
    periodo_mao_de_obra text, categoria text, breakdown jsonb,
    ficha_itens jsonb, insumos_consumidos jsonb, produto_id bigint, created_at timestamptz
  );

  GET DIAGNOSTICS gravadas = ROW_COUNT;
  RETURN gravadas;
END;
$$;

REVOKE ALL ON FUNCTION public.restaurar_backup_transacoes(jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.restaurar_backup_transacoes(jsonb) TO authenticated;
