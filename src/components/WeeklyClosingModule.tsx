import React, { useState } from 'react';
import { Transaction } from '../types';
import { calculateWeeklyClosing } from '../utils/weeklyCalculator';
import { formatCurrency, formatDateBr, getPaymentMethodLabel } from '../utils/formatters';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Store,
  DollarSign,
  UserCheck,
  Sparkles,
  Truck,
  ShoppingCart,
  Package,
  CheckCircle2,
  Clock,
  Check,
  Undo2,
  AlertCircle,
  Plus,
  ChevronDown,
  ChevronUp,
  Receipt,
  FileText,
} from 'lucide-react';

interface WeeklyClosingModuleProps {
  transactions: Transaction[];
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  onTogglePaymentStatus: (tx: Transaction) => void;
}

export const WeeklyClosingModule: React.FC<WeeklyClosingModuleProps> = ({
  transactions,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onTogglePaymentStatus,
}) => {
  // Reference date for week navigation
  const [refDate, setRefDate] = useState<Date>(new Date());
  // Expanded transaction breakdown IDs
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const summary = calculateWeeklyClosing(transactions, refDate);

  const handlePrevWeek = () => {
    const prev = new Date(refDate);
    prev.setDate(prev.getDate() - 7);
    setRefDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(refDate);
    next.setDate(next.getDate() + 7);
    setRefDate(next);
  };

  const handleResetToCurrentWeek = () => {
    setRefDate(new Date());
  };

  const toggleExpand = (id: string) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header Banner & Week Navigation */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 rounded-xl p-5 text-white shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-300" />
            Fechamento Semanal
          </span>
          {summary.isCurrentWeek ? (
            <span className="bg-semantic-success-400 text-emerald-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-card">
              Semana Atual
            </span>
          ) : (
            <button
              onClick={handleResetToCurrentWeek}
              className="bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full transition-all active:scale-95"
            >
              Ir para Semana Atual
            </button>
          )}
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-xs rounded-lg p-2 border border-white/15">
          <button
            onClick={handlePrevWeek}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
            title="Semana Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center px-2">
            <h2 className="heading-card-sm text-white tracking-tight">
              {summary.formattedRange}
            </h2>
            <p className="text-[11px] text-purple-200 font-medium">
              Segunda-feira a Domingo
            </p>
          </div>

          <button
            onClick={handleNextWeek}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
            title="Próxima Semana"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={onOpenAddModal}
          className="mt-3.5 w-full py-2.5 px-4 bg-white hover:bg-semantic-info-50 text-purple-900 rounded-lg font-brand font-bold text-xs shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Lançar Novo Pedido nesta Semana
        </button>
      </div>

      {/* Main Closing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        
        {/* CARD 1: 💰 Pagamento da Semana (Seu, pessoal) */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-semantic-success-500/80 shadow-card relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-semantic-success-100/50 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-semantic-success-50 border border-semantic-success-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                Pagamento da Semana (Seu, pessoal)
              </span>
            </div>

            <div className="my-2">
              <span className="font-brand font-marca value-lg sm:text-4xl text-emerald-600 block">
                {formatCurrency(summary.pagamentoPessoalTotal)}
              </span>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Valor livre para retirada pessoal (referente aos pedidos pagos da semana).
              </p>
            </div>

            {/* Sub-breakdown: Mão de Obra, Adicionais, Delivery */}
            <div className="mt-4 pt-3.5 border-t border-neutral-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                  Mão de Obra
                </span>
                <span className="font-brand font-bold text-slate-900">
                  {formatCurrency(summary.maoDeObraTotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Adicionais
                </span>
                <span className="font-brand font-bold text-slate-900">
                  {formatCurrency(summary.adicionaisTotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-semantic-warning-600" />
                  Delivery (Taxa de Entrega)
                </span>
                <span className="font-brand font-bold text-slate-900">
                  {formatCurrency(summary.deliveryTotal)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-semantic-success-50 p-2.5 rounded-lg border border-semantic-success-100 text-[11px] text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Mão de Obra + Adicionais + Delivery = {formatCurrency(summary.pagamentoPessoalTotal)}</span>
          </div>
        </div>

        {/* CARD 2: 🏪 Caixa da Confeitaria (Restante) */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-semantic-info-200/90 shadow-card relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-semantic-info-100/50 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-semantic-info-50 border border-semantic-info-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" />
                Caixa da Confeitaria (Restante)
              </span>
            </div>

            <div className="my-2">
              <span className="font-brand font-marca value-lg sm:text-4xl text-indigo-700 block">
                {formatCurrency(summary.caixaConfeitariaTotal)}
              </span>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Dinheiro que permanece no caixa da empresa para reposição e investimentos.
              </p>
            </div>

            {/* Sub-breakdown: Reposição, Custos e Investimento */}
            <div className="mt-4 pt-3.5 border-t border-neutral-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-semantic-warning-600" />
                  Reposição de Insumos
                </span>
                <span className="font-brand font-bold text-slate-900">
                  {formatCurrency(summary.reposicaoTotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-rose-600" />
                  Custos e Investimento
                </span>
                <span className="font-brand font-bold text-slate-900">
                  {formatCurrency(summary.custosEInvestimentoTotal)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-semantic-info-50 p-2.5 rounded-lg border border-semantic-info-100 text-[11px] text-indigo-900 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Reposição + Custos & Investimento = {formatCurrency(summary.caixaConfeitariaTotal)}</span>
          </div>
        </div>

      </div>

      {/* CARD 3: 📊 Faturamento Total da Semana */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-xl p-5 text-white shadow-sm">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-semantic-success-500/20 text-emerald-400 rounded-xl border border-semantic-success-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-200 block">
                Faturamento Total da Semana (Pedidos Pagos)
              </span>
              <p className="text-[10px] text-slate-300 font-medium">
                Soma de Pagamento Pessoal + Caixa da Confeitaria
              </p>
            </div>
          </div>

          <span className="font-brand font-marca value-md sm:text-3xl text-emerald-400">
            {formatCurrency(summary.faturamentoTotalPago)}
          </span>
        </div>

        {/* Verification formula */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-white/5 rounded-xl p-2 border border-white/10">
            <span className="text-[10px] text-emerald-300 block font-medium">Pagamento Pessoal</span>
            <span className="font-bold text-white">{formatCurrency(summary.pagamentoPessoalTotal)}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2 border border-white/10">
            <span className="text-[10px] text-indigo-300 block font-medium">Caixa Confeitaria</span>
            <span className="font-bold text-white">{formatCurrency(summary.caixaConfeitariaTotal)}</span>
          </div>
          <div className="bg-semantic-success-500/10 rounded-xl p-2 border border-semantic-success-500/30">
            <span className="text-[10px] text-emerald-200 block font-bold">Total Conferido</span>
            <span className="font-black text-emerald-400">{formatCurrency(summary.faturamentoTotalPago)}</span>
          </div>
        </div>
      </div>

      {/* Alert for Pending Orders in Week */}
      {summary.pendingCount > 0 && (
        <div className="bg-semantic-warning-50 rounded-lg p-4 border-2 border-semantic-warning-300 text-amber-950 shadow-card space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-semantic-warning-600 shrink-0" />
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wide text-amber-900">
                Atenção: {summary.pendingCount} {summary.pendingCount === 1 ? 'pedido pendente' : 'pedidos pendentes'} nesta semana
              </h4>
              <p className="text-[11px] text-amber-800 font-medium">
                Existe um total de <strong>{formatCurrency(summary.pendingTotalValue)}</strong> em aberto. Quando forem marcados como pagos, entrarão automaticamente neste fechamento.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Orders List for the Selected Week */}
      <div className="bg-white rounded-xl p-4 border border-neutral-200/80 shadow-card space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-purple-600" />
            <h3 className="font-brand font-bold text-sm text-slate-800">
              Pedidos da Semana ({summary.allSalesDetails.length})
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span className="bg-semantic-success-50 text-emerald-700 border border-semantic-success-200 px-2 py-0.5 rounded-full">
              {summary.paidCount} pago{summary.paidCount === 1 ? '' : 's'}
            </span>
            {summary.pendingCount > 0 && (
              <span className="bg-semantic-warning-50 text-amber-800 border border-semantic-warning-200 px-2 py-0.5 rounded-full">
                {summary.pendingCount} pendente{summary.pendingCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>

        {summary.allSalesDetails.length === 0 ? (
          <div className="text-center py-8 px-4 bg-neutral-50/50 rounded-lg border border-dashed border-neutral-200">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">
              Nenhum pedido cadastrado na semana selecionada.
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-3 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-card transition-all inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Lançar Pedido
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {summary.allSalesDetails.map((detail) => {
              const sale = detail.transaction;
              const isExpanded = expandedTxId === sale.id;

              return (
                <div
                  key={sale.id}
                  className={`rounded-lg border transition-all ${
                    detail.isPaid
                      ? 'bg-white border-neutral-200/90 shadow-card'
                      : 'bg-semantic-warning-50/40 border-semantic-warning-200 shadow-card'
                  }`}
                >
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        {/* Status badge */}
                        {detail.isPaid ? (
                          <span className="inline-flex items-center gap-1 bg-semantic-success-100 text-emerald-900 border border-semantic-success-300 px-2 py-0.5 rounded-full text-[11px] font-black">
                            <Check className="w-3 h-3 text-emerald-700" />
                            Pago
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-semantic-warning-100 text-amber-900 border border-semantic-warning-300 px-2 py-0.5 rounded-full text-[11px] font-black">
                            <Clock className="w-3 h-3 text-amber-700" />
                            Pendente
                          </span>
                        )}

                        <span className="font-brand font-bold text-slate-900 text-sm truncate">
                          {sale.description}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="bg-neutral-100 font-semibold px-2 py-0.5 rounded-md text-slate-700">
                          Data: {formatDateBr(sale.date)}
                        </span>
                        <span className="bg-semantic-info-50 text-purple-700 font-bold px-2 py-0.5 rounded-md">
                          {getPaymentMethodLabel(sale.paymentMethod)}
                        </span>
                        <button
                          onClick={() => toggleExpand(sale.id)}
                          className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-0.5 underline decoration-purple-300 underline-offset-2 text-[10px]"
                        >
                          {isExpanded ? 'Ocultar divisão' : 'Ver divisão'}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Actions & Price */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                      
                      {/* Status Toggle Button */}
                      <div>
                        {!detail.isPaid ? (
                          <button
                            onClick={() => onTogglePaymentStatus(sale)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-card active:scale-95 transition-all flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            Marcar como Pago
                          </button>
                        ) : (
                          <button
                            onClick={() => onTogglePaymentStatus(sale)}
                            className="px-2 py-1 rounded-xl bg-neutral-100 hover:bg-semantic-warning-50 text-slate-600 hover:text-amber-800 border border-neutral-200 text-[10px] font-semibold active:scale-95 transition-all flex items-center gap-1"
                          >
                            <Undo2 className="w-3 h-3" />
                            Desmarcar
                          </button>
                        )}
                      </div>

                      <span
                        className={`font-brand font-black text-base ${
                          detail.isPaid ? 'text-emerald-600' : 'text-amber-700'
                        }`}
                      >
                        {detail.isPaid ? '+' : '⏳ '}{formatCurrency(sale.totalValue)}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Breakdown per Sale */}
                  {isExpanded && (
                    <div className="p-3 bg-neutral-50 border-t border-neutral-200/80 rounded-b-2xl text-xs space-y-2">
                      <div className="font-bold text-[10px] uppercase tracking-wider text-slate-500">
                        Divisão deste pedido:
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                        <div className="bg-white p-2 rounded-xl border border-neutral-200">
                          <span className="text-[10px] text-purple-600 font-bold block">Mão de Obra</span>
                          <span className="font-extrabold text-slate-800">{formatCurrency(detail.maoDeObra)}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-neutral-200">
                          <span className="text-[10px] text-blue-600 font-bold block">Adicionais</span>
                          <span className="font-extrabold text-slate-800">{formatCurrency(detail.adicionais)}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-neutral-200">
                          <span className="text-[10px] text-semantic-warning-600 font-bold block">Delivery</span>
                          <span className="font-extrabold text-slate-800">{formatCurrency(detail.delivery)}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-neutral-200">
                          <span className="text-[10px] text-emerald-700 font-bold block">Reposição</span>
                          <span className="font-extrabold text-slate-800">{formatCurrency(detail.reposicao)}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-neutral-200 col-span-2 sm:col-span-1">
                          <span className="text-[10px] text-rose-600 font-bold block">Custos & Invest.</span>
                          <span className="font-extrabold text-slate-800">{formatCurrency(detail.custosEInvestimento)}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-200 flex flex-wrap items-center justify-between text-[11px] font-bold">
                        <span className="text-emerald-700">
                          💰 Seu Pagamento Pessoal: {formatCurrency(detail.pagamentoPessoal)}
                        </span>
                        <span className="text-indigo-700">
                          🏪 Caixa Confeitaria: {formatCurrency(detail.caixaConfeitaria)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

