import { AdministrativeCosts, Transaction } from '../types';
import { getWeekRange } from './weeklyCalculator';

/**
 * Quanto a confeitaria precisa faturar por semana so para cobrir os custos
 * fixos — e quanto ja faturou nesta semana.
 *
 * Os custos administrativos sao MENSAIS (aluguel, energia, internet...). A
 * conversao usa 12 meses / 52 semanas, e nao "dividir por 4": o mes tem em
 * media 4,35 semanas, e a diferenca nao e detalhe. Num custo fixo de R$ 2.000,
 * dividir por 4 daria uma meta de R$ 500 e um rombo de cerca de R$ 350 por mes,
 * justamente no numero que existe para evitar rombo.
 */
const SEMANAS_POR_MES = 52 / 12; // ≈ 4,3333

export interface MetaSemanal {
  /** Soma das despesas mensais. */
  custoFixoMensal: number;
  /** Quanto precisa entrar por semana so para empatar com os fixos. */
  necessarioPorSemana: number;
  /** Vendas PAGAS da semana corrente (segunda a domingo). */
  faturadoNaSemana: number;
  /** Quanto ainda falta. Zero quando a meta ja foi batida. */
  faltaFaturar: number;
  /** Fracao da meta ja coberta, de 0 a 1 (limitada em 1 para a barra). */
  progresso: number;
  /** A meta foi atingida ou superada. */
  metaAtingida: boolean;
  /** Sem custo fixo cadastrado nao ha meta: a tela deve convidar a preencher. */
  temCustoCadastrado: boolean;
}

export const calcularMetaSemanal = (
  custos: AdministrativeCosts | null,
  transacoes: Transaction[]
): MetaSemanal => {
  const custoFixoMensal = custos?.total || 0;
  const necessarioPorSemana = custoFixoMensal / SEMANAS_POR_MES;

  const { startIso, endIso } = getWeekRange();

  // So venda PAGA cobre custo. Pedido pendente e promessa, nao dinheiro em
  // caixa — incluir daria a impressao de meta batida com o dinheiro ainda na
  // mao da cliente.
  const faturadoNaSemana = transacoes.reduce((soma, tx) => {
    if (tx.type !== 'venda') return soma;
    if (tx.paymentStatus === 'pendente') return soma;
    if (!tx.date || tx.date < startIso || tx.date > endIso) return soma;

    // Com sinal, so o que foi efetivamente pago entra.
    const pago = tx.signalValue != null ? Number(tx.signalValue) : Number(tx.totalValue);
    return soma + (Number.isFinite(pago) ? pago : 0);
  }, 0);

  const faltaFaturar = Math.max(0, necessarioPorSemana - faturadoNaSemana);

  return {
    custoFixoMensal,
    necessarioPorSemana,
    faturadoNaSemana,
    faltaFaturar,
    progresso: necessarioPorSemana > 0
      ? Math.min(1, faturadoNaSemana / necessarioPorSemana)
      : 0,
    metaAtingida: necessarioPorSemana > 0 && faturadoNaSemana >= necessarioPorSemana,
    temCustoCadastrado: custoFixoMensal > 0,
  };
};
