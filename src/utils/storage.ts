import { Transaction, TimePeriod, SummaryTotals, FichaTecnica, FichaOrderItem } from '../types';
import { SAMPLE_INITIAL_TRANSACTIONS } from '../data/presetData';
import { getTodayIso } from './formatters';
import { parseSaleDetail } from './weeklyCalculator';
import {
  consumeIngredientsFromFicha,
  consumeIngredientsForOrder,
  returnIngredientsToStock,
} from './stockManager';

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

/**
 * Atualiza uma venda reequilibrando o estoque.
 *
 * Estrategia: DEVOLVE tudo o que a versao antiga consumiu e CONSOME de novo
 * pela versao nova. Nao calculamos delta de propositio — o delta so funciona
 * quando muda apenas a quantidade, e quebra quando a vendedora troca o produto
 * ou mistura itens. Devolver-e-reconsumir da o resultado certo em todos os
 * casos e reaproveita dois caminhos que ja estao provados.
 *
 * `fichasDisponiveis` e passado de fora (e nao lido aqui) para manter este
 * modulo sem dependencia do modulo de fichas, que importa deste.
 */
export const updateSaleWithStock = (
  updatedTx: Transaction,
  fichasDisponiveis: FichaTecnica[]
): Transaction => {
  const current = getStoredTransactions();
  const existing = current.find((t) => t.id === updatedTx.id);

  // 1. Desfaz o consumo antigo, se havia
  if (existing?.consumedIngredients?.length) {
    returnIngredientsToStock(
      existing.id,
      existing.consumedIngredients,
      updatedTx.date || getTodayIso()
    );
  }

  // 2. Reconsome pela composicao nova
  const fichaItems = updatedTx.fichaItems || [];
  const resolved = fichaItems
    .map((item) => {
      const ficha = fichasDisponiveis.find((f) => f.id === item.fichaId);
      if (!ficha) {
        console.warn(
          `[ESTOQUE] Aviso: fichaId "${item.fichaId}" não encontrado no catálogo. ` +
          `Item não baixará estoque. Fichas disponíveis: ${fichasDisponiveis.map(f => f.id).join(', ') || '(nenhuma)'}`
        );
      }
      return ficha ? { ficha, quantity: item.quantity } : null;
    })
    .filter((x): x is { ficha: FichaTecnica; quantity: number } => x !== null);

  const consumedIngredients = resolved.length
    ? consumeIngredientsForOrder(resolved, updatedTx.id, updatedTx.date)
    : [];

  const finalTx: Transaction = {
    ...updatedTx,
    fichaItems,
    fichaId: fichaItems[0]?.fichaId,
    consumedIngredients,
  };

  saveTransactions(current.map((t) => (t.id === finalTx.id ? finalTx : t)));
  return finalTx;
};

export const deleteTransaction = (id: string): void => {
  const current = getStoredTransactions();
  const transaction = current.find((t) => t.id === id);

  // If it's a sale that consumed ingredients, return them to stock
  if (transaction && transaction.type === 'venda' && transaction.consumedIngredients && transaction.consumedIngredients.length > 0) {
    returnIngredientsToStock(id, transaction.consumedIngredients, getTodayIso());
  }

  const updated = current.filter((t) => t.id !== id);
  saveTransactions(updated);
};

// Special function to add a sale with automatic ingredient consumption from a technical sheet
//
// `orderQuantity` = quantas unidades do produto. A ficha descreve UMA unidade.
export const addSaleWithFicha = (
  saleData: Omit<Transaction, 'id' | 'createdAt' | 'consumedIngredients'>,
  ficha: FichaTecnica,
  orderQuantity: number = 1
): Transaction => {
  const current = getStoredTransactions();
  const txId = 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

  // Consume ingredients from the technical sheet
  const consumedIngredients = consumeIngredientsFromFicha(
    ficha.id,
    ficha,
    txId,
    saleData.date,
    orderQuantity
  );

  // Create transaction with consumed ingredients
  const createdTx: Transaction = {
    ...saleData,
    id: txId,
    createdAt: Date.now(),
    fichaId: ficha.id,
    fichaItems: [{ fichaId: ficha.id, fichaName: ficha.name, quantity: orderQuantity }],
    consumedIngredients,
  };

  const updated = [createdTx, ...current];
  saveTransactions(updated);
  return createdTx;
};

/**
 * Lanca uma venda que pode conter varios produtos diferentes, cada um com sua
 * ficha e sua quantidade. E o caminho usado pelo formulario de pedido.
 *
 * Se nenhum item casar com uma ficha (ex.: produto avulso digitado a mao), a
 * venda e criada normalmente e simplesmente nao movimenta estoque.
 */
export const addSaleWithFichaItems = (
  saleData: Omit<Transaction, 'id' | 'createdAt' | 'consumedIngredients'>,
  fichaItems: FichaOrderItem[],
  fichasDisponiveis: FichaTecnica[]
): Transaction => {
  const current = getStoredTransactions();
  const txId = 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

  const resolved = fichaItems
    .map((item) => {
      const ficha = fichasDisponiveis.find((f) => f.id === item.fichaId);
      if (!ficha) {
        console.warn(
          `[ESTOQUE] Aviso: fichaId "${item.fichaId}" não encontrado no catálogo. ` +
          `Item não baixará estoque. Fichas disponíveis: ${fichasDisponiveis.map(f => f.id).join(', ') || '(nenhuma)'}`
        );
      }
      return ficha ? { ficha, quantity: item.quantity } : null;
    })
    .filter((x): x is { ficha: FichaTecnica; quantity: number } => x !== null);

  const consumedIngredients = resolved.length
    ? consumeIngredientsForOrder(resolved, txId, saleData.date)
    : [];

  const createdTx: Transaction = {
    ...saleData,
    id: txId,
    createdAt: Date.now(),
    fichaId: fichaItems[0]?.fichaId,
    fichaItems,
    consumedIngredients,
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
  const lucroLiquido = totalVendas - totalReposicao - totalCustos - totalInvestimento;

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
