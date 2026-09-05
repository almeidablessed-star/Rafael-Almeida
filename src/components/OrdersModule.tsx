import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, formatDateBr } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import { getCurrentWeekMonday, getCurrentWeekSunday, filterTransactionsByWeek } from '../utils/weeklyArchiveUtils';
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
  const { formatCurrency: formatMoney } = useCurrency();
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
    .reduce((acc, curr) => {
      const paidAmount = curr.signalValue ? Number(curr.signalValue) : (curr.totalValue || 0);
      return acc + paidAmount;
    }, 0);
  const totalPendentes = sales
    .filter((s) => s.paymentStatus === 'pendente')
    .reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
  const totalAReceber = sales
    .filter((s) => (s.paymentStatus || 'pago') === 'pago' && s.signalValue)
    .reduce((acc, curr) => {
      const remainingAmount = (curr.totalValue || 0) - (curr.signalValue || 0);
      return acc + remainingAmount;
    }, 0);

  const pendingCount = sales.filter((s) => s.paymentStatus === 'pendente').length;
  const paidCount = sales.filter((s) => (s.paymentStatus || 'pago') === 'pago').length;

  return (
    <div className="space-y-4 animate-fadeIn pb-8">
      {/* Header Card — Flutuante com cabeçalho roxo */}
      <div
        className="overflow-hidden shadow-card"
        style={{
          boxShadow: '0 30px 70px rgba(58,35,80,.26)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: '#F6F2F5',
          marginBottom: '-70px',
          paddingBottom: '70px',
        }}
      >
        {/* Header roxo: titulo+selo, total em vendas (texto, sem grafico) e
            os cards de Pagas/A Receber, tudo dentro do mesmo gradiente —
            como a referencia 6A. Antes "Total em Vendas" tinha um donut de
            progresso e os dois cards ficavam brancos soltos no corpo claro;
            a referencia nao tem grafico nenhum ali, e os dois cards vivem
            dentro do roxo com fundo translucido tingido (verde/areia). */}
        <div
          className="px-5 flex flex-col gap-4"
          style={{
            background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
            paddingTop: '24px',
            paddingBottom: '44px',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <span
              className="text-white leading-tight flex-1"
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: '29px',
                lineHeight: '1.1',
              }}
            >
              Pedidos &amp; Encomendas
            </span>

            {/* Selo translucido: contra o roxo do fundo, fica "roxo claro",
                nao mais o salmao solido de antes. */}
            <span
              className="uppercase font-black shrink-0 whitespace-nowrap"
              style={{
                background: 'rgba(255,255,255,.18)',
                border: '1px solid rgba(255,255,255,.28)',
                color: '#FFFFFF',
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

          <div className="flex flex-col gap-1">
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '.14em',
                color: 'rgba(247,220,225,.8)',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              TOTAL EM VENDAS
            </span>
            <span
              style={{
                fontSize: '32px',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-.03em',
                lineHeight: 1,
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              {formatMoney(totalVendas)}
            </span>
            <span style={{ fontSize: '10px', color: 'rgba(247,220,225,.72)', fontFamily: "'Manrope', sans-serif" }}>
              {sales.length} {sales.length === 1 ? 'encomenda registrada' : 'encomendas registradas'}
            </span>
          </div>

          <div className="flex gap-2">
            {/* Vendas Pagas */}
            <div className="flex-1" style={{ background: 'rgba(169,216,184,.22)', borderRadius: '16px', padding: '11px 12px' }}>
              <div style={{ fontSize: '9px', color: '#CDEBD8', fontWeight: 800, letterSpacing: '.06em', fontFamily: "'Manrope', sans-serif" }}>
                ✓ VENDAS PAGAS
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginTop: '3px', fontFamily: "'Manrope', sans-serif" }}>
                {formatMoney(totalPagas)}
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(247,220,225,.7)', marginTop: '2px', fontFamily: "'Manrope', sans-serif" }}>
                {paidCount} {paidCount === 1 ? 'pedido pago' : 'pedidos pagos'}
              </div>
            </div>

            {/* A Receber */}
            <div className="flex-1" style={{ background: 'rgba(228,217,195,.26)', borderRadius: '16px', padding: '11px 12px' }}>
              <div style={{ fontSize: '9px', color: '#F0E2C8', fontWeight: 800, letterSpacing: '.06em', fontFamily: "'Manrope', sans-serif" }}>
                ⏳ A RECEBER (PENDENTES)
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginTop: '3px', fontFamily: "'Manrope', sans-serif" }}>
                {formatMoney(totalPendentes + totalAReceber)}
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(247,220,225,.7)', marginTop: '2px', fontFamily: "'Manrope', sans-serif" }}>
                {pendingCount} {pendingCount === 1 ? 'pedido pendente' : 'pedidos pendentes'}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-4"
          style={{
            marginTop: '-24px',
            background: '#F6F2F5',
            borderRadius: '28px 28px 0 0',
            position: 'relative',
            padding: '20px',
            marginLeft: 'calc(-50vw + 50%)',
            marginRight: 'calc(-50vw + 50%)',
            paddingLeft: 'calc(20px + max(0px, env(safe-area-inset-left)))',
            paddingRight: 'calc(20px + max(0px, env(safe-area-inset-right)))',
            flex: 1,
            paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          }}
        >

      {/* Search & Filters */}
      <div className="flex flex-col gap-[11px]">
        <div className="relative">
          <Search className="w-4 h-4 text-[#A096A6] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome da cliente ou descrição do produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 bg-white rounded-full text-[11px] text-[#A096A6] focus:outline-none focus:ring-2 focus:ring-neutral-charcoal/20"
            style={{
              fontFamily: "'Manrope', sans-serif",
              boxShadow: '0 6px 14px rgba(58,35,80,.07)',
            }}
          />
        </div>

        <div className="flex items-center gap-[14px] overflow-x-auto no-scrollbar" style={{ paddingBottom: '0.25rem', borderBottom: '1px solid rgba(36,27,43,.1)' }}>
          <span className="text-[10px] font-bold text-[#9A8FA0] uppercase flex items-center gap-1" style={{ fontFamily: "'Manrope', sans-serif", letterSpacing: '.06em' }}>
            STATUS:
          </span>

          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'todos'
                ? 'text-[#3A2350] border-b-2 border-[#3A2350]'
                : 'text-[#7A6E80] hover:text-[#3A2350]'
            }`}
            style={{
              fontSize: '12px',
              fontFamily: "'Manrope', sans-serif",
              fontWeight: statusFilter === 'todos' ? 800 : 600,
              background: 'none',
              border: 'none',
              padding: '8px 0',
              marginBottom: statusFilter === 'todos' ? '-1px' : '0',
            }}
          >
            Todos ({sales.length})
          </button>

          <button
            onClick={() => setStatusFilter('pago')}
            className={`text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'pago'
                ? 'text-[#3A2350] border-b-2 border-[#3A2350]'
                : 'text-[#7A6E80] hover:text-[#3A2350]'
            }`}
            style={{
              fontSize: '12px',
              fontFamily: "'Manrope', sans-serif",
              fontWeight: statusFilter === 'pago' ? 800 : 600,
              background: 'none',
              border: 'none',
              padding: '8px 0',
              marginBottom: statusFilter === 'pago' ? '-1px' : '0',
            }}
          >
            Pagos ({paidCount})
          </button>

          <button
            onClick={() => setStatusFilter('pendente')}
            className={`text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'pendente'
                ? 'text-[#3A2350] border-b-2 border-[#3A2350]'
                : 'text-[#7A6E80] hover:text-[#3A2350]'
            }`}
            style={{
              fontSize: '12px',
              fontFamily: "'Manrope', sans-serif",
              fontWeight: statusFilter === 'pendente' ? 800 : 600,
              background: 'none',
              border: 'none',
              padding: '8px 0',
              marginBottom: statusFilter === 'pendente' ? '-1px' : '0',
            }}
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
              className="px-4 py-2 bg-[#6E3F72] text-white text-xs font-medium rounded-full inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#5A2F5E] transition-colors"
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
                className="rounded-3xl transition-all duration-300 cursor-pointer relative overflow-hidden"
                style={{
                  background: isPending ? '#FFFCF6' : '#FFFFFF',
                  boxShadow: '0 8px 20px rgba(58,35,80,.09)',
                }}
                onClick={() => onEditTransaction(tx)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 18px 34px rgba(58,35,80,.18)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(58,35,80,.09)';
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
                    background: isPending ? 'linear-gradient(180deg, #E4D9C3, #B08D57)' : 'linear-gradient(180deg, #8F5A9C, #C4626F)',
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
                <div
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[9px]"
                  style={{ padding: '16px 18px 16px 22px' }}
                >

                  <div className="flex-1 min-w-0 space-y-2">
                    {/* CLIENT CHIP & STATUS */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1 rounded-full" style={{ fontSize: '10px', fontWeight: 800, color: '#3A2350', background: '#F3E9F3', padding: '5px 11px', fontFamily: "'Manrope', sans-serif" }}>
                        👤 CLIENTE: {tx.customerName ? tx.customerName.toUpperCase() : 'CLIENTE'}
                      </span>

                      {isPending ? (
                        <span className="rounded-full flex items-center gap-1" style={{ fontSize: '9px', fontWeight: 800, color: '#5B4A2E', background: '#E4D9C3', padding: '5px 10px', fontFamily: "'Manrope', sans-serif" }}>
                          ⏳ Pendente
                        </span>
                      ) : (
                        <span className="rounded-full flex items-center gap-1" style={{ fontSize: '9px', fontWeight: 800, color: '#26402F', background: '#A9D8B8', padding: '5px 10px', fontFamily: "'Manrope', sans-serif" }}>
                          ✅ Pago
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '10px', color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>
                      📅 Data: <strong style={{ color: '#241B2B' }}>{formatDateBr(tx.date)}</strong> • Pgto: <strong style={{ color: '#241B2B' }}>{tx.paymentMethod || 'N/A'}</strong>
                    </div>
                  </div>

                  <div
                    className="flex flex-row items-center justify-between w-full shrink-0 gap-3 border-t border-dashed border-[rgba(36,27,43,0.14)] pt-[11px] sm:border-t-0 sm:pt-0"
                  >
                    <div className="text-right">
                      <span className="font-black text-[var(--color-ink)]" style={{ fontSize: '17px', fontWeight: 800, color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>
                        {formatMoney(tx.totalValue)}
                      </span>
                      {tx.signalValue && (
                        <div style={{ fontSize: '11px', color: '#7A6E80', fontFamily: "'Manrope', sans-serif", marginTop: '4px' }}>
                          💰 Sinal: {formatMoney(tx.signalValue)} | Restante: {formatMoney((tx.totalValue || 0) - (tx.signalValue || 0))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-[6px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); setQuoteTx(tx); }}
                      className="rounded-full transition-all flex items-center gap-1 cursor-pointer active:scale-95 hover:translate-y-[-2px]"
                      style={{ fontSize: '9px', fontWeight: 800, color: '#F5B9C6', background: '#3A2350', padding: '5px 10px', fontFamily: "'Manrope', sans-serif" }}
                      title="Gerar e Visualizar Orçamento em PDF"
                    >
                      <Printer className="w-3 h-3" style={{ stroke: '#F5B9C6', strokeWidth: 2 }} />
                      <span>PDF</span>
                    </button>

                    {onTogglePaymentStatus && (
                      isPending ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); onTogglePaymentStatus(tx); }}
                          className="rounded-full transition-all flex items-center gap-1 cursor-pointer active:scale-95 hover:translate-y-[-2px]"
                          style={{ fontSize: '10px', fontWeight: 800, color: '#26402F', background: '#A9D8B8', padding: '7px 12px', fontFamily: "'Manrope', sans-serif" }}
                          title="Clique para marcar este pedido como PAGO"
                        >
                          <span>✅ Pago</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); onTogglePaymentStatus(tx); }}
                          className="rounded-full transition-all flex items-center gap-1 cursor-pointer active:scale-95 hover:translate-y-[-2px]"
                          style={{ fontSize: '10px', fontWeight: 700, color: '#5B4A2E', background: '#F0E2C8', padding: '7px 12px', fontFamily: "'Manrope', sans-serif" }}
                          title="Clique para alterar este pedido para PENDENTE"
                        >
                          <span>Pendente</span>
                        </button>
                      )
                    )}

                    {onEditTransaction && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditTransaction(tx); }}
                        className="rounded-full transition-all cursor-pointer"
                        style={{ width: '28px', height: '28px', background: '#F6F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#EFE6F0'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#F6F2F5'}
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" style={{ stroke: '#7A6E80', strokeWidth: 2 }} />
                      </button>
                    )}
                    {onDeleteTransaction && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteTransaction(tx); }}
                        className="rounded-full transition-all cursor-pointer"
                        style={{ width: '28px', height: '28px', background: '#F6F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#FBE9EC'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#F6F2F5'}
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ stroke: '#C4626F', strokeWidth: 2 }} />
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
