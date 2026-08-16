import React, { useState, useEffect } from 'react';
import { StockItem } from '../types';
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  Edit3,
  Trash2,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

const DEFAULT_STOCK_ITEMS: StockItem[] = [
  { id: '1', name: 'Farinha de Trigo', quantity: 5000, unit: 'g', minThreshold: 1000, costPerUnit: 0.005 },
  { id: '2', name: 'Açúcar Refinado', quantity: 3000, unit: 'g', minThreshold: 1000, costPerUnit: 0.004 },
  { id: '3', name: 'Cacau em Pó 100%', quantity: 250, unit: 'g', minThreshold: 300, costPerUnit: 0.0265 },
  { id: '4', name: 'Leite Integral', quantity: 2000, unit: 'ml', minThreshold: 1000, costPerUnit: 0.006 },
  { id: '5', name: 'Ovos Grandes', quantity: 30, unit: 'un', minThreshold: 12, costPerUnit: 0.50 },
  { id: '6', name: 'Leite Condensado', quantity: 8, unit: 'un', minThreshold: 4, costPerUnit: 6.50 },
  { id: '7', name: 'Creme de Leite', quantity: 10, unit: 'un', minThreshold: 5, costPerUnit: 4.20 },
  { id: '8', name: 'Manteiga sem Sal', quantity: 1000, unit: 'g', minThreshold: 400, costPerUnit: 0.035 },
];

export function getStoredStockItems(): StockItem[] {
  try {
    const data = localStorage.getItem('carula_stock_items');
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading stock items from localStorage:', e);
  }
  return DEFAULT_STOCK_ITEMS;
}

export function saveStoredStockItems(items: StockItem[]) {
  try {
    localStorage.setItem('carula_stock_items', JSON.stringify(items));
  } catch (e) {
    console.error('Error saving stock items to localStorage:', e);
  }
}

const getArcColor = (percentage: number): { stroke: string; text: string; background: string } => {
  if (percentage >= 76) {
    return { stroke: '#4CAF7D', text: '#4CAF7D', background: '#E8F5E9' }; // Verde
  } else if (percentage >= 51) {
    return { stroke: '#81C784', text: '#81C784', background: '#F1F8E9' }; // Verde claro
  } else if (percentage >= 26) {
    return { stroke: '#F5A623', text: '#F5A623', background: '#FFF3E0' }; // Laranja
  } else {
    return { stroke: '#C4626F', text: '#C4626F', background: '#FFEBEE' }; // Vermelho
  }
};

