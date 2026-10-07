-- Script B da Etapa 4 — trava de privilegios em `usuarias`.
--
-- APLICADO EM PRODUCAO pelo Rafael, no SQL Editor, em 2026-10-07, ANTES do
-- Script A (20261007_2). Este arquivo existe para o repositorio refletir o
-- banco; nao precisa ser rodado de novo.
--
-- Por que: `anon` e `authenticated` tinham os sete privilegios na tabela
-- inteira, entao qualquer pessoa logada conseguia rodar
-- `update usuarias set acesso_status = 'ativo'` na propria linha. Isso foi
-- CONFIRMADO NA PRATICA antes da trava — sem ela, o bloqueio por RLS do
-- Script A seria contornavel com uma linha de JavaScript no console, e
-- portanto decorativo.
--
-- Revogar coluna a coluna nao teria efeito enquanto existisse o privilegio na
-- tabela inteira: por isso o REVOKE vem primeiro e o GRANT devolve so o que o
-- app realmente escreve.
--
-- As listas de colunas foram lidas do codigo, nao de memoria:
--   INSERT  -> AuthContext.setupProfile (upsert ON CONFLICT DO NOTHING)
--   UPDATE  -> ProfileModal (nome, nome_confeitaria, foto_url, telefone,
--              endereco, instagram), UserProfileModal (nome, foto_url) e
--              CurrencyContext (moeda)
-- `labor_period` fica de fora porque nenhuma linha do app o grava; tem default
-- no banco. Coluna de perfil nova precisa entrar neste GRANT, senao salvar
-- perfil quebra.
--
-- `acesso_status`, `acesso_atualizado_em` e `parceiro_id` ficam fora dos dois
-- GRANTs de proposito: quem manda neles e o webhook (service-role) e a funcao
-- `vincular_parceiro_da_compra` (SECURITY DEFINER), ambos alheios a estes
-- privilegios. Fora do INSERT tambem — assim ninguem nasce escolhendo o
-- proprio `acesso_status`, e o default do banco e quem decide.
--
-- DELETE revogado: o app nao tem "excluir conta".
-- SELECT de `anon` mantido: inofensivo, porque a politica exige
-- `auth.uid() = id`, que e nulo para visitante.

BEGIN;

REVOKE INSERT, UPDATE, DELETE ON public.usuarias FROM anon, authenticated;

GRANT INSERT (id, nome, nome_confeitaria, moeda, created_at)
  ON public.usuarias TO authenticated;

GRANT UPDATE (nome, nome_confeitaria, moeda, foto_url, telefone, endereco, instagram)
  ON public.usuarias TO authenticated;

COMMIT;

-- Verificado apos aplicar: 8 privilegios de tabela e 12 de coluna.
--   SELECT grantee, privilege_type FROM information_schema.table_privileges
--    WHERE table_schema = 'public' AND table_name = 'usuarias';
--   SELECT grantee, privilege_type, column_name FROM information_schema.column_privileges
--    WHERE table_schema = 'public' AND table_name = 'usuarias';
