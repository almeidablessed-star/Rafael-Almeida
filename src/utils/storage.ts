import { Transaction, TimePeriod, SummaryTotals } from '../types';
import { getTodayIso } from './formatters';
import { parseSaleDetail } from './weeklyCalculator';

/**
 * Calculo puro sobre transacoes: filtro por periodo e resumo financeiro.
 *
 * Este arquivo ja foi o dono das transacoes, gravando-as no `localStorage` e,
 * antes disso, movimentando tambem um estoque paralelo por meio do
 * `stockManager`. As duas responsabilidades sairam:
 *
 *   - O estoque virou [[EstoqueContext]], que fala com a tabela `estoque`.
 *   - As transacoes viraram [[TransacoesContext]], que fala com `transacoes`.
 *
 * Sobrou o que sempre foi funcao pura e nao precisa de banco nem de usuaria
 * logada — o que torna estas duas testaveis isoladamente.
 */

// Filter transactions by period
export const filterTransactionsByPeriod = (
  transactions: Transaction[],
  period: TimePeriod,
  customStartDate?: string,
  customEndDate?: string
): Transaction[] => {
  const todayIso = getTodayIso();
  const todayDate = new Date(todayIso + 'T00:00:00');

  return transactions.filter((tx) => {
    if (!tx.date) return false;
    const txDate = new Date(tx.date + 'T00:00:00');

    if (period === 'tudo') return true;

    if (period === 'hoje') {
      return tx.date === todayIso;
    }

    if (period === 'semana') {
      // Calculate start of current week (Monday)
      const dayOfWeek = todayDate.getDay() || 7; // Sunday is 7 in 1-based Monday week
      const monday = new Date(todayDate);
      monday.setDate(todayDate.getDate() - (dayOfWeek - 1));
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return txDate >= monday && txDate <= sunday;
    }

    if (period === 'mes') {
      return (
        txDate.getFullYear() === todayDate.getFullYear() &&
        txDate.getMonth() === todayDate.getMonth()
      );
    }

    if (period === 'ano') {
      return txDate.getFullYear() === todayDate.getFullYear();
    }

    if (period === 'personalizado' && customStartDate && customEndDate) {
      const start = new Date(customStartDate + 'T00:00:00');
      const end = new Date(customEndDate + 'T23:59:59');
      return txDate >= start && txDate <= end;
    }

    return true;
  });
};

// Calculate financial metrics summary
export const calculateSummary = (filteredTxs: Transaction[]): SummaryTotals => {
  let totalVendas = 0;
  let totalAReceber = 0;
  let totalReposicao = 0;
  let totalMaoDeObra = 0;
  let totalCustos = 0;
  let totalInvestimento = 0;

  filteredTxs.forEach((tx) => {
    const val = Number(tx.totalValue) || 0;
    switch (tx.type) {
      case 'venda':
        if (tx.paymentStatus === 'pendente') {
          totalAReceber += val;
        } else {
          // Se há signalValue, é o sinal que foi pago. O resto fica a receber.
          const paidAmount = tx.signalValue ? Number(tx.signalValue) : val;
          const pendingAmount = val - paidAmount;
          totalVendas += paidAmount;
          totalAReceber += pendingAmount;
          const detail = parseSaleDetail(tx);
          totalReposicao += detail.reposicao;
          totalMaoDeObra += detail.maoDeObra;
          totalCustos += detail.custos;
          totalInvestimento += detail.investimento;
        }
        break;
      case 'reposicao':
        totalReposicao += val;
        break;
      case 'maodeobra':
        totalMaoDeObra += val;
        break;
      case 'custo':
        totalCustos += val;
        break;
      case 'investimento':
        totalInvestimento += val;
        break;
    }
  });

  const totalSaidas = totalReposicao + totalMaoDeObra + totalCustos + totalInvestimento;
  const lucroLiquido = totalVendas - totalReposicao - totalMaoDeObra - totalCustos - totalInvestimento;

  return {
    totalVendas,
    totalAReceber,
    totalReposicao,
    totalMaoDeObra,
    totalCustos,
    totalInvestimento,
    totalSaidas,
    lucroLiquido,
    isPositive: lucroLiquido >= 0,
    totalTransactionsCount: filteredTxs.length,
  };
};
