-- Passo 0 do endurecimento do OTP: a tabela passa a comportar o hash.
--
-- Aditiva e reversivel. NAO remove a coluna `code` — isso vem numa migration
-- separada, depois de as duas Edge Functions novas estarem no ar. Derrubar a
-- coluna junto cortaria qualquer codigo em transito: quem recebeu o e-mail e
-- ainda nao digitou ficaria sem conseguir entrar.
--
-- Contexto: o codigo era guardado em TEXTO PURO, e as politicas da tabela
-- liberavam leitura e escrita para qualquer um — um visitante sem conta lia os
-- codigos e os e-mails de todas as compradoras, e um usuario logado conseguia
-- forjar uma linha e obter sessao de outra pessoa. O bloqueio das politicas foi
-- aplicado a parte; esta migration e o que permite parar de guardar o segredo.

ALTER TABLE public.otp_codes
  ADD COLUMN IF NOT EXISTS code_hash  text,
  ADD COLUMN IF NOT EXISTS tentativas smallint NOT NULL DEFAULT 0;

-- `code` deixa de ser obrigatoria: as linhas novas nao a preenchem mais.
ALTER TABLE public.otp_codes ALTER COLUMN code DROP NOT NULL;

COMMENT ON COLUMN public.otp_codes.code_hash  IS 'HMAC-SHA256 do codigo, com o segredo OTP_PEPPER. Sem o pepper, um hash de 6 digitos se quebra por forca bruta em instantes — por isso HMAC com segredo, e nao hash simples.';
COMMENT ON COLUMN public.otp_codes.tentativas IS 'Erros de digitacao neste codigo. Em 5, a linha e marcada como usada: sem isso, 6 digitos caem por tentativa e erro.';

-- Invalida tudo que existe hoje. Sao linhas de teste, e todas tem o codigo em
-- texto puro — que ja foi exposto enquanto as politicas estavam abertas.
-- `IS NOT TRUE` e nao `= false` porque a coluna e NULLABLE: `= false` deixaria
-- de fora as linhas com NULL, que sao tao validas quanto para quem le com
-- `.eq('used', false)`.
UPDATE public.otp_codes SET used = true WHERE used IS NOT TRUE;

-- Apaga o codigo em texto das linhas antigas, ja invalidadas acima.
--
-- Rodado pelo Rafael junto do resto do passo 0, e registrado aqui para o
-- repositorio refletir o banco. Invalidar nao basta: enquanto o texto continua
-- gravado, ele segue sendo um segredo guardado a toa — e esses codigos
-- especificos ja estiveram expostos enquanto as politicas da tabela eram
-- abertas. A coluna em si so sai numa migration posterior.
UPDATE public.otp_codes SET code = NULL;
