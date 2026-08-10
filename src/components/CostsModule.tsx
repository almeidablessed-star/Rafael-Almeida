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
    <div className="space-y-4 animate-fadeIn pb-6">
      
      {/* Module Header Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Custos Operacionais Card */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl p-4 text-white shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-100 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" /> Custos Operacionais
            </span>
          </div>
          <span className="font-brand text-2xl font-extrabold tracking-tight block">
            {formatCurrency(totalCustos)}
          </span>
          <p className="text-[11px] text-rose-100 mt-0.5">
            Gás, Energia, Aluguel, Anúncios, Taxas de cartão
          </p>
        </div>

        {/* Investimentos Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-4 text-white shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Investimentos
            </span>
          </div>
          <span className="font-brand text-2xl font-extrabold tracking-tight block">
            {formatCurrency(totalInvestimentos)}
          </span>
          <p className="text-[11px] text-blue-100 mt-0.5">
            Batedeiras, Fornos, Reformas, Cursos & Utensílios
          </p>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={() => onOpenAddModal('custo')}
        className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-2xl font-brand font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        Cadastrar Novo Custo ou Investimento
      </button>

      {/* Subcategory Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
        {[
          { id: 'todos', label: 'Todos os Registros' },
          { id: 'custos', label: 'Apenas Custos' },
          { id: 'investimentos', label: 'Apenas Investimentos' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-white text-slate-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por gás, energia, batedeira, curso..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-2xs"
        />
      </div>

      {/* Costs & Investments List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
          Lista de Lançamentos:
        </h3>

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-2xs">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Nenhum registro encontrado</p>
            <p className="text-xs text-slate-500 mt-1">
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
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-brand font-bold text-slate-900 text-sm truncate">
                      {item.description}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isInvestimento
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      {getCostCategoryLabel(item.category)}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {formatDateBr(item.date)}
                    </span>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="text-right flex flex-col items-end shrink-0">
                  <span
                    className={`font-brand font-extrabold text-base ${
                      isInvestimento ? 'text-blue-600' : 'text-rose-600'
                    }`}
                  >
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
