import React, { useState } from 'react';
import { Transaction, SummaryTotals, TransactionType, TimePeriod } from '../types';
import { formatCurrency, formatDateBr } from '../utils/formatters';
import { calculateBalances } from '../utils/balancesCalculator';
import { OrdersCalendar } from './OrdersCalendar';
import { QuotePdfModal } from './QuotePdfModal';
import {
  Sparkles,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Trash2,
  Wallet,
  ShoppingBag,
  Plus,
  Printer,
  TrendingUp,
  X,
  Search,
  Users,
} from 'lucide-react';

interface DashboardProps {
  summary: SummaryTotals;
  period: TimePeriod;
  recentTransactions?: Transaction[];
  allTransactions?: Transaction[];
  onOpenAddModal: (type: TransactionType) => void;
  onNavigateToTab: (tabName: any) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
  onTogglePaymentStatus?: (tx: Transaction) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  period,
  recentTransactions,
  allTransactions = [],
  onOpenAddModal,
  onNavigateToTab,
  onEditTransaction,
  onDeleteTransaction,
  onTogglePaymentStatus,
}) => {
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [quoteTx, setQuoteTx] = useState<Transaction | null>(null);
  const [salesSearch, setSalesSearch] = useState('');

  const transactionsList = allTransactions.length > 0 ? allTransactions : (recentTransactions || []);
  const salesTransactions = transactionsList.filter((tx) => tx.type === 'venda');
  const balances = calculateBalances(transactionsList);

  const filteredSales = salesTransactions.filter(
    (tx) =>
      tx.description.toLowerCase().includes(salesSearch.toLowerCase()) ||
      (tx.customerName && tx.customerName.toLowerCase().includes(salesSearch.toLowerCase()))
  );

  return (
    <div className="space-y-5 animate-fadeIn pb-6">
      
      {/* 1. PRIMARY ACTION: LANÇAR PEDIDO */}
      <div className="bg-pastry-hero rounded-[28px] p-4 sm:p-5 border border-[#E8A0B0]/40 shadow-2xs flex items-center justify-center">
        <button
          onClick={() => onOpenAddModal('venda')}
          className="w-full py-3.5 px-6 rounded-full bg-[#2B2420] hover:bg-black text-[#F5C6CE] font-medium text-sm sm:text-base shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <PlusCircle className="w-5 h-5 stroke-[2.5]" />
          <span>+ Lançar Pedido</span>
        </button>
      </div>

      {/* 2. AGENDA DE PEDIDOS / CALENDÁRIO (Subiu para o lugar do Lucro) */}
      <OrdersCalendar
        transactions={transactionsList}
        onOpenAddModal={() => onOpenAddModal('venda')}
        onEditTransaction={onEditTransaction}
        onDeleteTransaction={onDeleteTransaction}
        onTogglePaymentStatus={onTogglePaymentStatus}
      />

      {/* 3. SALDO */}
      <div className="bg-[#F8F1E4] rounded-[28px] p-5 border border-[#2B2420]/10 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#2B2420] text-[#F5C6CE] rounded-full shadow-2xs">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-editorial-bold text-base text-[#2B2420]">
                Saldos & Divisão dos Pedidos
              </h3>
              <p className="text-[11px] text-[#2B2420]/70 font-medium">
                Entradas das vendas pagas − Compras registradas
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Card Saldo Reposição */}
          <div
            onClick={() => onNavigateToTab('saldos')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
              balances.reposicao.isNegative
                ? 'bg-rose-50 border-rose-300'
                : 'bg-[#F5C6CE]/80 border-[#E8A0B0] shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase text-[#2B2420] flex items-center gap-1">
                <ShoppingBag className="w-3 h-3 text-[#2B2420]" />
                🔄 Reposição
              </span>
            </div>
            <span
              className={`font-numbers font-black text-lg sm:text-xl block ${
                balances.reposicao.isNegative ? 'text-rose-700' : 'text-[#2B2420]'
              }`}
            >
              {formatCurrency(balances.reposicao.currentBalance)}
            </span>
          </div>

          {/* Card Saldo Mão de Obra */}
          <div
            onClick={() => onNavigateToTab('saldos')}
            className="p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] bg-[#D8CDEB]/40 border-[#D8CDEB]"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase text-[#2B2420] flex items-center gap-1">
                🟣 Mão de Obra
              </span>
            </div>
            <span className="font-numbers font-black text-lg sm:text-xl block text-[#2B2420]">
              {formatCurrency(balances.maodeobra?.currentBalance || 0)}
            </span>
          </div>

          {/* Card Custo + Investimento Juntos */}
          <div
            onClick={() => onNavigateToTab('saldos')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
              balances.custoEInvestimento.isNegative
                ? 'bg-rose-50 border-rose-300'
                : 'bg-[#D6E4CC]/40 border-[#D6E4CC]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase text-[#2B2420] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#2B2420]" />
                📊 Custo + Invest.
              </span>
            </div>
            <span
              className={`font-numbers font-black text-lg sm:text-xl block ${
                balances.custoEInvestimento.isNegative ? 'text-rose-700' : 'text-[#2B2420]'
              }`}
            >
              {formatCurrency(balances.custoEInvestimento.currentBalance)}
            </span>
            <span className="text-[9px] text-[#2B2420]/60 font-medium block">
              50% Custo ({formatCurrency(balances.custoEInvestimento.custoHalf)}) / 50% Invest.
            </span>
          </div>
        </div>
      </div>

      {/* 4. LUCRO LÍQUIDO DO MÊS - PASTEL THEME LAYOUT (Foi para o lugar da Agenda) */}
      <div className="bg-[#D6E4CC] rounded-[32px] p-6 border border-[#2B2420]/10 shadow-2xs relative overflow-hidden text-[#2B2420] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-2xs">
              <TrendingUp className="w-4 h-4 text-[#2B2420]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2B2420]">
              Lucro Líquido do Mês (Rendimento)
            </span>
          </div>

          <div className="px-3.5 py-1 rounded-full text-xs font-bold bg-white/80 text-[#2B2420] border border-white flex items-center gap-1 shadow-2xs">
            {summary.isPositive ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Positivo
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-700" /> Atenção / Negativo
              </>
            )}
          </div>
        </div>

        {/* Big Profit Amount */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="font-numbers font-black text-3xl sm:text-5xl text-[#2B2420] tracking-tight">
            {formatCurrency(summary.lucroLiquido)}
          </span>

          <button
            onClick={() => setShowSalesModal(true)}
            className="px-5 py-2.5 bg-[#2B2420] hover:bg-black text-[#F5C6CE] rounded-full text-xs font-medium shadow-2xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Ver Detalhamento das Vendas</span>
          </button>
        </div>

        {/* Status Message Explanation */}
        <p className="text-xs font-normal text-[#2B2420]/80 leading-relaxed">
          {summary.isPositive ? (
            <span>
              🎉 <strong>Resultado excelente!</strong> Suas vendas superaram todas as despesas e custos por{' '}
              <strong>{formatCurrency(summary.lucroLiquido)}</strong> no período.
            </span>
          ) : (
            <span>
              ⚠️ Suas saídas estão superiores às vendas neste período em{' '}
              <strong>{formatCurrency(Math.abs(summary.lucroLiquido))}</strong>.
            </span>
          )}
        </p>

        {/* Formula Indicator */}
        <div className="pt-3 border-t border-[#2B2420]/10 flex flex-wrap items-center justify-between text-[11px] font-semibold text-[#2B2420]/70 gap-2">
          <span>
            Vendas Pagas: <strong className="text-[#2B2420]">{formatCurrency(summary.totalVendas)}</strong>
          </span>
          <span>−</span>
          <span>
            Saídas: <strong className="text-[#2B2420]">{formatCurrency(summary.totalSaidas)}</strong>
          </span>
          {summary.totalAReceber > 0 && (
            <span className="bg-white/80 text-[#2B2420] px-3 py-1 rounded-full font-bold text-[10px] ml-auto border border-white">
              ⏳ A Receber: {formatCurrency(summary.totalAReceber)}
            </span>
          )}
        </div>
      </div>

      {/* SALES DETAILS MODAL (ACCESSIBLE FROM PROFIT CARD) */}
      {showSalesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-200" />
                <h3 className="font-brand font-black text-base">
                  Detalhamento Completo das Vendas
                </h3>
              </div>
              <button
                onClick={() => setShowSalesModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar venda por nome da cliente ou produto..."
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Total Summary Header */}
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-900 uppercase block">
                    Total de Encomendas / Vendas
                  </span>
                  <span className="font-brand font-black text-2xl text-emerald-800">
                    {formatCurrency(summary.totalVendas)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-amber-900 uppercase block">
                    A Receber (Pendente)
                  </span>
                  <span className="font-brand font-black text-lg text-amber-700">
                    {formatCurrency(summary.totalAReceber)}
                  </span>
                </div>
              </div>

              {/* Sales List */}
              <div className="space-y-2.5">
                {filteredSales.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    Nenhuma venda encontrada.
                  </p>
                ) : (
                  filteredSales.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-brand font-black text-xs text-pink-900 bg-pink-100 px-2 py-0.5 rounded-lg border border-pink-200">
                            👤 {tx.customerName || 'Cliente Geral'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              tx.paymentStatus !== 'pendente'
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {tx.paymentStatus !== 'pendente' ? '✅ Pago' : '⏳ Pendente'}
                          </span>
                        </div>
                        <p className="font-brand font-bold text-slate-900 text-xs truncate">
                          🍰 {tx.description}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Data: {formatDateBr(tx.date)} {tx.paymentMethod ? `• ${tx.paymentMethod.toUpperCase()}` : ''}
                        </p>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <span className="font-brand font-black text-sm text-emerald-700 block">
                          {formatCurrency(tx.totalValue)}
                        </span>
                        <button
                          onClick={() => setQuoteTx(tx)}
                          className="px-2.5 py-1 bg-pink-600 hover:bg-pink-700 text-white text-[10px] font-bold rounded-xl flex items-center gap-1 shadow-2xs ml-auto"
                        >
                          <Printer className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF QUOTE PREVIEW MODAL */}
      {quoteTx && (
        <QuotePdfModal
          transaction={quoteTx}
          onClose={() => setQuoteTx(null)}
        />
      )}

    </div>
  );
};
