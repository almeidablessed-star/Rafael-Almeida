import React, { useState, useEffect } from 'react';
import { StockItem } from '../types';
import { useEstoque } from '../context/EstoqueContext';
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  Edit3,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react';
import { StockMovementsHistory } from './StockMovementsHistory';

// DEFAULT_STOCK_ITEMS e as funcoes getStoredStockItems/saveStoredStockItems
// foram removidos: eram um estoque de exemplo em localStorage, de uma fase
// anterior, exportado e nunca chamado por tela nenhuma. O estoque real vem do
// Supabase por [[EstoqueContext]].

const getColorBasedOnThreshold = (
  quantity: number,
  minThreshold: number
): { stroke: string; text: string; background: string } => {
  // Se abaixo do limite: sempre vermelho
  if (quantity < minThreshold) {
    return { stroke: '#C4626F', text: '#C4626F', background: '#FFEBEE' }; // Vermelho
  }

  // Calcular folga percentual acima do mínimo
  const slack = ((quantity - minThreshold) / minThreshold) * 100;

  if (slack >= 75) {
    return { stroke: '#4CAF7D', text: '#4CAF7D', background: '#E8F5E9' }; // Verde escuro
  } else if (slack >= 50) {
    return { stroke: '#81C784', text: '#81C784', background: '#F1F8E9' }; // Verde claro
  } else if (slack >= 25) {
    return { stroke: '#F5A623', text: '#F5A623', background: '#FFF3E0' }; // Laranja
  } else {
    return { stroke: '#C4626F', text: '#C4626F', background: '#FFEBEE' }; // Vermelho
  }
};

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
  const { estoque: items, isLoading: isLoadingEstoque, error: estoqueError, addEstoque, updateEstoque, deleteEstoque } = useEstoque();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'g' | 'kg' | 'ml' | 'L' | 'un' | 'pacote'>('g');
  const [minThreshold, setMinThreshold] = useState('');
  const [minThresholdUnit, setMinThresholdUnit] = useState<'g' | 'kg' | 'ml' | 'L' | 'un' | 'pacote'>('g');
  const [costPerUnit, setCostPerUnit] = useState('');

  // Efeito para resetar o formulário quando isAdding muda
  useEffect(() => {
    if (!isAdding) {
      setName('');
      setQuantity('');
      setUnit('g');
      setMinThreshold('');
      setMinThresholdUnit('g');
      setCostPerUnit('');
      setEditingId(null);
    }
  }, [isAdding]);

  // Itens são agora gerenciados pelo hook useEstoque (salva no Supabase)

  const handleOpenAdd = () => {
    setName('');
    setQuantity('');
    setUnit('g');
    // Vazio, nao '500': o campo ja tem placeholder e o valor pre-digitado
    // grudava no que a pessoa escrevia (500 + 10 = "50010"). Mesmo defeito dos
    // campos de custo, com outro numero.
    setMinThreshold('');
    setMinThresholdUnit('g');
    setCostPerUnit('');
    setEditingId(null);
    setIsAdding(true);
  };

  const handleOpenEdit = (item: StockItem) => {
    setName(item.name);
    setQuantity(item.quantity.toString());
    setUnit(item.unit);
    setMinThreshold(item.minThreshold.toString());
    // O alerta pode ser configurado numa unidade diferente da quantidade (ex:
    // quantidade em L, alerta em ml) — por isso a unidade gravada no item e
    // que vale aqui, nao a de `unit`.
    setMinThresholdUnit(item.minThresholdUnit);
    setCostPerUnit((item.costPerUnit || 0).toString());
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setFormError('');
    const qtyNum = parseFloat(quantity.replace(',', '.')) || 0;
    const threshNum = parseFloat(minThreshold.replace(',', '.')) || 0;
    const costNum = parseFloat(costPerUnit.replace(',', '.')) || 0;

    const itemData: Omit<StockItem, 'id'> = {
      name: name.trim(),
      quantity: qtyNum,
      unit,
      minThreshold: threshNum,
      // Unidade PROPRIA do alerta, independente de `unit`: a quantidade pode
      // estar em L e o alerta disparar em ml, por exemplo. Antes o alerta era
      // gravado sem unidade propria e voltava do banco com "g" fixo — um item
      // em litros avisava na unidade errada.
      minThresholdUnit,
      costPerUnit: costNum,
    };

    try {
      if (editingId) {
        await updateEstoque(editingId, itemData);
      } else {
        await addEstoque(itemData);
      }
      setIsAdding(false);
      setEditingId(null);
    } catch (err) {
      setFormError((err as any).message || 'Erro ao salvar item');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este item do estoque?')) {
      try {
        await deleteEstoque(id);
      } catch (err) {
        setFormError((err as any).message || 'Erro ao deletar item');
      }
    }
  };

  const normalizeToCommonUnit = (value: number, fromUnit: string, toUnit: string): number => {
    if (fromUnit === toUnit) return value;
    if (fromUnit === 'kg' && toUnit === 'g') return value * 1000;
    if (fromUnit === 'g' && toUnit === 'kg') return value / 1000;
    if (fromUnit === 'L' && toUnit === 'ml') return value * 1000;
    if (fromUnit === 'ml' && toUnit === 'L') return value / 1000;
    return value;
  };

  const getThresholdDelta = (unit: string): number => {
    if (unit === 'kg' || unit === 'L') return 0.5;
    if (unit === 'g' || unit === 'ml') return 100;
    return 1; // un, pacote
  };

  const handleQuickAdjustThreshold = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newThreshold = Math.max(0, item.minThreshold + delta);
    await updateEstoque(id, { ...item, minThreshold: newThreshold });
  };

  const handleChangeThresholdUnit = async (id: string, newUnit: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    await updateEstoque(id, { ...item, minThresholdUnit: newUnit as any });
  };

  const handleQuickAdjust = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newQty = Math.max(0, item.quantity + delta);
    try {
      await updateEstoque(id, { ...item, quantity: newQty });
    } catch (err) {
      setFormError((err as any).message || 'Erro ao ajustar quantidade');
    }
  };

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para obter a faixa de criticidade baseada em quantity vs minThreshold
  const getCriticalityRank = (quantity: number, minThreshold: number): number => {
    if (quantity < minThreshold) return 0; // Vermelho - crítico (abaixo do limite)
    const slack = ((quantity - minThreshold) / minThreshold) * 100;
    if (slack < 25) return 1; // Vermelho - perto do limite
    if (slack < 50) return 2; // Laranja - folga baixa
    if (slack < 75) return 3; // Verde claro - folga média
    return 4; // Verde escuro - folga alta
  };

  // Função para obter o texto do status baseado em quantity vs minThreshold
  const getStatusLabel = (quantity: number, minThreshold: number): string => {
    if (quantity < minThreshold) return 'Crítico';
    const slack = ((quantity - minThreshold) / minThreshold) * 100;
    if (slack < 25) return 'Alerta';
    if (slack < 50) return 'Atenção';
    if (slack < 75) return 'Normal';
    return 'Alto';
  };

  // Ordenar items por criticidade (vermelho primeiro, verde por último)
  const sortedItems = [...filteredItems].sort((a, b) => {
    // Normalizar unidades antes de comparar com minThreshold
    const normalizedQtyA = normalizeToCommonUnit(a.quantity, a.unit, a.minThresholdUnit);
    const normalizedQtyB = normalizeToCommonUnit(b.quantity, b.unit, b.minThresholdUnit);

    const rankA = getCriticalityRank(normalizedQtyA, a.minThreshold);
    const rankB = getCriticalityRank(normalizedQtyB, b.minThreshold);
    return rankA - rankB; // Menor rank (vermelho) vem primeiro
  });

  const lowStockCount = items.filter((i) => i.quantity <= i.minThreshold).length;

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
            marginTop: '-70px',
            background: '#FAF7FA',
            borderRadius: '28px 28px 0 0',
            position: 'relative',
            padding: '20px',
            marginLeft: 'calc(-50vw + 50%)',
            marginRight: 'calc(-50vw + 50%)',
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
            marginBottom: '16px',
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

        {/* Form Modal / Inline Box */}
        {/* Mesma casca do formulario de Pedido (ver Clientes e Fichas): corpo
            claro, cartao branco com borda #E6E1DB e shadow-card por cima, e o
            cabecalho no gradiente de tres paradas em 155deg. Antes era branco
            sobre branco, sem cabecalho colorido nem separacao entre secoes. */}
        {isAdding && (
          <div className="bg-[#F6F2F5] rounded-xl overflow-hidden shadow-highlight border border-[#E6E1DB] animate-slideUp" style={{ marginBottom: '16px' }}>
            <div
              style={{ background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)' }}
              className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between"
            >
              <h3 className="font-brand font-black text-sm sm:text-base text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F5B9C6]" />
                {editingId ? 'Editar Item' : 'Novo Item'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-white/70 hover:text-white font-bold px-2 py-1 transition-colors"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSave} className="bg-[#F6F2F5] p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-[#E6E1DB] shadow-card">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                    Nome do Insumo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Farinha de Trigo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-900 mb-1.5">
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
                      className="flex-1 px-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] transition-all"
                    />
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as any)}
                      className="px-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] transition-all"
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
                  <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                    Alerta Mínimo
                  </label>
                  {/* Unidade PROPRIA, independente da Quantidade: da pra guardar
                      em L e alertar em ml, por exemplo. */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="100"
                      value={minThreshold}
                      onChange={(e) => setMinThreshold(e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs font-normal text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] transition-all"
                    />
                    <select
                      value={minThresholdUnit}
                      onChange={(e) => setMinThresholdUnit(e.target.value as any)}
                      className="px-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] transition-all"
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
                  <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                    Preço Unitário (R$) — Calculado automaticamente
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={costPerUnit}
                    disabled
                    className="w-full px-3 py-2.5 bg-neutral-100 border border-[#E6E1DB] rounded-xl text-xs font-normal text-neutral-400 placeholder:text-neutral-400 focus:outline-none transition-all cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#E6E1DB] text-neutral-700 font-bold text-xs hover:bg-neutral-50 shadow-card active:scale-95 transition-all duration-normal"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6E3F72] hover:bg-[#5A3560] text-white font-brand font-bold text-xs shadow-card flex items-center gap-1 active:scale-95 transition-all duration-normal"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        )}

      {/* Stock Sections - Ordered by Criticality */}
      {sortedItems.length === 0 ? (
        <div className="p-8 rounded-3xl bg-[var(--color-neutral-cream)] border border-[var(--color-neutral-light)] text-center space-y-2 mt-5">
          <Package className="w-10 h-10 text-[var(--color-neutral-warm-gray)] mx-auto" />
          <p className="text-xs text-[var(--color-text-secondary)] font-normal">
            Nenhum insumo encontrado.
          </p>
        </div>
      ) : (
        <div className="space-y-4 px-4 mt-5">
          <div className="grid grid-cols-1 gap-4">
            {sortedItems.map((item) => {
                  // Normalizar unidades antes de comparar
                  const normalizedQty = normalizeToCommonUnit(item.quantity, item.unit, item.minThresholdUnit);
                  const colors = getColorBasedOnThreshold(normalizedQty, item.minThreshold);

                  // Para exibição visual do arco: 0% se abaixo do limite, senão percentual de folga
                  let displayPercentage: number;
                  if (normalizedQty < item.minThreshold) {
                    displayPercentage = 0; // Crítico - abaixo do limite
                  } else {
                    const slack = ((normalizedQty - item.minThreshold) / item.minThreshold) * 100;
                    displayPercentage = Math.min(slack, 100); // Folga máxima de 100%
                  }

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
                          strokeDasharray={`${displayPercentage * (Math.PI * 30 / 100)} ${Math.PI * 30}`}
                        ></path>
                        <text x="38" y="58" textAnchor="middle" fontSize="12" fontWeight="900" fill={colors.stroke} fontFamily="'Manrope', sans-serif">
                          {Math.round(displayPercentage)}%
                        </text>
                      </svg>

                      {/* Right Column: Name + Alert */}
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-brand font-semibold text-[14px] text-[var(--color-neutral-charcoal)]">
                            {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                          </h4>
                          <span style={{ background: colors.background, color: colors.text }} className="text-[7px] font-semibold px-1 py-0.5 rounded uppercase whitespace-nowrap">
                            {getStatusLabel(normalizedQty, item.minThreshold)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#999999] font-light">
                          Alerta quando menor que: {item.minThreshold} {item.minThresholdUnit}
                        </p>

                        {/* Quantity Display + Action Icons Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between', marginTop: '6px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#333', fontFamily: "'Manrope', sans-serif", border: '1px solid #E0E0E0', borderRadius: '20px', padding: '8px 16px', backgroundColor: '#FAFAFA', minWidth: 'fit-content' }}>
                            {item.quantity} {item.unit}
                          </div>

                          {/* Edit/Delete Actions */}
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

      {/* Stock Movements History Section */}
      <div className="mt-8 px-4">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#3A2350]" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Histórico de Movimentações
          </h2>
          <p className="text-xs text-[#7A6E80] mt-1">
            Rastreie todas as consumições, devoluções e reposições automáticas de estoque
          </p>
        </div>
        <StockMovementsHistory />
      </div>
      </div>
    </div>
  );
};

// Arc gauge and lift effect added
// Scale(1.015) on hover with perspective effect
