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
  Smartphone,
  Download,
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
  onOpenPwaModal?: () => void;
  onOpenBackupModal?: () => void;
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
  onOpenPwaModal,
  onOpenBackupModal,
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
        className="rounded-b-3xl text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
          padding: '20px',
          boxShadow: '0 30px 70px rgba(58,35,80,0.26)',
        }}
      >

        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* Header: Logo, Title, Icons */}
          <div className="flex items-center justify-between gap-3">
            {/* Logo "C" Badge - 34x34px */}
            <div
              className="flex-shrink-0 w-[34px] h-[34px] rounded-[12px] flex items-center justify-center font-serif-display text-base cursor-pointer"
              style={{
                background: 'rgba(255,255,255,.16)',
                border: '1px solid rgba(255,255,255,.24)',
                color: '#F7DCE1',
                transition: 'background-color 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,.16)';
              }}
            >
              C
            </div>

            {/* "Carula Confeitaria" Title */}
            <div className="flex-1 text-center">
              <div className="font-serif-display text-[32px] text-white leading-[1] tracking-[0.01em]">
                Carula
              </div>
              <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.44em', color: 'rgba(247,220,225,0.78)', marginTop: '3px', paddingLeft: '0.44em', textTransform: 'uppercase' }}>
                CONFEITARIA
              </div>
            </div>

            {/* Action Icons - 32x32px each */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <button
                onClick={onOpenPwaModal}
                className="w-8 h-8 rounded-[11px] text-white flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,.16)',
                  cursor: 'pointer',
                  transition: 'background-color 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,.16)';
                }}
                title="Versão Mobile"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenBackupModal}
                className="w-8 h-8 rounded-[11px] text-white flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,.16)',
                  cursor: 'pointer',
                  transition: 'background-color 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,.16)';
                }}
                title="Baixar Dados"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Top: Gauge (92px) à esquerda + Label/Valor à direita */}
          <div className="flex items-center gap-4">
            {/* Circular Gauge (92px) - À ESQUERDA */}
            <div className="flex-shrink-0 relative w-[92px] h-[92px]">
              <svg width="92" height="92" viewBox="0 0 92 92" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="46" cy="46" r="38" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="9" />
                <circle
                  cx="46" cy="46" r="38" fill="none" stroke="#F5B9C6" strokeWidth="9"
                  strokeDasharray={`${239 * (marginPercent / 100)} ${239}`}
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(245,185,198,0.6))' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center leading-[1]">
                <span className="text-[19px] font-black text-white">{marginPercent}%</span>
                <span className="text-[8px] mt-[3px]" style={{ color: 'rgba(247,220,225,0.75)' }}>margem</span>
              </div>
            </div>

            {/* Texto e valor - À DIREITA */}
            <div className="flex-1">
              <div className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: 'rgba(247,220,225,0.8)', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                LUCRO LÍQUIDO DO MÊS (RENDIMENTO)
              </div>
              <div className="text-white" style={{ fontSize: '32px', lineHeight: 1, letterSpacing: '-0.03em', marginTop: '0px', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                {formatCurrency(profit)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-3 py-1 text-[10px] font-black rounded-full whitespace-nowrap" style={{ background: '#A9D8B8', color: '#26402F' }}>
                  Positivo
                </span>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-[12px] leading-[1.6]" style={{ color: 'rgba(247,220,225,0.84)' }}>
            🎉 <strong style={{ color: '#FFFFFF' }}>Resultado excelente!</strong> Suas vendas superaram todas as despesas e custos por <strong style={{ color: '#FFFFFF' }}>{formatCurrency(profit)}</strong> no período.
          </div>

          {/* Bottom: 3 Small Boxes */}
          <div className="flex gap-2">
            <div className="flex-1 rounded-[16px] p-3 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="text-[9px] text-white/75 uppercase tracking-[0.06em]" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}>VENDAS PAGAS</div>
              <div className="text-white mt-1" style={{ fontSize: '15px', lineHeight: 1, fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                {formatCurrency(balances.paidSales || 0)}
              </div>
            </div>
            <div className="flex-1 rounded-[16px] p-3 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="text-[9px] text-white/75 uppercase tracking-[0.06em]" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}>SAÍDAS</div>
              <div className="text-white mt-1" style={{ fontSize: '15px', lineHeight: 1, fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                {formatCurrency(balances.totalExpenses || 0)}
              </div>
            </div>
            <div className="flex-1 rounded-[16px] p-3 text-center" style={{ background: 'rgba(228,217,195,0.28)' }}>
              <div className="text-[9px] uppercase tracking-[0.06em]" style={{ color: '#F0E2C8', fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}>⏳ A RECEBER</div>
              <div className="text-white mt-1" style={{ fontSize: '15px', lineHeight: 1, fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                {formatCurrency(balances.pendingSales || 0)}
              </div>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={() => onNavigateToTab('saldos')}
            className="w-full text-[12px] uppercase tracking-wide py-3 rounded-[14px]"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.32)',
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 700,
              color: '#FFFFFF',
              transition: 'background-color 0.25s ease, color 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.color = '#3A2350';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
          >
            Ver Detalhamento das Vendas
          </button>
        </div>
      </div>

      {/* Panel Overlay - Sobreposição com border-radius */}
      <div
        className="mx-0 pb-6 space-y-4"
        style={{
          background: '#F6F2F5',
          position: 'relative',
          zIndex: 1,
          marginTop: '-14px',
          paddingTop: '18px',
          paddingLeft: '18px',
          paddingRight: '18px',
          borderRadius: '28px 28px 0 0',
        }}
      >

        {/* 2. COMANDA TICKET BUTTON - "LANÇAR PEDIDO" */}
        <button
          onClick={() => onOpenAddModal('venda')}
          className="w-full relative overflow-hidden transition-all duration-250"
          style={{
            background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)',
            borderRadius: '20px',
            padding: '18px 20px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 14px 30px rgba(58,35,80,0.36)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) rotate(-0.6deg)';
            e.currentTarget.style.boxShadow = '0 22px 42px rgba(58,35,80,0.48)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 14px 30px rgba(58,35,80,0.36)';
          }}
        >
          {/* Cutout circles */}
          <div style={{
            position: 'absolute',
            width: '22px', height: '22px', borderRadius: '50%',
            background: '#F6F2F5',
            left: '-11px', top: '50%', transform: 'translateY(-50%)',
          }} />
          <div style={{
            position: 'absolute',
            width: '22px', height: '22px', borderRadius: '50%',
            background: '#F6F2F5',
            right: '-11px', top: '50%', transform: 'translateY(-50%)',
          }} />

          <div className="relative flex items-center gap-4">
            <div className="flex-1" style={{ paddingLeft: '6px', borderLeft: '2px dashed rgba(245,185,198,0.5)' }}>
              <div className="text-[9px] font-black text-white/80 mb-1" style={{ letterSpacing: '0.24em' }}>NOVA COMANDA</div>
              <div className="font-serif-display text-white" style={{ fontSize: '29px', lineHeight: 1 }}>Lançar Pedido</div>
            </div>
            <div
              className="animate-carFloat flex-shrink-0 w-11 h-11 rounded-[14px] flex items-center justify-center text-2xl font-black"
              style={{
                background: '#F5B9C6',
                color: '#3A2350',
                boxShadow: '0 8px 16px rgba(0,0,0,0.18)',
              }}
            >
              +
            </div>
          </div>

          {/* Sweep animation */}
          <div className="animate-carSweep absolute top-0 left-0 w-[70px] h-full pointer-events-none" style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
          }} />
        </button>

        {/* 3. SALDOS & DIVISÃO DOS PEDIDOS - 3 Medidores */}
        <div className="space-y-3">
          <div>
            <h3 className="font-serif-display text-[23px]" style={{ color: '#241B2B' }}>
              Saldos &amp; Divisão dos Pedidos
            </h3>
            <p className="text-[11px]" style={{ color: '#7A6E80', marginTop: '2px' }}>
              Entradas das vendas pagas − Compras registradas
            </p>
          </div>

          {/* 3 Circular Gauges */}
          <div className="flex gap-3">
            {/* Reposição */}
            <div
              className="flex-1 bg-white rounded-[22px] p-4 text-center transition-all duration-300 cursor-pointer"
              style={{ boxShadow: '0 8px 20px rgba(58,35,80,0.08)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 16px 32px rgba(58,35,80,0.16)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(58,35,80,0.08)';
              }}>
              <div className="relative w-14 h-14 mx-auto">
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="28" cy="28" r="23" fill="none" stroke="#F0E9EE" strokeWidth="6" />
                  <circle
                    cx="28" cy="28" r="23" fill="none" stroke="#C4626F" strokeWidth="6"
                    strokeDasharray={`${145 * (balances.reposicaoPercent / 100 || 0.72)} ${145}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                  {Math.round(balances.reposicaoPercent || 72)}%
                </div>
              </div>
              <div className="text-[9px] uppercase tracking-[0.05em] mt-2" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '24px' }}>
                <span className="text-[22px]" style={{ lineHeight: 1 }}>🔄</span>
                REPOSIÇÃO
              </div>
              <div className="text-[15px] mt-2" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>{formatCurrency(balances.reposicao || 1240)}</div>
            </div>

            {/* Mão de Obra */}
            <div
              className="flex-1 bg-white rounded-[22px] p-4 text-center transition-all duration-300 cursor-pointer"
              style={{ boxShadow: '0 8px 20px rgba(58,35,80,0.08)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 16px 32px rgba(58,35,80,0.16)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(58,35,80,0.08)';
              }}>
              <div className="relative w-14 h-14 mx-auto">
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="28" cy="28" r="23" fill="none" stroke="#F0E9EE" strokeWidth="6" />
                  <circle
                    cx="28" cy="28" r="23" fill="none" stroke="#7E4F9E" strokeWidth="6"
                    strokeDasharray={`${145 * (balances.laborPercent / 100 || 0.48)} ${145}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                  {Math.round(balances.laborPercent || 48)}%
                </div>
              </div>
              <div className="text-[9px] uppercase tracking-[0.05em] mt-2" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '24px' }}>
                <span className="text-[22px]" style={{ lineHeight: 1 }}>👥</span>
                MÃO DE OBRA
              </div>
              <div className="text-[15px] mt-2" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>{formatCurrency(balances.labor || 860)}</div>
            </div>

            {/* Custo + Investimento */}
            <div
              className="flex-1 bg-white rounded-[22px] p-4 text-center transition-all duration-300 cursor-pointer"
              style={{ boxShadow: '0 8px 20px rgba(58,35,80,0.08)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 16px 32px rgba(58,35,80,0.16)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(58,35,80,0.08)';
              }}>
              <div className="relative w-14 h-14 mx-auto">
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="28" cy="28" r="23" fill="none" stroke="#F0E9EE" strokeWidth="6" />
                  <circle
                    cx="28" cy="28" r="23" fill="none" stroke="#B08D57" strokeWidth="6"
                    strokeDasharray={`${145 * (balances.costsPercent / 100 || 0.35)} ${145}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                  {Math.round(balances.costsPercent || 35)}%
                </div>
              </div>
              <div className="text-[9px] uppercase tracking-[0.05em] mt-2" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '24px' }}>
                <span className="text-[22px]" style={{ lineHeight: 1 }}>📊</span>
                CUSTO + INVEST.
              </div>
              <div className="text-[15px] mt-2" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>{formatCurrency(balances.costs || 620)}</div>
            </div>
          </div>

          {/* Note about cost division */}
          <p className="text-[10px]" style={{ color: '#9A8FA0' }}>
            50% Custo ({formatCurrency((balances.costs || 620) / 2)}) / 50% Invest.
          </p>
        </div>

        {/* 4. AGENDA DE PEDIDOS - CALENDAR */}
        <div className="mt-6">
          <OrdersCalendar transactions={transactionsList} />
        </div>
      </div>
    </div>
  );
};
