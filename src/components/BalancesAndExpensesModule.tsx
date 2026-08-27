import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, WeeklyArchive, StockItem } from '../types';
import { calculateWeeklyBalances } from '../utils/balancesCalculator';
import { getWeeklyArchives, hasNewWeekStarted, archiveCurrentWeek } from '../utils/weeklyArchiveUtils';
import { WeeklyHistoryCard } from './WeeklyHistoryCard';
import { StockItemAutocomplete } from './StockItemAutocomplete';
import { formatCurrency, formatDateBr, getTodayIso } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import { useFichasTecnicas } from '../context/FichasTecnicasContext';
import { useEstoque } from '../hooks/useEstoque';
import {
  Wallet,
  ShoppingBag,
  Sparkles,
  Plus,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Edit3,
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  Search,
  CheckCircle2,
  Package,
} from 'lucide-react';

interface BalancesAndExpensesModuleProps {
  transactions: Transaction[];
  onAddTransaction: (txData: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

export const BalancesAndExpensesModule: React.FC<BalancesAndExpensesModuleProps> = ({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const { formatCurrency: formatMoney } = useCurrency();
  const { fichas } = useFichasTecnicas();
  const balances = calculateWeeklyBalances(transactions, fichas);
  const { estoque, addEstoque, updateEstoque } = useEstoque();

  // Form state for quick expense logging
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'reposicao' | 'investimento'>('reposicao');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayIso());
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Stock item state (optional)
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState<'g' | 'kg' | 'ml' | 'L' | 'un' | 'pacote'>('un');

  // History filtering
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'reposicao' | 'investimento'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Weekly archives
  const [archives, setArchives] = useState<WeeklyArchive[]>(getWeeklyArchives());

  // Debug: log estoque e itemQuantity
  useEffect(() => {
    const isEnabled = itemQuantity.trim().length > 0;
    console.log(`[BalancesAndExpenses] itemQuantity="${itemQuantity}", isEnabled=${isEnabled}, estoque.length=${estoque.length}`);
    estoque.forEach(item => console.log(`  - estoque item: "${item.name}"`));
  }, [itemQuantity, estoque]);

  // Auto-archive when new week starts
  useEffect(() => {
    const lastArchiveDate = localStorage.getItem('carula_last_archive_date');
    if (hasNewWeekStarted(lastArchiveDate)) {
      const archive = archiveCurrentWeek(transactions);
      if (archive) {
        setArchives(getWeeklyArchives());
        localStorage.setItem('carula_last_archive_date', new Date().toISOString());
      }
    }
  }, [transactions]);

  const findExistingItem = (itemName: string): StockItem | undefined => {
    const normalized = itemName.toLowerCase().trim();
    return estoque.find(item => item.name.toLowerCase().trim() === normalized);
  };

  const convertQuantityToTargetUnit = (quantity: number, fromUnit: string, toUnit: string): number => {
    if (fromUnit === toUnit) return quantity;

    // Convert to base units first
    const baseMap: { [key: string]: number } = {
      'g': 1,
      'kg': 1000,
      'ml': 1,
      'L': 1000,
      'un': 1,
      'pacote': 1,
    };

    const fromBase = baseMap[fromUnit] || 1;
    const toBase = baseMap[toUnit] || 1;

    return (quantity * fromBase) / toBase;
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const valNum = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || isNaN(valNum) || valNum <= 0) {
      return;
    }

    // Validate stock item fields: if quantity is filled, description is used as item name
    const itemQtyNum = itemQuantity ? parseFloat(itemQuantity.replace(',', '.')) : 0;
    const hasItemQty = itemQtyNum > 0;

    if (hasItemQty && itemQtyNum <= 0) {
      alert('Quantidade deve ser maior que zero');
      return;
    }

    // Register stock item if quantity provided
    if (hasItemQty) {
      try {
        const itemNameFromDescription = description.trim();
        console.log('[handleSaveExpense] Procurando item:', itemNameFromDescription, 'em estoque:', estoque);
        const existing = findExistingItem(itemNameFromDescription);
        console.log('[handleSaveExpense] Item encontrado:', existing);

        // Calcular preço unitário: valor pago / quantidade comprada
        const costPerUnitCalculated = valNum / itemQtyNum;

        if (existing) {
          console.log('[handleSaveExpense] Atualizando item existente:', existing.id);
          const convertedQty = convertQuantityToTargetUnit(itemQtyNum, itemUnit, existing.unit);
          console.log('[handleSaveExpense] Quantidade convertida:', itemQtyNum, itemUnit, '→', convertedQty, existing.unit);
          await updateEstoque(existing.id, {
            ...existing,
            quantity: existing.quantity + convertedQty,
            costPerUnit: costPerUnitCalculated,
          });
        } else {
          console.log('[handleSaveExpense] Criando novo item:', itemNameFromDescription, itemQtyNum, itemUnit);
          await addEstoque({
            name: itemNameFromDescription,
            quantity: itemQtyNum,
            unit: itemUnit,
            minThreshold: 0,
            minThresholdUnit: itemUnit,
            costPerUnit: costPerUnitCalculated,
          });
        }
      } catch (err) {
        console.error('Erro ao atualizar estoque:', err);
        alert('Erro ao registrar item no estoque. Despesa registrada, mas verifique o estoque.');
      }
    }

    onAddTransaction({
      type: category as TransactionType,
      description: description.trim(),
      quantity: 1,
      unitValue: valNum,
      totalValue: valNum,
      date: date || getTodayIso(),
      paymentStatus: 'pago',
      notes: `Compra registrada em ${category === 'reposicao' ? 'Reposição de Insumos' : 'Investimento'}${hasItemQty ? ` - Item: ${description.trim()} (${itemQtyNum}${itemUnit})` : ''}`,
    });

    // Reset form
    setDescription('');
    setAmount('');
    setDate(getTodayIso());
    setItemQuantity('');
    setItemUnit('un');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Filter expenses list (only real expenses under reposicao or investimento)
  const expenseTransactions = transactions.filter(
    (tx) => tx.type === 'reposicao' || tx.type === 'investimento'
  );

  const filteredExpenses = expenseTransactions.filter((tx) => {
    const matchesCategory = selectedFilter === 'todos' || tx.type === selectedFilter;
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pb-12 animate-fadeIn" style={{ background: '#FAF7FA' }}>
      {/* Header Card — Flutuante com cabeçalho roxo */}
      <div
        className="overflow-hidden shadow-card"
        style={{
          boxShadow: '0 30px 70px rgba(58,35,80,.26)',
        }}
      >
        {/* Header with Title only */}
        <div
          className="px-5 flex items-center justify-between gap-4"
          style={{
            background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
            borderRadius: '0px 0px 0px 0px',
            paddingTop: '40px',
            paddingBottom: '120px',
          }}
        >
          {/* Title */}
          <span
            className="text-white leading-tight flex-1"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: '31px',
              lineHeight: '1.1',
            }}
          >
            Saldos
          </span>

          {/* Button */}
          <button
            onClick={() => {}}
            className="px-3 py-2 rounded-xl text-[10px] font-black cursor-pointer transition-all active:scale-95 shrink-0"
            style={{
              background: '#F5B9C6',
              color: '#3A2350',
              fontFamily: "'Manrope', sans-serif",
            }}
            title="Gestão de saldos"
          >
            Gestão
          </button>
        </div>
      </div>

      {/* TOTAL BALANCE CARD - SALDO TOTAL DISPONÍVEL */}
      <div
        className="rounded-[22px] p-6 text-white mx-5"
        style={{
          background: 'linear-gradient(155deg, var(--color-brand-900) 0%, var(--color-brand-700) 60%, var(--color-brand-500) 100%)',
          marginTop: '-70px',
          position: 'relative',
          zIndex: 50,
        }}
      >
        <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.14em', color: 'rgba(247, 220, 225, 0.8)', textTransform: 'uppercase', display: 'block', fontFamily: "'Manrope', sans-serif" }}>
          Saldo Total Disponível
        </span>
        <span style={{ fontSize: '31px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1, display: 'block', marginTop: '8px', fontFamily: "'Manrope', sans-serif" }}>
          {formatMoney(balances.reposicao.currentBalance + balances.maodeobra.currentBalance + balances.custoEInvestimento.currentBalance)}
        </span>

        {/* Progress bar with category divisions */}
        <div style={{ display: 'flex', height: '10px', borderRadius: '999px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.18)', marginTop: '12px', marginBottom: '12px' }}>
          <div style={{ width: '45.6%', background: '#F5B9C6' }} />
          <div style={{ width: '31.6%', background: '#D6B8E0' }} />
          <div style={{ width: '22.8%', background: '#A9D8B8' }} />
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '9.5px', fontWeight: 700, color: 'rgba(247, 220, 225, 0.85)', fontFamily: "'Manrope', sans-serif" }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '3px', background: '#F5B9C6' }} />
            Reposição
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '3px', background: '#D6B8E0' }} />
            Mão de Obra
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '3px', background: '#A9D8B8' }} />
            Custo + Invest.
          </span>
        </div>
      </div>

      {/* REGISTRATION FORM FOR REAL PURCHASES / EXPENSES */}
      <div className="bg-white mx-5" style={{ borderRadius: '24px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '13px', boxShadow: '0 8px 20px rgba(58,35,80,.09)', marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(36,27,43,.07)', paddingBottom: '11px' }}>
          <span style={{ width: '34px', height: '34px', borderRadius: '12px', background: '#6E3F72', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plus className="w-4 h-4" style={{ stroke: '#FFFFFF', strokeWidth: 3 }} />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>
              Lançar Compra Real / Despesa
            </span>
            <span style={{ fontSize: '10px', color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>
              Desconta automaticamente do cofrinho selecionado
            </span>
          </div>
          {showSuccessToast && (
            <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)] font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              Despesa lançada!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '10.5px', fontWeight: 800, color: '#5B4A6B', fontFamily: "'Manrope', sans-serif" }}>
              O que você comprou? (Descrição)
            </label>
            <StockItemAutocomplete
              value={description}
              onChange={setDescription}
              onSelect={() => {}}
              stockItems={estoque}
              isEnabled={itemQuantity.trim().length > 0}
              placeholder={itemQuantity ? "Nome do item (ex: Farinha, Açúcar, Caixa, Pote)" : "Ex: 2 sacos de farinha, 2 formas e bicos"}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '10.5px', fontWeight: 800, color: '#5B4A6B', fontFamily: "'Manrope', sans-serif" }}>
              Categoria da Compra
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCategory('reposicao')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  borderRadius: '14px',
                  background: category === 'reposicao' ? '#F3E9F3' : '#FAF7FA',
                  border: category === 'reposicao' ? '1.5px solid #B892BE' : '1.5px solid rgba(36,27,43,.1)',
                  color: category === 'reposicao' ? '#4A3556' : '#7A6E80',
                  fontSize: '11px',
                  fontWeight: category === 'reposicao' ? 800 : 700,
                  cursor: 'pointer',
                  transition: 'transform .2s ease',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                🔄 Reposição
              </button>
              <button
                type="button"
                onClick={() => setCategory('investimento')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  borderRadius: '14px',
                  background: category === 'investimento' ? '#F3E9F3' : '#FAF7FA',
                  border: category === 'investimento' ? '1.5px solid #B892BE' : '1.5px solid rgba(36,27,43,.1)',
                  color: category === 'investimento' ? '#4A3556' : '#7A6E80',
                  fontSize: '11px',
                  fontWeight: category === 'investimento' ? 800 : 700,
                  cursor: 'pointer',
                  transition: 'transform .2s ease',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                📈 Investimento
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '9px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '10.5px', fontWeight: 800, color: '#5B4A6B', fontFamily: "'Manrope', sans-serif" }}>
                Valor Gasto (R$)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: 800, color: '#5B4A6B', fontFamily: "'Manrope', sans-serif", pointerEvents: 'none' }}>
                  R$
                </span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  style={{ paddingLeft: '32px', paddingRight: '13px', paddingTop: '11px', paddingBottom: '11px', background: '#FAF7FA', border: '1px solid rgba(36,27,43,.08)', borderRadius: '14px', fontSize: '11px', color: '#241B2B', fontFamily: "'Manrope', sans-serif", width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '10.5px', fontWeight: 800, color: '#5B4A6B', fontFamily: "'Manrope', sans-serif" }}>
                Data da Compra
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ padding: '11px 13px', background: '#FAF7FA', border: '1px solid rgba(36,27,43,.08)', borderRadius: '14px', fontSize: '11px', color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}
                required
              />
            </div>
          </div>

          {/* Quantidade e Unidade para Estoque (Opcional) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingTop: '8px', borderTop: '1px solid rgba(36,27,43,.08)' }}>
            <label style={{ fontSize: '9.5px', fontWeight: 800, color: '#5B4A6B', fontFamily: "'Manrope', sans-serif", letterSpacing: '0.05em' }}>
              📦 Quantidade e Unidade no Estoque (Opcional)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
                placeholder="Quantidade"
                step="0.01"
                min="0"
                style={{ flex: 1, padding: '11px 13px', background: '#FAF7FA', border: '1px solid rgba(36,27,43,.08)', borderRadius: '14px', fontSize: '11px', color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}
              />
              <select
                value={itemUnit}
                onChange={(e) => setItemUnit(e.target.value as any)}
                style={{ padding: '11px 13px', background: '#FAF7FA', border: '1px solid rgba(36,27,43,.08)', borderRadius: '14px', fontSize: '11px', color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}
              >
                <option value="un">Unidade</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="pacote">Pacote</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '13px',
              borderRadius: '16px',
              background: '#3A2350',
              color: '#F5B9C6',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 10px 20px rgba(58,35,80,.3)',
              transition: 'transform .22s ease',
              fontFamily: "'Manrope', sans-serif",
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Plus className="w-4 h-4" style={{ stroke: '#F5B9C6', strokeWidth: 3, flexShrink: 0 }} />
            Registrar Compra e Descontar do Cofrinho
          </button>
        </form>
      </div>

      {/* 4. EXPENSES HISTORY */}
      <div className="bg-white mx-5" style={{ borderRadius: '24px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 8px 20px rgba(58,35,80,.09)', marginTop: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: '1px solid rgba(36,27,43,.07)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '19px', color: '#241B2B', lineHeight: 1.15 }}>
              Histórico de Compras Realizadas ({expenseTransactions.length})
            </span>
            <span style={{ fontSize: '10px', color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>
              Ajuste ou remova lançamentos se digitou algo errado
            </span>
          </div>

          <div style={{ display: 'flex', background: '#EDE6EF', borderRadius: '12px', padding: '3px' }}>
            <button
              onClick={() => setSelectedFilter('todos')}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '10.5px',
                fontWeight: selectedFilter === 'todos' ? 800 : 600,
                color: selectedFilter === 'todos' ? '#FFFFFF' : '#6B5F71',
                background: selectedFilter === 'todos' ? '#3A2350' : 'transparent',
                borderRadius: '9px',
                padding: '7px 0',
                border: 'none',
                boxShadow: selectedFilter === 'todos' ? '0 4px 10px rgba(58,35,80,.28)' : 'none',
                cursor: 'pointer',
                transition: 'background .2s ease',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Todos ({expenseTransactions.length})
            </button>
            <button
              onClick={() => setSelectedFilter('reposicao')}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '10.5px',
                fontWeight: selectedFilter === 'reposicao' ? 800 : 600,
                color: selectedFilter === 'reposicao' ? '#FFFFFF' : '#6B5F71',
                background: selectedFilter === 'reposicao' ? '#3A2350' : 'transparent',
                borderRadius: '9px',
                padding: '7px 0',
                border: 'none',
                boxShadow: selectedFilter === 'reposicao' ? '0 4px 10px rgba(58,35,80,.28)' : 'none',
                cursor: 'pointer',
                transition: 'background .2s ease',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Reposição
            </button>
            <button
              onClick={() => setSelectedFilter('investimento')}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '10.5px',
                fontWeight: selectedFilter === 'investimento' ? 800 : 600,
                color: selectedFilter === 'investimento' ? '#FFFFFF' : '#6B5F71',
                background: selectedFilter === 'investimento' ? '#3A2350' : 'transparent',
                borderRadius: '9px',
                padding: '7px 0',
                border: 'none',
                boxShadow: selectedFilter === 'investimento' ? '0 4px 10px rgba(58,35,80,.28)' : 'none',
                cursor: 'pointer',
                transition: 'background .2s ease',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Investimento
            </button>
          </div>
        </div>

        {/* Search Input */}
        {expenseTransactions.length > 0 && (
          <div style={{ position: 'relative' }}>
            <Search className="w-4 h-4" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#A096A6' }} />
            <div style={{ padding: '11px 12px 11px 34px', background: '#FAF7FA', border: '1px solid rgba(36,27,43,.08)', borderRadius: '14px', fontSize: '11px', color: '#A096A6', fontFamily: "'Manrope', sans-serif" }}>
              Buscar compra...
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar compra..."
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'transparent', border: 'none', paddingLeft: '34px', fontSize: '11px', color: '#241B2B', fontFamily: "'Manrope', sans-serif", borderRadius: '14px', outline: 'none' }}
            />
          </div>
        )}

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 px-4 bg-[var(--color-surface)]/50 rounded-lg border border-dashed border-[#E6E1DB]">
            <Package className="w-8 h-8 text-[#E6E1DB] mx-auto mb-2" />
            <p className="text-xs text-[#E6E1DB] font-medium">
              Nenhuma compra registrada nesta categoria.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {filteredExpenses.map((tx) => {
              const isReposicao = tx.type === 'reposicao';

              return (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '16px',
                    background: '#FAF7FA',
                    border: '1px solid rgba(36,27,43,.06)',
                    cursor: 'pointer',
                    transition: 'transform .25s ease, background .25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(3px)';
                    e.currentTarget.style.background = '#F3E9F3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.background = '#FAF7FA';
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          color: isReposicao ? '#4A3556' : '#2F4A6B',
                          background: isReposicao ? '#F3E9F3' : '#E9EFF7',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          textTransform: 'uppercase',
                          fontFamily: "'Manrope', sans-serif",
                        }}
                      >
                        {isReposicao ? '🔄 Reposição' : '📈 Investimento'}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#241B2B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Manrope', sans-serif" }}>
                        {tx.description}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>
                      Data: {formatDateBr(tx.date)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#C4626F', fontFamily: "'Manrope', sans-serif" }}>
                      -{formatMoney(tx.totalValue)}
                    </span>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => onEditTransaction(tx)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '9px',
                          background: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(58,35,80,.1)',
                          border: 'none',
                        }}
                        title="Editar Compra"
                      >
                        <Edit3 className="w-3 h-3" style={{ color: '#7A6E80' }} />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(tx)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '9px',
                          background: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(58,35,80,.1)',
                          border: 'none',
                        }}
                        title="Excluir Compra"
                      >
                        <Trash2 className="w-3 h-3" style={{ color: '#C4626F' }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weekly History Card */}
      <div style={{ marginTop: '20px' }}>
        <WeeklyHistoryCard archives={archives} />
      </div>
    </div>
  );
};
