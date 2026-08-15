import React, { useState } from 'react';
import { Transaction, SummaryTotals, TransactionType } from '../types';
import { formatCurrency } from '../utils/formatters';
import { calculateBalances } from '../utils/balancesCalculator';

interface DashboardProps {
  summary: SummaryTotals;
  allTransactions?: Transaction[];
  onOpenAddModal: (type: TransactionType) => void;
  onNavigateToTab: (tabName: any) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
  onTogglePaymentStatus?: (tx: Transaction) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  allTransactions = [],
  onOpenAddModal,
  onNavigateToTab,
}) => {
  const [showSalesModal, setShowSalesModal] = useState(false);
  const balances = calculateBalances(allTransactions);

  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const dayNum = (i % 28) + 1;
    const hasEvent = dayNum % 3 === 0;
    return {
      day: dayNum,
      hasEvent,
      isPrevMonth: i < 7,
    };
  });

  return (
    <div style={{ background: 'linear-gradient(155deg,#3A2350 0%,#6E3F72 55%,#A85E86 100%)', color: '#FFFFFF', borderRadius: '0 0 40px 40px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '12px', background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Instrument Serif', serif", fontSize: '16px', fontWeight: 'bold' }}>C</div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '32px", fontWeight: 'bold', letterSpacing: '.01em' }}>Carula</div>
          <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '.44em', color: 'rgba(247,220,225,.78)', marginTop: '3px' }}>CONFEITARIA</div>
        </div>
        <div style={{ display: 'flex', gap: '7px' }}>
          <button onClick={() => onOpenAddModal('venda')} style={{ width: '32px', height: '32px', borderRadius: '11px', background: 'rgba(255,255,255,.16)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F7DCE1' }}>📱</button>
          <button style={{ width: '32px', height: '32px', borderRadius: '11px', background: 'rgba(255,255,255,.16)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F7DCE1' }}>⬇️</button>
        </div>
      </div>

      {/* Profit Section */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ position: 'relative', width: '92px', height: '92px', flexShrink: 0 }}>
          <svg width="92" height="92" viewBox="0 0 92 92" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="46" cy="46" r="38" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="9"/>
            <circle cx="46" cy="46" r="38" fill="none" stroke="#F5B9C6" strokeWidth="9" strokeLinecap="round" strokeDasharray="239" strokeDashoffset="98" style={{ filter: 'drop-shadow(0 0 8px rgba(245,185,198,.6))' }}/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '19px', fontWeight: 800 }}>59%</span>
            <span style={{ fontSize: '8px', color: 'rgba(247,220,225,.75)', marginTop: '3px' }}>margem</span>
          </div>
        </div>
        <div style={{ flex: 1, paddingTop: '4px' }}>
          <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.14em', color: 'rgba(247,220,225,.8)' }}>LUCRO LÍQUIDO (RENDIMENTO)</div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '4px', letterSpacing: '-.03em', lineHeight: 1 }}>{formatCurrency(summary.lucroLiquido)}</div>
          <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: 800, color: '#26402F', background: '#A9D8B8', padding: '4px 11px', borderRadius: '999px', marginTop: '8px' }}>{summary.isPositive ? 'Positivo' : 'Atenção'}</div>
        </div>
      </div>

      <p style={{ fontSize: '12px', lineHeight: 1.6, color: 'rgba(247,220,225,.84)', margin: 0 }}>
        🎉 <strong>Resultado excelente!</strong> Suas vendas superaram todas as despesas por <strong>{formatCurrency(summary.lucroLiquido)}</strong> no período.
      </p>

      {/* Sales Summary */}
      <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
        <div style={{ flex: 1, background: 'rgba(255,255,255,.12)', borderRadius: '16px', padding: '11px 12px' }}>
          <div style={{ fontSize: '9px', color: 'rgba(247,220,225,.75)', fontWeight: 700 }}>VENDAS PAGAS</div>
          <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '3px' }}>{formatCurrency(summary.totalVendas)}</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,.12)', borderRadius: '16px', padding: '11px 12px' }}>
          <div style={{ fontSize: '9px', color: 'rgba(247,220,225,.75)', fontWeight: 700 }}>SAÍDAS</div>
          <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '3px' }}>{formatCurrency(summary.totalSaidas)}</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(228,217,195,.28)', borderRadius: '16px', padding: '11px 12px' }}>
          <div style={{ fontSize: '9px', color: '#F0E2C8', fontWeight: 700 }}>⏳ A RECEBER</div>
          <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '3px' }}>{formatCurrency(summary.totalAReceber)}</div>
        </div>
      </div>

      <button onClick={() => setShowSalesModal(true)} style={{ width: '100%', padding: '12px', border: '1px solid rgba(255,255,255,.32)', borderRadius: '14px', background: 'rgba(255,255,255,.12)', color: '#FFFFFF', fontFamily: "'Manrope', sans-serif", fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all .25s' }}>Ver Detalhamento das Vendas</button>
    </div>
  );
};