export const EstoqueModule: React.FC = () => {
  const [items, setItems] = useState<StockItem[]>(getStoredStockItems());
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'g' | 'kg' | 'ml' | 'L' | 'un' | 'pacote'>('g');
  const [minThreshold, setMinThreshold] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');

  useEffect(() => {
    saveStoredStockItems(items);
  }, [items]);

  const handleOpenAdd = () => {
    setName('');
    setQuantity('');
    setUnit('g');
    setMinThreshold('500');
    setCostPerUnit('');
    setEditingId(null);
    setIsAdding(true);
  };

  const handleOpenEdit = (item: StockItem) => {
    setName(item.name);
    setQuantity(item.quantity.toString());
    setUnit(item.unit);
    setMinThreshold(item.minThreshold.toString());
    setCostPerUnit((item.costPerUnit || 0).toString());
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const qtyNum = parseFloat(quantity.replace(',', '.')) || 0;
    const threshNum = parseFloat(minThreshold.replace(',', '.')) || 0;
    const costNum = parseFloat(costPerUnit.replace(',', '.')) || 0;

    if (editingId) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingId
            ? { ...i, name: name.trim(), quantity: qtyNum, unit, minThreshold: threshNum, costPerUnit: costNum }
            : i
        )
      );
    } else {
      const newItem: StockItem = {
        id: Date.now().toString(),
        name: name.trim(),
        quantity: qtyNum,
        unit,
        minThreshold: threshNum,
        costPerUnit: costNum,
      };
      setItems((prev) => [newItem, ...prev]);
    }

    setIsAdding(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir este item do estoque?')) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleQuickAdjust = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      })
    );
  };

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para obter a faixa de criticidade (0=vermelho, 1=laranja, 2=verde claro, 3=verde)
  const getCriticalityRank = (percentage: number): number => {
    if (percentage <= 25) return 0; // Vermelho - crítico
    if (percentage <= 50) return 1; // Laranja - aviso
    if (percentage <= 75) return 2; // Verde claro - normal
    return 3; // Verde - saudável
  };

  // Ordenar items por criticidade (vermelho primeiro, verde por último)
  const sortedItems = [...filteredItems].sort((a, b) => {
    const percentageA = Math.min((a.quantity / a.minThreshold) * 100, 100);
    const percentageB = Math.min((b.quantity / b.minThreshold) * 100, 100);
    const rankA = getCriticalityRank(percentageA);
    const rankB = getCriticalityRank(percentageB);
    return rankA - rankB; // Menor rank (vermelho) vem primeiro
  });

  const lowStockCount = items.filter((i) => i.quantity <= i.minThreshold).length;

  return (
    <div className="pb-12 animate-fadeIn">
      {/* Header Card — Flutuante com cabeçalho roxo */}
      <div
        className="overflow-hidden shadow-card"
        style={{
          boxShadow: '0 30px 70px rgba(58,35,80,.26)',
        }}
      >
        {/* Header with Title only */}
        <div
          className="px-5 py-10 flex items-center justify-between gap-4 rounded-t-[40px]"
          style={{
            background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
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
            Estoque
          </span>

          {/* Button */}
          <button
            onClick={handleOpenAdd}
            className="px-3 py-2 rounded-xl text-[10px] font-black cursor-pointer transition-all active:scale-95 shrink-0"
            style={{
              background: '#F5B9C6',
              color: '#3A2350',
              fontFamily: "'Manrope', sans-serif",
            }}
            title="Adicionar novo insumo"
          >
            Novo Insumo
          </button>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-4"
          style={{
            marginTop: '-14px',
            background: '#F6F2F5',
            borderRadius: '28px 28px 0 0',
            position: 'relative',
            padding: '20px',
            margin: '0 calc(-50vw + 50%)',
            paddingLeft: 'calc(20px + max(0px, env(safe-area-inset-left)))',
            paddingRight: 'calc(20px + max(0px, env(safe-area-inset-right)))',
          }}
        >

        {/* Search and Button Row - Below Header */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          {/* Search Input */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Search
              className="w-3.75 h-3.75 absolute"
              style={{
                color: '#A096A6',
                left: '13px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar insumo no estoque..."
              style={{
                width: '100%',
                padding: '11px 12px 11px 34px',
                background: '#FFFFFF',
                borderRadius: '14px',
                fontSize: '11px',
                color: '#A096A6',
                border: 'none',
                boxShadow: '0 6px 14px rgba(58,35,80,.07)',
                fontFamily: "'Manrope', sans-serif",
                outline: 'none',
              }}
            />
          </div>
        </div>
        </div>
      </div>

      {/* Form Modal / Inline Box */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-5 border border-[var(--color-neutral-medium)] shadow-card space-y-4 animate-slideUp">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-neutral-light)]">
            <h3 className="font-brand font-semibold text-sm text-[var(--color-neutral-charcoal)] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
              {editingId ? 'Editar Item' : 'Novo Item'}
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 rounded-full hover:bg-[var(--color-neutral-light)] text-[var(--color-neutral-dark-gray)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                Nome do Insumo *
              </label>
              <input
                type="text"
                required
                placeholder="Farinha de Trigo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-neutral-light)] text-xs font-normal text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                Quantidade *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="500"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-[var(--color-neutral-light)] text-xs font-normal text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] bg-white transition-colors"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className="px-3 py-2.5 rounded-xl border border-[var(--color-neutral-light)] text-xs font-semibold bg-white text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="L">L</option>
                  <option value="un">un</option>
                  <option value="pacote">pacote</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                Alerta Mínimo
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="100"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-neutral-light)] text-xs font-normal text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] bg-white transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-neutral-light)]">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-neutral-light)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:brightness-110 text-white font-brand font-semibold text-xs shadow-card flex items-center gap-1 transition-all active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              Salvar
            </button>
          </div>
        </form>
      )}

      {/* Stock Sections - Ordered by Criticality */}
      {sortedItems.length === 0 ? (
        <div className="p-8 rounded-3xl bg-[var(--color-neutral-cream)] border border-[var(--color-neutral-light)] text-center space-y-2">
          <Package className="w-10 h-10 text-[var(--color-neutral-warm-gray)] mx-auto" />
          <p className="text-xs text-[var(--color-text-secondary)] font-normal">
            Nenhum insumo encontrado.
          </p>
        </div>
      ) : (
        <div className="space-y-4 px-4 lg:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedItems.map((item) => {
                  const percentage = Math.min((item.quantity / item.minThreshold) * 100, 100);
                  const colors = getArcColor(percentage);

                  return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-2.5 transition-all cursor-pointer"
                    style={{ backgroundColor: '#FFFFFF' }}
                  >
                    {/* Top Section: Two Columns (Gauge Left, Name+Alert Right) */}
                    <div className="flex gap-3 mb-3">
                      {/* Gauge Left - Larger */}
                      <svg width="76" height="64" viewBox="0 0 76 64" className="flex-shrink-0">
                        <path d="M8 60a30 30 0 0 1 60 0" fill="none" stroke="#F1ECF2" strokeWidth="10" strokeLinecap="round"></path>
                        <path
                          d="M8 60a30 30 0 0 1 60 0"
                          fill="none"
                          stroke={colors.stroke}
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={`${percentage * 1.26} 126`}
                        ></path>
                        <text x="38" y="58" textAnchor="middle" fontSize="12" fontWeight="900" fill={colors.stroke} fontFamily="'Manrope', sans-serif">
                          {Math.round(percentage)}%
                        </text>
                      </svg>

                      {/* Right Column: Name + Alert */}
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-brand font-semibold text-[14px] text-[var(--color-neutral-charcoal)]">
                            {item.name}
                          </h4>
                          {item.quantity <= item.minThreshold && (
                            <span style={{ background: '#C4626F', color: '#FFFFFF' }} className="text-white text-[7px] font-semibold px-1 py-0.5 rounded uppercase whitespace-nowrap">
                              Estoque Baixo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#999999] font-light">
                          Alertar quando menor que:
                        </p>

                        {/* Quantity Stepper + Action Icons Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                          {/* Quantity Stepper */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F5F5F5', borderRadius: '20px', padding: '4px 8px', width: 'fit-content' }}>
                            <button
                              onClick={() => handleQuickAdjust(item.id, -50)}
                              style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#E8E8E8', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#D0D0D0'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#E8E8E8'}
                              title="Diminuir 50"
                            >
                              −
                            </button>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#333', minWidth: '70px', textAlign: 'center', fontFamily: "'Manrope', sans-serif" }}>
                              {item.quantity} {item.unit}
                            </span>
                            <button
                              onClick={() => handleQuickAdjust(item.id, 50)}
                              style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#E8E8E8', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#D0D0D0'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#E8E8E8'}
                              title="Aumentar 50"
                            >
                              +
                            </button>
                          </div>

                          {/* Edit/Delete Actions - Same Row */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              style={{ width: '20px', height: '20px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0' }}
                              title="Editar"
                            >
                              <Edit3 className="w-3.5 h-3.5" style={{ color: '#999', strokeWidth: 2 }} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              style={{ width: '20px', height: '20px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0' }}
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" style={{ color: '#999', strokeWidth: 2 }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
            </div>
      )}
    </div>
  );
};

// Arc gauge and lift effect added
// Scale(1.015) on hover with perspective effect
