-- Achar a conta pelo e-mail direto no banco, em vez de varrer a lista de contas.
--
-- RODADO pelo Rafael no SQL Editor em 13/11/2026 (achou 5 contas de 5), antes de publicar
-- as tres funcoes (smart-processor, resend-otp, resend-webhook).
--
-- Por que: as funcoes achavam a conta pedindo a lista de contas ao Auth, de 200
-- em 200, ate 20 paginas. Acima de 4000 contas a busca desistia: reembolso nao
-- cortava o acesso, renovacao falhava e o reenvio de codigo nao saia. Antes
-- disso ja ficava lenta (ate 20 pedidos por busca), e o reenvio de codigo pode
-- ser chamado por qualquer pessoa. O resend-webhook olhava so as 50 primeiras.
--
-- Aqui a busca e uma consulta so, pelo indice de e-mail que o Auth ja tem.
-- O Auth guarda o e-mail em minusculas, entao a comparacao e exata.
--
-- So o servidor (service_role, usado pelas funcoes) pode chamar: para qualquer
-- outro papel, responder "existe conta com este e-mail" seria uma lista de
-- clientes aberta.
--
-- Aditiva: nao muda tabela nem dado. As funcoes novas caem na busca antiga se
-- esta funcao nao existir, entao a ordem errada de publicacao nao quebra nada.

CREATE OR REPLACE FUNCTION public.achar_conta_por_email(p_email text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT u.id
    FROM auth.users u
   WHERE u.email = lower(trim(p_email))
   ORDER BY u.created_at
   LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.achar_conta_por_email(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.achar_conta_por_email(text) TO service_role;

-- Para conferir depois de rodar (troque pelo e-mail da conta de teste):
--   SELECT public.achar_conta_por_email('email-da-conta-de-teste');   -- devolve um id
--   SELECT public.achar_conta_por_email('nao-existe@exemplo.com');    -- devolve vazio
--
-- Para desfazer: DROP FUNCTION public.achar_conta_por_email(text);
