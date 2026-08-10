import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import {
  formatCurrency,
  formatDateBr,
  getTransactionTypeDetails,
  getPaymentMethodLabel,
  getLaborPeriodLabel,
  getCostCategoryLabel,
} from '../utils/formatters';
import {
  History,
  Search,
  Calendar,
  Trash2,
  Edit3,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
} from 'lucide-react';

interface HistoryModuleProps {
  transactions: Transaction[];
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  onTogglePaymentStatus?: (tx: Transaction) => void;
}

export const HistoryModule: React.FC<HistoryModuleProps> = ({
  transactions,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onTogglePaymentStatus,
}) => {
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Sort transactions chronologically (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateB - dateA; // newest date first
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const filteredTransactions = sortedTransactions.filter((tx) => {
    if (selectedType !== 'todos' && tx.type !== selectedType) {
      return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(term);
      const matchSupplier = tx.supplier?.toLowerCase().includes(term);
      const matchNotes = tx.notes?.toLowerCase().includes(term);
      return matchDesc || matchSupplier || matchNotes;
    }

    return true;
  });

  const exportCsv = () => {
    if (filteredTransactions.length === 0) {
      alert('Nenhum lançamento para exportar.');
      return;
    }

    const headers = ['Data', 'Tipo', 'Descrição', 'Quantidade', 'Valor Total (R$)', 'Detalhe/Fornecedor'];
    const rows = filteredTransactions.map((t) => [
      formatDateBr(t.date),
      getTransactionTypeDetails(t.type).label,
      `"${t.description.replace(/"/g, '""')}"`,
      t.quantity,
      t.totalValue.toFixed(2),
      `"${(t.supplier || getPaymentMethodLabel(t.paymentMethod) || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `docegestao_historico_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-6">
      
      {/* Module Title Banner */}
      <div className="bg-white rounded-3xl p-4 border border-pink-100/80 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="font-brand font-bold text-lg text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-pink-500" />
            Histórico de Lançamentos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredTransactions.length} de {transactions.length} registros no total
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
          title="Exportar Tabela Excel / CSV"
        >
          <FileText className="w-3.5 h-3.5 text-slate-600" />
          Exportar Excel
        </button>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'venda', label: '🟢 Vendas' },
          { id: 'reposicao', label: '🟡 Reposição' },
          { id: 'maodeobra', label: '🟣 Mão de Obra' },
          { id: 'custo', label: '🔴 Custos' },
          { id: 'investimento', label: '🔵 Investimentos' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedType(item.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
              selectedType === item.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filtrar por nome, fornecedor ou observação..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-2xs"
        />
      </div>

      {/* Chronological List */}
      <div className="space-y-2.5">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-2xs">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Nenhum lançamento encontrado</p>
            <p className="text-xs text-slate-500 mt-1">
              Tente alterar os filtros acima ou cadastre um novo movimento!
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const details = getTransactionTypeDetails(tx.type);
            const isPositive = details.isPositive;
            const isVenda = tx.type === 'venda';
            const isPending = isVenda && tx.paymentStatus === 'pendente';

            return (
              <div
                key={tx.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isPending
                    ? 'bg-amber-50/40 border-amber-200/90 shadow-2xs'
                    : 'bg-white border-slate-200/80 shadow-2xs hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Category Badge Icon */}
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${details.badgeBg}`}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-1.5">
                      {isVenda && (
                        isPending ? (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded text-[10px] font-black">
                            ⏳ Pendente
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.2 rounded text-[10px] font-black">
                            ✅ Pago
                          </span>
                        )
                      )}
                      <span className="font-brand font-bold text-slate-900 text-sm truncate">
                        {tx.description}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <span className={`font-bold px-1.5 py-0.2 rounded ${details.badgeBg}`}>
                        {details.label}
                      </span>

                      {tx.type === 'venda' && (
                        <span>• {getPaymentMethodLabel(tx.paymentMethod)}</span>
                      )}
                      {tx.supplier && <span>• {tx.supplier}</span>}
                      {tx.quantity > 1 && <span>• {tx.quantity}x</span>}

                      <span className="text-slate-400">
                        • {formatDateBr(tx.date)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="text-right flex flex-col items-end shrink-0">
                  <span
                    className={`font-brand font-extrabold text-sm sm:text-base ${
                      isPositive ? (isPending ? 'text-amber-700' : 'text-emerald-600') : 'text-slate-800'
                    }`}
                  >
                    {isPositive ? (isPending ? '⏳ ' : '+') : '-'}{formatCurrency(tx.totalValue)}
                  </span>
                  
                  <div className="flex items-center gap-1.5 mt-1">
                    {isVenda && onTogglePaymentStatus && (
                      isPending ? (
                        <button
                          onClick={() => onTogglePaymentStatus(tx)}
                          className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-2xs transition-all"
                          title="Marcar como Pago"
                        >
                          ✓ Pago
                        </button>
                      ) : (
                        <button
                          onClick={() => onTogglePaymentStatus(tx)}
                          className="px-1.5 py-0.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-800 border border-slate-200 text-[10px] transition-all"
                          title="Desmarcar (Voltar a Pendente)"
                        >
                          ↩ Pendente
                        </button>
                      )
                    )}
                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(tx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Excluir Lançamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
