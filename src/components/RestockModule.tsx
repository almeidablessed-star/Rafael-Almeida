import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDateBr } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import { ShoppingCart, Plus, Search, Calendar, Trash2, Edit3, Store } from 'lucide-react';

interface RestockModuleProps {
  transactions: Transaction[];
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

export const RestockModule: React.FC<RestockModuleProps> = ({
  transactions,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const { formatCurrency: formatMoney } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter restock only
  const items = transactions.filter((t) => t.type === 'reposicao');

  const filteredItems = items.filter(
    (item) =>
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalSpent = items.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn pb-6">

      {/* HERO ACTION CARD - Premium Styled */}
      <button
        onClick={onOpenAddModal}
        className="w-full group relative overflow-hidden rounded-[22px] transition-all active:scale-95 hover:shadow-highlight"
      >
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#C8E6D7] to-[#B8D6C7] opacity-100 group-hover:opacity-105 transition-opacity" />

        {/* Content */}
        <div className="relative px-6 md:px-8 py-6 md:py-8 flex items-center justify-between gap-6">
          {/* Left: Icon and Text */}
          <div className="flex items-center gap-4 md:gap-6 flex-1">
            <div className="flex-shrink-0 text-4xl md:text-5xl">
              🛒
            </div>
            <div className="text-left">
              <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#3A5A4A]/70 mb-1">
                Registrar Compra
              </p>
              <p className="text-lg md:text-2xl font-brand font-black text-[var(--color-brand-900)]">
                + Cadastrar Insumos
              </p>
            </div>
          </div>

          {/* Right: Arrow */}
          <div className="flex-shrink-0 text-3xl md:text-4xl text-[var(--color-brand-900)]/60 group-hover:translate-x-1 transition-transform">
            →
          </div>
        </div>

        {/* Subtle shadow inside */}
        <div className="absolute inset-0 pointer-events-none rounded-[22px] shadow-inset opacity-0 group-hover:opacity-10 transition-opacity" />
      </button>

      {/* Module Summary Card */}
      <div className="bg-gradient-to-r from-[#C8E6D7] via-[#E5F4F0] to-[#C8E6D7] rounded-[22px] p-5 md:p-6 text-[var(--color-brand-900)] shadow-sm border border-[#C8E6D7]/50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#3A5A4A] flex items-center gap-1.5">
            <div className="p-2 bg-[#3A5A4A]/15 rounded-lg">
              <ShoppingCart className="w-4 h-4" />
            </div>
            Reposição & Estoque
          </span>
          <span className="bg-white/50 px-3 py-1 rounded-full text-[11px] font-bold text-[var(--color-brand-900)] border border-white/60">
            {items.length} {items.length === 1 ? 'compra' : 'compras'}
          </span>
        </div>

        <span className="font-numbers text-3xl md:text-4xl font-black tracking-tight text-[var(--color-brand-900)] block mb-1">
          {formatMoney(totalSpent)}
        </span>
        <p className="text-xs md:text-sm text-[#3A5A4A]/85 font-medium">
          Total gasto em reposição de ingredientes e embalagens no período
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-brand-700)]" />
        <input
          type="text"
          placeholder="Buscar ingrediente ou fornecedor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E6E1DB] rounded-lg text-xs font-medium text-[var(--color-brand-900)] focus:outline-none focus:ring-2 focus:ring-[#C8E6D7]/40 shadow-card"
        />
      </div>

      {/* Restock List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-[var(--color-brand-700)] uppercase tracking-wider px-1">
          Lista de Insumos Comprados:
        </h3>

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-[#E6E1DB] shadow-card">
            <ShoppingCart className="w-10 h-10 text-[#C8E6D7]/40 mx-auto mb-2" />
            <p className="text-sm font-bold text-[var(--color-brand-900)]">Nenhuma compra cadastrada</p>
            <p className="text-xs text-[var(--color-brand-700)] mt-1">
              Registre suas compras de leite condensado, farinha, embalagens e barras de chocolate!
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-lg border border-[#E6E1DB] shadow-card hover:border-[#C8E6D7]/40 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-brand font-bold text-[var(--color-brand-900)] text-sm truncate">
                    {item.description}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-brand-700)]">
                  <span className="bg-[#C8E6D7]/20 text-[#3A5A4A] font-bold px-2 py-0.5 rounded-md">
                    Qtd: {item.quantity}x
                  </span>
                  {item.supplier && (
                    <span className="flex items-center gap-1 bg-[#E6E1DB]/50 font-medium px-2 py-0.5 rounded-md text-[var(--color-brand-900)]">
                      <Store className="w-3 h-3 text-[var(--color-brand-700)]" />
                      {item.supplier}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[var(--color-brand-700)]">
                    <Calendar className="w-3 h-3" />
                    {formatDateBr(item.date)}
                  </span>
                </div>
              </div>

              {/* Amount & Actions */}
              <div className="text-right flex flex-col items-end shrink-0">
                <span className="font-brand font-extrabold text-base text-[#3A5A4A]">
                  -{formatMoney(item.totalValue)}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <button
                    onClick={() => onEditTransaction(item)}
                    className="p-1.5 rounded-lg text-[var(--color-brand-700)] hover:text-[var(--color-brand-900)] hover:bg-[#C8E6D7]/20 transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTransaction(item)}
                    className="p-1.5 rounded-lg text-[var(--color-brand-700)] hover:text-[#C85A54] hover:bg-[#C85A54]/10 transition-colors"
                    title="Excluir Compra"
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
