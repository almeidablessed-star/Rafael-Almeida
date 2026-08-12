import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDateBr, getLaborPeriodLabel } from '../utils/formatters';
import { Users, Plus, Search, Calendar, Trash2, Edit3, Clock } from 'lucide-react';

interface LaborModuleProps {
  transactions: Transaction[];
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

export const LaborModule: React.FC<LaborModuleProps> = ({
  transactions,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter labor expenses only
  const laborTxs = transactions.filter((t) => t.type === 'maodeobra');

  const filteredLabor = laborTxs.filter(
    (item) =>
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getLaborPeriodLabel(item.laborPeriod).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLabor = laborTxs.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn pb-6">

      {/* HERO ACTION CARD - Premium Styled */}
      <button
        onClick={onOpenAddModal}
        className="w-full group relative overflow-hidden rounded-2xl transition-all active:scale-95 hover:shadow-lg"
      >
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4C5E2] to-[#C4B5D2] opacity-100 group-hover:opacity-105 transition-opacity" />

        {/* Content */}
        <div className="relative px-6 md:px-8 py-6 md:py-8 flex items-center justify-between gap-6">
          {/* Left: Icon and Text */}
          <div className="flex items-center gap-4 md:gap-6 flex-1">
            <div className="flex-shrink-0 text-4xl md:text-5xl">
              👷
            </div>
            <div className="text-left">
              <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#5A4B6B]/70 mb-1">
                Registrar Produção
              </p>
              <p className="text-lg md:text-2xl font-brand font-black text-[#3E3430]">
                + Registrar Mão de Obra
              </p>
            </div>
          </div>

          {/* Right: Arrow */}
          <div className="flex-shrink-0 text-3xl md:text-4xl text-[#3E3430]/60 group-hover:translate-x-1 transition-transform">
            →
          </div>
        </div>

        {/* Subtle shadow inside */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-inset opacity-0 group-hover:opacity-10 transition-opacity" />
      </button>

      {/* Module Summary Card */}
      <div className="bg-gradient-to-r from-[#D4C5E2] via-[#EDE5F5] to-[#D4C5E2] rounded-2xl p-5 md:p-6 text-[#3E3430] shadow-sm border border-[#D4C5E2]/50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#5A4B6B] flex items-center gap-1.5">
            <div className="p-2 bg-[#5A4B6B]/15 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
            Custo de Mão de Obra
          </span>
          <span className="bg-white/50 px-3 py-1 rounded-full text-[11px] font-bold text-[#3E3430] border border-white/60">
            {laborTxs.length} {laborTxs.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        <span className="font-numbers text-3xl md:text-4xl font-black tracking-tight text-[#3E3430] block mb-1">
          {formatCurrency(totalLabor)}
        </span>
        <p className="text-xs md:text-sm text-[#5A4B6B]/85 font-medium">
          Pró-labore próprio, diárias de ajudantes, freelancers e entregadores
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C5550]" />
        <input
          type="text"
          placeholder="Buscar pro-labore, ajudante, entregador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E6E1DB] rounded-lg text-xs font-medium text-[#3E3430] focus:outline-none focus:ring-2 focus:ring-[#D4C5E2]/40 shadow-xs"
        />
      </div>

      {/* Labor List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-[#5C5550] uppercase tracking-wider px-1">
          Registros de Mão de Obra:
        </h3>

        {filteredLabor.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-[#E6E1DB] shadow-xs">
            <Users className="w-10 h-10 text-[#D4C5E2]/40 mx-auto mb-2" />
            <p className="text-sm font-bold text-[#3E3430]">Nenhum custo de mão de obra cadastrado</p>
            <p className="text-xs text-[#5C5550] mt-1">
              Importante: Calcule sempre seu próprio pro-labore e o pagamento de ajudantes para saber seu lucro real!
            </p>
          </div>
        ) : (
          filteredLabor.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-lg border border-[#E6E1DB] shadow-xs hover:border-[#D4C5E2]/40 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-brand font-bold text-[#3E3430] text-sm truncate">
                    {item.description}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5C5550]">
                  <span className="bg-[#D4C5E2]/20 text-[#5A4B6B] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#5A4B6B]" />
                    {getLaborPeriodLabel(item.laborPeriod)}
                  </span>
                  <span className="flex items-center gap-1 text-[#5C5550]">
                    <Calendar className="w-3 h-3" />
                    {formatDateBr(item.date)}
                  </span>
                </div>
              </div>

              {/* Amount & Actions */}
              <div className="text-right flex flex-col items-end shrink-0">
                <span className="font-brand font-extrabold text-base text-[#5A4B6B]">
                  -{formatCurrency(item.totalValue)}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <button
                    onClick={() => onEditTransaction(item)}
                    className="p-1.5 rounded-lg text-[#5C5550] hover:text-[#3E3430] hover:bg-[#D4C5E2]/20 transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTransaction(item)}
                    className="p-1.5 rounded-lg text-[#5C5550] hover:text-[#C85A54] hover:bg-[#C85A54]/10 transition-colors"
                    title="Excluir Registro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
