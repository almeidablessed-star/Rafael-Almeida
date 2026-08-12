import { Transaction } from '../types';
import { parseSaleDetail } from './weeklyCalculator';

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
}

/**
 * Calculates accumulated balances for Reposição, Mão de Obra, and Custo + Investimento in real-time.
 * Inflow comes automatically from all sales marked as "Pago".
 * Deductions come from expenses logged under 'reposicao', 'maodeobra', 'custo', 'investimento'.
 */
export function calculateBalances(transactions: Transaction[]): SystemBalances {
  let reposicaoInflow = 0;
  let maodeobraInflow = 0;
  let custoInflow = 0;
  let investimentoInflow = 0;
  let paidSalesCount = 0;

  let reposicaoSpent = 0;
  let maodeobraSpent = 0;
  let custoSpent = 0;
  let investimentoSpent = 0;
  let totalExpensesCount = 0;

  for (const tx of transactions) {
    const val = Number(tx.totalValue) || 0;

    if (tx.type === 'venda') {
      if (tx.paymentStatus !== 'pendente') {
        paidSalesCount += 1;
        const detail = parseSaleDetail(tx);
        reposicaoInflow += detail.reposicao || 0;
        maodeobraInflow += (detail.maoDeObra || 0) + (detail.adicionais || 0) + (detail.delivery || 0);
        custoInflow += detail.custos || 0;
        investimentoInflow += detail.investimento || 0;
      }
    } else if (tx.type === 'reposicao') {
      totalExpensesCount += 1;
      reposicaoSpent += val;
    } else if (tx.type === 'maodeobra') {
      totalExpensesCount += 1;
      maodeobraSpent += val;
    } else if (tx.type === 'custo') {
      totalExpensesCount += 1;
      custoSpent += val;
    } else if (tx.type === 'investimento') {
      totalExpensesCount += 1;
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
  };
}
