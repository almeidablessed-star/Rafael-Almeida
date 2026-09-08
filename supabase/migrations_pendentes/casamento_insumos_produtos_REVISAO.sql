-- SO LEITURA. Nao grava nada. Mostra o casamento entre os insumos ja usados
-- nas fichas tecnicas existentes e os Produtos migrados (por nome
-- normalizado, mesma logica de normalizeName() em fichaMatcher.ts), para
-- revisao ANTES de qualquer UPDATE gravar produto_id no insumo de uma ficha.
--
-- Roda uma vez, mostra a lista inteira (casados e nao-casados). Nada aqui
-- persiste — pode rodar quantas vezes quiser.

WITH insumos_ficha AS (
  -- Insumos no nivel da ficha (fallback quando o tamanho nao tem lista propria).
  SELECT
    f.id          AS ficha_id,
    f.usuaria_id  AS usuaria_id,
    f.nome_produto AS ficha_nome,
    NULL::text    AS tamanho_id,
    ing ->> 'name' AS insumo_nome
  FROM public.fichas_tecnicas f
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(f.insumos, '[]'::jsonb)) AS ing

  UNION ALL

  -- Insumos por tamanho.
  SELECT
    f.id,
    f.usuaria_id,
    f.nome_produto,
    tam ->> 'id',
    ing ->> 'name'
  FROM public.fichas_tecnicas f
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(f.tamanhos, '[]'::jsonb)) AS tam
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(tam -> 'ingredients', '[]'::jsonb)) AS ing
),

-- Mesma normalizacao de normalizeName() (fichaMatcher.ts): minusculas, sem
-- acento (via translate, sem depender da extensao unaccent), tudo que nao e
-- a-z0-9 vira espaco, espacos colapsados, trim.
normalizado AS (
  SELECT DISTINCT
    ficha_id, usuaria_id, ficha_nome, tamanho_id, insumo_nome,
    trim(regexp_replace(regexp_replace(lower(translate(insumo_nome,
      'áàâãäÁÀÂÃÄéèêëÉÈÊËíìîïÍÌÎÏóòôõöÓÒÔÕÖúùûüÚÙÛÜçÇñÑ',
      'aaaaaAAAAAeeeeEEEEiiiiIIIIooooOOOOOuuuuUUUUcCnN'
    )), '[^a-z0-9]+', ' ', 'g'), '\s+', ' ', 'g')) AS insumo_normalizado
  FROM insumos_ficha
  WHERE insumo_nome IS NOT NULL AND trim(insumo_nome) <> ''
),

produtos_norm AS (
  SELECT
    id AS produto_id,
    usuaria_id,
    nome AS produto_nome,
    trim(regexp_replace(regexp_replace(lower(translate(nome,
      'áàâãäÁÀÂÃÄéèêëÉÈÊËíìîïÍÌÎÏóòôõöÓÒÔÕÖúùûüÚÙÛÜçÇñÑ',
      'aaaaaAAAAAeeeeEEEEiiiiIIIIooooOOOOOuuuuUUUUcCnN'
    )), '[^a-z0-9]+', ' ', 'g'), '\s+', ' ', 'g')) AS produto_normalizado
  FROM public.produtos
)

SELECT
  n.ficha_nome,
  n.tamanho_id,
  n.insumo_nome                              AS insumo_como_esta_na_ficha,
  n.insumo_normalizado,
  p.produto_id,
  p.produto_nome,
  CASE WHEN p.produto_id IS NULL THEN 'SEM CORRESPONDENCIA' ELSE 'CASADO' END AS status
FROM normalizado n
LEFT JOIN produtos_norm p
  ON p.produto_normalizado = n.insumo_normalizado
 AND p.usuaria_id = n.usuaria_id
ORDER BY (p.produto_id IS NULL) DESC, n.ficha_nome, n.insumo_nome;
