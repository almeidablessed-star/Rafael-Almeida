import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { calculateBalances } from '../utils/balancesCalculator';
import { formatCurrency, formatDateBr, getTodayIso } from '../utils/formatters';
import {
  Wallet,
  ShoppingBag,
  Sparkles,
  Plus,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Edit3,
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  Search,
  CheckCircle2,
  Package,
} from 'lucide-react';

interface BalancesAndExpensesModuleProps {
  transactions: Transaction[];
  onAddTransaction: (txData: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

export const BalancesAndExpensesModule: React.FC<BalancesAndExpensesModuleProps> = ({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const balances = calculateBalances(transactions);

  // Form state for quick expense logging
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'reposicao' | 'investimento'>('reposicao');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayIso());
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // History filtering
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'reposicao' | 'investimento'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const valNum = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || isNaN(valNum) || valNum <= 0) {
      return;
    }

    onAddTransaction({
      type: category as TransactionType,
      description: description.trim(),
      quantity: 1,
      unitValue: valNum,
      totalValue: valNum,
      date: date || getTodayIso(),
      paymentStatus: 'pago',
      notes: `Compra registrada em ${category === 'reposicao' ? 'Reposição de Insumos' : 'Investimento'}`,
    });

    // Reset form
    setDescription('');
    setAmount('');
    setDate(getTodayIso());
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Filter expenses list (only real expenses under reposicao or investimento)
  const expenseTransactions = transactions.filter(
    (tx) => tx.type === 'reposicao' || tx.type === 'investimento'
  );

  const filteredExpenses = expenseTransactions.filter((tx) => {
    const matchesCategory = selectedFilter === 'todos' || tx.type === selectedFilter;
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5 pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-amber-200" />
            Saldo
          </span>
          <span className="bg-white/20 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
            Gestão Real
          </span>
        </div>

        <h2 className="font-brand font-black text-xl sm:text-2xl text-white tracking-tight">
          Saldo & Compras
        </h2>
        <p className="text-xs text-amber-100 font-medium mt-1">
          O dinheiro das vendas é acumulado automaticamente aqui no Saldo. Quando você faz uma compra, registre a despesa para descontar da categoria correta.
        </p>
      </div>

      {/* 1. BALANCE CARDS (Reposição, Mão de Obra, Custo + Investimento Juntos) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CARD REPOSIÇÃO */}
        <div
          className={`rounded-3xl p-5 border-2 transition-all shadow-xs relative overflow-hidden flex flex-col justify-between ${
            balances.reposicao.isNegative
              ? 'bg-rose-50/90 border-rose-400'
              : 'bg-white border-amber-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  balances.reposicao.isNegative
                    ? 'bg-rose-200/80 text-rose-900 border border-rose-300'
                    : 'bg-amber-100/80 text-amber-900 border border-amber-300'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                🔄 Reposição
              </span>

              {balances.reposicao.isNegative && (
                <span className="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  Negativo
                </span>
              )}
            </div>

            <div className="my-2">
              <span
                className={`font-brand font-black text-2xl sm:text-3xl block ${
                  balances.reposicao.isNegative ? 'text-rose-700' : 'text-amber-800'
                }`}
              >
                {formatCurrency(balances.reposicao.currentBalance)}
              </span>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Para reposição de ingredientes e embalagens.
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1 text-xs font-semibold">
              <div className="flex items-center justify-between text-emerald-800 text-[11px]">
                <span>Entrou:</span>
                <span className="font-bold text-emerald-700">+{formatCurrency(balances.reposicao.accumulatedInflow)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 text-[11px]">
                <span>Gasto:</span>
                <span className="font-bold text-rose-600">-{formatCurrency(balances.reposicao.totalSpent)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD MÃO DE OBRA */}
        <div className="rounded-3xl p-5 border-2 transition-all shadow-xs relative overflow-hidden flex flex-col justify-between bg-white border-purple-300">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 bg-purple-100/80 text-purple-900 border border-purple-300">
                <DollarSign className="w-3.5 h-3.5 text-purple-700" />
                🟣 Mão de Obra
              </span>
            </div>

            <div className="my-2">
              <span className="font-brand font-black text-2xl sm:text-3xl block text-purple-900">
                {formatCurrency(balances.maodeobra?.currentBalance || 0)}
              </span>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Seu salário acumulado pelas produções.
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1 text-xs font-semibold">
              <div className="flex items-center justify-between text-emerald-800 text-[11px]">
                <span>Acumulado:</span>
                <span className="font-bold text-emerald-700">+{formatCurrency(balances.maodeobra?.accumulatedInflow || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD CUSTO + INVESTIMENTO JUNTOS (DIVIDIDO POR 2) */}
        <div
          className={`rounded-3xl p-5 border-2 transition-all shadow-xs relative overflow-hidden flex flex-col justify-between ${
            balances.custoEInvestimento.isNegative
              ? 'bg-rose-50/90 border-rose-400'
              : 'bg-white border-blue-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  balances.custoEInvestimento.isNegative
                    ? 'bg-rose-200/80 text-rose-900 border border-rose-300'
                    : 'bg-blue-100/80 text-blue-900 border border-blue-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                📊 Custo + Investimento
              </span>

              {balances.custoEInvestimento.isNegative && (
                <span className="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  Negativo
                </span>
              )}
            </div>

            <div className="my-2">
              <span
                className={`font-brand font-black text-2xl sm:text-3xl block ${
                  balances.custoEInvestimento.isNegative ? 'text-rose-700' : 'text-blue-900'
                }`}
              >
                {formatCurrency(balances.custoEInvestimento.currentBalance)}
              </span>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Dividido por 2 (50% Custo e 50% Investimento).
              </p>
            </div>

            {/* Split breakdown */}
            <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5 text-xs font-semibold">
              <div className="flex items-center justify-between text-blue-900 bg-blue-50/80 p-2 rounded-xl text-[11px]">
                <span className="font-bold">🔴 Metade Custo:</span>
                <span className="font-brand font-bold text-blue-800">
                  {formatCurrency(balances.custoEInvestimento.custoHalf)}
                </span>
              </div>
              <div className="flex items-center justify-between text-indigo-900 bg-indigo-50/80 p-2 rounded-xl text-[11px]">
                <span className="font-bold">📈 Metade Investimento:</span>
                <span className="font-brand font-bold text-indigo-800">
                  {formatCurrency(balances.custoEInvestimento.investimentoHalf)}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. REGISTRATION FORM FOR REAL PURCHASES / EXPENSES */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <h3 className="font-brand font-bold text-sm text-slate-900">
                Lançar Compra Real / Despesa
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Desconta automaticamente do cofrinho selecionado
              </p>
            </div>
          </div>

          {showSuccessToast && (
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Despesa lançada!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveExpense} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                O que você comprou? (Descrição)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: 2 sacos de farinha, 2 formas e bicos"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-slate-50/50"
                required
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Categoria da Compra
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('reposicao')}
                  className={`py-2 px-2.5 rounded-2xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 ${
                    category === 'reposicao'
                      ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                  Reposição
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('investimento')}
                  className={`py-2 px-2.5 rounded-2xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 ${
                    category === 'investimento'
                      ? 'bg-blue-100 text-blue-900 border-blue-400 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Investimento
                </button>
              </div>
            </div>

            {/* Valor Gasto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Valor Gasto (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 bg-slate-50/50"
                  required
                />
              </div>
            </div>

            {/* Data */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data da Compra
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500 bg-slate-50/50"
                required
              />
            </div>

          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-brand font-bold text-xs rounded-2xl shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Registrar Compra e Descontar do Cofrinho
          </button>
        </form>
      </div>

      {/* 4. EXPENSES HISTORY */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-brand font-bold text-sm text-slate-900">
              Histórico de Compras Realizadas ({expenseTransactions.length})
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Ajuste ou remova lançamentos se digitou algo errado
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
            <button
              onClick={() => setSelectedFilter('todos')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                selectedFilter === 'todos'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos ({expenseTransactions.length})
            </button>
            <button
              onClick={() => setSelectedFilter('reposicao')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                selectedFilter === 'reposicao'
                  ? 'bg-amber-100 text-amber-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Reposição
            </button>
            <button
              onClick={() => setSelectedFilter('investimento')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                selectedFilter === 'investimento'
                  ? 'bg-blue-100 text-blue-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Investimento
            </button>
          </div>
        </div>

        {/* Search Input */}
        {expenseTransactions.length > 0 && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar compra..."
              className="w-full pl-9 pr-3 py-2 rounded-2xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-amber-500 bg-slate-50/50"
            />
          </div>
        )}

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">
              Nenhuma compra registrada nesta categoria.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredExpenses.map((tx) => {
              const isReposicao = tx.type === 'reposicao';

              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 shadow-2xs transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isReposicao
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}
                      >
                        {isReposicao ? '🔄 Reposição' : '📈 Investimento'}
                      </span>
                      <span className="font-brand font-bold text-slate-900 text-sm truncate">
                        {tx.description}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>Data: {formatDateBr(tx.date)}</span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className="font-brand font-extrabold text-sm text-rose-700">
                      -{formatCurrency(tx.totalValue)}
                    </span>

                    <div className="flex items-center gap-1 mt-1">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Editar Compra"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Excluir Compra"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
