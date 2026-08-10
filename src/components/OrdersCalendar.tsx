import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDateBr } from '../utils/formatters';
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
} from 'lucide-react';

interface OrdersCalendarProps {
  transactions: Transaction[];
  onOpenAddModal: () => void;
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
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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
    <div className="bg-[#F8F1E4] rounded-[32px] p-5 sm:p-6 border border-[#2B2420]/10 shadow-2xs space-y-4">
      {/* Header Month Control */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#2B2420] text-[#F5C6CE] rounded-full shadow-2xs">
            <CalendarIcon className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="font-editorial-bold text-lg sm:text-xl text-[#2B2420] tracking-tight capitalize">
              {monthNames[month]} {year}
            </h2>
            <p className="text-[11px] text-[#2B2420]/70 font-medium">
              {monthSales.length} {monthSales.length === 1 ? 'pedido' : 'pedidos'} no mês
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToday}
            className="px-3 py-1 text-xs font-bold text-[#2B2420] bg-[#F5C6CE] hover:bg-[#E8A0B0] rounded-full transition-all border border-[#E8A0B0]/60 mr-1 shadow-2xs cursor-pointer"
          >
            Hoje
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-full bg-white/80 hover:bg-white text-[#2B2420] border border-white/80 transition-all cursor-pointer shadow-2xs"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-full bg-white/80 hover:bg-white text-[#2B2420] border border-white/80 transition-all cursor-pointer shadow-2xs"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div>
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
          {daysOfWeek.map((day) => (
            <span key={day} className="text-[10px] font-bold text-[#2B2420]/60 uppercase tracking-wider py-1">
              {day}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Leading empty cells */}
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-11 sm:h-12 rounded-2xl bg-white/30" />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayOrders = salesByDate[dayStr] || [];
            const hasOrders = dayOrders.length > 0;
            const isToday = dayStr === todayStr;
            const isSelected = dayStr === selectedDateStr;

            const pendingCount = dayOrders.filter((o) => o.paymentStatus === 'pendente').length;
            const paidCount = dayOrders.filter((o) => o.paymentStatus === 'pago').length;

            return (
              <button
                key={dayStr}
                onClick={() => setSelectedDateStr(isSelected ? null : dayStr)}
                className={`h-11 sm:h-12 rounded-2xl p-1 text-left relative transition-all flex flex-col justify-between items-center cursor-pointer ${
                  isSelected
                    ? 'bg-[#2B2420] text-[#F5C6CE] font-bold shadow-md'
                    : isToday
                    ? 'bg-[#F5C6CE] text-[#2B2420] font-extrabold border border-[#E8A0B0]'
                    : hasOrders
                    ? 'bg-[#F3E3B8] text-[#2B2420] border border-[#E8A0B0]/40 hover:bg-[#F3E3B8]/90'
                    : 'bg-white/80 text-[#2B2420] hover:bg-white border border-white/60'
                }`}
              >
                <span className={`text-xs ${isSelected ? 'text-[#F5C6CE]' : isToday ? 'text-[#2B2420] font-black' : 'font-semibold'}`}>
                  {dayNum}
                </span>

                {/* Badges / Order indicators */}
                {hasOrders && (
                  <div className="flex items-center gap-0.5 mt-auto">
                    {pendingCount > 0 && (
                      <span className={`text-[9px] font-black px-1 rounded-md ${
                        isSelected ? 'bg-[#F5C6CE] text-[#2B2420]' : 'bg-[#2B2420] text-white'
                      }`}>
                        {pendingCount}⏳
                      </span>
                    )}
                    {paidCount > 0 && (
                      <span className={`text-[9px] font-black px-1 rounded-md ${
                        isSelected ? 'bg-emerald-300 text-[#2B2420]' : 'bg-emerald-700 text-white'
                      }`}>
                        {paidCount}✓
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Orders List */}
      {selectedDateStr && (
        <div className="pt-3 border-t border-[#2B2420]/10 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#2B2420] uppercase tracking-wider flex items-center gap-1.5">
              <Cake className="w-4 h-4 text-[#2B2420]" />
              <span>Pedidos para {formatDateBr(selectedDateStr)}</span>
            </h3>

            <button
              onClick={() => setSelectedDateStr(null)}
              className="text-[11px] font-bold text-[#2B2420]/70 hover:text-[#2B2420] bg-white px-2.5 py-1 rounded-full flex items-center gap-1 border border-white shadow-2xs cursor-pointer"
            >
              <X className="w-3 h-3" /> Fechar
            </button>
          </div>

          {/* Orders List for Selected Date */}
          {displayTransactions.length === 0 ? (
            <div className="p-3.5 rounded-2xl bg-white/60 text-center text-xs text-[#2B2420]/70 font-medium">
              Nenhum pedido agendado para {formatDateBr(selectedDateStr)}.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {displayTransactions.map((tx) => {
                const isPending = tx.paymentStatus === 'pendente';

                return (
                  <div
                    key={tx.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                      isPending
                        ? 'bg-[#F3E3B8]/60 border-[#E8A0B0]/40'
                        : 'bg-[#D6E4CC]/60 border-[#D6E4CC]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
                        {isPending ? (
                          <span className="bg-[#2B2420] text-[#F5C6CE] px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> ⏳ Pendente
                          </span>
                        ) : (
                          <span className="bg-emerald-800 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> ✅ Pago
                          </span>
                        )}
                        <span className="font-editorial-bold text-[#2B2420] text-sm truncate">
                          {tx.description}
                        </span>
                      </div>

                      {tx.customerName && (
                        <p className="text-xs font-bold text-[#2B2420] mb-0.5 flex items-center gap-1">
                          👤 Cliente: {tx.customerName}
                        </p>
                      )}

                      <p className="text-[11px] text-[#2B2420]/70 font-medium">
                        📅 Data: <strong className="text-[#2B2420]">{formatDateBr(tx.date)}</strong>
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end shrink-0">
                      <span className="font-numbers font-extrabold text-[#2B2420] text-sm">
                        {formatCurrency(tx.totalValue)}
                      </span>

                      <div className="flex items-center gap-1 mt-1">
                        {onTogglePaymentStatus && (
                          <button
                            onClick={() => onTogglePaymentStatus(tx)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-2xs transition-all flex items-center gap-1 cursor-pointer ${
                              isPending
                                ? 'bg-[#2B2420] text-[#F5C6CE]'
                                : 'bg-white text-[#2B2420] border border-white'
                            }`}
                            title={isPending ? 'Clique para marcar este pedido como PAGO' : 'Clique para mudar este pedido para PENDENTE'}
                          >
                            {isPending ? '👉 Marcar PAGO' : '↩ PENDENTE'}
                          </button>
                        )}
                        {onEditTransaction && (
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1 rounded-lg text-[#2B2420]/60 hover:text-[#2B2420] hover:bg-white/50"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteTransaction && (
                          <button
                            onClick={() => onDeleteTransaction(tx)}
                            className="p-1 rounded-lg text-[#2B2420]/60 hover:text-rose-600 hover:bg-rose-50"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
