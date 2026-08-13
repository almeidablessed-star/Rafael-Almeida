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
  Clock,
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
    <div className="space-y-6 md:space-y-8 animate-fadeIn pb-6">

      {/* COMANDA TICKET BUTTON - "LANÇAR PEDIDO" (4C) */}
      <button
        onClick={() => onOpenAddModal('venda')}
        className="w-full group relative overflow-hidden transition-all active:scale-95 hover:-translate-y-1 hover:rotate-[-0.6deg]"
        style={{
          background: 'linear-gradient(155deg, var(--color-brand-900) 0%, var(--color-brand-700) 60%, var(--color-brand-500) 100%)',
          borderRadius: '20px',
          padding: '18px 20px',
          border: '2px dashed rgba(245, 185, 198, 0.5)',
        }}
      >
        {/* Left and Right cutout circles */}
        <div style={{
          position: 'absolute',
          width: '22px', height: '22px', borderRadius: '50%',
          background: 'var(--color-surface)',
          left: '-11px', top: '50%', transform: 'translateY(-50%)',
        }} />
        <div style={{
          position: 'absolute',
          width: '22px', height: '22px', borderRadius: '50%',
          background: 'var(--color-surface)',
          right: '-11px', top: '50%', transform: 'translateY(-50%)',
        }} />

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="label-sm text-white/80 mb-1">NOVA COMANDA</div>
            <div className="font-marca text-white" style={{ fontSize: '29px', lineHeight: 1 }}>+ Lançar Pedido</div>
          </div>
          <div className="animate-carFloat flex-shrink-0 w-11 h-11 rounded-[14px] bg-[var(--color-rose-200)] flex items-center justify-center font-black text-[var(--color-brand-900)] text-2xl">+</div>
        </div>

        {/* Sweep shine animation */}
        <div className="animate-carSweep absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          borderRadius: '20px',
        }} />
      </button>


      {/* 3. STATS SECTION - SALDO */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[var(--color-brand-900)]/10 text-[var(--color-brand-900)] rounded-lg shadow-card">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[var(--color-ink)]">
                Saldos & Divisão dos Pedidos
              </h3>
              <p className="text-[11px] text-[var(--color-brand-700)]/70 font-medium">
                Entradas das vendas pagas − Compras registradas
              </p>
            </div>
          </div>
        </div>

        {/* 3-Column Grid with Infographics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Card Saldo Reposição - with mini bar chart */}
          <div
            onClick={() => onNavigateToTab('saldos')}
            className={`rounded-2xl p-5 border-2 cursor-pointer transition-all hover:shadow-card-hover overflow-hidden relative ${
              balances.reposicao.isNegative
                ? 'bg-[#C85A54]/8 border-[#C85A54]/60'
                : 'bg-[#C8E6D7]/12 border-[#C8E6D7]/70 shadow-card'
            }`}
          >
            {/* Top color strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3A5A4A] to-[#5A8A6F]" />

            <div className="flex items-start justify-between mb-3">
              <span className={`label-sm tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                balances.reposicao.isNegative
                  ? 'bg-[#C85A54]/30 text-[#C85A54] border border-[#C85A54]'
                  : 'bg-[#3A5A4A]/15 text-[#3A5A4A] border border-[#3A5A4A]/40'
              }`}>
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                Reposição
              </span>
              {balances.reposicao.isNegative && (
                <span className="bg-[#C85A54] text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                  Negativo
                </span>
              )}
            </div>

            <span
              className={`font-numbers font-marca value-lg md:text-4xl block mb-2 ${
                balances.reposicao.isNegative ? 'text-[#C85A54]' : 'text-[#3A5A4A]'
              }`}
            >
              {formatCurrency(balances.reposicao.currentBalance)}
            </span>

            {/* Mini bar chart - 3 bars showing trend */}
            <div className="mb-3 flex items-end gap-1.5 h-12">
              <div className={`flex-1 rounded-sm transition-all ${balances.reposicao.isNegative ? 'bg-[#C85A54]/60' : 'bg-[#5A8A6F]/60'}`} style={{ height: '40%' }} title="Jan" />
              <div className={`flex-1 rounded-sm transition-all ${balances.reposicao.isNegative ? 'bg-[#C85A54]/80' : 'bg-[#5A8A6F]/80'}`} style={{ height: '70%' }} title="Feb" />
              <div className={`flex-1 rounded-sm transition-all ${balances.reposicao.isNegative ? 'bg-[#C85A54]' : 'bg-[#5A8A6F]'}`} style={{ height: '100%' }} title="Mar" />
            </div>

            <div className="text-[11px] text-[#3A5A4A]/70 font-medium">
              Para reposição de ingredientes
            </div>
          </div>

          {/* Card Saldo Mão de Obra - with circular progress */}
          <div
            onClick={() => onNavigateToTab('saldos')}
            className="rounded-2xl p-5 border-2 cursor-pointer transition-all hover:shadow-card-hover bg-[#D4C5E2]/12 border-[#D4C5E2]/70 shadow-card relative overflow-hidden"
          >
            {/* Top color strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5A4B6B] to-[#7A6B8B]" />

            <div className="flex items-start justify-between mb-3">
              <span className="label-sm tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 bg-[#5A4B6B]/15 text-[#5A4B6B] border border-[#5A4B6B]/40">
                <Users className="w-3.5 h-3.5" />
                Mão de Obra
              </span>
            </div>

            <span className="font-numbers font-marca value-lg md:text-4xl block mb-3 text-[#5A4B6B]">
              {formatCurrency(balances.maodeobra?.currentBalance || 0)}
            </span>

            {/* Circular progress indicator (50% filled) */}
            <div className="mb-3 flex justify-center items-center">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg width="80" height="80" viewBox="0 0 80 80" className="absolute -rotate-90">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="#D4C5E2" strokeWidth="3" />
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke="#5A4B6B"
                    strokeWidth="3"
                    strokeDasharray="109.96 219.91"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="relative font-bold text-2xl text-[#5A4B6B]">50%</span>
              </div>
            </div>

            <div className="text-[11px] text-[#5A4B6B]/70 font-medium text-center">
              Salário acumulado
            </div>
          </div>

          {/* Card Custo + Investimento - with horizontal status bar */}
          <div
            onClick={() => onNavigateToTab('saldos')}
            className={`rounded-2xl p-5 border-2 cursor-pointer transition-all hover:shadow-card-hover relative overflow-hidden ${
              balances.custoEInvestimento.isNegative
                ? 'bg-[#C85A54]/8 border-[#C85A54]/60'
                : 'bg-[#B8D4E8]/12 border-[#B8D4E8]/70 shadow-card'
            }`}
          >
            {/* Top color strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3A4A5A] to-[#5A7A9E]" />

            <div className="flex items-start justify-between mb-3">
              <span
                className={`label-sm tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  balances.custoEInvestimento.isNegative
                    ? 'bg-[#C85A54]/30 text-[#C85A54] border border-[#C85A54]'
                    : 'bg-[#3A4A5A]/15 text-[#3A4A5A] border border-[#3A4A5A]/40'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Custo + Invest.
              </span>
              {balances.custoEInvestimento.isNegative && (
                <span className="bg-[#C85A54] text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                  Negativo
                </span>
              )}
            </div>

            <span
              className={`font-numbers font-marca value-lg md:text-4xl block mb-3 ${
                balances.custoEInvestimento.isNegative ? 'text-[#C85A54]' : 'text-[#3A4A5A]'
              }`}
            >
              {formatCurrency(balances.custoEInvestimento.currentBalance)}
            </span>

            {/* Horizontal status bar - showing usage % */}
            <div className="mb-3 space-y-2">
              <div className="text-[10px] font-bold text-[#3A4A5A]/70 flex justify-between">
                <span>Utilização</span>
                <span>75%</span>
              </div>
              <div className="w-full bg-[#B8D4E8]/40 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-[#3A4A5A] to-[#5A7A9E] h-full rounded-full" style={{ width: '75%' }} />
              </div>
            </div>

            <div className="text-[10px] text-[#3A4A5A]/70 font-medium">
              50% Custo / 50% Investimento
            </div>
          </div>
        </div>
      </div>

      {/* 4. LUCRO LÍQUIDO DO MÊS - FULL-WIDTH HIGHLIGHT CARD */}
      <div className="bg-gradient-to-br from-[var(--color-neutral-cream)] via-[#F5E8DB] to-[var(--color-neutral-cream)] rounded-3xl p-6 md:p-8 border-2 border-[var(--color-neutral-medium)] shadow-highlight relative overflow-hidden text-[var(--color-pastry-chocolate)] space-y-5">

        {/* Decorative background circle */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[#D4A574] flex items-center justify-center shadow-highlight">
                <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-[var(--color-pastry-chocolate)]/70 block">
                  Lucro Líquido do Mês
                </span>
                <span className="text-[10px] md:text-xs font-medium text-[var(--color-pastry-chocolate)]/60">
                  Rendimento Total
                </span>
              </div>
            </div>

            <div className="px-4 py-1.5 rounded-full text-xs font-bold bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/50 flex items-center gap-1.5 shadow-card-hover">
              {summary.isPositive ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)]" /> Positivo
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-[#C85A54]" /> Negativo
                </>
              )}
            </div>
          </div>

          {/* Big Profit Amount with grid-based spacing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <p className="text-[11px] md:text-sm font-medium text-[var(--color-pastry-chocolate)]/70 mb-2 uppercase tracking-wide">
                Resultado
              </p>
              <span className="font-numbers font-black text-4xl md:text-6xl text-[var(--color-pastry-chocolate)] tracking-tight block leading-tight">
                {formatCurrency(summary.lucroLiquido)}
              </span>
            </div>

            {/* Status Message & Button Column */}
            <div className="space-y-3">
              {/* Status Message */}
              <p className="text-sm font-medium text-[var(--color-pastry-chocolate)]/85 leading-relaxed">
                {summary.isPositive ? (
                  <span>
                    <strong>Resultado excelente!</strong> Suas vendas superaram todas as despesas e custos por <strong>{formatCurrency(summary.lucroLiquido)}</strong> neste período.
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#C85A54] shrink-0" />
                    Suas saídas estão superiores às vendas em <strong>{formatCurrency(Math.abs(summary.lucroLiquido))}</strong>.
                  </span>
                )}
              </p>

              {/* Detail Button */}
              <button
                onClick={() => setShowSalesModal(true)}
                className="w-full md:w-auto px-6 py-3 bg-[var(--color-pastry-chocolate)] hover:bg-[#2D1B3F] text-white rounded-xl text-xs font-bold shadow-highlight flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Detalhamento das Vendas</span>
              </button>
            </div>
          </div>

          {/* Formula Breakdown */}
          <div className="pt-5 border-t border-[var(--color-text-muted)]/20 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/40 backdrop-blur-xs rounded-xl p-3">
              <span className="text-[10px] font-semibold text-[var(--color-pastry-chocolate)]/70 block mb-1">Vendas Pagas</span>
              <span className="font-numbers font-black text-base text-[var(--color-primary)]">
                {formatCurrency(summary.totalVendas)}
              </span>
            </div>
            <div className="bg-white/40 backdrop-blur-xs rounded-xl p-3">
              <span className="text-[10px] font-semibold text-[var(--color-pastry-chocolate)]/70 block mb-1">Saídas</span>
              <span className="font-numbers font-black text-base text-[#C85A54]">
                {formatCurrency(summary.totalSaidas)}
              </span>
            </div>
            {summary.totalAReceber > 0 && (
              <div className="bg-[var(--color-rose-200)]/40 backdrop-blur-xs rounded-xl p-3">
                <span className="text-[10px] font-semibold text-[var(--color-pastry-chocolate)]/70 flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3" /> A Receber
                </span>
                <span className="font-numbers font-black text-base text-[#C99B6F]">
                  {formatCurrency(summary.totalAReceber)}
                </span>
              </div>
            )}
            <div className="bg-[var(--color-primary)]/10 backdrop-blur-xs rounded-xl p-3">
              <span className="text-[10px] font-semibold text-[var(--color-primary)]/70 block mb-1">Período</span>
              <span className="font-bold text-sm text-[var(--color-primary)]">
                {period.label || 'Atual'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SECONDARY SECTION: AGENDA DE PEDIDOS / CALENDÁRIO */}
      <OrdersCalendar
        transactions={transactionsList}
        onOpenAddModal={() => onOpenAddModal('venda')}
        onEditTransaction={onEditTransaction}
        onDeleteTransaction={onDeleteTransaction}
        onTogglePaymentStatus={onTogglePaymentStatus}
      />

      {/* SALES DETAILS MODAL (ACCESSIBLE FROM PROFIT CARD) */}
      {showSalesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-[var(--color-primary)] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-white/70" />
                <h3 className="font-brand font-black text-base">
                  Detalhamento Completo das Vendas
                </h3>
              </div>
              <button
                onClick={() => setShowSalesModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors active:scale-95"
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
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                />
              </div>

              {/* Total Summary Header */}
              <div className="bg-[var(--color-primary)]/10 p-4 rounded-2xl border border-[var(--color-primary)]/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[var(--color-primary)] uppercase block">
                    Total de Encomendas / Vendas
                  </span>
                  <span className="font-brand font-marca value-md text-[var(--color-primary)]">
                    {formatCurrency(summary.totalVendas)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-[var(--color-semantic-gold)] uppercase block">
                    A Receber (Pendente)
                  </span>
                  <span className="font-brand font-black text-lg text-[var(--color-semantic-gold)]">
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
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-[var(--color-primary)]/40 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-brand font-black text-xs text-pink-900 bg-pink-100 px-2 py-0.5 rounded-lg border border-pink-200 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {tx.customerName || 'Cliente Geral'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                              tx.paymentStatus !== 'pendente'
                                ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                                : 'bg-[var(--color-semantic-gold)]/20 text-[var(--color-semantic-gold)]'
                            }`}
                          >
                            {tx.paymentStatus !== 'pendente' ? (
                              <><CheckCircle2 className="w-3 h-3" /> Pago</>
                            ) : (
                              <><Clock className="w-3 h-3" /> Pendente</>
                            )}
                          </span>
                        </div>
                        <p className="font-brand font-bold text-slate-900 text-xs truncate flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                          {tx.description}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Data: {formatDateBr(tx.date)} {tx.paymentMethod ? `• ${tx.paymentMethod.toUpperCase()}` : ''}
                        </p>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <span className="font-brand font-black text-sm text-[var(--color-primary)] block">
                          {formatCurrency(tx.totalValue)}
                        </span>
                        <button
                          onClick={() => setQuoteTx(tx)}
                          className="px-2.5 py-1 bg-pink-600 hover:bg-pink-700 text-white text-[10px] font-bold rounded-xl flex items-center gap-1 shadow-2xs ml-auto transition-all active:scale-95"
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
