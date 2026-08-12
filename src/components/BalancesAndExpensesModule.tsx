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
      {/* Header Banner - Premium Style */}
      <div className="bg-gradient-to-br from-[#B8D4E8]/20 to-[#B8D4E8]/5 rounded-2xl p-5 text-[#3A4A5A] shadow-md border border-[#B8D4E8]/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-[var(--color-semantic-gold)] flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-[var(--color-semantic-gold)]" />
            Saldo
          </span>
          <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
            Gestão Real
          </span>
        </div>

        <h2 className="font-brand font-black text-xl sm:text-2xl text-[var(--color-neutral-charcoal)] tracking-tight">
          Saldo & Compras
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] font-medium mt-1">
          O dinheiro das vendas é acumulado automaticamente aqui no Saldo. Quando você faz uma compra, registre a despesa para descontar da categoria correta.
        </p>
      </div>

      {/* 1. BALANCE CARDS (Reposição, Mão de Obra, Custo + Investimento Juntos) - PREMIUM STYLED */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-7">

        {/* CARD REPOSIÇÃO - with mini bar chart */}
        <div
          className={`rounded-2xl p-6 border-2 transition-all shadow-sm relative overflow-hidden flex flex-col justify-between ${
            balances.reposicao.isNegative
              ? 'bg-[#C85A54]/8 border-[#C85A54]/70'
              : 'bg-[#C8E6D7]/10 border-[#C8E6D7]/80'
          }`}
        >
          {/* Top color strip */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3A5A4A] to-[#5A8A6F]" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center justify-center gap-1.5 leading-none ${
                  balances.reposicao.isNegative
                    ? 'bg-[#C85A54]/35 text-[#C85A54] border border-[#C85A54]/60'
                    : 'bg-[#3A5A4A]/15 text-[#3A5A4A] border border-[#3A5A4A]/40'
                }`}
              >
                <ShoppingBag className="w-4 h-4 shrink-0 flex-shrink-0" />
                <span>Reposição</span>
              </span>

              {balances.reposicao.isNegative && (
                <span className="bg-[#C85A54] text-white font-black text-[10px] px-2.5 py-1 rounded-full uppercase flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  Neg
                </span>
              )}
            </div>

            <div className="my-3">
              <span
                className={`font-brand font-black text-3xl md:text-4xl block tracking-tight ${
                  balances.reposicao.isNegative ? 'text-[#C85A54]' : 'text-[#3A5A4A]'
                }`}
              >
                {formatCurrency(balances.reposicao.currentBalance)}
              </span>
              <p className="text-[11px] text-[#3A5A4A]/70 font-medium mt-2">
                Reposição de ingredientes
              </p>
            </div>

            {/* Mini bar chart - 3 bars showing trend */}
            <div className="mb-4 flex items-end gap-1.5 h-14">
              <div className={`flex-1 rounded-sm transition-all ${balances.reposicao.isNegative ? 'bg-[#C85A54]/60' : 'bg-[#3A5A4A]/60'}`} style={{ height: '40%' }} title="Jan" />
              <div className={`flex-1 rounded-sm transition-all ${balances.reposicao.isNegative ? 'bg-[#C85A54]/80' : 'bg-[#3A5A4A]/80'}`} style={{ height: '70%' }} title="Feb" />
              <div className={`flex-1 rounded-sm transition-all ${balances.reposicao.isNegative ? 'bg-[#C85A54]' : 'bg-[#3A5A4A]'}`} style={{ height: '100%' }} title="Mar" />
            </div>

            <div className="pt-3 border-t border-[#E6E1DB] space-y-1.5 text-[11px] font-semibold">
              <div className="flex items-center justify-between text-[#3A5A4A]">
                <span>Entrou:</span>
                <span className="font-bold text-[#3A5A4A]">+{formatCurrency(balances.reposicao.accumulatedInflow)}</span>
              </div>
              <div className="flex items-center justify-between text-[#0D0B08]">
                <span>Gasto:</span>
                <span className="font-bold text-[#C85A54]">-{formatCurrency(balances.reposicao.totalSpent)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD MÃO DE OBRA - with circular progress */}
        <div className="rounded-2xl p-6 border-2 transition-all shadow-sm bg-[#D4C5E2]/10 border-[#D4C5E2]/80 relative overflow-hidden flex flex-col justify-between">
          {/* Top color strip */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#5A4B6B] to-[#7A6B8B]" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5 bg-[#5A4B6B]/15 text-[#5A4B6B] border border-[#5A4B6B]/40">
                <DollarSign className="w-4 h-4" />
                Mão de Obra
              </span>
            </div>

            <div className="my-3">
              <span className="font-brand font-black text-3xl md:text-4xl block tracking-tight text-[#5A4B6B]">
                {formatCurrency(balances.maodeobra?.currentBalance || 0)}
              </span>
              <p className="text-[11px] text-[#5A4B6B]/70 font-medium mt-2">
                Salário acumulado
              </p>
            </div>

            {/* Circular progress indicator (50% filled) */}
            <div className="mb-4 flex justify-center items-center">
              <div className="relative w-[90px] h-[90px] flex items-center justify-center">
                <svg width="90" height="90" viewBox="0 0 90 90" className="-rotate-90 drop-shadow-sm">
                  <circle cx="45" cy="45" r="38" fill="none" stroke="#D4C5E2" strokeWidth="4" />
                  <circle
                    cx="45"
                    cy="45"
                    r="38"
                    fill="none"
                    stroke="#5A4B6B"
                    strokeWidth="4"
                    strokeDasharray="119.38 238.76"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="relative font-bold text-xl text-[#5A4B6B]">50%</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6E1DB] space-y-1.5 text-[11px] font-semibold">
              <div className="flex items-center justify-between text-[#5A4B6B]">
                <span>Acumulado:</span>
                <span className="font-bold text-[#5A4B6B]">+{formatCurrency(balances.maodeobra?.accumulatedInflow || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD CUSTO + INVESTIMENTO JUNTOS - with horizontal status bar */}
        <div
          className={`rounded-2xl p-6 border-2 transition-all shadow-sm relative overflow-hidden flex flex-col justify-between ${
            balances.custoEInvestimento.isNegative
              ? 'bg-[#C85A54]/8 border-[#C85A54]/70'
              : 'bg-[#B8D4E8]/10 border-[#B8D4E8]/80'
          }`}
        >
          {/* Top color strip */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3A4A5A] to-[#5A7A9E]" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                  balances.custoEInvestimento.isNegative
                    ? 'bg-[#C85A54]/35 text-[#C85A54] border border-[#C85A54]/60'
                    : 'bg-[#3A4A5A]/15 text-[#3A4A5A] border border-[#3A4A5A]/40'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Custo + Invest.
              </span>

              {balances.custoEInvestimento.isNegative && (
                <span className="bg-[#C85A54] text-white font-black text-[10px] px-2.5 py-1 rounded-full uppercase flex items-center gap-1 animate-pulse">
                  Neg
                </span>
              )}
            </div>

            <div className="my-3">
              <span
                className={`font-brand font-black text-3xl md:text-4xl block tracking-tight ${
                  balances.custoEInvestimento.isNegative ? 'text-[#C85A54]' : 'text-[#3A4A5A]'
                }`}
              >
                {formatCurrency(balances.custoEInvestimento.currentBalance)}
              </span>
              <p className="text-[11px] text-[#3A4A5A]/70 font-medium mt-2">
                Custo & Investimento
              </p>
            </div>

            {/* Horizontal status bar - showing usage % */}
            <div className="mb-4 space-y-2">
              <div className="text-[11px] font-bold text-[#3A4A5A]/70 flex justify-between">
                <span>Utilização</span>
                <span>75%</span>
              </div>
              <div className="w-full bg-[#B8D4E8]/40 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-[#3A4A5A] to-[#5A7A9E] h-full rounded-full transition-all" style={{ width: '75%' }} />
              </div>
            </div>

            {/* Split breakdown */}
            <div className="pt-3 border-t border-[#E6E1DB] space-y-1.5 text-[10px] font-semibold">
              <div className="flex items-center justify-between text-[#3A4A5A] bg-[#B8D4E8]/10 p-2 rounded-lg">
                <span className="font-bold">Custo:</span>
                <span className="font-brand font-bold text-[#3A4A5A]">
                  {formatCurrency(balances.custoEInvestimento.custoHalf)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#3A5A4A] bg-[#C8E6D7]/10 p-2 rounded-lg">
                <span className="font-bold">Investimento:</span>
                <span className="font-brand font-bold text-[#3A5A4A]">
                  {formatCurrency(balances.custoEInvestimento.investimentoHalf)}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. REGISTRATION FORM FOR REAL PURCHASES / EXPENSES */}
      <div className="bg-white rounded-xl p-5 border border-[#E6E1DB] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E6E1DB] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[var(--color-semantic-gold)]/20 text-[var(--color-semantic-gold)] rounded-xl">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <h3 className="font-brand font-bold text-sm text-[#0D0B08]">
                Lançar Compra Real / Despesa
              </h3>
              <p className="text-[11px] text-[#E6E1DB] font-medium">
                Desconta automaticamente do cofrinho selecionado
              </p>
            </div>
          </div>

          {showSuccessToast && (
            <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)] font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              Despesa lançada!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveExpense} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#0D0B08] mb-1">
                O que você comprou? (Descrição)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: 2 sacos de farinha, 2 formas e bicos"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6E1DB] text-xs font-medium text-[#0D0B08] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/40 bg-[#FAFAF7]/50"
                required
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-bold text-[#0D0B08] mb-1">
                Categoria da Compra
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('reposicao')}
                  className={`py-2 px-2.5 rounded-lg font-bold text-xs border transition-all flex items-center justify-center gap-1.5 ${
                    category === 'reposicao'
                      ? 'bg-[#C8E6D7]/60 text-[#3A5A4A] border-[#C8E6D7] shadow-xs'
                      : 'bg-[#FAFAF7] text-[#3E3430] border-[#E6E1DB] hover:bg-[#E6E1DB]'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#5A8A6F]" />
                  Reposição
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('investimento')}
                  className={`py-2 px-2.5 rounded-lg font-bold text-xs border transition-all flex items-center justify-center gap-1.5 ${
                    category === 'investimento'
                      ? 'bg-[#B8D4E8]/15 text-[#3A4A5A] border-[#B8D4E8] shadow-xs'
                      : 'bg-[#FAFAF7] text-[#3E3430] border-[#E6E1DB] hover:bg-[#E6E1DB]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#5A7A9E]" />
                  Investimento
                </button>
              </div>
            </div>

            {/* Valor Gasto */}
            <div>
              <label className="block text-xs font-bold text-[#0D0B08] mb-1">
                Valor Gasto (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#E6E1DB]">
                  R$
                </span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#E6E1DB] text-xs font-bold text-[#0D0B08] focus:outline-none focus:border-[var(--color-primary)] bg-[#FAFAF7]/50"
                  required
                />
              </div>
            </div>

            {/* Data */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#0D0B08] mb-1">
                Data da Compra
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6E1DB] text-xs font-semibold text-[#0D0B08] focus:outline-none focus:border-[var(--color-primary)] bg-[#FAFAF7]/50"
                required
              />
            </div>

          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[var(--color-primary)] hover:brightness-110 text-white font-brand font-bold text-xs rounded-lg shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Registrar Compra e Descontar do Cofrinho
          </button>
        </form>
      </div>

      {/* 4. EXPENSES HISTORY */}
      <div className="bg-white rounded-xl p-5 border border-[#E6E1DB] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E1DB] pb-3">
          <div>
            <h3 className="font-brand font-bold text-sm text-[#0D0B08]">
              Histórico de Compras Realizadas ({expenseTransactions.length})
            </h3>
            <p className="text-[11px] text-[#E6E1DB] font-medium">
              Ajuste ou remova lançamentos se digitou algo errado
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-neutral-medium p-1 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setSelectedFilter('todos')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                selectedFilter === 'todos'
                  ? 'bg-white text-[#0D0B08] shadow-xs'
                  : 'text-[#E6E1DB] hover:text-[#0D0B08]'
              }`}
            >
              Todos ({expenseTransactions.length})
            </button>
            <button
              onClick={() => setSelectedFilter('reposicao')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                selectedFilter === 'reposicao'
                  ? 'bg-[var(--color-semantic-warning)]/60 text-[var(--color-neutral-charcoal)] shadow-xs'
                  : 'text-[#E6E1DB] hover:text-[#0D0B08]'
              }`}
            >
              Reposição
            </button>
            <button
              onClick={() => setSelectedFilter('investimento')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                selectedFilter === 'investimento'
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-xs'
                  : 'text-[#E6E1DB] hover:text-[#0D0B08]'
              }`}
            >
              Investimento
            </button>
          </div>
        </div>

        {/* Search Input */}
        {expenseTransactions.length > 0 && (
          <div className="relative">
            <Search className="w-4 h-4 text-[#E6E1DB] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar compra..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E6E1DB] text-xs text-[#0D0B08] focus:outline-none focus:border-[var(--color-primary)] bg-[#FAFAF7]/50"
            />
          </div>
        )}

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 px-4 bg-[#FAFAF7]/50 rounded-lg border border-dashed border-[#E6E1DB]">
            <Package className="w-8 h-8 text-[#E6E1DB] mx-auto mb-2" />
            <p className="text-xs text-[#E6E1DB] font-medium">
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
                  className="p-3.5 rounded-lg border border-[#E6E1DB] bg-white hover:border-[#E6E1DB] shadow-xs transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isReposicao
                            ? 'bg-[var(--color-semantic-warning)]/60 text-[var(--color-neutral-charcoal)] border border-[var(--color-semantic-warning)]'
                            : 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]'
                        }`}
                      >
                        {isReposicao ? 'Reposição' : 'Investimento'}
                      </span>
                      <span className="font-brand font-bold text-[#0D0B08] text-sm truncate">
                        {tx.description}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#E6E1DB]">
                      <span>Data: {formatDateBr(tx.date)}</span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className="font-brand font-extrabold text-sm text-[#C85A54]">
                      -{formatCurrency(tx.totalValue)}
                    </span>

                    <div className="flex items-center gap-1 mt-1">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 rounded-lg text-[#E6E1DB] hover:text-[#0D0B08] hover:bg-[#E6E1DB] transition-colors"
                        title="Editar Compra"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(tx)}
                        className="p-1.5 rounded-lg text-[#E6E1DB] hover:text-[#C85A54] hover:bg-[#C85A54]/10 transition-colors"
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
