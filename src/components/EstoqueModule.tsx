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
      {/* fontFamily aqui, no container do "8A", nao em cada texto: e assim que
          a referencia faz — declara Manrope uma vez no card inteiro e so o
          titulo (Instrument Serif) sobrescreve. `font-sans` do Tailwind nao
          serve pra isso porque tailwind.config.ts nao esta com `@config` no
          index.css (Tailwind v4 exige o at-rule); sem ele a classe cai no
          stack padrao do Tailwind, nao no Manrope custom. */}
      <div
        className="overflow-hidden shadow-card"
        style={{
          boxShadow: '0 30px 70px rgba(58,35,80,.26)',
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        {/* Header: eyebrow + contador de estoque baixo, titulo, subtitulo */}
        <div
          className="px-5 flex flex-col gap-2"
          style={{
            background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
            paddingTop: '24px',
            paddingBottom: '90px',
          }}
        >
          <div className="flex items-center justify-between gap-2.5">
            <span
              className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase whitespace-nowrap"
              style={{ letterSpacing: '.06em', color: 'rgba(247,220,225,.85)' }}
            >
              <Package className="w-3.5 h-3.5 shrink-0" style={{ color: '#F5B9C6' }} />
              Estoque de Insumos &amp; Ingredientes
            </span>

            {lowStockCount > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full whitespace-nowrap shrink-0"
                style={{ background: '#C4626F', color: '#FFF8F6' }}
              >
                <AlertTriangle className="w-2.5 h-2.5" style={{ strokeWidth: 2.5 }} />
                {lowStockCount} {lowStockCount === 1 ? 'Estoque Baixo' : 'Estoques Baixos'}
              </span>
            )}
          </div>

          <span
            className="text-white leading-tight"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: '29px',
              lineHeight: '1.1',
            }}
          >
            Controle de Estoque
          </span>

          <span
            className="text-[11px] leading-relaxed"
            style={{ color: 'rgba(247,220,225,.8)' }}
          >
            Acompanhe suas quantidades em gramas, ml e unidades para nunca faltar ingredientes na produção.
          </span>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-4"
          style={{
            marginTop: '-56px',
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

        {/* Search + Adicionar Insumo - lado a lado, flutuando sobre o header */}
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

          {/* Adicionar Insumo */}
          <button
            onClick={handleOpenAdd}
            className="active:scale-95 transition-transform"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#3A2350',
              color: '#F5B9C6',
              fontWeight: 800,
              fontSize: '11px',
              padding: '11px 13px',
              borderRadius: '14px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              boxShadow: '0 8px 16px rgba(58,35,80,.28)',
              border: 'none',
              fontFamily: "'Manrope', sans-serif",
            }}
            title="Adicionar novo insumo"
          >
            <Plus className="w-3.5 h-3.5" style={{ strokeWidth: 3 }} />
            Adicionar Insumo
          </button>
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

                  const isCritical = normalizedQty < item.minThreshold;
                  const step = getThresholdDelta(item.unit);

                  return (
                  <div
                    key={item.id}
                    className="rounded-[22px] p-3.5 flex items-center gap-3 transition-all cursor-pointer"
                    style={{
                      background: isCritical ? '#FDF4F5' : '#FFFFFF',
                      border: isCritical ? '1px solid rgba(196,98,111,.35)' : '1px solid rgba(36,27,43,.06)',
                      boxShadow: '0 8px 20px rgba(58,35,80,.09)',
                    }}
                  >
                    {/* Gauge Left */}
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

                    {/* Right Column: Name + Alert + Stepper */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-brand font-semibold text-[13px]" style={{ color: '#241B2B' }}>
                          {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                        </h4>
                        <span style={{ background: colors.background, color: colors.text }} className="text-[8.5px] font-bold px-[7px] py-[3px] rounded-md uppercase whitespace-nowrap">
                          {getStatusLabel(normalizedQty, item.minThreshold)}
                        </span>
                      </div>
                      <p className="text-[10.5px]" style={{ color: '#7A6E80' }}>
                        Alerta quando menor que: <strong style={{ color: '#241B2B' }}>{item.minThreshold} {item.minThresholdUnit}</strong>
                      </p>

                      {/* Stepper de quantidade + Acoes */}
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <div
                          className="flex items-center"
                          style={{ background: '#F6F2F5', border: '1px solid rgba(36,27,43,.08)', borderRadius: '12px', padding: '2px' }}
                        >
                          <button
                            onClick={() => handleQuickAdjust(item.id, -step)}
                            className="active:scale-95 transition-transform"
                            style={{ width: '26px', height: '26px', borderRadius: '9px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: '#5B4A6B', border: 'none', cursor: 'pointer', boxShadow: '0 2px 5px rgba(58,35,80,.1)' }}
                            title="Diminuir quantidade"
                          >
                            −
                          </button>
                          <span style={{ padding: '0 9px', fontSize: '13px', fontWeight: 800, color: '#241B2B', whiteSpace: 'nowrap' }}>
                            {item.quantity} <span style={{ fontSize: '10px', fontWeight: 600, color: '#8A7E90' }}>{item.unit}</span>
                          </span>
                          <button
                            onClick={() => handleQuickAdjust(item.id, step)}
                            className="active:scale-95 transition-transform"
                            style={{ width: '26px', height: '26px', borderRadius: '9px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: '#5B4A6B', border: 'none', cursor: 'pointer', boxShadow: '0 2px 5px rgba(58,35,80,.1)' }}
                            title="Aumentar quantidade"
                          >
                            +
                          </button>
                        </div>

                        {/* Edit/Delete Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="hover:bg-[#EFE6F0] transition-colors"
                            style={{ width: '28px', height: '28px', borderRadius: '9px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0' }}
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" style={{ color: '#7A6E80', strokeWidth: 2 }} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="hover:bg-[#FBE9EC] transition-colors"
                            style={{ width: '28px', height: '28px', borderRadius: '9px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0' }}
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" style={{ color: '#C4626F', strokeWidth: 2 }} />
                          </button>
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
