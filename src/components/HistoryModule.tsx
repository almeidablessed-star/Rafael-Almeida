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
      <div className="bg-white rounded-xl p-4 border border-[var(--color-accent-gold)]/30 shadow-card flex items-center justify-between">
        <div>
          <h2 className="font-brand font-bold text-lg text-[var(--color-ink)] flex items-center gap-2">
            <History className="w-5 h-5 text-[var(--color-accent-gold)]" />
            Histórico de Lançamentos
          </h2>
          <p className="text-xs text-[#E6E1DB] mt-0.5">
            {filteredTransactions.length} de {transactions.length} registros no total
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="px-3 py-2 bg-[#E6E1DB] hover:bg-[#E6E1DB] text-[var(--color-ink)] rounded-lg text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
          title="Exportar Tabela Excel / CSV"
        >
          <FileText className="w-3.5 h-3.5 text-[#E6E1DB]" />
          Exportar Excel
        </button>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'venda', label: 'Vendas' },
          { id: 'reposicao', label: 'Reposição' },
          { id: 'maodeobra', label: 'Mão de Obra' },
          { id: 'custo', label: 'Custos' },
          { id: 'investimento', label: 'Investimentos' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedType(item.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
              selectedType === item.id
                ? 'bg-[var(--color-ink)] text-white shadow-card'
                : 'bg-white text-[var(--color-ink)] hover:bg-[#E6E1DB] border border-[#E6E1DB]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E6E1DB]" />
        <input
          type="text"
          placeholder="Filtrar por nome, fornecedor ou observação..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E6E1DB] rounded-lg text-xs font-medium text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)] shadow-card"
        />
      </div>

      {/* Chronological List */}
      <div className="space-y-2.5">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-[#E6E1DB] shadow-card">
            <History className="w-10 h-10 text-[#E6E1DB] mx-auto mb-2" />
            <p className="text-sm font-bold text-[var(--color-ink)]">Nenhum lançamento encontrado</p>
            <p className="text-xs text-[#E6E1DB] mt-1">
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
                className={`p-3.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                  isPending
                    ? 'bg-semantic-warning/20 border-semantic-warning/30 shadow-card'
                    : 'bg-white border-[#E6E1DB] shadow-card hover:border-[#E6E1DB]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Category Badge Icon */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${details.badgeBg}`}
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
                          <span className="bg-semantic-warning/20 text-semantic-warning border border-semantic-warning px-1.5 py-0.2 rounded text-[10px] font-black">
                            Pendente
                          </span>
                        ) : (
                          <span className="bg-semantic-success/20 text-semantic-success border border-semantic-success px-1.5 py-0.2 rounded text-[10px] font-black">
                            Pago
                          </span>
                        )
                      )}
                      <span className="font-brand font-bold text-[var(--color-ink)] text-sm truncate">
                        {tx.description}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#E6E1DB] mt-0.5">
                      <span className={`font-bold px-1.5 py-0.2 rounded ${details.badgeBg}`}>
                        {details.label}
                      </span>

                      {tx.type === 'venda' && (
                        <span>• {getPaymentMethodLabel(tx.paymentMethod)}</span>
                      )}
                      {tx.supplier && <span>• {tx.supplier}</span>}
                      {tx.quantity > 1 && <span>• {tx.quantity}x</span>}

                      <span className="text-[#E6E1DB]">
                        • {formatDateBr(tx.date)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="text-right flex flex-col items-end shrink-0">
                  <span
                    className={`font-brand font-extrabold text-sm sm:text-base ${
                      isPositive ? (isPending ? 'text-semantic-warning' : 'text-semantic-success') : 'text-[var(--color-ink)]'
                    }`}
                  >
                    {isPositive ? (isPending ? '' : '+') : '-'}{formatCurrency(tx.totalValue)}
                  </span>

                  <div className="flex items-center gap-1.5 mt-1">
                    {isVenda && onTogglePaymentStatus && (
                      isPending ? (
                        <button
                          onClick={() => onTogglePaymentStatus(tx)}
                          className="px-2 py-0.5 rounded-lg bg-semantic-success hover:bg-semantic-success/90 text-white font-bold text-[10px] shadow-card transition-all"
                          title="Marcar como Pago"
                        >
                          ✓ Pago
                        </button>
                      ) : (
                        <button
                          onClick={() => onTogglePaymentStatus(tx)}
                          className="px-1.5 py-0.5 rounded-lg bg-[#E6E1DB] hover:bg-semantic-warning/20 text-[var(--color-ink)] hover:text-semantic-warning border border-[#E6E1DB] text-[10px] transition-all"
                          title="Desmarcar (Voltar a Pendente)"
                        >
                          ↩ Pendente
                        </button>
                      )
                    )}
                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="p-1.5 rounded-lg text-[#E6E1DB] hover:text-[var(--color-ink)] hover:bg-[#E6E1DB] transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(tx)}
                      className="p-1.5 rounded-lg text-[#E6E1DB] hover:text-semantic-error hover:bg-semantic-error/10 transition-colors"
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
