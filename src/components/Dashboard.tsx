import React, { useState } from 'react';
import { Transaction, SummaryTotals, TransactionType, TimePeriod } from '../types';
import { formatCurrency, formatDateBr } from '../utils/formatters';
import { calculateWeeklyBalances } from '../utils/balancesCalculator';
import { ANIMATION_DURATIONS, ANIMATION_EASING } from '../lib/animation-tokens';
import { useCurrency } from '../context/CurrencyContext';
import { useFichasTecnicas } from '../context/FichasTecnicasContext';
import { OrdersCalendar } from './OrdersCalendar';
import { AvatarProfile } from './AvatarProfile';
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
  onOpenProfileModal?: () => void;
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
  onOpenProfileModal,
}) => {
  const { formatCurrency: formatMoney } = useCurrency();
  const { fichas } = useFichasTecnicas();
  const transactionsList = allTransactions.length > 0 ? allTransactions : (recentTransactions || []);
  const balances = calculateWeeklyBalances(transactionsList, fichas);

  // Calculate profit margin percentage (simplified calculation)
  const totalIn = balances.totalPaidSales || 0;
  const totalOut = balances.totalExpensesAmount || 0;
  const profit = Math.max(0, totalIn - totalOut);
  const marginPercent = totalIn > 0 ? Math.round((profit / totalIn) * 100) : 0;

  // Calcular porcentuais por categoria — antes tentava acessar fields que nao existem
  // Agora calcula a partir dos valores reais do objeto CategoryBalance
  const reposicaoPercent = balances.reposicao.accumulatedInflow > 0
    ? Math.round((balances.reposicao.currentBalance / balances.reposicao.accumulatedInflow) * 100)
    : 0;
  const laborPercent = balances.maodeobra.accumulatedInflow > 0
    ? Math.round((balances.maodeobra.currentBalance / balances.maodeobra.accumulatedInflow) * 100)
    : 0;
  const costsPercent = balances.custoEInvestimento.accumulatedInflow > 0
    ? Math.round((balances.custoEInvestimento.currentBalance / balances.custoEInvestimento.accumulatedInflow) * 100)
    : 0;

  return (
    <div className="space-y-0 pb-8 animate-fadeIn">

      {/* 1. PROFIT CARD - Roxo Gradiente (Cabeçalho da Página) */}
      <div
        className="text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
          padding: '20px',
          paddingBottom: '28px',
          // Sangra para cima cobrindo a safe area e devolve o mesmo valor em
          // padding, para que o gradiente seja um só (sem emenda) e o conteudo
          // fique exatamente onde estava. Altura cresce o mesmo tanto que a
          // margem sobe, entao nada abaixo do card se move.
          paddingTop: 'calc(8px + env(safe-area-inset-top, 0px))',
          boxShadow: '0 30px 70px rgba(58,35,80,0.26)',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          // Subtracao, nao multiplicacao: calc(-1 * env(...)) e rejeitado por
          // versoes do WebKit, o que descarta a declaracao inteira e faz o card
          // parar de sangrar para cima.
          marginTop: 'calc(0px - env(safe-area-inset-top, 0px))',
          paddingLeft: 'calc(50vw - 50% + 18px)',
          paddingRight: 'calc(50vw - 50% + 18px)',
          borderRadius: '32px 0px 32px 32px',
          zIndex: 1,
        }}
      >

        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* Header: Logo, Title, Icons */}
          <div className="flex items-center justify-between gap-2">
            {/* Avatar Profile - Circular */}
            <AvatarProfile onClick={onOpenProfileModal} />

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

          {/* Top: Total em Vendas Card */}
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: 'rgba(247,220,225,0.8)', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
              TOTAL EM VENDAS
            </div>
            <div className="text-white" style={{ fontSize: '32px', lineHeight: 1, letterSpacing: '-0.03em', marginTop: '0px', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
              {formatMoney(totalIn)}
            </div>
          </div>

          {/* Bottom: 3 Small Boxes */}
          <div className="flex gap-2">
            <div className="flex-1 rounded-[16px] p-3 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="text-[9px] text-white/75 uppercase tracking-[0.06em]" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}>VENDAS PAGAS</div>
              <div className="text-white mt-1" style={{ fontSize: '15px', lineHeight: 1, fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                {formatMoney(balances.totalPaidSales || 0)}
              </div>
            </div>
            <div className="flex-1 rounded-[16px] p-3 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="text-[9px] text-white/75 uppercase tracking-[0.06em]" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}>SAÍDAS</div>
              <div className="text-white mt-1" style={{ fontSize: '15px', lineHeight: 1, fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                {formatMoney(balances.totalExpensesAmount || 0)}
              </div>
            </div>
            <div className="flex-1 rounded-[16px] p-3 text-center" style={{ background: 'rgba(228,217,195,0.28)' }}>
              <div className="text-[9px] uppercase tracking-[0.06em]" style={{ color: '#F0E2C8', fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}>⏳ A RECEBER</div>
              <div className="text-white mt-1" style={{ fontSize: '15px', lineHeight: 1, fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                {formatMoney(balances.pendingSales || 0)}
              </div>
            </div>
          </div>

          {/* Spacer - maintains layout spacing */}
          <div style={{ height: '44px' }} />
        </div>

        {/* "Carula Confeitaria" Title - Centered on screen, floating */}
        <div
          className="absolute left-1/2 -translate-x-1/2 text-center z-20"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 2px)',
          }}
        >
          <div className="font-serif-display text-[38px] text-white leading-[1.2] tracking-[0.01em]">
            Carula
          </div>
          <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.44em', color: 'rgba(247,220,225,0.78)', marginTop: '3px', paddingLeft: '0.44em', textTransform: 'uppercase', fontFamily: "'Manrope', sans-serif" }}>
            CONFEITARIA
          </div>
        </div>
      </div>

      <div
        className="pb-6 space-y-4"
        style={{
          background: '#F6F2F5',
          position: 'relative',
          zIndex: 50,
          marginTop: '-44px',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          paddingTop: '32px',
          paddingLeft: 'calc(50vw - 50% + 18px)',
          paddingRight: 'calc(50vw - 50% + 18px)',
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
            transformOrigin: 'center',
            position: 'relative',
            zIndex: 10,
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
        <div className="space-y-3 w-full">
          <div>
            <h3 className="font-serif-display text-[23px]" style={{ color: '#241B2B' }}>
              Saldos &amp; Divisão dos Pedidos
            </h3>
            <p className="text-[11px]" style={{ color: '#7A6E80', marginTop: '2px' }}>
              Entradas das vendas pagas − Compras registradas
            </p>
          </div>

          {/* 3 Circular Gauges */}
          <div className="flex gap-3 w-full">
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
                    strokeDasharray={`${145 * (reposicaoPercent / 100)} ${145}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                  {Math.round(reposicaoPercent)}%
                </div>
              </div>
              <div className="text-[9px] uppercase tracking-[0.05em] mt-2" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '24px' }}>
                REPOSIÇÃO
              </div>
              <div className="text-[15px] mt-2" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>{formatMoney(balances.reposicao.currentBalance || 0)}</div>
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
                    strokeDasharray={`${145 * (laborPercent / 100)} ${145}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                  {Math.round(laborPercent)}%
                </div>
              </div>
              <div className="text-[9px] uppercase tracking-[0.05em] mt-2" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '24px' }}>
                MÃO DE OBRA
              </div>
              <div className="text-[15px] mt-2" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>{formatMoney(balances.maodeobra.currentBalance || 0)}</div>
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
                    strokeDasharray={`${145 * (costsPercent / 100)} ${145}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                  {Math.round(costsPercent)}%
                </div>
              </div>
              <div className="text-[9px] uppercase tracking-[0.05em] mt-2" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '24px' }}>
                CUSTO+INV
              </div>
              <div className="text-[15px] mt-2" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>{formatMoney(balances.custoEInvestimento.currentBalance || 0)}</div>
            </div>
          </div>

          {/* Note about cost division */}
          <p className="text-[10px]" style={{ color: '#9A8FA0' }}>
            50% Custo ({formatMoney((balances.custoEInvestimento.currentBalance || 0) / 2)}) / 50% Invest.
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
