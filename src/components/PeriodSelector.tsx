import React from 'react';
import { TimePeriod } from '../types';
import { Calendar, ChevronDown } from 'lucide-react';

interface PeriodSelectorProps {
  period: TimePeriod;
  onPeriodChange: (p: TimePeriod) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomDatesChange: (start: string, end: string) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  period,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomDatesChange,
}) => {
  const periods: { id: TimePeriod; label: string }[] = [
    { id: 'hoje', label: 'Hoje' },
    { id: 'semana', label: 'Esta Semana' },
    { id: 'mes', label: 'Este Mês' },
    { id: 'ano', label: 'Este Ano' },
    { id: 'tudo', label: 'Tudo' },
    { id: 'personalizado', label: 'Outro Período' },
  ];

  return (
    <div className="bg-white rounded-2xl p-3 border border-pink-100/70 shadow-xs mb-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-pink-500" />
          Filtrar Período:
        </span>
      </div>

      {/* Period Pills - Scrollable horizontally on small devices */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {periods.map((p) => {
          const isActive = period === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onPeriodChange(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                isActive
                  ? 'bg-pink-500 text-white shadow-xs shadow-pink-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Custom Date Range Picker */}
      {period === 'personalizado' && (
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 animate-fadeIn">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Data Inicial:
            </label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => onCustomDatesChange(e.target.value, customEndDate)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Data Final:
            </label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => onCustomDatesChange(customStartDate, e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
        </div>
      )}
    </div>
  );
};
