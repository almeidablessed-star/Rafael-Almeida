/**
 * Erro em palavras de quem usa o app. Os erros do navegador e do banco chegam
 * em ingles e tecnicos ("Failed to fetch", "JWT expired", "violates check
 * constraint"), e eram mostrados assim.
 */
export const mensagemDeErro = (err: unknown, padrao = 'Algo deu errado. Tente de novo.'): string => {
  const texto = String((err as any)?.message || (typeof err === 'string' ? err : '') || '');
  if (!texto) return padrao;
  if (/failed to fetch|load failed|networkerror|network request failed/i.test(texto))
    return 'Sem conexão com o servidor. Confira a internet e tente de novo.';
  if (/jwt expired|invalid jwt|refresh token|not authenticated|user not authenticated/i.test(texto))
    return 'Sua sessão precisou ser renovada. Tente de novo; se continuar, saia e entre outra vez.';
  if (/check constraint/i.test(texto)) return 'Algum número está fora do permitido. Confira os valores e tente de novo.';
  if (/row-level security|permission denied/i.test(texto))
    return 'Sua conta não pode gravar isso agora. Saia e entre de novo; se continuar, fale com o suporte.';
  if (/invalid login credentials/i.test(texto)) return 'E-mail ou senha incorretos.';
  if (/timeout|timed out/i.test(texto)) return 'O servidor demorou para responder. Tente de novo.';
  // Mensagem do proprio app (ja em portugues) segue como esta.
  return texto;
};
