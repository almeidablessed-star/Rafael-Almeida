/**
 * Numero no formato que o WhatsApp espera (codigo do pais + numero, so digitos).
 *
 * O app atende Brasil e EUA, e muita gente digita sem o codigo do pais. A regra
 * antiga tratava todo numero de 11 digitos comecando em 1 como americano, e os
 * celulares de DDD 11 a 19 (Sao Paulo) iam para o +1: a mensagem chegava em
 * outra pessoa. Um celular brasileiro tem 9 depois do DDD; nos EUA nenhum
 * codigo de area tem 9 no meio, entao "1?9" so pode ser do Brasil.
 */
export const telefoneParaWhatsApp = (telefone: string): string => {
  const d = telefone.replace(/\D/g, '');
  if (telefone.trim().startsWith('+')) return d;
  if (d.length === 11) {
    const celularDoBrasil = d[2] === '9';
    if (d.startsWith('1') && !celularDoBrasil) return d; // EUA ja com o 1 na frente
    return '55' + d;
  }
  if (d.length === 10) {
    // Nenhum codigo de area dos EUA comeca com 1: e um fixo do Brasil (DDD 11 a 19).
    return (d.startsWith('1') ? '55' : '1') + d;
  }
  return d;
};

/** Telefone digitado: so numeros e os sinais que se usa para escrever um. */
export const limparTelefoneDigitado = (texto: string) => texto.replace(/[^\d\s()+\-.]/g, '');
