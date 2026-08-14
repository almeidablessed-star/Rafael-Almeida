import React, { useState } from 'react';
import { Transaction, CostCategory } from '../types';
import { formatCurrency, formatDateBr, getCostCategoryLabel } from '../utils/formatters';
import { Receipt, Sparkles, Plus, Search, Calendar, Trash2, Edit3, Tag } from 'lucide-react';

interface CostsModuleProps {
  transactions: Transaction[];
  onOpenAddModal: (type?: any) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

export const CostsModule: React.FC<CostsModuleProps> = ({
  transactions,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<'todos' | 'custos' | 'investimentos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter costs and investments
  const costAndInvTxs = transactions.filter(
    (t) => t.type === 'custo' || t.type === 'investimento'
  );

  const totalCustos = costAndInvTxs
    .filter((t) => t.type === 'custo' || t.category === 'fixo' || t.category === 'variavel')
    .reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

  const totalInvestimentos = costAndInvTxs
    .filter((t) => t.type === 'investimento' || t.category === 'investimento')
    .reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

  const filteredItems = costAndInvTxs.filter((item) => {
    const matchesSearch =
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCostCategoryLabel(item.category).toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'custos') {
      return item.type === 'custo' || item.category === 'fixo' || item.category === 'variavel';
    }
    if (activeTab === 'investimentos') {
      return item.type === 'investimento' || item.category === 'investimento';
    }

    return true;
  });

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn pb-6">

      {/* HERO ACTION CARD - Premium Styled */}
      <button
        onClick={() => onOpenAddModal('custo')}
        className="w-full group relative overflow-hidden rounded-3xl transition-all active:scale-95 hover:shadow-highlight"
      >
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#B8D4E8] to-[#A8C4D8] opacity-100 group-hover:opacity-105 transition-opacity" />

        {/* Content */}
        <div className="relative px-6 md:px-8 py-6 md:py-8 flex items-center justify-between gap-6">
          {/* Left: Icon and Text */}
          <div className="flex items-center gap-4 md:gap-6 flex-1">
            <div className="flex-shrink-0 text-4xl md:text-5xl">
              💰
            </div>
            <div className="text-left">
              <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#3A4A5A]/70 mb-1">
                Registrar Despesa
              </p>
              <p className="text-lg md:text-2xl font-brand font-black text-[var(--color-brand-900)]">
                + Novo Custo / Investimento
              </p>
            </div>
          </div>

          {/* Right: Arrow */}
          <div className="flex-shrink-0 text-3xl md:text-4xl text-[var(--color-brand-900)]/60 group-hover:translate-x-1 transition-transform">
            →
          </div>
        </div>

        {/* Subtle shadow inside */}
        <div className="absolute inset-0 pointer-events-none rounded-3xl shadow-inset opacity-0 group-hover:opacity-10 transition-opacity" />
      </button>

      {/* Module Header Cards Grid - Premium Styled */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7">
        {/* Custos Operacionais Card */}
        <div className="bg-gradient-to-r from-[#B8D4E8] via-[#DDE9F5] to-[#B8D4E8] rounded-3xl p-5 md:p-6 text-[var(--color-brand-900)] shadow-sm border border-[#B8D4E8]/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3A4A5A] to-[#5A7A9E]" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-[#3A4A5A] flex items-center gap-1.5">
              <div className="p-2 bg-[#3A4A5A]/15 rounded-lg">
                <Receipt className="w-4 h-4" />
              </div>
              Custos Operacionais
            </span>
          </div>
          <span className="font-numbers text-2xl md:text-3xl font-black tracking-tight block text-[#3A4A5A] mb-1">
            {formatCurrency(totalCustos)}
          </span>
          <p className="text-xs text-[#3A4A5A]/75 font-medium">
            Gás, Energia, Aluguel, Anúncios, Taxas
          </p>
        </div>

        {/* Investimentos Card */}
        <div className="bg-gradient-to-r from-[#C8E6D7] via-[#E5F4F0] to-[#C8E6D7] rounded-3xl p-5 md:p-6 text-[var(--color-brand-900)] shadow-sm border border-[#C8E6D7]/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3A5A4A] to-[#5A8A6F]" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-[#3A5A4A] flex items-center gap-1.5">
              <div className="p-2 bg-[#3A5A4A]/15 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              Investimentos
            </span>
          </div>
          <span className="font-numbers text-2xl md:text-3xl font-black tracking-tight block text-[#3A5A4A] mb-1">
            {formatCurrency(totalInvestimentos)}
          </span>
          <p className="text-xs text-[#3A5A4A]/75 font-medium">
            Batedeiras, Fornos, Reformas, Cursos
          </p>
        </div>
      </div>

      {/* Subcategory Filter Tabs */}
      <div className="flex items-center gap-1 bg-[#E6E1DB] p-1 rounded-lg">
        {[
          { id: 'todos', label: 'Todos os Registros' },
          { id: 'custos', label: 'Apenas Custos' },
          { id: 'investimentos', label: 'Apenas Investimentos' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white text-[var(--color-brand-900)] shadow-card'
                : 'text-[var(--color-brand-700)] hover:text-[var(--color-brand-900)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-brand-700)]" />
        <input
          type="text"
          placeholder="Buscar por gás, energia, batedeira, curso..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E6E1DB] rounded-lg text-xs font-medium text-[var(--color-brand-900)] focus:outline-none focus:ring-2 focus:ring-[#B8D4E8]/40 shadow-card"
        />
      </div>

      {/* Costs & Investments List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-[var(--color-brand-700)] uppercase tracking-wider px-1">
          Lista de Lançamentos:
        </h3>

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-[#E6E1DB] shadow-card">
            <Receipt className="w-10 h-10 text-[#B8D4E8]/40 mx-auto mb-2" />
            <p className="text-sm font-bold text-[var(--color-brand-900)]">Nenhum registro encontrado</p>
            <p className="text-xs text-[var(--color-brand-700)] mt-1">
              Cadastre aqui suas contas de energia, gás, anúncios e compras de novos equipamentos.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isInvestimento =
              item.type === 'investimento' || item.category === 'investimento';

            return (
              <div
                key={item.id}
                className="bg-white p-4 rounded-lg border border-[#E6E1DB] shadow-card hover:border-[#B8D4E8]/40 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-brand font-bold text-[var(--color-brand-900)] text-sm truncate">
                      {item.description}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-brand-700)]">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isInvestimento
                          ? 'bg-[#C8E6D7]/20 text-[#3A5A4A]'
                          : 'bg-[#B8D4E8]/20 text-[#3A4A5A]'
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      {getCostCategoryLabel(item.category)}
                    </span>
                    <span className="flex items-center gap-1 text-[var(--color-brand-700)]">
                      <Calendar className="w-3 h-3" />
                      {formatDateBr(item.date)}
                    </span>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="text-right flex flex-col items-end shrink-0">
                  <span
                    className={`font-brand font-extrabold text-base ${
                      isInvestimento ? 'text-[#3A5A4A]' : 'text-[#3A4A5A]'
                    }`}
                  >
                    -{formatCurrency(item.totalValue)}
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      onClick={() => onEditTransaction(item)}
                      className="p-1.5 rounded-lg text-[var(--color-brand-700)] hover:text-[var(--color-brand-900)] hover:bg-[#E6E1DB] transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(item)}
                      className="p-1.5 rounded-lg text-[var(--color-brand-700)] hover:text-[#C85A54] hover:bg-[#C85A54]/10 transition-colors"
                      title="Excluir Custo/Investimento"
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
