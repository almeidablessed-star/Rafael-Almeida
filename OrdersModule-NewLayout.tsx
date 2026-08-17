import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, formatDateBr } from '../utils/formatters';

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

  const sales = transactions.filter((t) => t.type === 'venda');

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

    const currentStatus = s.paymentStatus || 'pago';
    const matchesStatus = statusFilter === 'todos' ? true : currentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
    <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ background: '#F3E3B8', borderRadius: '32px', padding: '20px', color: '#2B2420', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(232,160,176,0.4)' }}>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '28px', fontWeight: 'bold', margin: 0 }}>Pedidos</h2>
        <span style={{ background: '#2B2420', color: '#F5C6CE', fontSize: '10px', padding: '4px 12px', borderRadius: '999px', fontWeight: 700 }}>{sales.length} Pedidos</span>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <div style={{ padding: '16px', borderRadius: '18px', background: 'rgba(245,198,206,0.6)', border: '1px solid rgba(232,160,176,0.6)' }}>
          <div style={{ fontSize: '9px', fontWeight: 800, color: '#2B2420', marginBottom: '6px', textTransform: 'uppercase' }}>Total em Vendas</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#2B2420' }}>{formatCurrency(totalVendas)}</div>
          <div style={{ fontSize: '9px', color: 'rgba(43,36,32,0.7)', marginTop: '4px' }}>{sales.length} encomendas</div>
        </div>

        <div style={{ padding: '16px', borderRadius: '18px', background: 'rgba(214,228,204,0.6)', border: '1px solid rgba(214,228,204,0.8)' }}>
          <div style={{ fontSize: '9px', fontWeight: 800, color: '#2B2420', marginBottom: '6px', textTransform: 'uppercase' }}>✅ Vendas Pagas</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#2B2420' }}>{formatCurrency(totalPagas)}</div>
          <div style={{ fontSize: '9px', color: 'rgba(43,36,32,0.7)', marginTop: '4px' }}>{paidCount} pedidos pagos</div>
        </div>

        <div style={{ padding: '16px', borderRadius: '18px', background: 'rgba(243,227,184,0.6)', border: '1px solid rgba(232,160,176,0.4)' }}>
          <div style={{ fontSize: '9px', fontWeight: 800, color: '#2B2420', marginBottom: '6px', textTransform: 'uppercase' }}>⏳ A Receber</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#2B2420' }}>{formatCurrency(totalPendentes)}</div>
          <div style={{ fontSize: '9px', color: 'rgba(43,36,32,0.7)', marginTop: '4px' }}>{pendingCount} pendentes</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div style={{ background: '#F8F1E4', padding: '14px', borderRadius: '18px', border: '1px solid rgba(43,36,32,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="text"
          placeholder="Buscar por nome ou produto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: '999px', border: '1px solid rgba(43,36,32,0.1)', fontSize: '12px', fontWeight: 500 }}
        />

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {['todos', 'pago', 'pendente'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === status ? '#2B2420' : 'white',
                color: statusFilter === status ? '#F5C6CE' : '#2B2420',
                whiteSpace: 'nowrap'
              }}
            >
              {status === 'todos' && `Todos (${sales.length})`}
              {status === 'pago' && `Pagos (${paidCount})`}
              {status === 'pendente' && `Pendentes (${pendingCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredSales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', background: 'white', borderRadius: '24px', border: '1px solid rgba(43,36,32,0.1)' }}>
            <p style={{ fontSize: '12px', color: 'rgba(43,36,32,0.7)', marginBottom: '12px' }}>Nenhum pedido encontrado</p>
            <button
              onClick={() => onOpenAddModal('venda')}
              style={{ padding: '8px 16px', background: '#2B2420', color: '#F5C6CE', fontSize: '11px', fontWeight: 700, border: 'none', borderRadius: '999px', cursor: 'pointer' }}
            >
              + Novo Pedido
            </button>
          </div>
        ) : (
          filteredSales.map((tx) => {
            const isPending = tx.paymentStatus === 'pendente';
            return (
              <div
                key={tx.id}
                style={{
                  padding: '16px',
                  borderRadius: '20px',
                  background: isPending ? 'rgba(243,227,184,0.6)' : 'white',
                  border: isPending ? '1px solid rgba(232,160,176,0.4)' : '1px solid rgba(43,36,32,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(245,198,206,0.7)', color: '#2B2420', padding: '6px 12px', borderRadius: '999px', fontSize: '10px', fontWeight: 700 }}>
                    👤 {tx.customerName || 'Cliente'}
                  </span>
                  <span style={{ background: isPending ? '#2B2420' : '#4CAF50', color: isPending ? '#F5C6CE' : 'white', padding: '4px 8px', borderRadius: '999px', fontSize: '9px', fontWeight: 700 }}>
                    {isPending ? '⏳ Pendente' : '✅ Pago'}
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: 'rgba(43,36,32,0.7)' }}>
                  📅 {formatDateBr(tx.date)} {tx.paymentMethod && `• ${tx.paymentMethod.toUpperCase()}`}
                </div>

                <div style={{ fontSize: '16px', fontWeight: 800, color: '#2B2420' }}>
                  {formatCurrency(tx.totalValue)}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(43,36,32,0.1)' }}>
                  <button
                    onClick={() => onTogglePaymentStatus?.(tx)}
                    style={{ flex: 1, padding: '8px 12px', background: isPending ? '#4CAF50' : '#FFA500', color: 'white', fontSize: '10px', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    {isPending ? 'Marcar Pago' : 'Pendente'}
                  </button>
                  <button
                    onClick={() => onEditTransaction(tx)}
                    style={{ padding: '8px 12px', background: '#F5C6CE', color: '#2B2420', fontSize: '10px', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDeleteTransaction(tx)}
                    style={{ padding: '8px 12px', background: '#FFE0E0', color: '#C00', fontSize: '10px', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
