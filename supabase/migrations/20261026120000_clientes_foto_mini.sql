-- Miniatura da foto da cliente, so para a lista da aba Clientes.
--
-- A lista nao carrega `photoUrl` (a foto inteira em base64, de 70 a 600 KB
-- cada) para nao pesar no 4G; por isso as clientes apareciam sem foto, e a
-- foto so surgia depois de abrir "Editar". O app passa a gravar aqui uma
-- miniatura de 96x96 (uns 4 a 8 KB) sempre que salva a foto, e gera as que
-- faltam na primeira vez que a aba abre. Nenhuma linha existente muda.

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS foto_mini text;
