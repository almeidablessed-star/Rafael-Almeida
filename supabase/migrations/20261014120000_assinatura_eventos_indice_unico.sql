-- A trava de duplicidade dos webhooks passa a ser do BANCO, nao da aplicacao.
--
-- NAO RODAR ainda: texto preparado para revisao. So rodar no SQL Editor
-- DEPOIS de conferir que nao ha duplicados hoje (consulta no fim deste
-- arquivo) — com duplicados, a criacao do indice falha e nada e alterado.
--
-- Hoje a trava e uma CONSULTA antes do INSERT, nas duas funcoes que gravam
-- em `assinatura_eventos`:
--
--   * `smart-processor` (webhook da Hotmart) consulta `hotmart_event_id`
--     pelo id do evento antes de processar;
--   * `resend-webhook` (bounce/complained) consulta a chave
--     `resend:<email_id>:<tipo>`.
--
-- As duas leem e so entao gravam. Entre a leitura e a gravacao existe uma
-- janela: dois reenvios simultaneos do MESMO evento podem passar pelos dois
-- lados dela e gerar duas linhas e dois alertas. A Hotmart e o Resend
-- reenviam ate receber 200, entao o reenvio nao e hipotese remota — e o
-- comportamento normal dos dois provedores.
--
-- O indice unico fecha a janela no unico lugar onde ela pode ser fechada de
-- verdade: o banco recusa a segunda linha, independentemente de quantas
-- execucoes simultaneas existam. A consulta nas funcoes CONTINUA valendo e
-- continua sendo a primeira camada — ela responde 200 sem ruido no caso
-- comum; o indice e a rede embaixo, para a corrida.
--
-- NULL nao conflita com NULL num indice unico do Postgres (o padrao e NULLS
-- DISTINCT), e isso importa aqui: as duas funcoes gravam
-- `hotmart_event_id = NULL` quando o evento chega sem id. Essas linhas
-- continuam podendo existir em qualquer quantidade — o indice so impede
-- repetir um id REAL.
--
-- Nao se usa CREATE INDEX CONCURRENTLY de proposito: a tabela e de dezenas de
-- linhas, a criacao e instantanea, e CONCURRENTLY nao roda dentro de
-- transacao — o que complicaria a execucao no SQL Editor sem nenhum ganho.

CREATE UNIQUE INDEX IF NOT EXISTS assinatura_eventos_hotmart_event_id_unico
  ON public.assinatura_eventos (hotmart_event_id);

COMMENT ON INDEX public.assinatura_eventos_hotmart_event_id_unico IS
  'Impede que o mesmo evento de webhook vire duas linhas. Chaves: o id da Hotmart puro (evento processado), o id com sufixo (:email-falhou, :prazo_ignorado, ...) e resend:<email_id>:<tipo> para os eventos do Resend. NULL e permitido repetidas vezes: e o evento que chegou sem id.';

-- ============================================================================
-- CONFERIR ANTES (so leitura; tem de voltar vazio)
-- ============================================================================
--
-- SELECT hotmart_event_id, COUNT(*) AS quantidade
--   FROM public.assinatura_eventos
--  WHERE hotmart_event_id IS NOT NULL
--  GROUP BY hotmart_event_id
-- HAVING COUNT(*) > 1
--  ORDER BY quantidade DESC;
--
-- Voltando linhas, NAO rodar o CREATE INDEX: decidir primeiro o que fazer com
-- cada duplicado (sao registros de auditoria — apagar e decisao do Rafael,
-- nunca automatica).
--
-- CONFERIR DEPOIS: o indice tem de aparecer em
--   SELECT indexname FROM pg_indexes
--    WHERE tablename = 'assinatura_eventos';
