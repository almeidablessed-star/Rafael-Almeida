-- Grava produtoId nos insumos das fichas tecnicas existentes, usando o
-- casamento por nome normalizado ja revisado manualmente (100% CASADO, sem
-- nenhum caso ambiguo) na consulta de
-- supabase/migrations_pendentes/casamento_insumos_produtos_REVISAO.sql.
--
-- Mexe em DADO REAL dentro de colunas JSONB (fichas_tecnicas.insumos e
-- fichas_tecnicas.tamanhos[].ingredients). So ADICIONA a chave `produtoId` a
-- cada objeto de insumo — nenhuma outra chave, nenhum outro campo da ficha ou
-- do tamanho e tocado ou reordenado.
--
-- Idempotente: rodar de novo so re-grava o mesmo produtoId (o `||` sobrescreve
-- com o mesmo valor, sem duplicar nem criar inconsistencia).
--
-- Reversivel: '_backup_20260907_fichas_tecnicas' (criado num passo separado,
-- ANTES deste arquivo) tem o estado exato de antes desta gravacao. Restaurar
-- = copiar `insumos` e `tamanhos` de volta da tabela de backup pelo mesmo id.
--
-- As duas secoes rodam dentro de uma unica transacao: se a Secao 2 falhar
-- depois da Secao 1 ja ter rodado, o COMMIT nunca acontece e o Postgres
-- desfaz a Secao 1 sozinho — nunca fica uma ficha com o nivel-ficha
-- atualizado e o nivel-tamanho nao, ou vice-versa.

BEGIN;

-- ============================================================================
-- 1. Insumos no nivel da ficha (fichas_tecnicas.insumos)
-- ============================================================================

UPDATE public.fichas_tecnicas f
SET insumos = sub.novos_insumos
FROM (
  SELECT
    f2.id,
    jsonb_agg(
      CASE
        WHEN p.produto_id IS NOT NULL THEN ing || jsonb_build_object('produtoId', p.produto_id)
        ELSE ing
      END
      ORDER BY ord
    ) AS novos_insumos
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
  GROUP BY f2.id
) sub
WHERE f.id = sub.id;


-- ============================================================================
-- 2. Insumos por tamanho (fichas_tecnicas.tamanhos[].ingredients)
-- ============================================================================

UPDATE public.fichas_tecnicas f
SET tamanhos = sub.novos_tamanhos
FROM (
  SELECT
    f2.id,
    jsonb_agg(
      tam || jsonb_build_object('ingredients', COALESCE(novos_ing.arr, tam -> 'ingredients'))
      ORDER BY tam_ord
    ) AS novos_tamanhos
  FROM public.fichas_tecnicas f2
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(f2.tamanhos, '[]'::jsonb)) WITH ORDINALITY AS t(tam, tam_ord)
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(
      CASE
        WHEN p2.produto_id IS NOT NULL THEN ing2 || jsonb_build_object('produtoId', p2.produto_id)
        ELSE ing2
      END
      ORDER BY ing_ord
    ) AS arr
    FROM jsonb_array_elements(COALESCE(tam -> 'ingredients', '[]'::jsonb)) WITH ORDINALITY AS ti(ing2, ing_ord)
    LEFT JOIN LATERAL (
      SELECT pr.id AS produto_id
      FROM public.produtos pr
      WHERE pr.usuaria_id = f2.usuaria_id
        AND trim(regexp_replace(regexp_replace(lower(translate(pr.nome,
              'áàâãäÁÀÂÃÄéèêëÉÈÊËíìîïÍÌÎÏóòôõöÓÒÔÕÖúùûüÚÙÛÜçÇñÑ',
              'aaaaaAAAAAeeeeEEEEiiiiIIIIooooOOOOOuuuuUUUUcCnN'
            )), '[^a-z0-9]+', ' ', 'g'), '\s+', ' ', 'g'))
          = trim(regexp_replace(regexp_replace(lower(translate(ing2 ->> 'name',
              'áàâãäÁÀÂÃÄéèêëÉÈÊËíìîïÍÌÎÏóòôõöÓÒÔÕÖúùûüÚÙÛÜçÇñÑ',
              'aaaaaAAAAAeeeeEEEEiiiiIIIIooooOOOOOuuuuUUUUcCnN'
            )), '[^a-z0-9]+', ' ', 'g'), '\s+', ' ', 'g'))
      LIMIT 1
    ) p2 ON true
  ) novos_ing ON true
  GROUP BY f2.id
) sub
WHERE f.id = sub.id;

COMMIT;
