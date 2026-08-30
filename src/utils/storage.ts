import { Transaction, TimePeriod, SummaryTotals, FichaOrderItem } from '../types';
import { getTodayIso } from './formatters';
import { parseSaleDetail } from './weeklyCalculator';

/**
 * Persistencia das transacoes. NADA de estoque aqui.
 *
 * Ate o passo 3 desta refatoracao este modulo tambem movimentava estoque, por
 * meio do `stockManager` — que gravava num segundo estoque, em localStorage,
 * completamente separado da tabela `estoque` do Supabase que a aba Estoque
 * mostra. Lancar pedido debitava um estoque que ninguem via.
 *
 * O estoque agora e do `EstoqueContext`, que fala com o banco. Como aquilo e
 * assincrono e depende da usuaria logada, a orquestracao "grava a venda E baixa
 * o estoque" subiu para o App, onde o contexto esta disponivel. Este arquivo
 * voltou a fazer uma coisa so.
 */

const STORAGE_KEY = 'carulaconfeitaria_transacoes_v3';

export const getStoredTransactions = (): Transaction[] => {
  try {
    // Clear legacy keys with demo data if present
    localStorage.removeItem('docegestao_transacoes_v1');
    localStorage.removeItem('carulaconfeitaria_transacoes_v1');
    localStorage.removeItem('carulaconfeitaria_transacoes_v2');

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler LocalStorage:', error);
    return [];
  }
};

export const saveTransactions = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Erro ao salvar no LocalStorage:', error);
  }
};

export const addTransaction = (newTx: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
  const current = getStoredTransactions();
  const createdTx: Transaction = {
    ...newTx,
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    createdAt: Date.now(),
  };
  const updated = [createdTx, ...current];
  saveTransactions(updated);
  return createdTx;
};

export const updateTransaction = (updatedTx: Transaction): void => {
  const current = getStoredTransactions();
  const updated = current.map((t) => (t.id === updatedTx.id ? updatedTx : t));
  saveTransactions(updated);
};

export const deleteTransaction = (id: string): void => {
  const current = getStoredTransactions();
  saveTransactions(current.filter((t) => t.id !== id));
};

/**
 * Cria a venda com o vinculo das fichas, SEM tocar no estoque.
 *
 * A baixa e feita pelo `EstoqueContext` depois que esta funcao retorna, porque
 * precisa do banco e do usuario logado. O `id` retornado e o que amarra os dois
 * lados: e ele que vai para `estoque_movimentos.transacao_id` e permite estornar
 * o pedido inteiro depois.
 */
export const addSale = (
  saleData: Omit<Transaction, 'id' | 'createdAt' | 'consumedIngredients'>,
  fichaItems: FichaOrderItem[]
): Transaction => {
  const current = getStoredTransactions();
  const createdTx: Transaction = {
    ...saleData,
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    createdAt: Date.now(),
    fichaId: fichaItems[0]?.fichaId,
    fichaItems,
  };

  saveTransactions([createdTx, ...current]);
  return createdTx;
};

export const resetToSampleData = (): Transaction[] => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  return [];
};

export const clearAllTransactions = (): Transaction[] => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  return [];
};

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
