-- Rastreia quando cada ficha tecnica foi salva pela ultima vez, para
-- comparar com a ultima mudanca de metas em configuracao_empresa_historico
-- (ver migration 20260906_minha_empresa_configuracao.sql) e avisar na tela
-- quando uma ficha ja salva ficou desatualizada em relacao as metas atuais
-- da empresa (CMV/Investimento/Despesas).
--
-- Efeito colateral esperado e aceito: fichas ja existentes nascem com
-- updated_at = agora (data desta migration), nao a data real da ultima
-- edicao. Conservador de proposito — nenhuma ficha antiga aparece
-- "desatualizada" logo apos rodar isto, so passa a valer dai pra frente.

ALTER TABLE public.fichas_tecnicas
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fichas_tecnicas_updated_at ON public.fichas_tecnicas;
CREATE TRIGGER trg_fichas_tecnicas_updated_at
  BEFORE UPDATE ON public.fichas_tecnicas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
