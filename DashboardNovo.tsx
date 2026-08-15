import React, { useState } from 'react';
import { Transaction, SummaryTotals, TransactionType } from '../types';
import { formatCurrency, formatDateBr } from '../utils/formatters';
import { calculateBalances } from '../utils/balancesCalculator';
import {
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  ShoppingBag,
  TrendingUp,
  X,
  Printer,
  Search,
} from 'lucide-react';
import { QuotePdfModal } from './QuotePdfModal';

interface DashboardNovoProps {
  summary: SummaryTotals;
  recentTransactions?: Transaction[];
  allTransactions?: Transaction[];
  onOpenAddModal: (type: TransactionType) => void;
  onNavigateToTab: (tabName: any) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
  onTogglePaymentStatus?: (tx: Transaction) => void;
}

export const DashboardNovo: React.FC<DashboardNovoProps> = ({
  summary,
  recentTransactions,
  allTransactions = [],
  onOpenAddModal,
  onNavigateToTab,
}) => {
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [quoteTx, setQuoteTx] = useState<Transaction | null>(null);
  const [salesSearch, setSalesSearch] = useState('');

  const transactionsList = allTransactions.length > 0 ? allTransactions : (recentTransactions || []);
  const salesTransactions = transactionsList.filter((tx) => tx.type === 'venda');
  const balances = calculateBalances(transactionsList);

  const filteredSales = salesTransactions.filter(
    (tx) =>
      tx.description.toLowerCase().includes(salesSearch.toLowerCase()) ||
      (tx.customerName && tx.customerName.toLowerCase().includes(salesSearch.toLowerCase()))
  );

  return (
    <div className="space-y-4 pb-6">
      {/* Header com Lucro */}
      <div className="bg-gradient-to-r from-[#3A2350] via-[#6E3F72] to-[#A85E86] rounded-3xl p-5 text-white space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-2xl bg-white/16 border border-white/24 flex items-center justify-center font-serif text-lg cursor-pointer hover:bg-white/30 transition">C</div>
          <div className="text-center flex-1">
            <div className="font-serif text-4xl font-bold tracking-wide">Carula</div>
            <div className="text-xs font-bold tracking-[0.44em] text-white/78 mt-0.5">CONFEITARIA</div>
          </div>
          <div className="flex gap-1.5">
            <div className="w-8 h-8 rounded-2xl bg-white/16 flex items-center justify-center cursor-pointer hover:bg-white/30 transition"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="6.5" y="2" width="11" height="20" rx="3"/><path d="M10.5 5.5h3"/><path d="M12 18.2h.01"/></svg></div>
            <div className="w-8 h-8 rounded-2xl bg-white/16 flex items-center justify-center cursor-pointer hover:bg-white/30 transition"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 3v12m0 0l4-4m-4 4l-4-4M4 19h16"/></svg></div>
          </div>
        </div>

        {/* Profit Ring + Amount */}
        <div className="flex items-start gap-4">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg width="96" height="96" viewBox="0 0 92 92" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="46" cy="46" r="38" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="9"/>
              <circle cx="46" cy="46" r="38" fill="none" stroke="#F5B9C6" strokeWidth="9" strokeLinecap="round" strokeDasharray="239" strokeDashoffset="98" style={{ filter: 'drop-shadow(0 0 8px rgba(245,185,198,.6))' }}/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-black text-xl text-white">59%</span>
              <span className="text-xs text-white/75 mt-1">margem</span>
            </div>
          </div>
          <div className="flex-1 pt-1">
            <div className="text-xs font-bold tracking-widest text-white/80 uppercase">Lucro Líquido (Rendimento)</div>
            <div className="text-3xl font-black text-white mt-1 tracking-tight">R$ 4.980</div>
            <div className="inline-block text-xs font-bold text-emerald-900 bg-emerald-300 px-2.5 py-1 rounded-full mt-2">Positivo</div>
          </div>
        </div>

        <p className="text-sm text-white/85">🎉 <strong>Resultado excelente!</strong> Suas vendas superaram todas as despesas por <strong>R$ 4.980</strong> no período.</p>

        {/* Mini Cards */}
        <div className="flex gap-2 text-xs">
          <div className="flex-1 bg-white/12 rounded-3xl p-2.5">
            <div className="text-white/75 font-bold mb-1">VENDAS PAGAS</div>
            <div className="text-lg font-black text-white">R$ 8.420</div>
          </div>
          <div className="flex-1 bg-white/12 rounded-3xl p-2.5">
            <div className="text-white/75 font-bold mb-1">SAÍDAS</div>
            <div className="text-lg font-black text-white">R$ 3.440</div>
          </div>
          <div className="flex-1 bg-yellow-600/40 rounded-3xl p-2.5">
            <div className="text-yellow-200/90 font-bold mb-1">⏳ A RECEBER</div>
            <div className="text-lg font-black text-white">R$ 1.150</div>
          </div>
        </div>

        <button className="w-full py-3 border border-white/32 rounded-3xl text-white font-bold text-sm bg-white/12 hover:bg-white hover:text-[#3A2350] transition">Ver Detalhamento das Vendas</button>
      </div>

      {/* New Order Button */}
      <button
        onClick={() => onOpenAddModal('venda')}
        className="relative w-full overflow-hidden bg-gradient-to-r from-[#3A2350] via-[#6E3F72] to-[#A85E86] rounded-3xl p-5 text-white font-serif text-2xl font-bold flex items-center justify-between gap-4 shadow-xl hover:shadow-2xl transition active:scale-95"
      >
        <span className="absolute -left-3 top-1/2 w-6 h-6 rounded-full bg-white/20 -translate-y-1/2"/>
        <span className="absolute -right-3 top-1/2 w-6 h-6 rounded-full bg-white/20 -translate-y-1/2"/>
        <div className="flex flex-col items-start gap-1 pl-1 border-l-2 border-dashed border-white/50">
          <span className="text-xs font-bold tracking-widest text-white/80">NOVA COMANDA</span>
          <span className="font-serif text-2xl">+ Lançar Pedido</span>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-[#F5B9C6] flex items-center justify-center flex-shrink-0 shadow-lg">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3A2350" strokeWidth="2.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </div>
        <span className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/22 to-transparent animate-pulse"/>
      </button>

      {/* Saldos Cards */}
      <div>
        <div className="mb-3">
          <h3 className="font-serif text-2xl text-slate-900">Saldos & Divisão</h3>
          <p className="text-xs text-slate-600 mt-0.5">Entradas das vendas pagas − Compras registradas</p>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-3xl p-4 shadow-md flex flex-col items-center gap-2 text-center">
            <div className="relative w-14 h-14">
              <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="28" cy="28" r="23" fill="none" stroke="#F0E9EE" strokeWidth="6"/>
                <circle cx="28" cy="28" r="23" fill="none" stroke="#C4626F" strokeWidth="6" strokeLinecap="round" strokeDasharray="145" strokeDashoffset="41"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-900">72%</div>
            </div>
            <span className="text-xs font-bold text-slate-600">🔄 REPOSIÇÃO</span>
            <span className="text-base font-black text-slate-900">R$ 1.240</span>
          </div>
          <div className="bg-white rounded-3xl p-4 shadow-md flex flex-col items-center gap-2 text-center">
            <div className="relative w-14 h-14">
              <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="28" cy="28" r="23" fill="none" stroke="#F0E9EE" strokeWidth="6"/>
                <circle cx="28" cy="28" r="23" fill="none" stroke="#7E4F9E" strokeWidth="6" strokeLinecap="round" strokeDasharray="145" strokeDashoffset="75"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-900">48%</div>
            </div>
            <span className="text-xs font-bold text-slate-600">🟣 MÃO DE OBRA</span>
            <span className="text-base font-black text-slate-900">R$ 860</span>
          </div>
          <div className="bg-white rounded-3xl p-4 shadow-md flex flex-col items-center gap-2 text-center">
            <div className="relative w-14 h-14">
              <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="28" cy="28" r="23" fill="none" stroke="#F0E9EE" strokeWidth="6"/>
                <circle cx="28" cy="28" r="23" fill="none" stroke="#B08D57" strokeWidth="6" strokeLinecap="round" strokeDasharray="145" strokeDashoffset="94"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-900">35%</div>
            </div>
            <span className="text-xs font-bold text-slate-600">📊 CUSTO + INVEST.</span>
            <span className="text-base font-black text-slate-900">R$ 620</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-3xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-2xl text-slate-900">Agenda de Pedidos</h3>
          <div className="flex items-center gap-2">
            <button className="w-7 h-7 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-slate-200"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 5l-7 7 7 7"/></svg></button>
            <span className="text-xs font-black tracking-widest text-[#6E3F72]">AGOSTO</span>
            <button className="w-7 h-7 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-slate-200"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 5l7 7-7 7"/></svg></button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-xs font-bold text-slate-500 text-center mb-2">
          <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-xs mb-3">
          {[26,27,28,29,30,31,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31].map((day, idx) => {
            const hasOrder = [3,9,13,21,27].includes(day);
            const isToday = day === 7;
            const isInMonth = day <= 31;
            
            return (
              <div
                key={idx}
                className={`aspect-square rounded-2xl flex items-center justify-center text-xs font-bold ${
                  !isInMonth ? 'text-gray-300' :
                  hasOrder ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-md' :
                  isToday ? 'bg-white border-2 border-purple-600 text-slate-900' :
                  'bg-slate-100 text-slate-900 hover:bg-slate-200'
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
        
        <div className="flex gap-4 text-xs font-bold text-slate-600 border-t pt-3">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gradient-to-br from-purple-600 to-pink-500"/><span>Com pedido</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-300"/><span>Livre</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded border-2 border-purple-600"/><span>Hoje</span></div>
        </div>
      </div>

      {quoteTx && <QuotePdfModal transaction={quoteTx} onClose={() => setQuoteTx(null)} />}
    </div>
  );
};
