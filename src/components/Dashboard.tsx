import React, { useState } from 'react';
import { Transaction, SummaryTotals, TransactionType, TimePeriod } from '../types';
import { formatCurrency, formatDateBr } from '../utils/formatters';
import { calculateBalances } from '../utils/balancesCalculator';
import { OrdersCalendar } from './OrdersCalendar';
import {
  Wallet,
  ShoppingBag,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Trash2,
  Plus,
  Printer,
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
  const transactionsList = allTransactions.length > 0 ? allTransactions : (recentTransactions || []);
  const balances = calculateBalances(transactionsList);

  // Calculate profit margin percentage (simplified calculation)
  const totalIn = balances.paidSales || 0;
  const totalOut = balances.totalExpenses || 0;
  const profit = Math.max(0, totalIn - totalOut);
  const marginPercent = totalIn > 0 ? Math.round((profit / totalIn) * 100) : 0;

  return (
    <div className="space-y-0 pb-8 animate-fadeIn">

      {/* 1. PROFIT CARD - Roxo Gradiente (Cabeçalho da Página) */}
      <div
        className="rounded-b-3xl pt-6 pb-8 px-5 text-white relative overflow-hidden shadow-highlight"
        style={{
          background: 'linear-gradient(155deg, var(--color-brand-900) 0%, var(--color-brand-700) 60%, var(--color-brand-500) 100%)',
        }}
      >
        {/* Glow animation background */}
        <div className="animate-carGlow absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* Top: Gauge (92px) + Label */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="text-xs font-black uppercase tracking-widest text-white/80 mb-3">
                Lucro Líquido do Mês (Rendimento)
              </div>
              <div className="font-black text-white" style={{ fontSize: '32px', lineHeight: 1.1 }}>
                {formatCurrency(profit)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {profit > 0 ? (
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-black rounded-full whitespace-nowrap" style={{ background: 'var(--color-mint-300)', color: 'var(--color-ink)' }}>
                    ✓ Positivo
                  </span>
                ) : (
                  <span className="text-xs text-white/70">⚠ Resultado</span>
                )}
              </div>
            </div>

            {/* Circular Gauge (92px, 59%) */}
            <svg width="92" height="92" viewBox="0 0 100 100" className="flex-shrink-0">
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="38" fill="none" stroke="var(--color-rose-200)" strokeWidth="10"
                strokeDasharray={`${Math.PI * 76 * (marginPercent / 100)} ${Math.PI * 76}`}
                transform="rotate(-90 50 50)"
                strokeLinecap="round"
              />
              <text x="50" y="58" textAnchor="middle" fontSize="20" fontWeight="bold" fill="white">{marginPercent}%</text>
            </svg>
          </div>

          {/* Success Message */}
          <div className="text-sm font-semibold text-white/90">
            🎉 Resultado excelente! Você teve ótimas vendas neste mês.
          </div>

          {/* Bottom: 3 Small Boxes */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-white/20 rounded-xl p-3 text-center backdrop-blur" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="text-xs text-white/80 font-semibold">Vendas Pagas</div>
              <div className="font-black text-sm text-white mt-1" style={{ fontSize: '13px' }}>
                {formatCurrency(balances.paidSales || 0)}
              </div>
            </div>
            <div className="bg-white/20 rounded-xl p-3 text-center backdrop-blur" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="text-xs text-white/80 font-semibold">Saídas</div>
              <div className="font-black text-sm text-white mt-1" style={{ fontSize: '13px' }}>
                {formatCurrency(balances.totalExpenses || 0)}
              </div>
            </div>
            <div className="bg-white/20 rounded-xl p-3 text-center backdrop-blur" style={{ background: 'rgba(228,217,195,0.28)' }}>
              <div className="text-xs text-white/80 font-semibold">⏳ A Receber</div>
              <div className="font-black text-sm text-white mt-1" style={{ fontSize: '13px' }}>
                {formatCurrency(balances.pendingSales || 0)}
              </div>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={() => onNavigateToTab('saldos')}
            className="w-full text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wide transition-all"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            Ver Detalhamento das Vendas
          </button>
        </div>
      </div>

      {/* Panel Overlay - Sobreposição com border-radius */}
      <div
        className="mx-0 rounded-t-3xl px-5 pb-6 space-y-6"
        style={{
          background: 'var(--color-surface)',
          position: 'relative',
          zIndex: 1,
          marginTop: '-28px',
          paddingTop: '32px',
        }}
      >

        {/* 2. COMANDA TICKET BUTTON - "LANÇAR PEDIDO" */}
        <button
          onClick={() => onOpenAddModal('venda')}
          className="w-full group relative overflow-hidden transition-all active:scale-95 hover:-translate-y-1 hover:rotate-1"
          style={{
            background: 'linear-gradient(150deg, #8F5A9C, #C4626F)',
            borderRadius: '20px',
            padding: '18px 20px',
            border: '2px dashed rgba(245, 185, 198, 0.5)',
          }}
        >
          {/* Cutout circles */}
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
              <div className="text-xs font-black uppercase tracking-wider text-white/80 mb-1">NOVA COMANDA</div>
              <div className="font-marca text-white" style={{ fontSize: '29px', lineHeight: 1 }}>+ Lançar Pedido</div>
            </div>
            <div
              className="animate-carFloat flex-shrink-0 w-11 h-11 rounded-[14px] flex items-center justify-center font-black text-2xl"
              style={{
                background: 'var(--color-rose-200)',
                color: 'var(--color-brand-900)',
            }}
          >
            +
          </div>
          </div>

          {/* Sweep animation */}
          <div className="animate-carSweep absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            borderRadius: '20px',
          }} />
        </button>

        {/* 3. SALDOS & DIVISÃO DOS PEDIDOS - 3 Medidores */}
        <div className="space-y-4 mt-6">
          <div className="flex items-start gap-3">
            <div>
              <h3 className="font-marca text-lg" style={{ color: 'var(--color-ink)' }}>
                Saldos & Divisão dos Pedidos
              </h3>
              <p className="text-xs" style={{ color: 'var(--color-ink-soft)', marginTop: '2px' }}>
                Entradas das vendas pagas − Compras registradas
              </p>
            </div>
          </div>

          {/* 3 Circular Gauges */}
          <div className="grid grid-cols-3 gap-4">
            {/* Reposição */}
            <div className="bg-white rounded-2xl p-4 shadow-card text-center">
              <svg width="84" height="84" viewBox="0 0 100 100" className="mx-auto">
                <circle cx="50" cy="50" r="38" fill="none" stroke="var(--color-meter-track)" strokeWidth="9" />
                <circle
                  cx="50" cy="50" r="38" fill="none" stroke="var(--color-brand-900)" strokeWidth="9"
                  strokeDasharray={`${Math.PI * 76 * (balances.reposicaoPercent / 100 || 0.72)} ${Math.PI * 76}`}
                  transform="rotate(-90 50 50)"
                  strokeLinecap="round"
                />
                <text x="50" y="58" textAnchor="middle" fontSize="18" fontWeight="bold" fill="var(--color-brand-900)">{Math.round(balances.reposicaoPercent || 72)}%</text>
              </svg>
              <div className="text-xs font-black uppercase tracking-wide mt-3" style={{ color: 'var(--color-brand-900)' }}>Reposição</div>
              <div className="font-marca text-lg font-bold mt-1" style={{ color: 'var(--color-ink)' }}>{formatCurrency(balances.reposicao || 1240)}</div>
            </div>

            {/* Mão de Obra */}
            <div className="bg-white rounded-2xl p-4 shadow-card text-center">
              <svg width="84" height="84" viewBox="0 0 100 100" className="mx-auto">
                <circle cx="50" cy="50" r="38" fill="none" stroke="var(--color-meter-track)" strokeWidth="9" />
                <circle
                  cx="50" cy="50" r="38" fill="none" stroke="#7E4F9E" strokeWidth="9"
                  strokeDasharray={`${Math.PI * 76 * (balances.laborPercent / 100 || 0.48)} ${Math.PI * 76}`}
                  transform="rotate(-90 50 50)"
                  strokeLinecap="round"
                />
                <text x="50" y="58" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#7E4F9E">{Math.round(balances.laborPercent || 48)}%</text>
              </svg>
              <div className="text-xs font-black uppercase tracking-wide mt-3" style={{ color: '#7E4F9E' }}>Mão de Obra</div>
              <div className="font-marca text-lg font-bold mt-1" style={{ color: 'var(--color-ink)' }}>{formatCurrency(balances.labor || 860)}</div>
            </div>

            {/* Custo + Investimento */}
            <div className="bg-white rounded-2xl p-4 shadow-card text-center">
              <svg width="84" height="84" viewBox="0 0 100 100" className="mx-auto">
                <circle cx="50" cy="50" r="38" fill="none" stroke="var(--color-meter-track)" strokeWidth="9" />
                <circle
                  cx="50" cy="50" r="38" fill="none" stroke="#B08D57" strokeWidth="9"
                  strokeDasharray={`${Math.PI * 76 * (balances.costsPercent / 100 || 0.35)} ${Math.PI * 76}`}
                  transform="rotate(-90 50 50)"
                  strokeLinecap="round"
                />
                <text x="50" y="58" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#B08D57">{Math.round(balances.costsPercent || 35)}%</text>
              </svg>
              <div className="text-xs font-black uppercase tracking-wide mt-3" style={{ color: '#B08D57' }}>Custo + Invest.</div>
              <div className="font-marca text-lg font-bold mt-1" style={{ color: 'var(--color-ink)' }}>{formatCurrency(balances.costs || 620)}</div>
            </div>
          </div>

          {/* Note about cost division */}
          <p className="text-xs text-center" style={{ color: 'var(--color-ink-soft)', marginTop: '8px' }}>
            50% Custo (R$ {formatCurrency((balances.costs || 620) / 2)}) / 50% Invest.
          </p>
        </div>

        {/* 4. CALENDAR */}
        <div className="space-y-3 mt-6">
          <h3 className="font-marca text-lg" style={{ color: 'var(--color-ink)' }}>Agenda de Pedidos</h3>
          <OrdersCalendar transactions={transactionsList} />
        </div>
      </div>
    </div>
  );
};
