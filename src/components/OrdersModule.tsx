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
      {/* Module Header Banner — Roxo Gradiente */}
      <div
        className="rounded-3xl p-6 text-white shadow-highlight relative overflow-hidden flex items-center justify-between"
        style={{
          background: 'linear-gradient(155deg, var(--color-brand-900) 0%, var(--color-brand-700) 60%, var(--color-brand-500) 100%)',
        }}
      >
        <div>
          <h2 className="font-marca text-3xl text-white tracking-tight" style={{ lineHeight: 1 }}>
            Pedidos & Encomendas
          </h2>
          <p className="text-xs text-white/80 font-semibold mt-2">Gestão completa de encomendas</p>
        </div>
        <span className="bg-[var(--color-rose-200)] text-[var(--color-brand-900)] font-black text-sm px-4 py-2.5 rounded-full uppercase shrink-0 shadow-card">
          {sales.length} {sales.length === 1 ? 'Pedido' : 'Pedidos'}
        </span>
      </div>

      {/* Summary Cards Row - Premium Style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Vendas */}
        <div className="bg-white rounded-3xl p-5 shadow-card transition-none hover:shadow-lg hover:-translate-y-1" style={{ transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 180ms ease-in-out' }}>
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--color-ink-soft)] block mb-2">Total em Vendas</span>
              <span className="font-marca text-2xl font-black text-[var(--color-brand-900)] block" style={{ fontSize: '24px' }}>{formatCurrency(totalVendas)}</span>
              <span className="text-xs text-[var(--color-ink-soft)] font-medium mt-3">{sales.length} encomendas</span>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-brand-500)', color: 'white' }}>
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Vendas Pagas */}
        <div className="bg-white rounded-3xl p-5 shadow-card transition-none hover:shadow-lg hover:-translate-y-1" style={{ transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 180ms ease-in-out' }}>
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--color-ink-soft)] block mb-2">Vendas Pagas</span>
              <span className="font-marca text-2xl font-black" style={{ fontSize: '24px', color: 'var(--color-mint-300)' }}>{formatCurrency(totalPagas)}</span>
              <span className="text-xs text-[var(--color-ink-soft)] font-medium mt-3">{paidCount} {paidCount === 1 ? 'pago' : 'pagos'}</span>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-mint-300)' }}>
              <CheckCircle2 className="w-6 h-6" style={{ color: 'var(--color-brand-900)' }} />
            </div>
          </div>
        </div>

        {/* A Receber */}
        <div className="bg-white rounded-3xl p-5 shadow-card transition-none hover:shadow-lg hover:-translate-y-1" style={{ transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 180ms ease-in-out' }}>
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--color-ink-soft)] block mb-2">A Receber</span>
              <span className="font-marca text-2xl font-black" style={{ fontSize: '24px', color: 'var(--color-sand-200)' }}>{formatCurrency(totalPendentes)}</span>
              <span className="text-xs text-[var(--color-ink-soft)] font-medium mt-3">{pendingCount} {pendingCount === 1 ? 'pendente' : 'pendentes'}</span>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-sand-200)' }}>
              <Clock className="w-6 h-6" style={{ color: 'var(--color-brand-900)' }} />
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
                className="bg-white rounded-3xl shadow-card transition-all duration-300 cursor-pointer relative overflow-hidden"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(58,35,80,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(58,35,80,0.08)';
                }}
              >
                {/* Stripe lateral */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '6px',
                    background: isPending ? 'var(--color-sand-200)' : 'var(--color-brand-900)',
                  }}
                />

                {/* Notches circulares laterais */}
                <div style={{
                  position: 'absolute',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: 'var(--color-surface)',
                  left: '-9px', top: '50%', transform: 'translateY(-50%)',
                }} />
                <div style={{
                  position: 'absolute',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: 'var(--color-surface)',
                  right: '-9px', top: '50%', transform: 'translateY(-50%)',
                }} />

                {/* Content */}
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pl-8">

                  <div className="flex-1 min-w-0 space-y-2">
                    {/* CLIENT CHIP & STATUS */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase" style={{ background: 'var(--color-lavender)', color: 'var(--color-brand-900)' }}>
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        {tx.customerName ? tx.customerName.toUpperCase() : 'CLIENTE'}
                      </span>

                      {isPending ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black flex items-center gap-1" style={{ background: 'var(--color-sand-200)', color: 'var(--color-brand-900)' }}>
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-black flex items-center gap-1" style={{ background: 'var(--color-mint-300)', color: 'var(--color-brand-900)' }}>
                          <CheckCircle2 className="w-3 h-3" /> Pago
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--color-ink-soft)] font-medium">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 shrink-0" /> {formatDateBr(tx.date)}</span>
                      {tx.paymentMethod && (
                        <span>Pgto: <strong className="text-[var(--color-ink)]">{tx.paymentMethod}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-end items-start justify-between w-full sm:w-auto shrink-0 gap-3">
                    <div className="text-right">
                      <span className="font-marca font-black text-xl text-[var(--color-ink)]" style={{ fontSize: '20px' }}>
                        {formatCurrency(tx.totalValue)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
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
