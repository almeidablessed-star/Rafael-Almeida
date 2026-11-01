import { Recebimento, Transaction } from '../types';
import { faltaReceberDoPedido } from './situacaoPagamento';
import { createdAtToLocalIso } from './weeklyArchiveUtils';

/**
 * O que entrou de cada pedido e em que dia. As contas do periodo (Inicio, Meta,
 * Historico) somam estes valores pela data do RECEBIMENTO: pelo dia do
 * lancamento, um pedido lancado numa semana e pago em outra saia do "a receber"
 * e nao entrava em semana nenhuma.
 *
 * `valor_sinal` e `status_pagamento` continuam dizendo em qual estado o pedido
 * esta; esta lista so acrescenta o quando. O dia e o de quem marcou no app.
 */

const centavos = (valor: number) => Math.round((Number(valor) || 0) * 100);

/** Quanto o estado atual do pedido diz que ja entrou. */
export const totalRecebidoDoPedido = (
  tx: Pick<Transaction, 'paymentStatus' | 'signalValue' | 'totalValue'>
): number => (Number(tx.totalValue) || 0) - faltaReceberDoPedido(tx);

/**
 * A lista do pedido. Pedido anterior a esta coluna nao tem lista: o que ele ja
 * recebeu fica no dia do lancamento, que e onde as contas sempre o colocaram.
 */
export const recebimentosDoPedido = (tx: Transaction): Recebimento[] => {
  if (Array.isArray(tx.recebimentos)) return tx.recebimentos;
  const recebido = totalRecebidoDoPedido(tx);
  if (!(recebido > 0) || !tx.createdAt) return [];
  return [{ valor: recebido, em: createdAtToLocalIso(tx.createdAt) }];
};

/**
 * A lista depois de uma mudanca: o que faltava entra em `hoje`, e o que sobrou
 * sai dos recebimentos mais recentes (marcar como pendente, baixar o total).
 */
export const ajustarRecebimentos = (lista: Recebimento[], recebidoAgora: number, hoje: string): Recebimento[] => {
  const alvo = centavos(recebidoAgora);
  const nova = lista.map((r) => ({ ...r }));
  const soma = nova.reduce((acc, r) => acc + centavos(r.valor), 0);

  if (alvo > soma) {
    const ultimo = nova[nova.length - 1];
    if (ultimo?.em === hoje) ultimo.valor = (centavos(ultimo.valor) + alvo - soma) / 100;
    else nova.push({ valor: (alvo - soma) / 100, em: hoje });
    return nova;
  }

  let sobrando = soma - alvo;
  while (sobrando > 0 && nova.length > 0) {
    const ultimo = nova[nova.length - 1];
    const valor = centavos(ultimo.valor);
    if (valor > sobrando) {
      ultimo.valor = (valor - sobrando) / 100;
      sobrando = 0;
    } else {
      nova.pop();
      sobrando -= valor;
    }
  }
  return nova;
};

/** Quanto do pedido entrou entre as duas datas, inclusive. */
export const recebidoNoPeriodo = (tx: Transaction, inicioIso: string, fimIso: string): number =>
  recebimentosDoPedido(tx)
    .filter((r) => r.em >= inicioIso && r.em <= fimIso)
    .reduce((acc, r) => acc + (Number(r.valor) || 0), 0);
