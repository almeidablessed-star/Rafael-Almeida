import { Transaction, FichaTecnica } from '../types';
import { parseSaleDetail } from './weeklyCalculator';
import { getCurrentWeekMonday, getCurrentWeekSunday, filterTransactionsByWeek } from './weeklyArchiveUtils';

export interface CategoryBalance {
  accumulatedInflow: number; // Sum from paid sales
  totalSpent: number;        // Sum from expenses registered in this category
  currentBalance: number;    // Inflow - Spent
  isNegative: boolean;
}

export interface SystemBalances {
  reposicao: CategoryBalance;
  maodeobra: CategoryBalance;
  investimento: CategoryBalance;
  custoEInvestimento: CategoryBalance & {
    custoHalf: number;
    investimentoHalf: number;
  };
  paidSalesCount: number;
  totalExpensesCount: number;
  totalPaidSales: number;
  totalAReceber: number;
  totalExpensesAmount: number;
}

/**
 * Calculates accumulated balances for Reposição, Mão de Obra, and Custo + Investimento in real-time.
 * Inflow comes automatically from all sales marked as "Pago".
 * Deductions come from expenses logged under 'reposicao', 'maodeobra', 'custo', 'investimento'.
 */
export function calculateBalances(transactions: Transaction[], fichas: FichaTecnica[] = []): SystemBalances {
  let reposicaoInflow = 0;
  let maodeobraInflow = 0;
  let custoInflow = 0;
  let investimentoInflow = 0;
  let paidSalesCount = 0;
  let totalPaidSalesAmount = 0;

  let reposicaoSpent = 0;
  let maodeobraSpent = 0;
  let custoSpent = 0;
  let investimentoSpent = 0;
  let totalExpensesCount = 0;
  let totalExpensesAmount = 0;

  for (const tx of transactions) {
    const val = Number(tx.totalValue) || 0;

    if (tx.type === 'venda') {
      if (tx.paymentStatus !== 'pendente') {
        paidSalesCount += 1;
        totalPaidSalesAmount += val;

        // Fonte unica: a composicao gravada na venda (com fallback interno
        // para pedidos antigos). O recalculo pelos custos ATUAIS da ficha que
        // existia aqui reescrevia o lucro de pedidos ja fechados sempre que um
        // insumo mudava de preco — uma venda de marco virava outra em agosto.
        const detail = parseSaleDetail(tx);
        reposicaoInflow += detail.reposicao || 0;
        maodeobraInflow += (detail.maoDeObra || 0) + (detail.adicionais || 0) + (detail.delivery || 0);
        custoInflow += detail.custos || 0;
        investimentoInflow += detail.investimento || 0;
      }
    } else if (tx.type === 'reposicao') {
      totalExpensesCount += 1;
      totalExpensesAmount += val;
      reposicaoSpent += val;
    } else if (tx.type === 'maodeobra') {
      totalExpensesCount += 1;
      totalExpensesAmount += val;
      maodeobraSpent += val;
    } else if (tx.type === 'custo') {
      totalExpensesCount += 1;
      totalExpensesAmount += val;
      custoSpent += val;
    } else if (tx.type === 'investimento') {
      totalExpensesCount += 1;
      totalExpensesAmount += val;
      investimentoSpent += val;
    }
  }

  const saldoReposicao = reposicaoInflow - reposicaoSpent;
  const saldoMaodeobra = maodeobraInflow - maodeobraSpent;
  const saldoInvestimento = investimentoInflow - investimentoSpent;

  const combinedInflow = custoInflow + investimentoInflow;
  const combinedSpent = custoSpent + investimentoSpent;
  const saldoCombined = combinedInflow - combinedSpent;

  return {
    reposicao: {
      accumulatedInflow: reposicaoInflow,
      totalSpent: reposicaoSpent,
      currentBalance: saldoReposicao,
      isNegative: saldoReposicao < 0,
    },
    maodeobra: {
      accumulatedInflow: maodeobraInflow,
      totalSpent: maodeobraSpent,
      currentBalance: saldoMaodeobra,
      isNegative: saldoMaodeobra < 0,
    },
    investimento: {
      accumulatedInflow: investimentoInflow,
      totalSpent: investimentoSpent,
      currentBalance: saldoInvestimento,
      isNegative: saldoInvestimento < 0,
    },
    custoEInvestimento: {
      accumulatedInflow: combinedInflow,
      totalSpent: combinedSpent,
      currentBalance: saldoCombined,
      isNegative: saldoCombined < 0,
      custoHalf: saldoCombined / 2,
      investimentoHalf: saldoCombined / 2,
    },
    paidSalesCount,
    totalExpensesCount,
    totalPaidSales: totalPaidSalesAmount,
    totalAReceber,
    totalExpensesAmount,
  };
}

