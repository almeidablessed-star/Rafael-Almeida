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
  onOpenAddModalWithDate?: (date: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
  onTogglePaymentStatus?: (tx: Transaction) => void;
}

export const OrdersCalendar: React.FC<OrdersCalendarProps> = ({
  transactions,
  onOpenAddModal,
  onOpenAddModalWithDate,
  onEditTransaction,
  onDeleteTransaction,
  onTogglePaymentStatus,
}) => {
  const { formatCurrency: formatMoney } = useCurrency();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [showWithOrdersFilter, setShowWithOrdersFilter] = useState(false);
  const [showFreeFilter, setShowFreeFilter] = useState(false);
  const [detailsDayStr, setDetailsDayStr] = useState<string | null>(null);
  const [confirmEmptyDayStr, setConfirmEmptyDayStr] = useState<string | null>(null);

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
    const dateStr = typeof tx.date === 'string' ? tx.date : (tx.date instanceof Date ? tx.date.toISOString().split('T')[0] : String(tx.date));
    const [y, m] = dateStr.split('-').map(Number);
    return y === year && m === month + 1;
  });

  // Group sales by date string 'YYYY-MM-DD'
  const salesByDate: Record<string, Transaction[]> = {};
  monthSales.forEach((tx) => {
    const dateStr = typeof tx.date === 'string' ? tx.date : (tx.date instanceof Date ? tx.date.toISOString().split('T')[0] : String(tx.date));
    if (!salesByDate[dateStr]) {
      salesByDate[dateStr] = [];
    }
    salesByDate[dateStr].push(tx);
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

            // Determinar cor baseado nos filtros ativos
            let bgColor = '#F6F2F5';
            let textColor = '#241B2B';
            let boxShadowStyle = 'none';
            let fontWeightStyle = 400;

            if (hasOrders && showWithOrdersFilter) {
              bgColor = 'linear-gradient(150deg, #8F5A9C, #C4626F)';
              textColor = '#FFFFFF';
              boxShadowStyle = '0 6px 14px rgba(143,90,156,0.34)';
              fontWeightStyle = 800;
            } else if (!hasOrders && showFreeFilter) {
              bgColor = '#B4E7B4';
              textColor = '#1B5E1B';
              boxShadowStyle = '0 6px 14px rgba(76,175,80,0.34)';
              fontWeightStyle = 800;
            }

            if (isToday) {
              textColor = '#6E3F72';
            }

            const handleDayClick = () => {
              if (hasOrders) {
                // Abrir modal de detalhes
                setDetailsDayStr(dayStr);
              } else {
                // Abrir diálogo de confirmação
                setConfirmEmptyDayStr(dayStr);
              }
            };

            return (
              <button
                key={dayStr}
                onClick={handleDayClick}
                className="aspect-square rounded-[13px] flex items-center justify-center cursor-pointer"
                style={{
                  background: bgColor,
                  color: textColor,
                  border: isToday ? '1.5px solid #6E3F72' : 'none',
                  fontSize: '12px',
                  fontWeight: fontWeightStyle,
                  boxShadow: boxShadowStyle,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                title={`${dayNum} de ${monthNames[month].toLowerCase()}`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="pt-4 border-t flex items-center justify-center gap-6 text-xs uppercase tracking-widest">
        <div
          className="flex items-center gap-2 cursor-pointer opacity-60"
          style={{ opacity: 1 }}
        >
          <div className="w-3 h-3 rounded" style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-brand-700)' }} />
          <span style={{ color: 'var(--color-ink-soft)', fontSize: '10px', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>Hoje</span>
        </div>

        <button
          onClick={() => setShowWithOrdersFilter(!showWithOrdersFilter)}
          className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-100"
          style={{ opacity: showWithOrdersFilter ? 1 : 0.6 }}
        >
          <div className="w-3 h-3 rounded" style={{ background: 'linear-gradient(150deg, #8F5A9C, #C4626F)' }} />
          <span style={{ color: 'var(--color-ink-soft)', fontSize: '10px', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>Com Pedido</span>
        </button>

        <button
          onClick={() => setShowFreeFilter(!showFreeFilter)}
          className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-100"
          style={{ opacity: showFreeFilter ? 1 : 0.6 }}
        >
          <div className="w-3 h-3 rounded" style={{ background: '#B4E7B4' }} />
          <span style={{ color: 'var(--color-ink-soft)', fontSize: '10px', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>Livre</span>
        </button>
      </div>

      {/* Modal: Detalhes dos Pedidos do Dia */}
      {detailsDayStr && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setDetailsDayStr(null)}
        >
          <div
            className="w-full bg-white rounded-[24px] p-6 space-y-4 max-h-[80vh] max-w-md overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b">
              <h3 className="font-serif-display text-lg" style={{ color: '#241B2B' }}>
                Pedidos de {formatDateBr(detailsDayStr)}
              </h3>
              <button
                onClick={() => setDetailsDayStr(null)}
                className="p-1 rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {(salesByDate[detailsDayStr] || []).map((tx) => (
                <div key={tx.id} className="pb-3 border-b last:border-b-0">
                  <p className="font-bold text-sm" style={{ color: '#241B2B' }}>
                    {tx.customerName || 'Cliente não informado'}
                  </p>
                  <p className="text-xs" style={{ color: '#7A6E80' }}>
                    {tx.description}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs font-semibold" style={{ color: '#241B2B' }}>
                      {formatMoney(tx.totalValue)}
                    </p>
                    <p className="text-xs" style={{ color: tx.paymentStatus === 'pago' ? '#4CAF7D' : '#F5A623' }}>
                      {tx.paymentStatus === 'pago' ? 'Pago' : 'Pendente'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Confirmar Lançamento de Pedido em Dia Vazio */}
      {confirmEmptyDayStr && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setConfirmEmptyDayStr(null)}
        >
          <div
            className="bg-white rounded-[24px] p-6 space-y-4 w-[90%] max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif-display text-lg" style={{ color: '#241B2B' }}>
              Lançar Pedido
            </h3>
            <p style={{ color: '#7A6E80', fontSize: '14px' }}>
              Gostaria de lançar um pedido para {formatDateBr(confirmEmptyDayStr)}?
            </p>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setConfirmEmptyDayStr(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#F6F2F5', color: '#241B2B' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setConfirmEmptyDayStr(null);
                  onOpenAddModalWithDate?.(confirmEmptyDayStr);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6E3F72 0%, #3A2350 100%)' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

