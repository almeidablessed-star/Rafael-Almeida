import React, { useState, useEffect } from 'react';
import { FichaTecnica, IngredientUsage, Transaction, TamanhoOpcao } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import { useFichasTecnicas } from '../context/FichasTecnicasContext';
import { useEstoque } from '../context/EstoqueContext';
import { useCosts } from '../context/CostsContext';
import { useUndo } from '../hooks/useUndo';
import { StockItemAutocomplete } from './StockItemAutocomplete';
import { compressImageFile } from '../utils/imageCompression';
import { GenericDeleteConfirmModal } from './GenericDeleteConfirmModal';
import {
  BookOpen,
  Plus,
  Cake,
  Cookie,
  Utensils,
  Image as ImageIcon,
  Upload,
  Trash2,
  Edit3,
  Copy,
  Check,
  X,
  Sparkles,
  PlusCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Helpers para compatibilidade com a nova estrutura de tamanhos
const getPrincipalTamanho = (ficha: FichaTecnica) => {
  return ficha.tamanhos?.[0] || { id: 't1', descricao: '1', preco: 0 };
};

const getYieldInfoCompat = (ficha: FichaTecnica) => {
  return getPrincipalTamanho(ficha).descricao || '1';
};

const getSugestaoVendaCompat = (ficha: FichaTecnica) => {
  return getPrincipalTamanho(ficha).preco || 0;
};

const getTamanhoSelecionado = (ficha: FichaTecnica, selectedTamanhoId?: string) => {
  if (!selectedTamanhoId || !ficha.tamanhos) return getPrincipalTamanho(ficha);
  return ficha.tamanhos.find(t => t.id === selectedTamanhoId) || getPrincipalTamanho(ficha);
};

const getMaoDeObraParaTamanho = (tamanho: TamanhoOpcao, fichaGlobal: number) => {
  return tamanho.maoDeObraCost !== undefined ? tamanho.maoDeObraCost : fichaGlobal;
};

const getCustoParaTamanho = (tamanho: TamanhoOpcao, fichaGlobal: number) => {
  return tamanho.custoCost !== undefined ? tamanho.custoCost : fichaGlobal;
};

const getInvestimentoParaTamanho = (tamanho: TamanhoOpcao, fichaGlobal: number) => {
  return tamanho.investimentoCost !== undefined ? tamanho.investimentoCost : fichaGlobal;
};

// Conversão de unidades para cálculo de custo correto
const convertCostToTargetUnit = (
  costPerUnit: number,
  fromUnit: string,
  toUnit: string
): number => {
  // Mapear unidades para gramas/ml como base
  const toBase: { [key: string]: number } = {
    'g': 1,
    'kg': 1000,
    'ml': 1,
    'L': 1000,
    'un': 1,
    'pacote': 1,
  };

  const fromBase = toBase[fromUnit] || 1;
  const toBase_ = toBase[toUnit] || 1;

  // Converter o custo: se o custo é por "from", converter para "to"
  // Exemplo: R$ 10/kg para grama
  // fromBase = 1000 (1kg = 1000g), toBase_ = 1 (1g = 1g)
  // R$ 10/kg = R$ 10 por 1000g = R$ 0,01 por 1g
  // Fórmula: costPerUnit × (toBase_ / fromBase) = 10 × (1 / 1000) = 0,01 ✅
  return costPerUnit * (toBase_ / fromBase);
};

const DEFAULT_FICHAS: FichaTecnica[] = [
  // Exemplo: Bolo com múltiplos tamanhos
  {
    id: 'f1-example',
    name: 'Bolo Vulcão Ninho com Nutella',
    category: 'bolos',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
    tamanhos: [
      { id: 'ts-1', descricao: '1', preco: 55.00, quantidade: 10 },
      { id: 'ts-2', descricao: '2', preco: 75.00, quantidade: 15 },
      { id: 'ts-3', descricao: '3', preco: 90.00, quantidade: 20 },
    ],
    ingredients: [
      { id: 'i1', name: 'Farinha de Trigo', quantity: 300, unit: 'g', unitCost: 0.005, totalCost: 1.50 },
      { id: 'i2', name: 'Açúcar Refinado', quantity: 250, unit: 'g', unitCost: 0.004, totalCost: 1.00 },
      { id: 'i3', name: 'Cacau em Pó 100%', quantity: 50, unit: 'g', unitCost: 0.0265, totalCost: 1.33 },
      { id: 'i4', name: 'Leite Condensado', quantity: 2, unit: 'un', unitCost: 6.50, totalCost: 13.00 },
      { id: 'i5', name: 'Creme de Leite', quantity: 2, unit: 'un', unitCost: 4.20, totalCost: 8.40 },
      { id: 'i6', name: 'Leite em Pó Ninho', quantity: 100, unit: 'g', unitCost: 0.035, totalCost: 3.50 },
      { id: 'i7', name: 'Nutella Original', quantity: 150, unit: 'g', unitCost: 0.048, totalCost: 7.20 },
    ],
    maoDeObraCost: 20.00,
    custoCost: 5.00,
    investimentoCost: 5.00,
  },
  // Novas fichas serão adicionadas via Supabase
];

export function getStoredFichas(): FichaTecnica[] {
  try {
    const data = localStorage.getItem('carula_fichas_tecnicas');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading fichas tecnicas from localStorage:', e);
  }
  return DEFAULT_FICHAS;
}

export function saveStoredFichas(fichas: FichaTecnica[]) {
  try {
    localStorage.setItem('carula_fichas_tecnicas', JSON.stringify(fichas));
  } catch (e) {
    console.error('Error saving fichas tecnicas to localStorage:', e);
  }
}

interface FichasTecnicasModuleProps {
  onAddTransaction?: (txData: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onNavigateToTab?: (tab: any) => void;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string; tagBg: string }> = {
  bolos: { label: 'Bolos & Massas', icon: '🎂', tagBg: 'bg-[var(--color-pastry-pink)] text-[var(--color-pastry-chocolate)]' },
  doces: { label: 'Doces & Sobremesas', icon: '🧁', tagBg: 'bg-[var(--color-pastry-lavender)] text-[var(--color-pastry-chocolate)]' },
  salgados: { label: 'Salgados & Lanches', icon: '🥟', tagBg: 'bg-[var(--color-pastry-sage)] text-[var(--color-pastry-chocolate)]' },
  saudaveis: { label: 'Saudáveis & Fit', icon: '🥗', tagBg: 'bg-[var(--color-pastry-sage)] text-[var(--color-pastry-chocolate)]' },
  kids: { label: 'Kids Friendly', icon: '🧸', tagBg: 'bg-[var(--color-pastry-yellow)] text-[var(--color-pastry-chocolate)]' },
};

const PALETTE_BG_CLASSES = [
  'bg-[var(--color-pastry-sage)] border-[var(--color-text-muted)]', // Verde Sálvia
  'bg-[var(--color-pastry-lavender)] border-[var(--color-pastry-light-pink)]/40', // Lavanda
  'bg-[var(--color-pastry-pink)] border-[var(--color-pastry-light-pink)]',    // Rosa Soft
  'bg-[var(--color-pastry-yellow)] border-[var(--color-pastry-light-pink)]/40', // Amarelo Manteiga
];

export const FichasTecnicasModule: React.FC<FichasTecnicasModuleProps> = ({
  onAddTransaction,
  onNavigateToTab,
}) => {
  const { formatCurrency: formatMoney } = useCurrency();
  const { fichas, isLoading: isLoadingFichas, error: fichasError, addFicha, updateFicha, deleteFicha, restoreFicha, fetchFichaPhoto } = useFichasTecnicas();
  const { estoque } = useEstoque();

  // Tarifa sugerida, vinda de Custos Administrativos. Só PREENCHE tamanhos
  // novos; cada tamanho continua editável, porque a hora varia por bolo — um
  // decorado vale mais que um simples. Ficha ja salva nunca e alterada por
  // mudanca nesta sugestao.
  const { administrativeCosts } = useCosts();
  const tarifaSugerida = administrativeCosts?.horaTrabalho
    ? String(administrativeCosts.horaTrabalho)
    : '';
  const { saveForUndo, getUndoData } = useUndo();
  const [selectedCategory, setSelectedCategory] = useState<'bolos' | 'doces' | 'salgados' | 'saudaveis' | 'kids'>('bolos');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingFicha, setDeletingFicha] = useState<FichaTecnica | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [expandedFichaId, setExpandedFichaId] = useState<string | null>(null);
  const [launchSuccessMsg, setLaunchSuccessMsg] = useState<string | null>(null);
  const [expandedTamanhosId, setExpandedTamanhosId] = useState<string | null>(null);
  const [selectedTamanhoIdByFicha, setSelectedTamanhoIdByFicha] = useState<Record<string, string>>({}); // Rastreia tamanho selecionado por ficha

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'bolos' | 'doces' | 'salgados' | 'saudaveis' | 'kids'>('bolos');
  const [imageUrl, setImageUrl] = useState('');
  const [yieldInfo, setYieldInfo] = useState('');
  const [selectedYieldUnit, setSelectedYieldUnit] = useState<string>('fatias');

  const handleApplyYieldUnit = (unitKey: string) => {
    setSelectedYieldUnit(unitKey);
    const unitLabels: Record<string, string> = {
      fatias: 'fatias',
      gramas: 'g',
      unidades: 'unidades',
      ml: 'ml',
    };
    const label = unitLabels[unitKey] || unitKey;
    if (!yieldInfo || yieldInfo.trim() === '') {
      setYieldInfo(`10 ${label}`);
      return;
    }
    const match = yieldInfo.match(/^[\d.,]+/);
    if (match) {
      setYieldInfo(`${match[0]} ${label}`);
    } else {
      setYieldInfo(`${yieldInfo} ${label}`);
    }
  };
  const [ingredients, setIngredients] = useState<IngredientUsage[]>([
    { id: '1', name: 'Farinha de Trigo', quantity: 200, unit: 'g', unitCost: 0.005, totalCost: 1.00 },
  ]);
  const [reposicaoCost, setReposicaoCost] = useState('0');
  // Custos globais - mantidos como defaults, não editáveis via UI
  const maoDeObraCost = '0';
  const custoCost = '0';
  const investimentoCost = '0';

  // Estado para gerenciar múltiplos tamanhos
  const [tamanhos, setTamanhos] = useState<Array<{
    id: string;
    descricao: string;
    preco: string;
    horasTrabalho: string;
    valorHora: string;
    maoDeObraCost: string;
    custoCost: string;
    investimentoCost: string;
  }>>([
    { id: 'ts-1', descricao: '1', preco: '55', horasTrabalho: '', valorHora: '', maoDeObraCost: '20', custoCost: '5', investimentoCost: '5' },
    { id: 'ts-2', descricao: '2', preco: '75', horasTrabalho: '', valorHora: '', maoDeObraCost: '20', custoCost: '5', investimentoCost: '5' },
    { id: 'ts-3', descricao: '3', preco: '90', horasTrabalho: '', valorHora: '', maoDeObraCost: '20', custoCost: '5', investimentoCost: '5' },
  ]);

  // Fichas são agora gerenciadas pelo hook useFichasTecnicas (salva no Supabase)

  const totalReposicao = ingredients.reduce((sum, ing) => sum + (ing.totalCost || 0), 0);
  const repoNum = parseFloat(reposicaoCost.replace(',', '.')) || 0;

  /**
   * Mão de obra de um tamanho: horas x tarifa.
   *
   * Sem horas ou sem tarifa, devolve o valor que ja estava gravado — e o que
   * mantem valida uma ficha cadastrada antes destes campos existirem.
   */
  const calcularMaoDeObra = (t: { horasTrabalho: string; valorHora: string; maoDeObraCost: string }) => {
    const horas = parseFloat((t.horasTrabalho || '').replace(',', '.')) || 0;
    const tarifa = parseFloat((t.valorHora || '').replace(',', '.')) || 0;
    const calculada = horas * tarifa;
    return calculada > 0 ? calculada : parseFloat((t.maoDeObraCost || '').replace(',', '.')) || 0;
  };

  const handleOpenAdd = () => {
    setName('');
    setCategory(selectedCategory);
    setImageUrl('');
    setYieldInfo('1');
    setIngredients([{ id: '1', name: 'Farinha de Trigo', quantity: 200, unit: 'g', unitCost: 0.005, totalCost: 1.00 }]);
    setReposicaoCost('0');
    setTamanhos([
      { id: 'ts-1', descricao: '1', preco: '55', horasTrabalho: '', valorHora: tarifaSugerida, maoDeObraCost: '20', custoCost: '5', investimentoCost: '5' },
      { id: 'ts-2', descricao: '2', preco: '75', horasTrabalho: '', valorHora: tarifaSugerida, maoDeObraCost: '20', custoCost: '5', investimentoCost: '5' },
      { id: 'ts-3', descricao: '3', preco: '90', horasTrabalho: '', valorHora: tarifaSugerida, maoDeObraCost: '20', custoCost: '5', investimentoCost: '5' },
    ]);
    setEditingId(null);
    setIsCreating(true);
  };

  const handleOpenEdit = async (ficha: FichaTecnica) => {
    setName(ficha.name);
    setCategory(ficha.category);
    setImageUrl(ficha.imageUrl || '');
    setYieldInfo(getYieldInfoCompat(ficha));
    setIngredients(ficha.ingredients || []);
    setReposicaoCost((ficha.reposicaoCost || 0).toString());

    // Carregar tamanhos da ficha, convertendo para string
    if (ficha.tamanhos && ficha.tamanhos.length > 0) {
      setTamanhos(
        ficha.tamanhos.map((t) => ({
          id: t.id,
          descricao: t.descricao,
          preco: (t.preco || 0).toString(),
          // Ficha antiga nao tem horas nem tarifa: os campos abrem VAZIOS e o
          // `maoDeObraCost` gravado e preservado como esta. Preencher com zero
          // faria a conta zerar a mao de obra que ela ja tinha definido.
          horasTrabalho: t.horasTrabalho != null ? String(t.horasTrabalho) : '',
          valorHora: t.valorHora != null ? String(t.valorHora) : '',
          maoDeObraCost: (t.maoDeObraCost || 0).toString(),
          custoCost: (t.custoCost || 0).toString(),
          investimentoCost: (t.investimentoCost || 0).toString(),
        }))
      );
    } else {
      // Se não há tamanhos, usar padrão
      setTamanhos([
        { id: 'ts-1', descricao: '1', preco: '0', horasTrabalho: '', valorHora: '', maoDeObraCost: '0', custoCost: '0', investimentoCost: '0' },
        { id: 'ts-2', descricao: '2', preco: '0', horasTrabalho: '', valorHora: '', maoDeObraCost: '0', custoCost: '0', investimentoCost: '0' },
        { id: 'ts-3', descricao: '3', preco: '0', horasTrabalho: '', valorHora: '', maoDeObraCost: '0', custoCost: '0', investimentoCost: '0' },
      ]);
    }

    setEditingId(ficha.id);
    setIsCreating(true);

    if (!ficha.imageUrl) {
      const imageUrl = await fetchFichaPhoto(ficha.id);
      if (imageUrl) setImageUrl(imageUrl);
    }
  };

  const handleAddIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { id: Date.now().toString(), name: '', quantity: 0, unit: 'g', unitCost: 0, totalCost: 0 },
    ]);
  };

  const handleUpdateIngredient = (id: string, field: keyof IngredientUsage, val: any) => {
    setIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id !== id) return ing;
        const updated = { ...ing, [field]: val };

        // Se está atualizando o nome do ingrediente (seleção via autocomplete)
        if (field === 'name') {
          const stockItem = estoque.find(item => item.name.toLowerCase() === val.toLowerCase());
          if (stockItem && stockItem.costPerUnit > 0) {
            // Converter o custo para a unidade da ficha
            const convertedCost = convertCostToTargetUnit(stockItem.costPerUnit, stockItem.unit, ing.unit);
            updated.unitCost = convertedCost;
            updated.totalCost = ing.quantity * convertedCost;
          }
        }

        // Se está atualizando quantidade ou unitCost
        if (field === 'quantity' || field === 'unitCost') {
          const q = field === 'quantity' ? parseFloat(val) || 0 : ing.quantity;
          const c = field === 'unitCost' ? parseFloat(val) || 0 : ing.unitCost;
          updated.totalCost = q * c;
        }
        return updated;
      })
    );
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateTamanho = (id: string, field: string, value: string) => {
    setTamanhos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleAddTamanho = () => {
    const newId = `ts-${Date.now()}`;
    setTamanhos((prev) => [
      ...prev,
      {
        id: newId,
        descricao: `${prev.length + 1}`,
        preco: '0',
        // Repete a tarifa do tamanho anterior: quem cadastra varios tamanhos do
        // mesmo bolo costuma cobrar a mesma hora, e so as horas mudam.
        horasTrabalho: '',
        valorHora: prev[prev.length - 1]?.valorHora || tarifaSugerida,
        maoDeObraCost: maoDeObraCost,
        custoCost: custoCost,
        investimentoCost: investimentoCost,
      },
    ]);
  };

  const handleRemoveTamanho = (id: string) => {
    if (tamanhos.length > 1) {
      setTamanhos((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleSaveFicha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Converter tamanhos do formulário para TamanhoOpcao
    const tamanhosData: TamanhoOpcao[] = tamanhos.map((t) => {
      const horas = parseFloat(t.horasTrabalho) || 0;
      const tarifa = parseFloat(t.valorHora) || 0;
      const maoDeObraCalculada = horas * tarifa;

      return {
        id: t.id,
        descricao: t.descricao,
        preco: parseFloat(t.preco) || 0,
        horasTrabalho: horas > 0 ? horas : undefined,
        valorHora: tarifa > 0 ? tarifa : undefined,
        // Com horas e tarifa preenchidas, a mao de obra vem da conta. Sem elas,
        // o valor que ja estava gravado e PRESERVADO — do contrario abrir uma
        // ficha antiga e salvar zeraria a mao de obra dela sem aviso.
        maoDeObraCost: maoDeObraCalculada > 0
          ? maoDeObraCalculada
          : parseFloat(t.maoDeObraCost) || 0,
        custoCost: parseFloat(t.custoCost) || 0,
        investimentoCost: parseFloat(t.investimentoCost) || 0,
      };
    });

    const fichaData: Omit<FichaTecnica, 'id' | 'createdAt'> = {
      name: name.trim(),
      category,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
      tamanhos: tamanhosData,
      ingredients,
      reposicaoCost: parseFloat(reposicaoCost) || 0,
      maoDeObraCost: parseFloat(maoDeObraCost) || 0,
      custoCost: parseFloat(custoCost) || 0,
      investimentoCost: parseFloat(investimentoCost) || 0,
    };

    try {
      if (editingId) {
        await updateFicha(editingId, fichaData);
      } else {
        await addFicha(fichaData);
      }
      setIsCreating(false);
      setEditingId(null);
    } catch (err) {
      alert('Erro ao salvar ficha técnica: ' + (err as any).message);
    }
  };

  const handleDelete = (ficha: FichaTecnica) => {
    setDeletingFicha(ficha);
  };

  const handleConfirmDelete = async (id: string) => {
    const fichaToDelete = fichas.find(f => f.id === id);
    if (!fichaToDelete) return;

    try {
      saveForUndo({ type: 'ficha', data: fichaToDelete });
      await deleteFicha(id);
      setShowUndoToast(true);
      setTimeout(() => setShowUndoToast(false), 10000);
    } catch (err: any) {
      console.error('Erro ao deletar:', err);
      alert('Erro ao deletar ficha técnica: ' + (err.message || JSON.stringify(err)));
    }
  };

  const handleUndo = async () => {
    const undoData = getUndoData();
    if (undoData && undoData.type === 'ficha') {
      try {
        await restoreFicha(undoData.data);
        setShowUndoToast(false);
      } catch (err: any) {
        console.error('Erro ao restaurar:', err);
        alert('Erro ao restaurar ficha técnica: ' + (err.message || JSON.stringify(err)));
      }
    }
  };

  const handleDuplicate = async (fichaToDup: FichaTecnica) => {
    try {
      const fichaData: Omit<FichaTecnica, 'id' | 'createdAt'> = {
        name: `${fichaToDup.name} (Cópia)`,
        category: fichaToDup.category,
        imageUrl: fichaToDup.imageUrl,
        tamanhos: fichaToDup.tamanhos,
        ingredients: (fichaToDup.ingredients || []).map((ing, idx) => ({ ...ing, id: `${Date.now()}_${idx}` })),
        reposicaoCost: fichaToDup.reposicaoCost,
        maoDeObraCost: fichaToDup.maoDeObraCost,
        custoCost: fichaToDup.custoCost,
        investimentoCost: fichaToDup.investimentoCost,
      };
      await addFicha(fichaData);
      setLaunchSuccessMsg(`Ficha "${fichaToDup.name}" duplicada com sucesso!`);
      setTimeout(() => setLaunchSuccessMsg(null), 3500);
    } catch (err) {
      alert('Erro ao duplicar ficha: ' + (err as any).message);
    }
  };

  const handleLaunchSaleFromFicha = (ficha: FichaTecnica) => {
    if (!onAddTransaction) return;
    const today = new Date().toISOString().split('T')[0];
    const repoTotal = (ficha.ingredients || []).reduce((acc, i) => acc + (i.totalCost || 0), 0);

    onAddTransaction({
      type: 'venda',
      description: `${ficha.name} (${getYieldInfoCompat(ficha)}) - Ficha Técnica`,
      quantity: 1,
      unitValue: getSugestaoVendaCompat(ficha),
      totalValue: getSugestaoVendaCompat(ficha),
      date: today,
      paymentStatus: 'pago',
      notes: `Lançado via Ficha Técnica. Reposição: ${formatMoney(repoTotal)}, Mão de Obra: ${formatMoney(ficha.maoDeObraCost)}, Custo/Invest: ${formatMoney((ficha.custoCost || 0) + (ficha.investimentoCost || 0))}`,
    });

    setLaunchSuccessMsg(`Venda de "${ficha.name}" no valor de ${formatMoney(getSugestaoVendaCompat(ficha))} lançada com sucesso no Caixa!`);
    setTimeout(() => setLaunchSuccessMsg(null), 4000);
  };

  const filteredFichas = fichas.filter((f) => f.category === selectedCategory);

  return (
    <div className="space-y-0 pb-12 animate-fadeIn" style={{ background: '#F6F2F5', minHeight: '100vh' }}>
      {/* Header - Roxo Gradiente */}
      <div
        className="overflow-hidden shadow-card"
        style={{
          boxShadow: '0 30px 70px rgba(58,35,80,.26)',
          background: '#F6F2F5',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '-100px',
          paddingBottom: '100px',
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
            Fichas Técnicas
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
            title="Adicionar nova ficha"
          >
            Nova Ficha
          </button>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-4"
          style={{
            marginTop: '-70px',
            background: '#FFFFFF',
            borderRadius: '28px 28px 0 0',
            position: 'relative',
            padding: '20px',
            marginLeft: 'calc(-50vw + 50%)',
            marginRight: 'calc(-50vw + 50%)',
            paddingLeft: 'calc(20px + max(0px, env(safe-area-inset-left)))',
            paddingRight: 'calc(20px + max(0px, env(safe-area-inset-right)))',
            zIndex: 50,
            boxShadow: 'inset 0 -8px 16px rgba(58,35,80,.06), inset 0 8px 16px rgba(58,35,80,.06)',
          }}
        >

      {launchSuccessMsg && (
        <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)] text-[var(--color-primary)] text-xs p-3.5 rounded-lg flex items-center gap-2.5 animate-fadeIn shadow-card">
          <Check className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
          <span className="font-bold">{launchSuccessMsg}</span>
        </div>
      )}

      {/* Category Tabs Bar - Flex wrap with 2 lines */}
      <div
        className="flex flex-wrap gap-[7px] bg-white rounded-[20px] p-[10px]"
        style={{
          boxShadow: '0 6px 16px rgba(58,35,80,.07)',
        }}
      >
        {/* Bolos (Selected) */}
        <span
          onClick={() => setSelectedCategory('bolos')}
          className="flex-shrink-0 cursor-pointer transition-all"
          style={{
            fontSize: '10.5px',
            fontWeight: selectedCategory === 'bolos' ? 800 : 700,
            color: selectedCategory === 'bolos' ? '#FFFFFF' : '#5B4A6B',
            background: selectedCategory === 'bolos' ? 'linear-gradient(140deg,#6E3F72,#A85E86)' : '#FFFFFF',
            borderBottom: selectedCategory === 'bolos' ? '2px solid transparent' : '2px solid #E3D8E5',
            padding: '8px 12px',
            borderRadius: '12px 12px 4px 4px',
            boxShadow: selectedCategory === 'bolos' ? '0 8px 16px rgba(110,63,114,.32)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (selectedCategory !== 'bolos') {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 18px rgba(58,35,80,.16)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            if (selectedCategory !== 'bolos') {
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          🎂 Bolos
        </span>

        {/* Doces & Sobremesas */}
        <span
          onClick={() => setSelectedCategory('doces')}
          className="flex-shrink-0 cursor-pointer transition-all"
          style={{
            fontSize: '10.5px',
            fontWeight: selectedCategory === 'doces' ? 700 : 600,
            color: selectedCategory === 'doces' ? '#FFFFFF' : '#5B4A6B',
            background: selectedCategory === 'doces' ? 'linear-gradient(140deg,#6E3F72,#A85E86)' : '#FFFFFF',
            borderBottom: selectedCategory === 'doces' ? '2px solid transparent' : '2px solid #E3D8E5',
            padding: '8px 12px',
            borderRadius: '12px 12px 4px 4px',
            boxShadow: selectedCategory === 'doces' ? '0 8px 16px rgba(110,63,114,.32)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (selectedCategory !== 'doces') {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 18px rgba(58,35,80,.16)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            if (selectedCategory !== 'doces') {
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          🧁 Doces & Sobremesas
        </span>

        {/* Salgados */}
        <span
          onClick={() => setSelectedCategory('salgados')}
          className="flex-shrink-0 cursor-pointer transition-all"
          style={{
            fontSize: '10.5px',
            fontWeight: selectedCategory === 'salgados' ? 700 : 600,
            color: selectedCategory === 'salgados' ? '#FFFFFF' : '#5B4A6B',
            background: selectedCategory === 'salgados' ? 'linear-gradient(140deg,#6E3F72,#A85E86)' : '#FFFFFF',
            borderBottom: selectedCategory === 'salgados' ? '2px solid transparent' : '2px solid #E3D8E5',
            padding: '8px 12px',
            borderRadius: '12px 12px 4px 4px',
            boxShadow: selectedCategory === 'salgados' ? '0 8px 16px rgba(110,63,114,.32)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (selectedCategory !== 'salgados') {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 18px rgba(58,35,80,.16)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            if (selectedCategory !== 'salgados') {
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          🥟 Salgados
        </span>

        {/* Saudáveis & Fit */}
        <span
          onClick={() => setSelectedCategory('saudaveis')}
          className="flex-shrink-0 cursor-pointer transition-all"
          style={{
            fontSize: '10.5px',
            fontWeight: selectedCategory === 'saudaveis' ? 700 : 600,
            color: selectedCategory === 'saudaveis' ? '#FFFFFF' : '#5B4A6B',
            background: selectedCategory === 'saudaveis' ? 'linear-gradient(140deg,#6E3F72,#A85E86)' : '#FFFFFF',
            borderBottom: selectedCategory === 'saudaveis' ? '2px solid transparent' : '2px solid #E3D8E5',
            padding: '8px 12px',
            borderRadius: '12px 12px 4px 4px',
            boxShadow: selectedCategory === 'saudaveis' ? '0 8px 16px rgba(110,63,114,.32)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (selectedCategory !== 'saudaveis') {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 18px rgba(58,35,80,.16)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            if (selectedCategory !== 'saudaveis') {
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          🥗 Saudáveis & Fit
        </span>

        {/* Kids Friendly */}
        <span
          onClick={() => setSelectedCategory('kids')}
          className="flex-shrink-0 cursor-pointer transition-all"
          style={{
            fontSize: '10.5px',
            fontWeight: selectedCategory === 'kids' ? 700 : 600,
            color: selectedCategory === 'kids' ? '#FFFFFF' : '#5B4A6B',
            background: selectedCategory === 'kids' ? 'linear-gradient(140deg,#6E3F72,#A85E86)' : '#FFFFFF',
            borderBottom: selectedCategory === 'kids' ? '2px solid transparent' : '2px solid #E3D8E5',
            padding: '8px 12px',
            borderRadius: '12px 12px 4px 4px',
            boxShadow: selectedCategory === 'kids' ? '0 8px 16px rgba(110,63,114,.32)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (selectedCategory !== 'kids') {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 18px rgba(58,35,80,.16)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            if (selectedCategory !== 'kids') {
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          🧸 Kids Friendly
        </span>
      </div>

      {/* Editor Modal / Form */}
      {isCreating && (
        <form onSubmit={handleSaveFicha} className="bg-white rounded-[32px] p-5 sm:p-6 border-2 border-[var(--color-pastry-light-pink)] shadow-xl space-y-4 animate-slideUp" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.98), #FFFFFF)' }}>
          <div style={{ background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)', borderRadius: '20px 20px 0 0', padding: '20px', margin: '-20px -20px 16px -20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Sparkles className="w-5 h-5 text-[#F5B9C6]" />
              {editingId ? 'Editar Ficha Técnica' : 'Criar Nova Ficha Técnica'}
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[var(--color-pastry-chocolate)] mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Nome do Pedido *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Bolo Vulcão Ninho com Nutella"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3E9F3] text-xs font-bold text-[var(--color-pastry-chocolate)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-pastry-chocolate)] mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3E9F3] text-xs font-extrabold text-[var(--color-pastry-chocolate)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] bg-white"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                <option value="bolos">🎂 Bolos & Massas</option>
                <option value="doces">🧁 Doces & Sobremesas</option>
                <option value="salgados">🥟 Salgados & Lanches</option>
                <option value="saudaveis">🥗 Saudáveis & Fit</option>
                <option value="kids">🧸 Kids Friendly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-pastry-chocolate)] mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Rendimento *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ex: 10 ou 500"
                  value={yieldInfo}
                  onChange={(e) => setYieldInfo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3E9F3] text-xs font-bold text-[var(--color-pastry-chocolate)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                style={{ fontFamily: "'Manrope', sans-serif" }}
                />

                <select
                  value={selectedYieldUnit}
                  onChange={(e) => handleApplyYieldUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3E9F3] text-xs font-extrabold text-[var(--color-pastry-chocolate)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] bg-white cursor-pointer"
                style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  <option value="fatias">🍰 Fatias</option>
                  <option value="gramas">⚖️ Gramas (g)</option>
                  <option value="unidades">📦 Unidades</option>
                  <option value="ml">🥛 ML</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-pastry-chocolate)] mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Foto
              </label>
              <div className="flex items-center gap-2.5">
                {imageUrl ? (
                  <div className="relative w-11 h-11 rounded-xl border-2 border-[var(--color-pastry-light-pink)] overflow-hidden shrink-0 shadow-card group">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-0 right-0 bg-semantic-error-600 text-white p-0.5 rounded-bl text-[9px] font-black hover:bg-semantic-error-700 transition cursor-pointer"
                      title="Remover Foto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[var(--color-pastry-cream)] border border-[var(--color-pastry-light-pink)]/50 flex items-center justify-center shrink-0 text-[var(--color-pastry-chocolate)]/40">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}

                <label className="flex-1 px-4 py-2.5 bg-[var(--color-pastry-chocolate)] hover:bg-black text-[var(--color-pastry-pink)] rounded-xl text-xs font-bold cursor-pointer text-center shadow-card transition-all active:scale-95 flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4 text-[var(--color-pastry-pink)]" />
                  <span>Escolher Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageUrl(await compressImageFile(file));
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* INGREDIENTS LIST BUILDER */}
          <div className="bg-[var(--color-pastry-cream)] p-4 rounded-lg border border-[var(--color-pastry-light-pink)]/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-[var(--color-pastry-chocolate)]">
                Ingredientes ({ingredients.length})
              </span>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="text-xs font-bold text-[var(--color-pastry-chocolate)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-[var(--color-pastry-light-pink)]" />
                <span>Adicionar</span>
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing) => (
                <div key={ing.id} className="bg-white p-2.5 rounded-xl border border-[var(--color-pastry-light-pink)]/30 grid grid-cols-12 gap-2 text-xs">
                  <div className="col-span-12">
                    <StockItemAutocomplete
                      value={ing.name}
                      onChange={(val) => handleUpdateIngredient(ing.id, 'name', val)}
                      onSelect={() => {}}
                      stockItems={estoque}
                      isEnabled={true}
                      placeholder="Ingrediente (ex: Cacau)"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      placeholder="Qtd"
                      value={ing.quantity}
                      onChange={(e) => handleUpdateIngredient(ing.id, 'quantity', e.target.value)}
                      className="w-full px-1.5 py-1 border border-[#F3E9F3] rounded-lg text-xs font-bold text-center"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={ing.unit}
                      onChange={(e) => handleUpdateIngredient(ing.id, 'unit', e.target.value)}
                      className="w-full px-1 py-1 border border-[#F3E9F3] rounded-lg text-[10px] font-bold"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="un">un</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                  <div className="col-span-5 text-right flex flex-col justify-center">
                    <span className="text-[10px] text-neutral-500 block">Custo Gasto</span>
                    <span className="font-black text-xs text-[var(--color-pastry-chocolate)]">
                      {formatMoney(ing.totalCost || 0)}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end items-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(ing.id)}
                      className="p-1 text-neutral-400 hover:text-semantic-error-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[var(--color-pastry-light-pink)]/30 flex items-center justify-between text-xs font-bold text-[var(--color-pastry-chocolate)]">
              <span>Total Reposição (Ingredientes):</span>
              <span className="font-extrabold text-sm text-[var(--color-pastry-chocolate)]">
                {formatMoney(totalReposicao)}
              </span>
            </div>
          </div>


          {/* TAMANHOS E PREÇOS */}
          <div className="bg-[var(--color-pastry-cream)] p-4 rounded-lg border border-[var(--color-pastry-light-pink)]/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-[var(--color-pastry-chocolate)]">
                Tamanhos & Preços ({tamanhos.length})
              </span>
              <button
                type="button"
                onClick={handleAddTamanho}
                className="text-xs font-bold text-[var(--color-pastry-chocolate)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-[var(--color-pastry-light-pink)]" />
                <span>Adicionar</span>
              </button>
            </div>

            <div className="space-y-2">
              {tamanhos.map((tamanho) => (
                <div key={tamanho.id} className="bg-white p-2.5 rounded-xl border border-[var(--color-pastry-light-pink)]/30 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--color-pastry-chocolate)] mb-1">
                        Descrição
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 1, 2, 3"
                        value={tamanho.descricao}
                        onChange={(e) => handleUpdateTamanho(tamanho.id, 'descricao', e.target.value)}
                        className="w-full px-2 py-1.5 border border-[#F3E9F3] rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--color-pastry-chocolate)] mb-1">
                        Preço ($)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={tamanho.preco}
                        onChange={(e) => handleUpdateTamanho(tamanho.id, 'preco', e.target.value)}
                        className="w-full px-2 py-1.5 border border-[#F3E9F3] rounded-lg text-xs font-bold text-center"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      />
                    </div>
                  </div>

                  {/* MÃO DE OBRA — horas x tarifa.
                      Era um valor em reais digitado direto. Agora ela informa
                      quanto tempo o bolo leva e quanto cobra pela hora NESTE
                      bolo (um decorado vale mais por hora que um simples), e o
                      app faz a conta. */}
                  <div className="grid grid-cols-3 gap-2 text-xs items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--color-pastry-chocolate)] mb-1">
                        Horas
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={tamanho.horasTrabalho}
                        onChange={(e) => handleUpdateTamanho(tamanho.id, 'horasTrabalho', e.target.value)}
                        className="w-full px-2 py-1.5 border border-[#F3E9F3] rounded-lg text-xs font-bold text-center"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--color-pastry-chocolate)] mb-1">
                        $ / hora
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={tamanho.valorHora}
                        onChange={(e) => handleUpdateTamanho(tamanho.id, 'valorHora', e.target.value)}
                        className="w-full px-2 py-1.5 border border-[#F3E9F3] rounded-lg text-xs font-bold text-center"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--color-pastry-chocolate)] mb-1">
                        Mão de Obra
                      </label>
                      <div
                        className="w-full px-2 py-1.5 rounded-lg text-xs font-bold text-center"
                        style={{ background: '#F6F2F5', color: '#3A2350', fontFamily: "'Manrope', sans-serif" }}
                        title="Horas × valor da hora"
                      >
                        {formatMoney(calcularMaoDeObra(tamanho))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--color-pastry-chocolate)] mb-1">
                        Custo ($)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={tamanho.custoCost}
                        onChange={(e) => handleUpdateTamanho(tamanho.id, 'custoCost', e.target.value)}
                        className="w-full px-2 py-1.5 border border-[#F3E9F3] rounded-lg text-xs font-bold text-center"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--color-pastry-chocolate)] mb-1">
                        Investimento ($)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={tamanho.investimentoCost}
                        onChange={(e) => handleUpdateTamanho(tamanho.id, 'investimentoCost', e.target.value)}
                        className="w-full px-2 py-1.5 border border-[#F3E9F3] rounded-lg text-xs font-bold text-center"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      />
                    </div>
                  </div>

                  {/* A CONTA ABERTA — de onde vem cada real deste tamanho.
                      Os quatro numeros ja existiam espalhados pelo formulario,
                      mas nada os somava nem comparava com o preco: dava para
                      cadastrar um bolo que custa mais do que vende sem nada na
                      tela avisar. Custo fixo NAO entra aqui de proposito — ele
                      vive na meta semanal do Inicio, porque ratear por bolo
                      exigiria supor um volume mensal que ninguem sabe. */}
                  {(() => {
                    const insumos = totalReposicao + repoNum;
                    const mdo = calcularMaoDeObra(tamanho);
                    const cus = parseFloat((tamanho.custoCost || '').replace(',', '.')) || 0;
                    const inv = parseFloat((tamanho.investimentoCost || '').replace(',', '.')) || 0;
                    const custoTotal = insumos + mdo + cus + inv;
                    const preco = parseFloat((tamanho.preco || '').replace(',', '.')) || 0;
                    const margem = preco - custoTotal;
                    const margemPct = preco > 0 ? (margem / preco) * 100 : 0;
                    const noPrejuizo = preco > 0 && margem < 0;

                    return (
                      <div
                        className="rounded-lg px-2.5 py-2 text-[10px] space-y-1"
                        style={{ background: '#FAF7FA', border: '1px solid #F3E9F3' }}
                      >
                        <div className="flex justify-between" style={{ color: '#7A6E80' }}>
                          <span>Insumos</span><span>{formatMoney(insumos)}</span>
                        </div>
                        <div className="flex justify-between" style={{ color: '#7A6E80' }}>
                          <span>Mão de obra</span><span>{formatMoney(mdo)}</span>
                        </div>
                        <div className="flex justify-between" style={{ color: '#7A6E80' }}>
                          <span>Custo + investimento</span><span>{formatMoney(cus + inv)}</span>
                        </div>
                        <div
                          className="flex justify-between font-bold pt-1"
                          style={{ borderTop: '1px solid #EDE6EF', color: '#3A2350' }}
                        >
                          <span>Custo total</span><span>{formatMoney(custoTotal)}</span>
                        </div>
                        <div className="flex justify-between font-bold" style={{ color: '#3A2350' }}>
                          <span>Preço</span><span>{formatMoney(preco)}</span>
                        </div>
                        <div
                          className="flex justify-between font-bold"
                          style={{ color: noPrejuizo ? '#C4626F' : '#4CAF7D' }}
                        >
                          <span>{noPrejuizo ? '⚠️ Prejuízo' : 'Sobra'}</span>
                          <span>
                            {formatMoney(margem)}
                            {preco > 0 && ` (${margemPct.toFixed(0)}%)`}
                          </span>
                        </div>
                        {noPrejuizo && (
                          <p style={{ color: '#C4626F', lineHeight: 1.4 }}>
                            Este tamanho custa mais do que você cobra por ele.
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {tamanhos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTamanho(tamanho.id)}
                      className="w-full text-xs font-bold text-semantic-error-600 hover:bg-semantic-error-50 py-1 rounded cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                      Remover
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* TOTAL SUGGESTED SELLING PRICE */}
          <div className="bg-[var(--color-pastry-chocolate)] p-4 rounded-lg text-white flex items-center justify-between">
            <div>
              <span className="label-sm tracking-wider text-[var(--color-pastry-pink)] block">
                Sugestão de Preço de Venda
              </span>
              <span className="font-marca text-3xl font-black text-[var(--color-pastry-cream)]">
                {formatMoney(repoNum)}
              </span>
            </div>
            <div className="text-right text-[11px] text-[var(--color-pastry-cream)]/80 font-medium">
              Total de Ingredientes
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[var(--color-pastry-chocolate)] hover:bg-black text-[var(--color-pastry-pink)] font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              Salvar Ficha Técnica
            </button>
          </div>
        </form>
      )}

      {/* FICHAS CARDS LIST - SEGUINDO FIELMENTE O DESIGN DE REFERÊNCIA */}
      <div className="space-y-3">
        {filteredFichas.length === 0 ? (
          <div className="p-8 rounded-[32px] bg-white border border-dashed border-[var(--color-pastry-light-pink)]/50 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-[var(--color-pastry-chocolate)]/40 mx-auto" />
            <p className="text-xs text-[var(--color-pastry-chocolate)]/70 font-semibold">
              Nenhuma ficha técnica cadastrada neste setor.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-full bg-[var(--color-pastry-chocolate)] text-[var(--color-pastry-pink)] text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              + Adicionar Primeira Ficha
            </button>
          </div>
        ) : (
          filteredFichas.map((ficha) => {
            // Converter descrição de tamanho quando exibir
            const getTamanhoDisplay = (tamanho: any, index: number) => {
              return tamanho.descricao.includes('cm') || tamanho.descricao.includes('fatias')
                ? String(index + 1)
                : tamanho.descricao;
            };

            const ingList = ficha.ingredients || [];
            const isExpanded = expandedFichaId === ficha.id;
            const tamanhoSelecionado = getTamanhoSelecionado(ficha, selectedTamanhoIdByFicha[ficha.id]);

            // Calcula os segmentos do gauge com base nos custos do tamanho selecionado
            const circumference = 2 * Math.PI * 35;
            const repoTotal = ingList.reduce((acc, i) => acc + (i.totalCost || 0), 0);
            const maoDeObraTotal = getMaoDeObraParaTamanho(tamanhoSelecionado, ficha.maoDeObraCost || 0);
            const custoTotal = getCustoParaTamanho(tamanhoSelecionado, ficha.custoCost || 0);
            const investimentoTotal = getInvestimentoParaTamanho(tamanhoSelecionado, ficha.investimentoCost || 0);
            const custosTotal = custoTotal + investimentoTotal;
            const totalCosts = repoTotal + maoDeObraTotal + custosTotal;

            // Calcular stroke-dasharray para cada segmento (protegido contra divisão por zero)
            const repoLength = totalCosts > 0 ? (repoTotal / totalCosts) * circumference : 0;
            const maoLength = totalCosts > 0 ? (maoDeObraTotal / totalCosts) * circumference : 0;
            const custosLength = totalCosts > 0 ? (custosTotal / totalCosts) * circumference : 0;

            return (
              <div
                key={ficha.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '26px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 8px 20px rgba(58,35,80,.09)',
                  cursor: 'pointer',
                  transition: 'transform .28s ease, box-shadow .28s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 20px 36px rgba(58,35,80,.18)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(58,35,80,.09)';
                }}
              >
                {/* HEADER: TÍTULO + IMAGEM */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  {/* ESQUERDA: TÍTULO E FATIAS */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {/* TÍTULO */}
                    <span
                      style={{
                        fontFamily: "'Instrument Serif', serif",
                        fontSize: '21px',
                        color: '#241B2B',
                        lineHeight: 1.15,
                      }}
                    >
                      {ficha.name}
                    </span>
                    {/* FILEIRA DE BOTÕES DE TAMANHO - SEMPRE VISÍVEL */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignSelf: 'flex-start' }}>
                      {ficha.tamanhos && ficha.tamanhos.length > 0 ? (
                        ficha.tamanhos.map((tamanho, index) => (
                          <button
                            key={tamanho.id}
                            onClick={() => setSelectedTamanhoIdByFicha(prev => ({ ...prev, [ficha.id]: tamanho.id }))}
                            style={{
                              fontSize: '8px',
                              fontWeight: selectedTamanhoIdByFicha[ficha.id] === tamanho.id ? 700 : 600,
                              color: selectedTamanhoIdByFicha[ficha.id] === tamanho.id ? '#FFFFFF' : '#5B4A6B',
                              background: selectedTamanhoIdByFicha[ficha.id] === tamanho.id
                                ? 'linear-gradient(140deg,#6E3F72,#A85E86)'
                                : '#F3E9F3',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all .15s ease',
                              boxShadow: selectedTamanhoIdByFicha[ficha.id] === tamanho.id
                                ? '0 4px 12px rgba(110,63,114,.25)'
                                : 'none',
                              whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={(e) => {
                              if (selectedTamanhoIdByFicha[ficha.id] !== tamanho.id) {
                                e.currentTarget.style.background = '#EFE6F0';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedTamanhoIdByFicha[ficha.id] !== tamanho.id) {
                                e.currentTarget.style.background = '#F3E9F3';
                              }
                            }}
                          >
                            {getTamanhoDisplay(tamanho, index)}
                          </button>
                        ))
                      ) : (
                        <span style={{ fontSize: '9px', color: '#999' }}>Sem tamanhos</span>
                      )}
                    </div>
                  </div>

                  {/* DIREITA: IMAGEM */}
                  <img
                    src={ficha.imageUrl}
                    alt={ficha.name}
                    style={{
                      width: '72px',
                      height: '72px',
                      objectFit: 'cover',
                      borderRadius: '18px',
                      border: '2px solid #FFFFFF',
                      boxShadow: '0 8px 18px rgba(58,35,80,.18)',
                      flexShrink: 0,
                    }}
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* GAUGE E LEGENDA */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    background: '#FAF7FA',
                    borderRadius: '18px',
                    padding: '14px',
                  }}
                >
                  {/* SVG GAUGE */}
                  <div
                    style={{
                      position: 'relative',
                      width: '82px',
                      height: '82px',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="82" height="82" viewBox="0 0 82 82" style={{ transform: 'rotate(-90deg)' }}>
                      {/* Background circle */}
                      <circle cx="41" cy="41" r="35" fill="none" stroke="#F1ECF2" strokeWidth="10"></circle>
                      {/* Reposição - roxo */}
                      <circle
                        cx="41"
                        cy="41"
                        r="35"
                        fill="none"
                        stroke="#6E3F72"
                        strokeWidth="10"
                        strokeDasharray={`${isFinite(repoLength) ? repoLength : 0} ${circumference}`}
                        strokeDashoffset={0}
                      ></circle>
                      {/* Mão de Obra - rosa */}
                      <circle
                        cx="41"
                        cy="41"
                        r="35"
                        fill="none"
                        stroke="#C4626F"
                        strokeWidth="10"
                        strokeDasharray={`${isFinite(maoLength) ? maoLength : 0} ${circumference}`}
                        strokeDashoffset={-(isFinite(repoLength) ? repoLength : 0)}
                      ></circle>
                      {/* Custos Op. - marrom */}
                      <circle
                        cx="41"
                        cy="41"
                        r="35"
                        fill="none"
                        stroke="#B08D57"
                        strokeWidth="10"
                        strokeDasharray={`${isFinite(custosLength) ? custosLength : 0} ${circumference}`}
                        strokeDashoffset={-((isFinite(repoLength) ? repoLength : 0) + (isFinite(maoLength) ? maoLength : 0))}
                      ></circle>
                    </svg>
                    {/* TEXTO NO CENTRO DO GAUGE */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '8px',
                          fontWeight: 800,
                          color: '#8A7E90',
                          letterSpacing: '.03em',
                          fontFamily: "'Manrope', sans-serif",
                        }}
                      >
                        SUGESTÃO
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#241B2B',
                          marginTop: '3px',
                          fontFamily: "'Manrope', sans-serif",
                        }}
                      >
                        {formatMoney(tamanhoSelecionado.preco || 0)}
                      </span>
                    </div>
                  </div>

                  {/* LEGENDA */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                    {/* Reposição */}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '10px', color: '#5B4A6B' }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: '#6E3F72', flexShrink: 0 }}></span>
                      Reposição
                      <span style={{ color: '#241B2B', marginLeft: 'auto', fontWeight: 400 }}>{formatMoney(repoTotal)}</span>
                    </span>
                    {/* Mão de Obra */}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '10px', color: '#5B4A6B' }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: '#C4626F', flexShrink: 0 }}></span>
                      Mão de Obra
                      <span style={{ color: '#241B2B', marginLeft: 'auto', fontWeight: 400 }}>{formatMoney(maoDeObraTotal)}</span>
                    </span>
                    {/* Custos */}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '10px', color: '#5B4A6B' }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: '#B08D57', flexShrink: 0 }}></span>
                      Custos Op.
                      <span style={{ color: '#241B2B', marginLeft: 'auto', fontWeight: 400 }}>{formatMoney(custosTotal)}</span>
                    </span>
                  </div>
                </div>

                {/* INSUMOS EXPANDÍVEL */}
                <button
                  onClick={() => setExpandedFichaId(isExpanded ? null : ficha.id)}
                  style={{
                    alignSelf: 'flex-start',
                    background: '#F6F2F5',
                    border: 'none',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: '#3A2350',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 13px',
                    borderRadius: '999px',
                    transition: 'transform .2s ease, background .2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.background = '#EFE6F0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = '#F6F2F5';
                  }}
                >
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Ver {ingList.length} Insumos
                </button>

                {/* INSUMOS EXPANDIDOS */}
                {isExpanded && (
                  <div
                    style={{
                      background: '#FAF7FA',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      fontSize: '9px',
                    }}
                  >
                    {ingList.map((ing) => (
                      <div key={ing.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '5px', marginBottom: '5px', borderBottom: '1px solid #E3D8E5' }}>
                        <span style={{ color: '#5B4A6B' }}>
                          {ing.quantity} {ing.unit} de {ing.name}
                        </span>
                        <span style={{ fontWeight: 700, color: '#241B2B' }}>{formatMoney(ing.totalCost)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* BOTÕES */}
                <div style={{ display: 'flex', gap: '7px', paddingTop: '4px' }}>
                  <button
                    onClick={() => handleOpenEdit(ficha)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      height: '36px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: '#3A2350',
                      border: 'none',
                      borderRadius: '18px 18px 6px 18px',
                      color: '#F5B9C6',
                      cursor: 'pointer',
                      boxShadow: '0 8px 16px rgba(58,35,80,.28)',
                      transition: 'transform .22s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F5B9C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 20h4l10-10-4-4L4 16z"></path>
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => handleDuplicate(ficha)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      height: '36px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: '#F3E9F3',
                      border: 'none',
                      borderRadius: '18px 18px 18px 6px',
                      color: '#6E3F72',
                      cursor: 'pointer',
                      transition: 'transform .22s ease, background .22s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.background = '#E8DAEA';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.background = '#F3E9F3';
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6E3F72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="11" height="11" rx="2.5"></rect>
                      <path d="M5 15V6a2 2 0 0 1 2-2h9"></path>
                    </svg>
                    Duplicar
                  </button>
                  <button
                    onClick={() => handleDelete(ficha)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      height: '36px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: '#FBECEE',
                      border: 'none',
                      borderRadius: '18px 18px 6px 18px',
                      color: '#C4626F',
                      cursor: 'pointer',
                      transition: 'transform .22s ease, background .22s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.background = '#F7DCE1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.background = '#FBECEE';
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4626F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"></path>
                    </svg>
                    Excluir
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
        </div>

      {/* Delete Confirmation Modal */}
      <GenericDeleteConfirmModal
        isOpen={!!deletingFicha}
        itemType="ficha"
        itemName={deletingFicha?.name}
        itemDetails={[
          { label: '📂', value: deletingFicha?.category || 'N/A' },
        ]}
        onClose={() => setDeletingFicha(null)}
        onConfirmDelete={() => {
          if (deletingFicha) {
            handleConfirmDelete(deletingFicha.id);
            setDeletingFicha(null);
          }
        }}
      />

      {/* Undo Toast */}
      {showUndoToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 rounded-2xl p-4 z-40 flex items-center gap-3 shadow-lg" style={{ background: 'linear-gradient(135deg, #6E3F72 0%, #3A2350 100%)' }}>
          <span className="text-sm font-bold text-white">✓ Ficha deletada</span>
          <button
            onClick={handleUndo}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 hover:shadow-md"
            style={{ background: '#F5B9C6', color: '#3A2350' }}
          >
            ↩️ Desfazer
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

