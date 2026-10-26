-- Miniatura da foto da ficha, so para a lista da aba Fichas.
--
-- A lista nao carrega `foto_url` (a foto inteira em base64, de 190 a 610 KB
-- cada) e buscava as fotos uma a uma a cada volta para a aba: numa conta com
-- 22 fichas eram ~7 MB e 3 a 4 segundos. O app passa a gravar aqui uma
-- miniatura de 144x144 (uns 10 KB) sempre que salva a foto, e gera as que
-- faltam na primeira abertura. Nenhuma linha existente muda.

ALTER TABLE public.fichas_tecnicas ADD COLUMN IF NOT EXISTS foto_mini text;
