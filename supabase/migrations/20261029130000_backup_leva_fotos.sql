-- Backup completo passa a levar o ENDERECO das fotos (passo 4 de "fotos para o Storage").
--
-- Com as fotos no deposito (bucket `fotos`, ver 20261029120000_storage_fotos.sql),
-- o backup leva so o endereco de cada uma (storage:<uid>/<pasta>/<arquivo>), uns
-- 80 caracteres, e as miniaturas. O arquivo continua pequeno e, ao restaurar, as
-- fotos voltam: excluir ou zerar nao apaga os arquivos do deposito.
--
-- So entra endereco do deposito DESTA conta. Foto inteira (base64, de quem ainda
-- nao migrou) ou endereco de outra conta vira NULL, como antes.
--
-- E a mesma funcao de 20261026150000_restaurar_backup_completo.sql com estas
-- colunas a mais: fichas (foto_url, foto_mini), clientes ("photoUrl", foto_mini),
-- transacoes (cliente_foto_url, imagem_inspiracao) e usuarias (foto_url).
-- Para desfazer: rodar de novo o CREATE OR REPLACE daquele arquivo.

CREATE OR REPLACE FUNCTION public.restaurar_backup_completo(dados jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  linha jsonb;
  novo_id bigint;
  mapa_produtos jsonb := '{}'::jsonb;
  mapa_fichas jsonb := '{}'::jsonb;
  p public.produtos;
  f public.fichas_tecnicas;
  c public.administrative_costs;
  perfil public.usuarias;
  tamanhos_novos jsonb;
  -- Endereco de foto do deposito valido para ESTA conta (storage:<uid>/...).
  -- Qualquer outra coisa (foto inteira em base64, endereco de outra conta) vira NULL.
  prefixo text;
  n_produtos integer := 0;
  n_fichas integer := 0;
  n_clientes integer := 0;
  n_transacoes integer := 0;
  n_despesas integer := 0;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Sem sessao: entre de novo e tente outra vez.';
  END IF;
  prefixo := 'storage:' || uid::text || '/';

  IF dados IS NULL OR jsonb_typeof(dados) <> 'object' OR (dados ->> 'versao') IS DISTINCT FROM '2' THEN
    RAISE EXCEPTION 'Backup em formato invalido. Nada foi alterado.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM unnest(ARRAY['produtos','fichas','clientes','transacoes','despesas','historico']) AS k
    WHERE dados ? k AND jsonb_typeof(dados -> k) <> 'array'
  ) THEN
    RAISE EXCEPTION 'Backup em formato invalido (lista quebrada). Nada foi alterado.';
  END IF;

  -- 1. Limpa a conta
  DELETE FROM estoque_movimentos WHERE usuaria_id = uid;
  DELETE FROM transacoes WHERE usuaria_id = uid;
  DELETE FROM fichas_tecnicas WHERE usuaria_id = uid;
  DELETE FROM produtos WHERE usuaria_id = uid;
  DELETE FROM clientes WHERE usuaria_id = uid;
  DELETE FROM despesas_empresa WHERE usuaria_id = uid;
  DELETE FROM configuracao_empresa_historico WHERE usuaria_id = uid;

  -- 2. Produtos
  FOR linha IN SELECT value FROM jsonb_array_elements(COALESCE(dados -> 'produtos', '[]'::jsonb)) LOOP
    p := jsonb_populate_record(NULL::public.produtos, linha);
    INSERT INTO produtos (
      usuaria_id, nome, categoria, preco_pago, quantidade_embalagem, unidade_embalagem,
      controla_estoque, quantidade_atual, quantidade_referencia, nivel_minimo, nivel_minimo_unidade,
      created_at, updated_at
    ) VALUES (
      uid, p.nome, p.categoria, COALESCE(p.preco_pago, 0), COALESCE(p.quantidade_embalagem, 1), p.unidade_embalagem,
      COALESCE(p.controla_estoque, true), p.quantidade_atual, p.quantidade_referencia, p.nivel_minimo, p.nivel_minimo_unidade,
      COALESCE(p.created_at, now()), COALESCE(p.updated_at, now())
    ) RETURNING id INTO novo_id;
    IF p.id IS NOT NULL THEN
      mapa_produtos := mapa_produtos || jsonb_build_object(p.id::text, novo_id);
    END IF;
    n_produtos := n_produtos + 1;
  END LOOP;

  -- 3. Fichas, com os insumos apontando para os produtos novos
  FOR linha IN SELECT value FROM jsonb_array_elements(COALESCE(dados -> 'fichas', '[]'::jsonb)) LOOP
    f := jsonb_populate_record(NULL::public.fichas_tecnicas, linha);

    IF f.tamanhos IS NOT NULL AND jsonb_typeof(f.tamanhos) = 'array' THEN
      SELECT COALESCE(jsonb_agg(
        CASE
          WHEN jsonb_typeof(t) = 'object' AND t ? 'ingredients' THEN
            jsonb_set(t, '{ingredients}', public.backup_troca_ids(t -> 'ingredients', 'produtoId', mapa_produtos, false))
          ELSE t
        END
        ORDER BY ordem), '[]'::jsonb)
      INTO tamanhos_novos
      FROM jsonb_array_elements(f.tamanhos) WITH ORDINALITY AS e(t, ordem);
    ELSE
      tamanhos_novos := f.tamanhos;
    END IF;

    INSERT INTO fichas_tecnicas (
      usuaria_id, nome_produto, categoria, custo, mao_de_obra, reposicao, investimento,
      tamanhos, insumos, rendimento, created_at, foto_url, foto_mini
    ) VALUES (
      uid, f.nome_produto, f.categoria, f.custo, f.mao_de_obra, f.reposicao, f.investimento,
      tamanhos_novos, public.backup_troca_ids(f.insumos, 'produtoId', mapa_produtos, false), f.rendimento,
      COALESCE(f.created_at, now()),
      CASE WHEN left(f.foto_url, length(prefixo)) = prefixo THEN f.foto_url END,
      CASE WHEN left(f.foto_url, length(prefixo)) = prefixo THEN f.foto_mini END
    ) RETURNING id INTO novo_id;
    IF f.id IS NOT NULL THEN
      mapa_fichas := mapa_fichas || jsonb_build_object(f.id::text, novo_id::text);
    END IF;
    n_fichas := n_fichas + 1;
  END LOOP;

  -- 4. Clientes
  INSERT INTO clientes (
    usuaria_id, nome, telefone, endereco, city, notes,
    "eventDate", "recurringEventTitle", "additionalEvents", created_at, "photoUrl", foto_mini
  )
  SELECT
    uid, r.nome, r.telefone, r.endereco, r.city, r.notes,
    r."eventDate", r."recurringEventTitle", r."additionalEvents", COALESCE(r.created_at, now()),
    CASE WHEN left(r."photoUrl", length(prefixo)) = prefixo THEN r."photoUrl" END,
    CASE WHEN left(r."photoUrl", length(prefixo)) = prefixo THEN r.foto_mini END
  FROM jsonb_array_elements(COALESCE(dados -> 'clientes', '[]'::jsonb)) AS e(l),
       LATERAL jsonb_populate_record(NULL::public.clientes, e.l) AS r;
  GET DIAGNOSTICS n_clientes = ROW_COUNT;

  -- Lancamentos, com produto e fichas apontando para os ids novos
  INSERT INTO transacoes (
    usuaria_id, tipo, descricao, data, quantidade, valor_unitario, valor_total,
    valor_sinal, status_pagamento, forma_pagamento, cliente_nome, cliente_telefone,
    data_evento, horario_entrega, endereco_entrega, observacoes,
    notas, fornecedor, periodo_mao_de_obra, categoria, breakdown,
    ficha_itens, insumos_consumidos, produto_id, created_at,
    cliente_foto_url, imagem_inspiracao
  )
  SELECT
    uid, r.tipo, r.descricao, r.data,
    COALESCE(r.quantidade, 1), COALESCE(r.valor_unitario, 0), COALESCE(r.valor_total, 0),
    r.valor_sinal, r.status_pagamento, r.forma_pagamento, r.cliente_nome, r.cliente_telefone,
    r.data_evento, r.horario_entrega, r.endereco_entrega, r.observacoes,
    r.notas, r.fornecedor, r.periodo_mao_de_obra, r.categoria,
    CASE
      WHEN r.breakdown IS NOT NULL AND jsonb_typeof(r.breakdown) = 'object' AND r.breakdown ? 'itens' THEN
        jsonb_set(r.breakdown, '{itens}', public.backup_troca_ids(r.breakdown -> 'itens', 'fichaId', mapa_fichas, true))
      ELSE r.breakdown
    END,
    COALESCE(public.backup_troca_ids(r.ficha_itens, 'fichaId', mapa_fichas, true), '[]'::jsonb),
    COALESCE(r.insumos_consumidos, '[]'::jsonb),
    (mapa_produtos ->> r.produto_id::text)::bigint,
    COALESCE(r.created_at, now()),
    CASE WHEN left(r.cliente_foto_url, length(prefixo)) = prefixo THEN r.cliente_foto_url END,
    CASE WHEN left(r.imagem_inspiracao, length(prefixo)) = prefixo THEN r.imagem_inspiracao END
  FROM jsonb_array_elements(COALESCE(dados -> 'transacoes', '[]'::jsonb)) AS e(l),
       LATERAL jsonb_populate_record(NULL::public.transacoes, e.l) AS r;
  GET DIAGNOSTICS n_transacoes = ROW_COUNT;

  -- Minha Empresa: despesas fixas e historico de mudancas
  INSERT INTO despesas_empresa (usuaria_id, nome, valor, percentual_rateio, ordem, created_at, updated_at)
  SELECT uid, r.nome, COALESCE(r.valor, 0), COALESCE(r.percentual_rateio, 100), r.ordem,
         COALESCE(r.created_at, now()), COALESCE(r.updated_at, now())
  FROM jsonb_array_elements(COALESCE(dados -> 'despesas', '[]'::jsonb)) AS e(l),
       LATERAL jsonb_populate_record(NULL::public.despesas_empresa, e.l) AS r;
  GET DIAGNOSTICS n_despesas = ROW_COUNT;

  INSERT INTO configuracao_empresa_historico (usuaria_id, campo, valor_antigo, valor_novo, changed_at)
  SELECT uid, r.campo, r.valor_antigo, r.valor_novo, COALESCE(r.changed_at, now())
  FROM jsonb_array_elements(COALESCE(dados -> 'historico', '[]'::jsonb)) AS e(l),
       LATERAL jsonb_populate_record(NULL::public.configuracao_empresa_historico, e.l) AS r;

  -- 5. Custos fixos e metas (as marcas de onboarding/tour ficam como estao)
  IF jsonb_typeof(dados -> 'custos') = 'object' THEN
    c := jsonb_populate_record(NULL::public.administrative_costs, dados -> 'custos');
    UPDATE administrative_costs SET
      agua = c.agua, aluguel = c.aluguel, energia = c.energia, gas = c.gas,
      internet = c.internet, limpeza = c.limpeza, gasolina = c.gasolina,
      hora_trabalho = c.hora_trabalho, monthly_income_target = c.monthly_income_target,
      working_days_per_week = c.working_days_per_week, cmv_target_percent = c.cmv_target_percent,
      investment_target_percent = c.investment_target_percent, profit_target_percent = c.profit_target_percent,
      migrado_de_colunas_fixas = c.migrado_de_colunas_fixas, periodo_reset = c.periodo_reset,
      updated_at = now()
    WHERE usuaria_id = uid;
    IF NOT FOUND THEN
      INSERT INTO administrative_costs (
        usuaria_id, agua, aluguel, energia, gas, internet, limpeza, gasolina,
        hora_trabalho, monthly_income_target, working_days_per_week, cmv_target_percent,
        investment_target_percent, profit_target_percent, migrado_de_colunas_fixas, periodo_reset
      ) VALUES (
        uid, c.agua, c.aluguel, c.energia, c.gas, c.internet, c.limpeza, c.gasolina,
        c.hora_trabalho, c.monthly_income_target, c.working_days_per_week, c.cmv_target_percent,
        c.investment_target_percent, c.profit_target_percent, c.migrado_de_colunas_fixas, c.periodo_reset
      );
    END IF;
  END IF;

  -- Dados da confeitaria no perfil (nada de acesso/assinatura). A foto so volta
  -- se o backup trouxer um endereco do deposito desta conta; senao fica a atual.
  IF jsonb_typeof(dados -> 'perfil') = 'object' THEN
    perfil := jsonb_populate_record(NULL::public.usuarias, dados -> 'perfil');
    UPDATE usuarias SET
      nome_confeitaria = perfil.nome_confeitaria, moeda = COALESCE(perfil.moeda, moeda),
      telefone = perfil.telefone, endereco = perfil.endereco, instagram = perfil.instagram,
      foto_url = CASE WHEN left(perfil.foto_url, length(prefixo)) = prefixo THEN perfil.foto_url ELSE foto_url END
    WHERE id = uid;
  END IF;

  RETURN jsonb_build_object(
    'produtos', n_produtos, 'fichas', n_fichas, 'clientes', n_clientes,
    'transacoes', n_transacoes, 'despesas', n_despesas
  );
END;
$$;

REVOKE ALL ON FUNCTION public.restaurar_backup_completo(jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.restaurar_backup_completo(jsonb) TO authenticated;
