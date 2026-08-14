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

  const lowStockCount = items.filter((i) => i.quantity <= i.minThreshold).length;
  const lowStockItems = filteredItems.filter((i) => i.quantity <= i.minThreshold);
  const healthyStockItems = filteredItems.filter((i) => i.quantity > i.minThreshold);

  return (
    <div className="pb-12 animate-fadeIn">
      {/* Header Section - Roxo Gradiente */}
      <div
        className="rounded-3xl p-6 mb-6 text-white shadow-highlight"
        style={{
          background: 'linear-gradient(155deg, var(--color-brand-900) 0%, var(--color-brand-700) 60%, var(--color-brand-500) 100%)',
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-marca text-3xl text-white tracking-tight" style={{ lineHeight: 1 }}>
              Controle de Estoque
            </h2>
            <p className="text-xs text-white/80 font-semibold mt-2">
              {items.length} insumos · {lowStockCount} com alerta
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="py-2.5 px-4 text-xs font-black uppercase rounded-full active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap"
            style={{
              background: 'var(--color-rose-200)',
              color: 'var(--color-brand-900)',
            }}
          >
            <Plus className="w-4 h-4" />
            Adicionar Item
          </button>
        </div>

        {/* Search Utility */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.6)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nome..."
            className="w-full sm:w-80 pl-9 pr-3 py-2 rounded-full text-xs placeholder:text-white/50 focus:outline-none bg-white/20 text-white transition-colors"
          />
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

      {/* Stock Sections */}
      {filteredItems.length === 0 ? (
        <div className="p-8 rounded-3xl bg-[var(--color-neutral-cream)] border border-[var(--color-neutral-light)] text-center space-y-2">
          <Package className="w-10 h-10 text-[var(--color-neutral-warm-gray)] mx-auto" />
          <p className="text-xs text-[var(--color-text-secondary)] font-normal">
            Nenhum insumo encontrado.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Low Stock Section */}
          {lowStockItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-[var(--color-semantic-coral)]">
                <AlertTriangle className="w-5 h-5 text-[var(--color-semantic-coral)]" />
                <h3 className="font-brand font-semibold text-sm text-[var(--color-neutral-charcoal)]">
                  Alerta Baixo ({lowStockItems.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#FBE8D6] border-2 border-[#F5D4A8] rounded-3xl p-4 hover:shadow-card transition-all shadow-card"
                  >
                    {/* Item Header */}
                    <div className="flex items-start justify-between mb-3 pb-2 border-b border-[var(--color-semantic-coral)] border-opacity-30">
                      <span className="font-brand font-semibold text-sm text-[var(--color-neutral-charcoal)] flex-1 pr-2">
                        {item.name}
                      </span>
                      <span className="bg-[var(--color-semantic-coral)] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md uppercase shrink-0 animate-pulse">
                        Baixo
                      </span>
                    </div>

                    {/* Quantity Display (Hero) */}
                    <div className="mb-3 pb-3 border-b border-[var(--color-neutral-light)]">
                      <div className="text-right">
                        <span className="font-numbers font-brand font-semibold text-2xl text-[var(--color-neutral-charcoal)]">
                          {item.quantity}
                        </span>
                        <span className="text-xs text-[var(--color-text-secondary)] font-normal ml-1">
                          {item.unit}
                        </span>
                      </div>
                    </div>

                    {/* Threshold Info */}
                    <p className="text-[11px] text-[var(--color-text-secondary)] font-normal mb-4">
                      Mín: {item.minThreshold} {item.unit}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 bg-white rounded-lg border border-[var(--color-neutral-light)] p-1">
                        <button
                          onClick={() => handleQuickAdjust(item.id, -100)}
                          className="w-6 h-6 rounded text-[var(--color-text-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-neutral-light)] font-semibold text-xs flex items-center justify-center transition-colors"
                          title="Diminuir 100"
                        >
                          −
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(item.id, 100)}
                          className="w-6 h-6 rounded text-[var(--color-text-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-neutral-light)] font-semibold text-xs flex items-center justify-center transition-colors"
                          title="Aumentar 100"
                        >
                          +
                        </button>
                      </div>

                      {/* Edit/Delete Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded text-[var(--color-neutral-dark-gray)] hover:text-[var(--color-primary)] hover:bg-[var(--color-neutral-light)] transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded text-[var(--color-neutral-dark-gray)] hover:text-[var(--color-semantic-coral)] hover:bg-[var(--color-neutral-light)] transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Healthy Stock Section */}
          {healthyStockItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-[var(--color-primary)]">
                <Check className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="font-brand font-semibold text-sm text-[var(--color-neutral-charcoal)]">
                  Estoque Normal ({healthyStockItems.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthyStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-[var(--color-neutral-light)] rounded-3xl p-4 hover:border-[var(--color-primary)] hover:shadow-card transition-all"
                  >
                    {/* Item Header */}
                    <div className="pb-2 border-b border-[var(--color-neutral-light)] mb-3">
                      <span className="font-brand font-semibold text-sm text-[var(--color-neutral-charcoal)]">
                        {item.name}
                      </span>
                    </div>

                    {/* Quantity Display (Hero) */}
                    <div className="mb-3 pb-3 border-b border-[var(--color-neutral-light)]">
                      <div className="text-right">
                        <span className="font-numbers font-brand font-semibold text-2xl text-[var(--color-neutral-charcoal)]">
                          {item.quantity}
                        </span>
                        <span className="text-xs text-[var(--color-text-secondary)] font-normal ml-1">
                          {item.unit}
                        </span>
                      </div>
                    </div>

                    {/* Threshold Info */}
                    <p className="text-[11px] text-[var(--color-text-secondary)] font-normal mb-4">
                      Mín: {item.minThreshold} {item.unit}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 bg-[var(--color-neutral-cream)] rounded-lg border border-[var(--color-neutral-light)] p-1">
                        <button
                          onClick={() => handleQuickAdjust(item.id, -100)}
                          className="w-6 h-6 rounded text-[var(--color-text-primary)] hover:text-[var(--color-primary)] hover:bg-white font-semibold text-xs flex items-center justify-center transition-colors"
                          title="Diminuir 100"
                        >
                          −
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(item.id, 100)}
                          className="w-6 h-6 rounded text-[var(--color-text-primary)] hover:text-[var(--color-primary)] hover:bg-white font-semibold text-xs flex items-center justify-center transition-colors"
                          title="Aumentar 100"
                        >
                          +
                        </button>
                      </div>

                      {/* Edit/Delete Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded text-[var(--color-neutral-dark-gray)] hover:text-[var(--color-primary)] hover:bg-[var(--color-neutral-light)] transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded text-[var(--color-neutral-dark-gray)] hover:text-[var(--color-semantic-coral)] hover:bg-[var(--color-neutral-light)] transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Arc gauge and lift effect added
// Scale(1.015) on hover with perspective effect
