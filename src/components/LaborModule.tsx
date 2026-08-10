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
    <div className="space-y-4 animate-fadeIn pb-6">
      
      {/* Module Header Card */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-100 flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Custo de Mão de Obra
          </span>
          <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            {laborTxs.length} {laborTxs.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        <div className="my-1">
          <span className="font-brand text-3xl font-extrabold tracking-tight">
            {formatCurrency(totalLabor)}
          </span>
        </div>
        <p className="text-xs text-purple-100 font-medium">
          Pró-labore próprio, diárias de ajudantes, freelancers e entregadores
        </p>

        <button
          onClick={onOpenAddModal}
          className="mt-4 w-full py-3 px-4 bg-white hover:bg-purple-50 text-purple-900 rounded-2xl font-brand font-bold text-sm shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          Registrar Mão de Obra
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar pro-labore, ajudante, entregador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-2xs"
        />
      </div>

      {/* Labor List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
          Registros de Mão de Obra:
        </h3>

        {filteredLabor.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-2xs">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Nenhum custo de mão de obra cadastrado</p>
            <p className="text-xs text-slate-500 mt-1">
              Importante: Calcule sempre seu próprio pro-labore e o pagamento de ajudantes para saber seu lucro real!
            </p>
          </div>
        ) : (
          filteredLabor.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-purple-200 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-brand font-bold text-slate-900 text-sm truncate">
                    {item.description}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3 text-purple-500" />
                    {getLaborPeriodLabel(item.laborPeriod)}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {formatDateBr(item.date)}
                  </span>
                </div>
              </div>

              {/* Amount & Actions */}
              <div className="text-right flex flex-col items-end shrink-0">
                <span className="font-brand font-extrabold text-base text-purple-600">
                  -{formatCurrency(item.totalValue)}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <button
                    onClick={() => onEditTransaction(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTransaction(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
