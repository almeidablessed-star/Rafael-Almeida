-- SO LEITURA. Mostra lado a lado o `insumos` (nivel ficha) ATUAL e o que
-- ficaria DEPOIS do UPDATE de 20260907_vincula_insumos_produtos.sql, sem
-- gravar nada. Rodar isto ANTES do UPDATE de verdade, so pra conferencia
-- visual.

SELECT
  f2.id,
  f2.nome_produto,
  f2.insumos                       AS insumos_antes,
  jsonb_agg(
    CASE
      WHEN p.produto_id IS NOT NULL THEN ing || jsonb_build_object('produtoId', p.produto_id)
      ELSE ing
    END
    ORDER BY ord
  )                                 AS insumos_depois
FROM public.fichas_tecnicas f2
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(f2.insumos, '[]'::jsonb)) WITH ORDINALITY AS t(ing, ord)
LEFT JOIN LATERAL (
  SELECT pr.id AS produto_id
  FROM public.produtos pr
  WHERE pr.usuaria_id = f2.usuaria_id
    AND trim(regexp_replace(regexp_replace(lower(translate(pr.nome,
          'áàâãäÁÀÂÃÄéèêëÉÈÊËíìîïÍÌÎÏóòôõöÓÒÔÕÖúùûüÚÙÛÜçÇñÑ',
          'aaaaaAAAAAeeeeEEEEiiiiIIIIooooOOOOOuuuuUUUUcCnN'
        )), '[^a-z0-9]+', ' ', 'g'), '\s+', ' ', 'g'))
      = trim(regexp_replace(regexp_replace(lower(translate(ing ->> 'name',
          'áàâãäÁÀÂÃÄéèêëÉÈÊËíìîïÍÌÎÏóòôõöÓÒÔÕÖúùûüÚÙÛÜçÇñÑ',
          'aaaaaAAAAAeeeeEEEEiiiiIIIIooooOOOOOuuuuUUUUcCnN'
        )), '[^a-z0-9]+', ' ', 'g'), '\s+', ' ', 'g'))
  LIMIT 1
) p ON true
GROUP BY f2.id, f2.nome_produto, f2.insumos;

-- Repita a mesma logica para `tamanhos` se quiser conferir tambem os
-- insumos por tamanho antes do UPDATE da secao 2 do script principal — avise
-- que eu monto essa segunda consulta de preview igual a esta.
