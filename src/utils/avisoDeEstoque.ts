/**
 * Produto contado (unidade, pacote) tem aviso de compra em numero inteiro:
 * "avisa em 0,4 un" nao quer dizer nada. O SALDO continua aceitando fracao —
 * uma receita pode usar meia lata.
 */
export const contaInteiro = (unidade?: string | null): boolean => unidade === 'un' || unidade === 'pacote';

/** Sugestao de aviso: 20% da embalagem; em produto contado, inteiro e no minimo 1. */
export const sugestaoDeAviso = (qtdEmbalagem: number, unidade: string): string => {
  if (!Number.isFinite(qtdEmbalagem) || qtdEmbalagem <= 0) return '';
  if (contaInteiro(unidade)) return String(Math.max(1, Math.round(qtdEmbalagem * 0.2)));
  return String(Math.round(qtdEmbalagem * 0.2 * 100) / 100).replace('.', ',');
};

/** O aviso digitado, pronto para gravar: inteiro (para cima) em produto contado. */
export const avisoParaGravar = (digitado: number, unidade?: string | null): number =>
  contaInteiro(unidade) ? Math.ceil(digitado) : digitado;
