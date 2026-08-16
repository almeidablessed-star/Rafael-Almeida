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
      {/* Header Card — Flutuante com cabeçalho roxo */}
      <div
        className="overflow-hidden shadow-card"
        style={{
          boxShadow: '0 30px 70px rgba(58,35,80,.26)',
        }}
      >
        {/* Logo & Branding Strip */}
        <div
          className="px-5 py-5 flex flex-col gap-4 rounded-t-[40px]"
          style={{
            background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
          }}
        >
          {/* Logo Section */}
          <div className="flex items-center justify-between gap-3">
            <div
              className="w-[34px] h-[34px] rounded-[12px] flex items-center justify-center font-serif-display text-base shrink-0"
              style={{
                background: 'rgba(255,255,255,.16)',
                border: '1px solid rgba(255,255,255,.24)',
                color: '#F7DCE1',
                fontFamily: "'Instrument Serif', serif",
              }}
            >
              C
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span
                className="text-white"
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: '32px',
                  letterSpacing: '.01em',
                  lineHeight: 1,
                }}
              >
                Carula
              </span>
              <span
                className="uppercase"
                style={{
                  fontSize: '8px',
                  fontWeight: 700,
                  letterSpacing: '.44em',
                  color: 'rgba(247,220,225,.78)',
                  paddingLeft: '.44em',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Confeitaria
              </span>
            </div>
            <div className="w-[34px] h-[34px]" />
          </div>

          {/* Title & Badge */}
          <div className="flex items-center justify-between gap-3">
            <span
              className="text-white leading-tight"
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: '31px',
                lineHeight: '1.1',
              }}
            >
              Pedidos & Encomendas
            </span>
            <span
              className="uppercase font-black shrink-0 whitespace-nowrap"
              style={{
                background: '#F5B9C6',
                color: '#3A2350',
                fontSize: '10px',
                padding: '6px 12px',
                borderRadius: '999px',
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 800,
              }}
            >
              {sales.length} {sales.length === 1 ? 'Pedido' : 'Pedidos'}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4.5 flex flex-col gap-4"
          style={{
            marginTop: '-14px',
            background: '#F6F2F5',
            borderRadius: '28px 28px 0 0',
            position: 'relative',
          }}
        >

      {/* Summary Cards Row */}
      <div className="flex gap-2" style={{ gap: '8px' }}>
        {/* Total Vendas */}
        <div
          className="flex-1 bg-white rounded-[18px] shadow-card flex flex-col gap-[3px]"
          style={{
            padding: '13px',
            boxShadow: '0 8px 18px rgba(58,35,80,.08)',
            transition: 'transform 0.25s ease'
          }}
        >
          <span
            className="text-[8px] font-black uppercase"
            style={{
              color: '#7A6E80',
              fontFamily: "'Manrope', sans-serif",
              letterSpacing: '.06em',
              minHeight: '20px'
            }}
          >
            TOTAL EM VENDAS
          </span>
          <span
            className="font-black"
            style={{
              fontSize: '16px',
              color: '#241B2B',
              fontFamily: "'Manrope', sans-serif"
            }}
          >
            {formatCurrency(totalVendas)}
          </span>
          <span className="text-xs" style={{ color: '#9A8FA0', fontFamily: "'Manrope', sans-serif" }}>
            {sales.length} encomendas
          </span>
        </div>

        {/* Vendas Pagas */}
        <div
          className="flex-1 bg-white rounded-[18px] shadow-card flex flex-col gap-[3px]"
          style={{
            padding: '13px',
            boxShadow: '0 8px 18px rgba(58,35,80,.08)',
            borderTop: '3px solid #A9D8B8',
            transition: 'transform 0.25s ease'
          }}
        >
          <span
            className="text-[8px] font-black uppercase"
            style={{
              color: '#4C7358',
              fontFamily: "'Manrope', sans-serif",
              letterSpacing: '.06em',
              minHeight: '20px'
            }}
          >
            ✓ VENDAS PAGAS
          </span>
          <span
            className="font-black"
            style={{
              fontSize: '16px',
              color: '#241B2B',
              fontFamily: "'Manrope', sans-serif"
            }}
          >
            {formatCurrency(totalPagas)}
          </span>
          <span className="text-xs" style={{ color: '#9A8FA0', fontFamily: "'Manrope', sans-serif" }}>
            {paidCount} {paidCount === 1 ? 'pago' : 'pagos'}
          </span>
        </div>

        {/* A Receber */}
        <div
          className="flex-1 bg-white rounded-[18px] shadow-card flex flex-col gap-[3px]"
          style={{
            padding: '13px',
            boxShadow: '0 8px 18px rgba(58,35,80,.08)',
            borderTop: '3px solid #E4D9C3',
            transition: 'transform 0.25s ease'
          }}
        >
          <span
            className="text-[8px] font-black uppercase"
            style={{
              color: '#8A7340',
              fontFamily: "'Manrope', sans-serif",
              letterSpacing: '.06em',
              minHeight: '20px'
            }}
          >
            ⏳ A RECEBER (PENDENTES)
          </span>
          <span
            className="font-black"
            style={{
              fontSize: '16px',
              color: '#241B2B',
              fontFamily: "'Manrope', sans-serif"
            }}
          >
            {formatCurrency(totalPendentes)}
          </span>
          <span className="text-xs" style={{ color: '#9A8FA0', fontFamily: "'Manrope', sans-serif" }}>
            {pendingCount} {pendingCount === 1 ? 'pendente' : 'pendentes'}
          </span>
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
                      <span className=" font-black text-xl text-[var(--color-ink)]" style={{ fontSize: '20px' }}>
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
      </div>
    </div>
  );
};
