import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDateBr, getPaymentMethodLabel } from '../utils/formatters';
import { calculateSalesBreakdown } from '../utils/salesCalculator';
import {
  TrendingUp,
  Plus,
  Search,
  Calendar,
  Trash2,
  Edit3,
  PieChart,
  RotateCcw,
  UserCheck,
  Package,
  Sparkles,
  CheckCircle2,
  Clock,
  Check,
  Undo2,
  AlertCircle,
} from 'lucide-react';

interface SalesModuleProps {
  transactions: Transaction[];
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  onTogglePaymentStatus?: (tx: Transaction) => void;
}

export const SalesModule: React.FC<SalesModuleProps> = ({
  transactions,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onTogglePaymentStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter sales only
  const sales = transactions.filter((t) => t.type === 'venda');

  const filteredSales = sales.filter(
    (s) =>
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getPaymentMethodLabel(s.paymentMethod).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.paymentStatus || 'pago').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Category Breakdown (calculates only paid sales, sums pending separately in totalAReceber)
  const breakdown = calculateSalesBreakdown(sales);

  return (
    <div className="space-y-4 animate-fadeIn pb-6">
      
      {/* Module Header Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> Módulo de Vendas
          </span>
          <div className="flex items-center gap-1.5">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              {breakdown.totalPaidCount} pago{breakdown.totalPaidCount === 1 ? '' : 's'}
            </span>
            {breakdown.totalPendingCount > 0 && (
              <span className="bg-amber-400/90 text-amber-950 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {breakdown.totalPendingCount} pendente{breakdown.totalPendingCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>

        <div className="my-1">
          <span className="font-brand text-3xl font-extrabold tracking-tight">
            {formatCurrency(breakdown.totalVendas)}
          </span>
        </div>
        <p className="text-xs text-emerald-100 font-medium">
          Total arrecadado (vendas pagas) no período selecionado
        </p>

        {/* Resumo A Receber (se houver vendas pendentes) */}
        {breakdown.totalAReceber > 0 && (
          <div className="mt-3.5 p-3 rounded-2xl bg-amber-500/20 backdrop-blur-xs border border-amber-300/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-400 text-amber-950 rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-amber-200 block">
                  A Receber (Pendentes)
                </span>
                <span className="text-[10px] text-emerald-100 font-medium">
                  {breakdown.totalPendingCount} {breakdown.totalPendingCount === 1 ? 'pedido pendente' : 'pedidos pendentes'}
                </span>
              </div>
            </div>
            <span className="font-brand font-black text-lg text-amber-200">
              {formatCurrency(breakdown.totalAReceber)}
            </span>
          </div>
        )}

        <button
          onClick={onOpenAddModal}
          className="mt-4 w-full py-3 px-4 bg-white hover:bg-emerald-50 text-emerald-800 rounded-2xl font-brand font-bold text-sm shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          Cadastrar Nova Venda (Entrará como Pendente)
        </button>
      </div>

      {/* Detalhamento de Vendas por Categoria (Apenas Vendas Pagas) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                Detalhamento das Vendas
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Soma de todas as vendas pagas do período por categoria
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            {breakdown.totalPaidCount} {breakdown.totalPaidCount === 1 ? 'paga' : 'pagas'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* 1. Total de Reposição */}
          <div className="bg-amber-50/90 p-3 rounded-2xl border border-amber-200/80 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-[11px] mb-1">
              <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>🔄 Total de Reposição</span>
            </div>
            <span className="font-brand font-extrabold text-base text-amber-800">
              {formatCurrency(breakdown.totalReposicao)}
            </span>
            <span className="text-[10px] text-amber-700/90 font-medium mt-0.5">
              Insumos e Estoque
            </span>
          </div>

          {/* 2. Total de Mão de Obra */}
          <div className="bg-purple-50/90 p-3 rounded-2xl border border-purple-200/80 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-purple-900 font-extrabold text-[11px] mb-1">
              <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>🛠️ Total de Mão de Obra</span>
            </div>
            <span className="font-brand font-extrabold text-base text-purple-800">
              {formatCurrency(breakdown.totalMaoDeObra)}
            </span>
            <span className="text-[10px] text-purple-700/90 font-medium mt-0.5">
              Salário Confeiteira
            </span>
          </div>

          {/* 3. Custos e Investimento */}
          <div className="bg-rose-50/90 p-3 rounded-2xl border border-rose-200/80 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-rose-900 font-extrabold text-[11px] mb-1">
              <Package className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>📦 Custos e Investimento</span>
            </div>
            <span className="font-brand font-extrabold text-base text-rose-800">
              {formatCurrency(breakdown.totalCustosEInvestimento)}
            </span>
            <span className="text-[10px] text-rose-700/90 font-medium mt-0.5">
              Custos Operacionais + Reserva
            </span>
          </div>

          {/* 4. Total de Lucro Líquido */}
          <div className="sm:col-span-3 bg-gradient-to-r from-emerald-500 to-teal-600 p-3.5 rounded-2xl text-white shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wide text-emerald-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                ✅ Total de Lucro Líquido
              </span>
              <span className="text-[10px] text-emerald-100/90 font-medium block mt-0.5">
                Mão de Obra + Investimento + Taxas & Adicionais (vendas pagas)
              </span>
            </div>
            <span className="font-brand font-black text-xl text-white">
              {formatCurrency(breakdown.totalLucroLiquido)}
            </span>
          </div>
        </div>

        {/* Informative note about pending sales exclusion */}
        {breakdown.totalPendingCount > 0 && (
          <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Existem <strong>{breakdown.totalPendingCount} pedidos pendentes ({formatCurrency(breakdown.totalAReceber)})</strong>. Marque como "Pago" para incluí-los nesses totais.
            </span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar venda por produto, forma de pagamento ou status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-2xs"
        />
      </div>

      {/* Sales List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
          Lista de Pedidos e Vendas:
        </h3>

        {filteredSales.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-2xs">
            <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Nenhuma venda registrada</p>
            <p className="text-xs text-slate-500 mt-1">
              Toque no botão acima para cadastrar sua primeira venda!
            </p>
          </div>
        ) : (
          filteredSales.map((sale) => {
            const isPending = sale.paymentStatus === 'pendente';

            return (
              <div
                key={sale.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isPending
                    ? 'bg-amber-50/40 border-amber-200/90 shadow-2xs'
                    : 'bg-white border-slate-200/80 shadow-2xs hover:border-emerald-200'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1.5">
                    {/* Status Badge */}
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[11px] font-black">
                        <Clock className="w-3 h-3 text-amber-700" />
                        Pendente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full text-[11px] font-black">
                        <Check className="w-3 h-3 text-emerald-700" />
                        Pago
                      </span>
                    )}

                    <span className="font-brand font-bold text-slate-900 text-sm truncate">
                      {sale.description}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="bg-slate-100 font-semibold px-2 py-0.5 rounded-md text-slate-700">
                      Qtd: {sale.quantity}x
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md">
                      {getPaymentMethodLabel(sale.paymentMethod)}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {formatDateBr(sale.date)}
                    </span>
                  </div>
                </div>

                {/* Amount, Payment Status Toggle Button & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  
                  {/* Status Toggle Button */}
                  {onTogglePaymentStatus && (
                    <div>
                      {isPending ? (
                        <button
                          onClick={() => onTogglePaymentStatus(sale)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                          title="Marcar este pedido como Pago"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Marcar como Pago
                        </button>
                      ) : (
                        <button
                          onClick={() => onTogglePaymentStatus(sale)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-800 border border-slate-200 hover:border-amber-300 font-semibold text-[11px] active:scale-95 transition-all flex items-center gap-1"
                          title="Desmarcar e voltar para Pendente"
                        >
                          <Undo2 className="w-3 h-3" />
                          Desmarcar
                        </button>
                      )}
                    </div>
                  )}

                  <div className="text-right flex flex-col items-end">
                    <span
                      className={`font-brand font-extrabold text-base ${
                        isPending ? 'text-amber-700' : 'text-emerald-600'
                      }`}
                    >
                      {isPending ? '⏳ ' : '+'}{formatCurrency(sale.totalValue)}
                    </span>
                    
                    <div className="flex items-center gap-1 mt-0.5">
                      <button
                        onClick={() => onEditTransaction(sale)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(sale)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Excluir Venda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
