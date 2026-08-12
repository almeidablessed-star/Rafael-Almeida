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
      <div className="bg-gradient-to-r from-[#E8B4B8] via-[#F5E5E7] to-[#E8B4B8] rounded-2xl p-5 text-[#3E3430] shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6B3E42] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> Módulo de Vendas
          </span>
          <div className="flex items-center gap-1.5">
            <span className="bg-white/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#3E3430]">
              {breakdown.totalPaidCount} pago{breakdown.totalPaidCount === 1 ? '' : 's'}
            </span>
            {breakdown.totalPendingCount > 0 && (
              <span className="bg-[#F5D4A8]/80 text-[#3E3430] px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {breakdown.totalPendingCount} pendente{breakdown.totalPendingCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>

        <div className="my-1">
          <span className="font-brand text-3xl font-extrabold tracking-tight text-[#3E3430]">
            {formatCurrency(breakdown.totalVendas)}
          </span>
        </div>
        <p className="text-xs text-[#6B3E42]/80 font-medium">
          Total arrecadado (vendas pagas) no período selecionado
        </p>

        {/* Resumo A Receber (se houver vendas pendentes) */}
        {breakdown.totalAReceber > 0 && (
          <div className="mt-3.5 p-3 rounded-2xl bg-[#F5D4A8]/20 backdrop-blur-xs border border-[#F5D4A8]/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#F5D4A8] text-[#3E3430] rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#6B3E42] block">
                  A Receber (Pendentes)
                </span>
                <span className="text-[10px] text-[#6B3E42]/70 font-medium">
                  {breakdown.totalPendingCount} {breakdown.totalPendingCount === 1 ? 'pedido pendente' : 'pedidos pendentes'}
                </span>
              </div>
            </div>
            <span className="font-brand font-black text-lg text-[#3E3430]">
              {formatCurrency(breakdown.totalAReceber)}
            </span>
          </div>
        )}

        <button
          onClick={onOpenAddModal}
          className="mt-4 w-full py-3 px-4 bg-[#F5D4A8] hover:bg-[#C99B6F] text-[#3E3430] rounded-2xl font-brand font-bold text-sm shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          Cadastrar Nova Venda (Entrará como Pendente)
        </button>
      </div>

      {/* Detalhamento de Vendas por Categoria (Apenas Vendas Pagas) */}
      <div className="bg-white rounded-3xl p-4 border border-[#E8B4B8]/30 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8B4B8]/20 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#E8B4B8]/15 text-[#6B3E42] rounded-xl">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-[#3E3430] uppercase tracking-wide">
                Detalhamento das Vendas
              </h3>
              <p className="text-[10px] text-[#5C5550] font-medium">
                Soma de todas as vendas pagas do período por categoria
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#6B3E42] bg-[#E8B4B8]/20 border border-[#E8B4B8]/40 px-2.5 py-1 rounded-full">
            {breakdown.totalPaidCount} {breakdown.totalPaidCount === 1 ? 'paga' : 'pagas'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* 1. Total de Reposição - Premium styled with color strip */}
          <div className="bg-[#C8E6D7]/12 p-5 rounded-2xl border-2 border-[#C8E6D7]/70 flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3A5A4A] to-[#5A8A6F]" />
            <div className="flex items-center gap-2 text-[#3A5A4A] font-black text-[11px] mb-2 uppercase tracking-wide">
              <div className="p-2 bg-[#3A5A4A]/15 rounded-lg">
                <RotateCcw className="w-4 h-4 text-[#5A8A6F]" />
              </div>
              <span>Total de Reposição</span>
            </div>
            <span className="font-numbers font-black text-2xl md:text-3xl text-[#3A5A4A] mb-1">
              {formatCurrency(breakdown.totalReposicao)}
            </span>
            <span className="text-[11px] text-[#3A5A4A]/70 font-medium">
              Insumos e Estoque
            </span>
          </div>

          {/* 2. Total de Mão de Obra - Premium styled with color strip */}
          <div className="bg-[#D4C5E2]/12 p-5 rounded-2xl border-2 border-[#D4C5E2]/70 flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#5A4B6B] to-[#7A6B8B]" />
            <div className="flex items-center gap-2 text-[#5A4B6B] font-black text-[11px] mb-2 uppercase tracking-wide">
              <div className="p-2 bg-[#5A4B6B]/15 rounded-lg">
                <UserCheck className="w-4 h-4 text-[#5A4B6B]" />
              </div>
              <span>Mão de Obra</span>
            </div>
            <span className="font-numbers font-black text-2xl md:text-3xl text-[#5A4B6B] mb-1">
              {formatCurrency(breakdown.totalMaoDeObra)}
            </span>
            <span className="text-[11px] text-[#5A4B6B]/70 font-medium">
              Salário Confeiteira
            </span>
          </div>

          {/* 3. Custos e Investimento - Premium styled with color strip */}
          <div className="bg-[#B8D4E8]/12 p-5 rounded-2xl border-2 border-[#B8D4E8]/70 flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3A4A5A] to-[#5A7A9E]" />
            <div className="flex items-center gap-2 text-[#3A4A5A] font-black text-[11px] mb-2 uppercase tracking-wide">
              <div className="p-2 bg-[#3A4A5A]/15 rounded-lg">
                <Package className="w-4 h-4 text-[#5A7A9E]" />
              </div>
              <span>Custos & Invest.</span>
            </div>
            <span className="font-numbers font-black text-2xl md:text-3xl text-[#3A4A5A] mb-1">
              {formatCurrency(breakdown.totalCustosEInvestimento)}
            </span>
            <span className="text-[11px] text-[#3A4A5A]/70 font-medium">
              Operacional + Reserva
            </span>
          </div>

          {/* 4. Total de Lucro Líquido - Full width highlight */}
          <div className="md:col-span-3 bg-gradient-to-r from-[#E8B4B8] via-[#F5E5E7] to-[#D4C5E2] p-5 md:p-6 rounded-2xl border-2 border-[#E8B4B8]/60 text-[#3E3430] shadow-md relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none" />
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs md:text-sm font-black uppercase tracking-wider text-[#3E3430] flex items-center gap-2 mb-1">
                  <div className="p-2 bg-[#3E3430]/15 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-[#6B3E42]" />
                  </div>
                  Total de Lucro Líquido
                </span>
                <span className="text-[11px] text-[#3E3430]/70 font-medium block">
                  Mão de Obra + Investimento + Taxas (vendas pagas)
                </span>
              </div>
              <span className="font-numbers font-black text-3xl md:text-4xl text-[#3E3430] shrink-0">
                {formatCurrency(breakdown.totalLucroLiquido)}
              </span>
            </div>
          </div>
        </div>

        {/* Informative note about pending sales exclusion */}
        {breakdown.totalPendingCount > 0 && (
          <div className="bg-[#F5D4A8]/20 p-2.5 rounded-2xl border border-[#F5D4A8]/40 text-[#6B5A42] text-[11px] flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-[#C99B6F] shrink-0" />
            <span>
              Existem <strong>{breakdown.totalPendingCount} pedidos pendentes ({formatCurrency(breakdown.totalAReceber)})</strong>. Marque como "Pago" para incluí-los nesses totais.
            </span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C5550]" />
        <input
          type="text"
          placeholder="Buscar venda por produto, forma de pagamento ou status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E6E1DB] rounded-2xl text-xs font-medium text-[#3E3430] focus:outline-none focus:ring-2 focus:ring-[#E8B4B8]/40 shadow-2xs"
        />
      </div>

      {/* Sales List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-[#5C5550] uppercase tracking-wider px-1">
          Lista de Pedidos e Vendas:
        </h3>

        {filteredSales.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-[#E6E1DB] shadow-2xs">
            <TrendingUp className="w-10 h-10 text-[#D4C5E2]/40 mx-auto mb-2" />
            <p className="text-sm font-bold text-[#3E3430]">Nenhuma venda registrada</p>
            <p className="text-xs text-[#5C5550] mt-1">
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
                    ? 'bg-[#F5D4A8]/10 border-[#F5D4A8]/40 shadow-2xs'
                    : 'bg-white border-[#E6E1DB] shadow-2xs hover:border-[#E8B4B8]/50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1.5">
                    {/* Status Badge */}
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 bg-[#F5D4A8]/20 text-[#6B5A42] border border-[#F5D4A8]/40 px-2 py-0.5 rounded-full text-[11px] font-black">
                        <Clock className="w-3 h-3 text-[#C99B6F]" />
                        Pendente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-[#C8E6D7]/20 text-[#3A5A4A] border border-[#C8E6D7]/40 px-2 py-0.5 rounded-full text-[11px] font-black">
                        <Check className="w-3 h-3 text-[#5A8A6F]" />
                        Pago
                      </span>
                    )}

                    <span className="font-brand font-bold text-[#3E3430] text-sm truncate">
                      {sale.description}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5C5550]">
                    <span className="bg-[#E6E1DB]/50 font-semibold px-2 py-0.5 rounded-md text-[#3E3430]">
                      Qtd: {sale.quantity}x
                    </span>
                    <span className="bg-[#D4C5E2]/20 text-[#5A4B6B] font-bold px-2 py-0.5 rounded-md">
                      {getPaymentMethodLabel(sale.paymentMethod)}
                    </span>
                    <span className="flex items-center gap-1 text-[#5C5550]/70">
                      <Calendar className="w-3 h-3" />
                      {formatDateBr(sale.date)}
                    </span>
                  </div>
                </div>

                {/* Amount, Payment Status Toggle Button & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E6E1DB]">

                  {/* Status Toggle Button */}
                  {onTogglePaymentStatus && (
                    <div>
                      {isPending ? (
                        <button
                          onClick={() => onTogglePaymentStatus(sale)}
                          className="px-3 py-1.5 rounded-xl bg-[#C8E6D7] hover:bg-[#5A8A6F] text-[#3E3430] hover:text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                          title="Marcar este pedido como Pago"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Marcar como Pago
                        </button>
                      ) : (
                        <button
                          onClick={() => onTogglePaymentStatus(sale)}
                          className="px-2.5 py-1 rounded-lg bg-[#E6E1DB] hover:bg-[#F5D4A8]/20 text-[#5C5550] hover:text-[#C99B6F] border border-[#E6E1DB] hover:border-[#F5D4A8] font-semibold text-[11px] active:scale-95 transition-all flex items-center gap-1"
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
                        isPending ? 'text-[#C99B6F]' : 'text-[#3A5A4A]'
                      }`}
                    >
                      {isPending ? '' : '+'}{formatCurrency(sale.totalValue)}
                    </span>

                    <div className="flex items-center gap-1 mt-0.5">
                      <button
                        onClick={() => onEditTransaction(sale)}
                        className="p-1.5 rounded-lg text-[#5C5550] hover:text-[#3E3430] hover:bg-[#E6E1DB] transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(sale)}
                        className="p-1.5 rounded-lg text-[#5C5550] hover:text-[#C85A54] hover:bg-[#C85A54]/5 transition-colors"
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
