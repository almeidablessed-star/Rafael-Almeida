import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, formatDateBr } from '../utils/formatters';
import { QuotePdfModal } from './QuotePdfModal';
import {
  ShoppingBag,
  PlusCircle,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  Edit3,
  Trash2,
  Filter,
  Calendar,
  Users,
} from 'lucide-react';

interface OrdersModuleProps {
  transactions: Transaction[];
  onOpenAddModal: (type?: TransactionType) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  onTogglePaymentStatus?: (tx: Transaction) => void;
}

export const OrdersModule: React.FC<OrdersModuleProps> = ({
  transactions,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onTogglePaymentStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pago' | 'pendente'>('todos');
  const [quoteTx, setQuoteTx] = useState<Transaction | null>(null);

  // Filter sales/orders only
  const sales = transactions.filter((t) => t.type === 'venda');

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

    const currentStatus = s.paymentStatus || 'pago';
    const matchesStatus =
      statusFilter === 'todos' ? true : currentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Financial calculations
  const totalVendas = sales.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
  const totalPagas = sales
    .filter((s) => (s.paymentStatus || 'pago') === 'pago')
    .reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
  const totalPendentes = sales
    .filter((s) => s.paymentStatus === 'pendente')
    .reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

  const pendingCount = sales.filter((s) => s.paymentStatus === 'pendente').length;
  const paidCount = sales.filter((s) => (s.paymentStatus || 'pago') === 'pago').length;

  return (
    <div className="space-y-4 animate-fadeIn pb-8">
      {/* Module Header Banner */}
      <div className="bg-[#F5D4A8] rounded-2xl p-5 text-[var(--color-ink)] border border-[#F5D4A8]/40 shadow-card relative overflow-hidden flex items-center justify-between">
        <h2 className="font-bold text-2xl sm:text-3xl text-[var(--color-ink)] tracking-tight">
          Pedidos & Encomendas
        </h2>
        <span className="bg-[var(--color-ink)] text-[var(--color-rose-200)] font-medium text-[10px] px-3.5 py-1.5 rounded-full uppercase shrink-0">
          {sales.length} {sales.length === 1 ? 'Pedido' : 'Pedidos'}
        </span>
      </div>

      {/* Summary Cards Row - Premium Style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Vendas */}
        <div className="bg-gradient-to-br from-[#F5D4A8]/30 to-[#F5D4A8]/10 rounded-2xl p-4 border border-[#F5D4A8]/40 shadow-card hover:shadow-card-hover transition-all relative overflow-hidden">
          <div className="flex gap-3 items-start">
            <div className="flex-1 min-w-0">
              <span className="label-sm text-[#6B5A42] block mb-1">Total em Vendas</span>
              <span className="font-numbers font-marca value-md text-[var(--color-brand-900)] block">{formatCurrency(totalVendas)}</span>
              <span className="text-[10px] text-[#6B5A42]/70 font-medium mt-2">{sales.length} encomendas registradas</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#F5D4A8] flex items-center justify-center shrink-0 shadow-sm">
              <ShoppingBag className="w-5 h-5 text-[var(--color-brand-900)]" />
            </div>
          </div>
        </div>

        {/* Vendas Pagas */}
        <div className="bg-gradient-to-br from-[#C8E6D7]/30 to-[#C8E6D7]/10 rounded-2xl p-4 border border-[#C8E6D7]/40 shadow-card-hover hover:shadow-highlight transition-all relative overflow-hidden">
          <div className="flex gap-3 items-start">
            <div className="flex-1 min-w-0">
              <span className="label-sm text-[#3A5A4A] block mb-1">Vendas Pagas</span>
              <span className="font-numbers font-marca value-md text-[#3A5A4A] block">{formatCurrency(totalPagas)}</span>
              <span className="text-[10px] text-[#3A5A4A]/70 font-medium mt-2">{paidCount} {paidCount === 1 ? 'pedido pago' : 'pedidos pagos'}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#C8E6D7] flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-[#3A5A4A]" />
            </div>
          </div>
        </div>

        {/* A Receber */}
        <div className="bg-gradient-to-br from-[#B8D4E8]/30 to-[#B8D4E8]/10 rounded-2xl p-4 border border-[#B8D4E8]/40 shadow-card-hover hover:shadow-highlight transition-all relative overflow-hidden">
          <div className="flex gap-3 items-start">
            <div className="flex-1 min-w-0">
              <span className="label-sm text-[#3A4A5A] block mb-1">A Receber</span>
              <span className="font-numbers font-marca value-md text-[#3A4A5A] block">{formatCurrency(totalPendentes)}</span>
              <span className="text-[10px] text-[#3A4A5A]/70 font-medium mt-2">{pendingCount} {pendingCount === 1 ? 'pedido pendente' : 'pedidos pendentes'}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#B8D4E8] flex items-center justify-center shrink-0 shadow-sm">
              <Clock className="w-5 h-5 text-[#3A4A5A]" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-[var(--color-surface)] p-3.5 rounded-lg border border-[#E6E1DB] shadow-card space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--color-ink)]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome da cliente ou descrição do produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#E6E1DB] rounded-full text-xs font-medium text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-neutral-charcoal/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          <span className="text-[11px] font-bold text-[var(--color-ink)]/70 uppercase mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>

          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'todos'
                ? 'bg-[var(--color-ink)] text-[var(--color-accent-gold)] shadow-card'
                : 'bg-white text-[var(--color-ink)] border border-[#E6E1DB] hover:bg-white/80'
            }`}
          >
            Todos ({sales.length})
          </button>

          <button
            onClick={() => setStatusFilter('pago')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'pago'
                ? 'bg-[#C8E6D7] text-[#3A5A4A] shadow-card'
                : 'bg-white text-[var(--color-brand-900)] border border-[#E6E1DB] hover:bg-white/80'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-[#5A8A6F]" />
            Pagos ({paidCount})
          </button>

          <button
            onClick={() => setStatusFilter('pendente')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'pendente'
                ? 'bg-[var(--color-ink)] text-[var(--color-accent-gold)] shadow-card'
                : 'bg-white text-[var(--color-ink)] border border-[#E6E1DB] hover:bg-white/80'
            }`}
          >
            <Clock className="w-3 h-3 text-semantic-warning" />
            Pendentes ({pendingCount})
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-2.5">
        {filteredSales.length === 0 ? (
          <div className="p-8 rounded-xl bg-white text-center border border-[#E6E1DB] space-y-2">
            <ShoppingBag className="w-8 h-8 text-[var(--color-ink)]/30 mx-auto" />
            <p className="text-xs text-[var(--color-ink)]/70 font-medium">
              Nenhum pedido encontrado.
            </p>
            <button
              onClick={() => onOpenAddModal('venda')}
              className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-accent-gold)] text-xs font-medium rounded-full inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Lançar Novo Pedido
            </button>
          </div>
        ) : (
          filteredSales.map((tx) => {
            const isPending = tx.paymentStatus === 'pendente';

            return (
              <div
                key={tx.id}
                className={`p-4 rounded-xl border shadow-card transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isPending
                    ? 'bg-semantic-warning/20 border-semantic-warning/30'
                    : 'bg-white border-[#E6E1DB] hover:border-semantic-warning/30'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  {/* CLIENT CHIP & STATUS */}
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[var(--color-accent-gold)]/70 border border-[var(--color-accent-gold)]/30 text-[var(--color-ink)] font-black text-xs uppercase shadow-card">
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      CLIENTE: {tx.customerName ? tx.customerName.toUpperCase() : 'CLIENTE CADASTRADO'}
                    </span>

                    {isPending ? (
                      <span className="bg-[#F5D4A8] text-[var(--color-brand-900)] px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pendente
                      </span>
                    ) : (
                      <span className="bg-[#C8E6D7] text-[#3A5A4A] px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Pago
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[var(--color-ink)]/70 font-medium pt-0.5">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 shrink-0" /> Data: <strong className="text-[var(--color-ink)]">{formatDateBr(tx.date)}</strong></span>
                    {tx.paymentMethod && (
                      <span>• Pgto: <strong className="text-[var(--color-ink)] uppercase">{tx.paymentMethod}</strong></span>
                    )}
                  </div>
                </div>

                <div className="text-right flex items-center sm:flex-col sm:items-end justify-between w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E6E1DB]">
                  <span className="font-numbers font-black text-sm text-[var(--color-ink)]">
                    {formatCurrency(tx.totalValue)}
                  </span>

                  <div className="flex items-center gap-1.5 mt-1.5">
                    <button
                      onClick={() => setQuoteTx(tx)}
                      className="px-3 py-1.5 rounded-full bg-[var(--color-ink)] hover:bg-black text-[var(--color-accent-gold)] font-medium text-[11px] shadow-card transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      title="Gerar e Visualizar Orçamento em PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
                      <span>PDF</span>
                    </button>

                    {onTogglePaymentStatus && (
                      isPending ? (
                        <button
                          onClick={() => onTogglePaymentStatus(tx)}
                          className="px-3 py-1.5 rounded-full bg-[#C8E6D7] hover:bg-[#5A8A6F] text-[#3A5A4A] hover:text-white font-bold text-[11px] shadow-card transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                          title="Clique para marcar este pedido como PAGO"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Marcar PAGO</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onTogglePaymentStatus(tx)}
                          className="px-3 py-1.5 rounded-full bg-semantic-warning/20 hover:bg-semantic-warning/30 text-semantic-warning border border-semantic-warning font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                          title="Clique para alterar este pedido para PENDENTE"
                        >
                          <Clock className="w-3.5 h-3.5 text-semantic-warning" />
                          <span>Mudar p/ Pendente</span>
                        </button>
                      )
                    )}

                    {onEditTransaction && (
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 rounded-full text-[var(--color-ink)]/70 hover:text-[var(--color-ink)] hover:bg-white/80 transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {onDeleteTransaction && (
                      <button
                        onClick={() => onDeleteTransaction(tx)}
                        className="p-1.5 rounded-full text-[var(--color-ink)]/70 hover:text-semantic-error hover:bg-semantic-error/10 transition-colors cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PDF QUOTE PREVIEW MODAL */}
      {quoteTx && (
        <QuotePdfModal
          transaction={quoteTx}
          onClose={() => setQuoteTx(null)}
        />
      )}
    </div>
  );
};
