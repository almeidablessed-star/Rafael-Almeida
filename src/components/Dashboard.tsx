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

  return (
    <div className="space-y-6 pb-8 animate-fadeIn">

      {/* 1. PROFIT CARD - Roxo Gradiente com Medidor */}
      <div
        className="rounded-3xl p-6 text-white relative overflow-hidden shadow-highlight"
        style={{
          background: 'linear-gradient(155deg, var(--color-brand-900) 0%, var(--color-brand-700) 60%, var(--color-brand-500) 100%)',
        }}
      >
        {/* Glow animation background */}
        <div className="animate-carGlow absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* Top: Gauge + Label */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-xs font-black uppercase tracking-widest text-white/80 mb-2">
                Lucro Líquido do Mês (Rendimento)
              </div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '42px', fontWeight: 'bold', lineHeight: 1.1, color: '#F5B9C6' }}>
                {formatCurrency(summary.totalValue || 0)}
              </div>
              <div className="text-xs text-white/70 mt-1">
                {summary.isPositive ? '✓ Resultado excelente!' : '⚠ Atenção necessária'}
              </div>
            </div>

            {/* Circular Gauge (59%) */}
            <svg width="100" height="100" viewBox="0 0 100 100" className="flex-shrink-0">
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="38" fill="none" stroke="rgba(245,185,198,0.9)" strokeWidth="8"
                strokeDasharray={`${Math.PI * 76 * 0.59} ${Math.PI * 76}`}
                transform="rotate(-90 50 50)"
                strokeLinecap="round"
              />
              <text x="50" y="58" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white">59%</text>
            </svg>
          </div>

          {/* Bottom: 3 Small Boxes */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-white/20 rounded-xl p-3 text-center backdrop-blur">
              <div className="text-xs text-white/80">Vendas Pagas</div>
              <div className="font-black text-base text-white mt-1">R$ 8.400</div>
            </div>
            <div className="bg-white/20 rounded-xl p-3 text-center backdrop-blur">
              <div className="text-xs text-white/80">Saldos</div>
              <div className="font-black text-base text-white mt-1">R$ 5.440</div>
            </div>
            <div className="bg-white/20 rounded-xl p-3 text-center backdrop-blur">
              <div className="text-xs text-white/80">A Receber</div>
              <div className="font-black text-base text-white mt-1">R$ 1.180</div>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={() => onNavigateToTab('saldos')}
            className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-all"
          >
            Ver Detalhamento das Vendas
          </button>
        </div>
      </div>

      {/* 2. COMANDA TICKET BUTTON - "LANÇAR PEDIDO" */}
      <button
        onClick={() => onOpenAddModal('venda')}
        className="w-full group relative overflow-hidden transition-all active:scale-95 hover:-translate-y-1"
        style={{
          background: 'linear-gradient(135deg, var(--color-brand-900) 0%, var(--color-brand-700) 50%, var(--color-brand-500) 100%)',
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
            <div className="label-sm text-white/80 mb-1">NOVA COMANDA</div>
            <div className="font-marca text-white" style={{ fontSize: '24px', lineHeight: 1 }}>+ Lançar Pedido</div>
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
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="p-2 rounded-lg" style={{ background: 'rgba(58, 35, 80, 0.1)' }}>
            <Wallet className="w-5 h-5" style={{ color: 'var(--color-brand-900)' }} />
          </div>
          <div>
            <h3 className="font-marca text-lg" style={{ color: 'var(--color-ink)' }}>
              Saldos & Divisão dos Pedidos
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-ink-soft)' }}>
              Entradas das vendas pagas − Compras registradas
            </p>
          </div>
        </div>

        {/* 3 Circular Gauges */}
        <div className="grid grid-cols-3 gap-4">
          {/* Reposição - 72% - Mint Green */}
          <div className="bg-white rounded-2xl p-4 shadow-card text-center hover:shadow-card-hover transition-all duration-300">
            <svg width="90" height="90" viewBox="0 0 100 100" className="mx-auto">
              <circle cx="50" cy="50" r="38" fill="none" stroke="var(--color-meter-track)" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="38" fill="none" stroke="var(--color-mint-300)" strokeWidth="6"
                strokeDasharray={`${Math.PI * 76 * 0.72} ${Math.PI * 76}`}
                transform="rotate(-90 50 50)"
                strokeLinecap="round"
              />
              <text x="50" y="58" textAnchor="middle" fontSize="16" fontWeight="bold" fill="var(--color-mint-300)">72%</text>
            </svg>
            <div className="label-sm mt-3 text-[var(--color-mint-300)]">REPOSIÇÃO</div>
            <div className="value-md text-[var(--color-mint-300)] mt-1">R$ 1.240</div>
          </div>

          {/* Mão de Obra - 48% - Purple/Rose */}
          <div className="bg-white rounded-2xl p-4 shadow-card text-center hover:shadow-card-hover transition-all duration-300">
            <svg width="90" height="90" viewBox="0 0 100 100" className="mx-auto">
              <circle cx="50" cy="50" r="38" fill="none" stroke="var(--color-meter-track)" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="38" fill="none" stroke="var(--color-brand-700)" strokeWidth="6"
                strokeDasharray={`${Math.PI * 76 * 0.48} ${Math.PI * 76}`}
                transform="rotate(-90 50 50)"
                strokeLinecap="round"
              />
              <text x="50" y="58" textAnchor="middle" fontSize="16" fontWeight="bold" fill="var(--color-brand-700)">48%</text>
            </svg>
            <div className="label-sm mt-3 text-[var(--color-brand-700)]">MÃO DE OBRA</div>
            <div className="value-md text-[var(--color-brand-700)] mt-1">R$ 860</div>
          </div>

          {/* Custo + Investimento - 35% - Sand/Gold */}
          <div className="bg-white rounded-2xl p-4 shadow-card text-center hover:shadow-card-hover transition-all duration-300">
            <svg width="90" height="90" viewBox="0 0 100 100" className="mx-auto">
              <circle cx="50" cy="50" r="38" fill="none" stroke="var(--color-meter-track)" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="38" fill="none" stroke="var(--color-sand-200)" strokeWidth="6"
                strokeDasharray={`${Math.PI * 76 * 0.35} ${Math.PI * 76}`}
                transform="rotate(-90 50 50)"
                strokeLinecap="round"
              />
              <text x="50" y="58" textAnchor="middle" fontSize="16" fontWeight="bold" fill="var(--color-sand-200)">35%</text>
            </svg>
            <div className="label-sm mt-3" style={{ color: '#6B5A42' }}>CUSTO + INVEST</div>
            <div className="value-md mt-1" style={{ color: '#6B5A42' }}>R$ 620</div>
          </div>
        </div>
      </div>

      {/* 4. CALENDAR */}
      <div className="space-y-3">
        <h3 className="font-marca text-lg px-1">Agenda de Pedidos</h3>
        <OrdersCalendar transactions={transactionsList} />
      </div>
    </div>
  );
};
