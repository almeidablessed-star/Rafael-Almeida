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
  TrendingDown,
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

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 rounded-3xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-amber-200" />
            Estoque de Insumos & Ingredientes
          </span>
          {lowStockCount > 0 && (
            <span className="bg-rose-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3" /> {lowStockCount} Estoque Baixo
            </span>
          )}
        </div>

        <h2 className="font-brand font-black text-xl sm:text-2xl text-white tracking-tight">
          Controle de Estoque
        </h2>
        <p className="text-xs text-amber-100 font-medium mt-1">
          Acompanhe suas quantidades em gramas, ml e unidades para nunca faltar ingredientes na produção.
        </p>
      </div>

      {/* Actions & Search Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar insumo no estoque..."
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-amber-500 bg-white shadow-2xs"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-brand font-bold text-xs rounded-2xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Adicionar Insumo
        </button>
      </div>

      {/* Form Modal / Inline Box */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-4 border-2 border-amber-300 shadow-md space-y-3 animate-slideUp">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-brand font-black text-sm text-amber-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              {editingId ? 'Editar Item do Estoque' : 'Novo Item no Estoque'}
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome do Insumo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Farinha de Trigo, Leite, Cacau 100%"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantidade Atual *
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="Ex: 500"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className="px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-extrabold bg-slate-50 text-slate-800"
                >
                  <option value="g">Gramas (g)</option>
                  <option value="kg">Kilos (kg)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="L">Litros (L)</option>
                  <option value="un">Unidades (un)</option>
                  <option value="pacote">Pacotes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alerta de Estoque Mínimo
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 100"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-brand font-bold text-xs shadow-xs flex items-center gap-1"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              Salvar no Estoque
            </button>
          </div>
        </form>
      )}

      {/* Stock List */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-dashed border-slate-200 text-center space-y-2">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Nenhum insumo encontrado no estoque.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isLow = item.quantity <= item.minThreshold;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all shadow-2xs flex items-center justify-between gap-3 ${
                  isLow
                    ? 'bg-rose-50/80 border-rose-300'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-brand font-black text-slate-900 text-sm truncate">
                      {item.name}
                    </span>
                    {isLow && (
                      <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase flex items-center gap-1 animate-pulse shrink-0">
                        <AlertTriangle className="w-3 h-3" /> Estoque Baixo
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    Alerta quando menor que: <strong className="text-slate-700">{item.minThreshold} {item.unit}</strong>
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 p-0.5">
                    <button
                      onClick={() => handleQuickAdjust(item.id, -100)}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition-colors"
                      title="Diminuir 100"
                    >
                      -
                    </button>
                    <span className="px-2.5 font-brand font-extrabold text-sm text-slate-900">
                      {item.quantity} <span className="text-xs text-slate-500 font-normal">{item.unit}</span>
                    </span>
                    <button
                      onClick={() => handleQuickAdjust(item.id, 100)}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition-colors"
                      title="Aumentar 100"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Editar Item"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Excluir Item"
                    >
                      <Trash2 className="w-4 h-4" />
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
