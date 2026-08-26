-- Adiciona os campos de contato da confeitaria a tabela `usuarias`.
--
-- Motivo: o formulario de perfil (ProfileModal) sempre mostrou telefone,
-- endereco e Instagram, mas o handleSave so gravava `nome` e `foto_url` —
-- as colunas nao existiam. O que a confeiteira digitava nesses tres campos
-- era descartado silenciosamente ao salvar.
--
-- A folha de orcamento (QuotePdfModal) precisa desses dados para montar o
-- cabecalho com o contato de QUEM vendeu. Antes ela lia um DEFAULT_PROFILE
-- fixo no codigo, o que fazia toda compradora emitir orcamento com o nome, o
-- telefone e o e-mail pessoal da dona do app.
--
-- Nao criamos coluna `email`: o e-mail ja vive em auth.users e chega ao app
-- por user.email. Duplicar criaria duas fontes de verdade para o mesmo dado.
--
-- Idempotente: pode rodar mais de uma vez sem erro.

ALTER TABLE public.usuarias
  ADD COLUMN IF NOT EXISTS telefone  text,
  ADD COLUMN IF NOT EXISTS endereco  text,
  ADD COLUMN IF NOT EXISTS instagram text;

-- Sem DEFAULT e sem NOT NULL de proposito: perfil nao preenchido deve ficar
-- NULL e sair EM BRANCO no orcamento. Um valor padrao aqui reintroduziria
-- exatamente o bug que esta migration existe para corrigir — um orcamento com
-- o contato errado e pior do que um orcamento sem contato.

COMMENT ON COLUMN public.usuarias.telefone  IS 'Telefone/WhatsApp da confeitaria, exibido no orcamento. NULL = nao preenchido.';
COMMENT ON COLUMN public.usuarias.endereco  IS 'Endereco da confeitaria, exibido no orcamento. NULL = nao preenchido.';
COMMENT ON COLUMN public.usuarias.instagram IS 'Instagram da confeitaria, exibido no orcamento. NULL = nao preenchido.';
