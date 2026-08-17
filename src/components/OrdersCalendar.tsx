import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDateBr } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  PlusCircle,
  Clock,
  CheckCircle2,
  Edit3,
  Trash2,
  Cake,
  X,
  Users,
} from 'lucide-react';

interface OrdersCalendarProps {
  transactions: Transaction[];
  onOpenAddModal?: () => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
  onTogglePaymentStatus?: (tx: Transaction) => void;
}

export const OrdersCalendar: React.FC<OrdersCalendarProps> = ({
  transactions,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onTogglePaymentStatus,
}) => {
  const { formatCurrency: formatMoney } = useCurrency();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];

  const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  // Calculate calendar grid days
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDateStr(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDateStr(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    const todayStr = new Date().toISOString().split('T')[0];
    setSelectedDateStr(todayStr);
  };

  // Filter only 'venda' (orders) for calendar
  const monthSales = transactions.filter((tx) => {
    if (tx.type !== 'venda') return false;
    if (!tx.date) return false;
    const [y, m] = tx.date.split('-').map(Number);
    return y === year && m === month + 1;
  });

  // Group sales by date string 'YYYY-MM-DD'
  const salesByDate: Record<string, Transaction[]> = {};
  monthSales.forEach((tx) => {
    if (!salesByDate[tx.date]) {
      salesByDate[tx.date] = [];
    }
    salesByDate[tx.date].push(tx);
  });

  // Today string YYYY-MM-DD
  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

  // Transactions to display in list below calendar
  const displayTransactions = selectedDateStr
    ? salesByDate[selectedDateStr] || []
    : monthSales;

  return (
    <div className="bg-white rounded-[22px] p-6 shadow-card space-y-4">
      {/* Title */}
      <div>
        <h2 className="font-serif-display text-[23px]" style={{ color: '#241B2B' }}>
          Agenda de Pedidos
        </h2>
      </div>

      {/* Header Month Control */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-full transition-all hover:-translate-x-0.5"
            style={{ color: 'var(--color-ink)', background: 'transparent' }}
            title="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-base uppercase tracking-widest" style={{ color: 'var(--color-ink)', fontFamily: "'Manrope', sans-serif", fontWeight: 800, flex: 1, textAlign: 'center' }}>
          {monthNames[month]}
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-full transition-all hover:translate-x-0.5"
            style={{ color: 'var(--color-ink)', background: 'transparent' }}
            title="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div>
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
          {daysOfWeek.map((day, idx) => (
            <span key={`day-${idx}`} className="text-xs uppercase tracking-widest py-2" style={{ color: 'var(--color-ink-soft)', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
              {day}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Leading empty cells */}
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-[22px] flex items-center justify-center font-black text-sm" style={{ color: '#D3C9D6', background: 'transparent' }} />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayOrders = salesByDate[dayStr] || [];
            const hasOrders = dayOrders.length > 0;
            const isToday = dayStr === todayStr;

            let bgColor = 'var(--color-surface)';
            let textColor = 'var(--color-ink)';
            let borderStyle = 'none';
            let hoverEffect = 'hover:bg-var(--color-surface)';

            if (isToday) {
              bgColor = 'var(--color-surface)';
              textColor = 'var(--color-brand-700)';
              borderStyle = '1.5px solid var(--color-brand-700)';
            } else if (hasOrders) {
              bgColor = 'linear-gradient(150deg, #8F5A9C, #C4626F)';
              textColor = 'white';
              borderStyle = 'none';
            }

            return (
              <button
                key={dayStr}
                className="aspect-square rounded-[13px] flex items-center justify-center cursor-pointer"
                style={{
                  background: hasOrders ? 'linear-gradient(150deg, #8F5A9C, #C4626F)' : '#F6F2F5',
                  color: hasOrders ? '#FFFFFF' : (isToday ? '#6E3F72' : '#241B2B'),
                  border: isToday ? '1.5px solid #6E3F72' : 'none',
                  fontSize: '12px',
                  fontWeight: isToday || hasOrders ? 800 : 400,
                  boxShadow: hasOrders ? '0 6px 14px rgba(143,90,156,0.34)' : 'none',
                  transition: hasOrders ? 'transform 0.2s ease' : 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (hasOrders) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  } else {
                    e.currentTarget.style.background = '#EFE6F0';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  if (!hasOrders) {
                    e.currentTarget.style.background = '#F6F2F5';
                  }
                }}
                title={`${dayNum} de ${monthNames[month].toLowerCase()}`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="pt-4 border-t flex items-center justify-center gap-6 text-xs uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-brand-700)' }} />
          <span style={{ color: 'var(--color-ink-soft)', fontSize: '10px', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>Hoje</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: 'linear-gradient(150deg, #8F5A9C, #C4626F)' }} />
          <span style={{ color: 'var(--color-ink-soft)', fontSize: '10px', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>Com Pedido</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-ink-soft)' }} />
          <span style={{ color: 'var(--color-ink-soft)', fontSize: '10px', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>Livre</span>
        </div>
      </div>
    </div>
  );
};

