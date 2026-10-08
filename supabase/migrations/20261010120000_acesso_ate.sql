-- Cancelamento deixa de cortar na hora: o acesso vale ate o fim do periodo pago.
--
-- NAO RODAR ainda: texto aprovado, para o Rafael rodar no SQL Editor no passo
-- combinado, ANTES de publicar as funcoes e o app.
--
-- Decisao de negocio: quem cancela mantem o acesso ate o fim do que ja pagou.
-- Reembolso e chargeback continuam cortando na hora — ali o dinheiro voltou.
--
-- A data vem do proprio payload da Hotmart (`data.date_next_charge`), que a
-- documentacao descreve como "pode ser usado para encerrar o acesso da
-- compradora" no evento de cancelamento de assinatura.

ALTER TABLE public.usuarias ADD COLUMN IF NOT EXISTS acesso_ate timestamptz;

COMMENT ON COLUMN public.usuarias.acesso_ate IS
  'Ate quando o acesso vale, mesmo com acesso_status = ativo. NULL = sem prazo, o caso normal. Preenchido no cancelamento de assinatura com a data da proxima cobranca, e zerado em qualquer nova compra aprovada. Quem escreve aqui e o webhook (service-role); o navegador nao tem privilegio nesta coluna.';

-- ============================================================================
-- A regra de acesso passa a considerar o prazo
-- ============================================================================
--
-- Mudar AQUI, e nao em cada politica, e o que faz a data valer de uma vez nas
-- dez tabelas bloqueadas: todas chamam esta funcao. E o corte acontece sozinho
-- quando a data passa, sem tarefa agendada e sem janela entre o vencimento e
-- uma execucao periodica.
--
-- `acesso_ate IS NULL` primeiro, de proposito: a esmagadora maioria das contas
-- nao tem prazo, e e esse ramo que nao pode falhar.

CREATE OR REPLACE FUNCTION public.tem_acesso_ativo()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarias u
     WHERE u.id = auth.uid()
       AND u.acesso_status = 'ativo'
       AND (u.acesso_ate IS NULL OR u.acesso_ate > now())
  )
$$;

REVOKE ALL ON FUNCTION public.tem_acesso_ativo() FROM public;
GRANT EXECUTE ON FUNCTION public.tem_acesso_ativo() TO authenticated, anon;
