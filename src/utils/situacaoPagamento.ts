import { Transaction } from '../types';

/**
 * Em qual dos tres estados de pagamento um pedido esta. Fonte unica para as
 * telas (etiqueta, filtros, agenda, formulario): todas perguntam aqui.
 *
 * - `pendente`: nada entrou. Inclui o caso antigo "pendente com sinal" — as
 *   contas do app (financialEngine) sempre trataram pendente como nada pago,
 *   ignorando o sinal, e a tela segue as contas.
 * - `sinal`: entrou so o sinal; o restante fica para a entrega. No banco e
 *   `status_pagamento = 'pago'` com `valor_sinal` menor que o total — a mesma
 *   combinacao que as contas ja tratavam como "pago parcialmente".
 * - `pago`: entrou tudo (sem sinal, ou sinal igual ao total).
 *
 * Nao existe coluna nova: o estado e deduzido dos dados de sempre.
 */
export type SituacaoPagamento = 'pendente' | 'sinal' | 'pago';

export const situacaoPagamento = (tx: Pick<Transaction, 'paymentStatus' | 'signalValue' | 'totalValue'>): SituacaoPagamento => {
  if (tx.paymentStatus === 'pendente') return 'pendente';
  const sinal = tx.signalValue != null ? Number(tx.signalValue) : null;
  if (sinal != null && Number.isFinite(sinal) && sinal < (Number(tx.totalValue) || 0)) return 'sinal';
  return 'pago';
};

/** Quanto falta receber do pedido: tudo se pendente, o restante se so o sinal entrou. */
export const faltaReceberDoPedido = (tx: Pick<Transaction, 'paymentStatus' | 'signalValue' | 'totalValue'>): number => {
  const total = Number(tx.totalValue) || 0;
  const s = situacaoPagamento(tx);
  if (s === 'pendente') return total;
  if (s === 'sinal') return total - Number(tx.signalValue);
  return 0;
};

/**
 * O pedido depois do toque no botao de pagamento do card:
 * - pendente -> pago (por inteiro);
 * - sinal -> pago ("Recebi o restante");
 * - pago -> pendente.
 * Em todos, o sinal sai: "pendente com sinal" nao deve mais nascer, e "pago"
 * sem sinal e o pago por inteiro.
 */
export const proximoPagamento = (tx: Transaction): Transaction => {
  const s = situacaoPagamento(tx);
  return { ...tx, paymentStatus: s === 'pago' ? 'pendente' : 'pago', signalValue: undefined };
};