/**
 * Calculate balances for the current week only (Monday to Sunday)
 */
export function calculateWeeklyBalances(transactions: Transaction[], fichas: FichaTecnica[] = []): SystemBalances {
  const startDate = getCurrentWeekMonday();
  const endDate = getCurrentWeekSunday();
  const weeklyTransactions = filterTransactionsByWeek(transactions, startDate, endDate);

  // Inline balances calculation for current week
  let reposicaoInflow = 0;
  let maodeobraInflow = 0;
  let custoInflow = 0;
  let investimentoInflow = 0;
  let paidSalesCount = 0;
  let totalPaidSalesAmount = 0;
  let totalAReceber = 0;

  let reposicaoSpent = 0;
  let maodeobraSpent = 0;
  let custoSpent = 0;
  let investimentoSpent = 0;
  let totalExpensesCount = 0;
  let totalExpensesAmount = 0;

  for (const tx of weeklyTransactions) {
    const val = Number(tx.totalValue) || 0;

    if (tx.type === 'venda') {
      if (tx.paymentStatus !== 'pendente') {
        paidSalesCount += 1;
        // Usar signalValue se informado, caso contrário assume que foi pago o valor total
        const paidAmount = tx.signalValue ? Number(tx.signalValue) : val;
        totalPaidSalesAmount += paidAmount;
        // Se há sinal, o restante fica a receber
        if (tx.signalValue) {
          const remainingAmount = val - paidAmount;
          totalAReceber += remainingAmount;
        }

        // Fonte unica: a composicao gravada na venda (com fallback interno
        // para pedidos antigos). O recalculo pelos custos ATUAIS da ficha que
        // existia aqui reescrevia o lucro de pedidos ja fechados sempre que um
        // insumo mudava de preco — uma venda de marco virava outra em agosto.
        const detail = parseSaleDetail(tx);
        reposicaoInflow += detail.reposicao || 0;
        maodeobraInflow += (detail.maoDeObra || 0) + (detail.adicionais || 0) + (detail.delivery || 0);
        custoInflow += detail.custos || 0;
        investimentoInflow += detail.investimento || 0;
      } else {
        // Pendentes completamente a receber
        totalAReceber += val;
      }
    } else if (tx.type === 'reposicao') {
      totalExpensesCount += 1;
      totalExpensesAmount += val;
      reposicaoSpent += val;
    } else if (tx.type === 'maodeobra') {
      totalExpensesCount += 1;
      totalExpensesAmount += val;
      maodeobraSpent += val;
    } else if (tx.type === 'custo') {
      totalExpensesCount += 1;
      totalExpensesAmount += val;
      custoSpent += val;
    } else if (tx.type === 'investimento') {
      totalExpensesCount += 1;
      totalExpensesAmount += val;
      investimentoSpent += val;
    }
  }

  const saldoReposicao = reposicaoInflow - reposicaoSpent;
  const saldoMaodeobra = maodeobraInflow - maodeobraSpent;
  const saldoInvestimento = investimentoInflow - investimentoSpent;

  const combinedInflow = custoInflow + investimentoInflow;
  const combinedSpent = custoSpent + investimentoSpent;
  const saldoCombined = combinedInflow - combinedSpent;

  return {
    reposicao: {
      accumulatedInflow: reposicaoInflow,
      totalSpent: reposicaoSpent,
      currentBalance: saldoReposicao,
      isNegative: saldoReposicao < 0,
    },
    maodeobra: {
      accumulatedInflow: maodeobraInflow,
      totalSpent: maodeobraSpent,
      currentBalance: saldoMaodeobra,
      isNegative: saldoMaodeobra < 0,
    },
    investimento: {
      accumulatedInflow: investimentoInflow,
      totalSpent: investimentoSpent,
      currentBalance: saldoInvestimento,
      isNegative: saldoInvestimento < 0,
    },
    custoEInvestimento: {
      accumulatedInflow: combinedInflow,
      totalSpent: combinedSpent,
      currentBalance: saldoCombined,
      isNegative: saldoCombined < 0,
      custoHalf: saldoCombined / 2,
      investimentoHalf: saldoCombined / 2,
    },
    paidSalesCount,
    totalExpensesCount,
    totalPaidSales: totalPaidSalesAmount,
    totalAReceber,
    totalExpensesAmount,
  };
}
