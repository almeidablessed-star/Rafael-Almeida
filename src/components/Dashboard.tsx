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
        className="rounded-b-3xl pt-6 pb-8 text-white relative overflow-hidden shadow-highlight"
        style={{
          background: 'linear-gradient(155deg, var(--color-brand-900) 0%, var(--color-brand-700) 60%, var(--color-brand-500) 100%)',
        }}
      >
        {/* Glow animation background */}
        <div className="animate-carGlow absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 space-y-4 px-5">
          {/* Top: Gauge (92px) à esquerda + Label/Valor à direita */}
          <div className="flex items-center justify-between gap-6">
            {/* Circular Gauge (92px) - À ESQUERDA */}
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

            {/* Texto e valor - À DIREITA */}
            <div className="flex-1">
              <div className="text-xs font-black uppercase tracking-widest text-white/80 mb-2">
                LUCRO LÍQUIDO DO MÊS (RENDIMENTO)
              </div>
              <div className="font-black text-white" style={{ fontSize: '38px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                {formatCurrency(profit)}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center px-3 py-1.5 text-xs font-black rounded-full whitespace-nowrap" style={{ background: 'var(--color-mint-300)', color: 'var(--color-ink)' }}>
                  ✓ Positivo
                </span>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-sm font-semibold text-white/90">
            🎉 Resultado excelente! Você teve ótimas vendas neste mês.
          </div>

          {/* Bottom: 3 Small Boxes */}
          <div className="grid grid-cols-3 gap-3 pt-3">
            <div className="rounded-xl p-4 text-center backdrop-blur" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="text-xs text-white/80 font-bold uppercase tracking-wide">VENDAS PAGAS</div>
              <div className="font-black text-white mt-2" style={{ fontSize: '18px', lineHeight: 1 }}>
                {formatCurrency(balances.paidSales || 0)}
              </div>
            </div>
            <div className="rounded-xl p-4 text-center backdrop-blur" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="text-xs text-white/80 font-bold uppercase tracking-wide">SAÍDAS</div>
              <div className="font-black text-white mt-2" style={{ fontSize: '18px', lineHeight: 1 }}>
                {formatCurrency(balances.totalExpenses || 0)}
              </div>
            </div>
            <div className="rounded-xl p-4 text-center backdrop-blur" style={{ background: 'rgba(228,217,195,0.28)' }}>
              <div className="text-xs text-white/80 font-bold uppercase tracking-wide">⏳ A RECEBER</div>
              <div className="font-black text-white mt-2" style={{ fontSize: '18px', lineHeight: 1 }}>
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
          marginTop: '-80px',
          paddingTop: '60px',
        }}
      >

        {/* 2. COMANDA TICKET BUTTON - "LANÇAR PEDIDO" */}
        <button
          onClick={() => onOpenAddModal('venda')}
          className="comanda-btn w-full group relative overflow-hidden active:scale-[0.98]"
          style={{
            background: 'var(--comanda-gradient)',
            borderRadius: '20px',
            padding: '18px 20px',
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

          <div className="relative flex items-center gap-4" style={{ borderLeft: '2px dashed rgba(245,185,198,.5)', paddingLeft: '16px' }}>
            <div className="flex-1">
              <div className="label-sm text-white/80 mb-1" style={{ letterSpacing: '0.24em' }}>NOVA COMANDA</div>
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
          <div className="grid grid-cols-3 gap-4 stagger-children">
            {/* Reposição */}
            <div className="card-interactive bg-white rounded-3xl p-4 text-center">
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
              <div className="text-sm font-black uppercase tracking-wider mt-3" style={{ color: 'var(--color-brand-900)' }}>🔄 REPOSIÇÃO</div>
              <div className="font-marca text-lg font-black mt-2" style={{ color: 'var(--color-ink)', fontSize: '20px' }}>{formatCurrency(balances.reposicao || 1240)}</div>
            </div>

            {/* Mão de Obra */}
            <div className="card-interactive bg-white rounded-3xl p-4 text-center">
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
              <div className="text-sm font-black uppercase tracking-wider mt-3" style={{ color: '#7E4F9E' }}>🟣 MÃO DE OBRA</div>
              <div className="font-marca text-lg font-black mt-2" style={{ color: 'var(--color-ink)', fontSize: '20px' }}>{formatCurrency(balances.labor || 860)}</div>
            </div>

            {/* Custo + Investimento */}
            <div className="card-interactive bg-white rounded-3xl p-4 text-center">
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
              <div className="text-sm font-black uppercase tracking-wider mt-3" style={{ color: '#B08D57' }}>📊 CUSTO + INVEST.</div>
              <div className="font-marca text-lg font-black mt-2" style={{ color: 'var(--color-ink)', fontSize: '20px' }}>{formatCurrency(balances.costs || 620)}</div>
            </div>
          </div>

          {/* Note about cost division */}
          <p className="text-xs text-center" style={{ color: 'var(--color-ink-soft)', marginTop: '8px' }}>
            50% Custo ({formatCurrency((balances.costs || 620) / 2)}) / 50% Invest.
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
