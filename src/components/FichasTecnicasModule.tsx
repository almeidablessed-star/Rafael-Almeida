import React, { useState, useEffect } from 'react';
import { FichaTecnica, IngredientUsage, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
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

const DEFAULT_FICHAS: FichaTecnica[] = [
  // 1. BOLOS
  {
    id: 'f1',
    name: 'Bolo Vulcão Ninho com Nutella',
    category: 'bolos',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
    yieldInfo: '10 fatias (Aproximadamente 1.5kg)',
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
    sugestaoVenda: 65.93,
  },
  {
    id: 'f1_2',
    name: 'Bolo Red Velvet Especial Velvet',
    category: 'bolos',
    imageUrl: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&auto=format&fit=crop&q=80',
    yieldInfo: '15 fatias (Aproximadamente 2.0kg)',
    ingredients: [
      { id: 'ir1', name: 'Farinha de Trigo Especial', quantity: 350, unit: 'g', unitCost: 0.005, totalCost: 1.75 },
      { id: 'ir2', name: 'Cream Cheese Tradicional', quantity: 300, unit: 'g', unitCost: 0.045, totalCost: 13.50 },
      { id: 'ir3', name: 'Leite Condensado', quantity: 2, unit: 'un', unitCost: 6.50, totalCost: 13.00 },
      { id: 'ir4', name: 'Manteiga sem Sal', quantity: 100, unit: 'g', unitCost: 0.035, totalCost: 3.50 },
      { id: 'ir5', name: 'Cacau e Corante Red Velvet', quantity: 1, unit: 'un', unitCost: 4.00, totalCost: 4.00 },
    ],
    maoDeObraCost: 25.00,
    custoCost: 6.00,
    investimentoCost: 6.00,
    sugestaoVenda: 72.75,
  },
  {
    id: 'f1_3',
    name: 'Bolo de Cenoura com Brigaderia',
    category: 'bolos',
    imageUrl: 'https://images.unsplash.com/photo-1557925923-33b27f891f88?w=600&auto=format&fit=crop&q=80',
    yieldInfo: '12 fatias (Forma Vulcão 22cm)',
    ingredients: [
      { id: 'ic1', name: 'Cenouras Frescas', quantity: 250, unit: 'g', unitCost: 0.006, totalCost: 1.50 },
      { id: 'ic2', name: 'Farinha de Trigo', quantity: 280, unit: 'g', unitCost: 0.005, totalCost: 1.40 },
      { id: 'ic3', name: 'Açúcar & Óleo Vegetal', quantity: 1, unit: 'un', unitCost: 2.50, totalCost: 2.50 },
      { id: 'ic4', name: 'Leite Condensado', quantity: 2, unit: 'un', unitCost: 6.50, totalCost: 13.00 },
      { id: 'ic5', name: 'Cacau em Pó 50%', quantity: 80, unit: 'g', unitCost: 0.025, totalCost: 2.00 },
    ],
    maoDeObraCost: 18.00,
    custoCost: 4.50,
    investimentoCost: 4.50,
    sugestaoVenda: 47.40,
  },

  // 2. DOCES & SOBREMESAS
  {
    id: 'f2',
    name: 'Brigadeiro Gourmet ao Leite',
    category: 'doces',
    imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&auto=format&fit=crop&q=80',
    yieldInfo: '50 unidades (20g cada)',
    ingredients: [
      { id: 'i8', name: 'Leite Condensado', quantity: 2, unit: 'un', unitCost: 6.50, totalCost: 13.00 },
      { id: 'i9', name: 'Creme de Leite', quantity: 1, unit: 'un', unitCost: 4.20, totalCost: 4.20 },
      { id: 'i10', name: 'Cacau em Pó 100%', quantity: 40, unit: 'g', unitCost: 0.0265, totalCost: 1.06 },
      { id: 'i11', name: 'Manteiga sem Sal', quantity: 30, unit: 'g', unitCost: 0.035, totalCost: 1.05 },
      { id: 'i12', name: 'Granulado Gourmet', quantity: 150, unit: 'g', unitCost: 0.032, totalCost: 4.80 },
    ],
    maoDeObraCost: 15.00,
    custoCost: 3.50,
    investimentoCost: 3.50,
    sugestaoVenda: 46.11,
  },
  {
    id: 'f2_2',
    name: 'Pudim Cremoso de Leite Condensado',
    category: 'doces',
    imageUrl: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80',
    yieldInfo: '12 fatias (Forma Pudim 20cm)',
    ingredients: [
      { id: 'ip1', name: 'Leite Condensado', quantity: 2, unit: 'un', unitCost: 6.50, totalCost: 13.00 },
      { id: 'ip2', name: 'Leite Integral', quantity: 400, unit: 'ml', unitCost: 0.005, totalCost: 2.00 },
      { id: 'ip3', name: 'Ovos Caipiras', quantity: 4, unit: 'un', unitCost: 0.80, totalCost: 3.20 },
      { id: 'ip4', name: 'Açúcar para Calda Caramelizada', quantity: 150, unit: 'g', unitCost: 0.004, totalCost: 0.60 },
    ],
    maoDeObraCost: 15.00,
    custoCost: 3.50,
    investimentoCost: 3.50,
    sugestaoVenda: 40.80,
  },
  {
    id: 'f2_3',
    name: 'Sobremesa na Taça Ninho com Morangos',
    category: 'doces',
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80',
    yieldInfo: 'Taça de 1.8L (8 a 10 pessoas)',
    ingredients: [
      { id: 'it1', name: 'Morangos Frescos Selecionados', quantity: 400, unit: 'g', unitCost: 0.025, totalCost: 10.00 },
      { id: 'it2', name: 'Leite Condensado', quantity: 2, unit: 'un', unitCost: 6.50, totalCost: 13.00 },
      { id: 'it3', name: 'Leite Ninho em Pó', quantity: 120, unit: 'g', unitCost: 0.035, totalCost: 4.20 },
      { id: 'it4', name: 'Creme de Leite & Chantilly', quantity: 1, unit: 'un', unitCost: 6.00, totalCost: 6.00 },
    ],
    maoDeObraCost: 20.00,
    custoCost: 5.00,
    investimentoCost: 5.00,
    sugestaoVenda: 63.20,
  },

  // 3. SALGADOS
  {
    id: 'f3',
    name: 'Coxinha Especial de Frango com Catupiry',
    category: 'salgados',
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
    yieldInfo: '25 unidades salgados grandes (100g cada)',
    ingredients: [
      { id: 'i13', name: 'Peito de Frango Desfiado', quantity: 800, unit: 'g', unitCost: 0.018, totalCost: 14.40 },
      { id: 'i14', name: 'Farinha de Trigo', quantity: 600, unit: 'g', unitCost: 0.005, totalCost: 3.00 },
      { id: 'i15', name: 'Requeijão Culinário Catupiry', quantity: 300, unit: 'g', unitCost: 0.025, totalCost: 7.50 },
      { id: 'i16', name: 'Temperos & Caldo Especial', quantity: 1, unit: 'un', unitCost: 3.00, totalCost: 3.00 },
      { id: 'i17', name: 'Farinha de Rosca e Óleo', quantity: 1, unit: 'un', unitCost: 5.00, totalCost: 5.00 },
    ],
    maoDeObraCost: 20.00,
    custoCost: 4.00,
    investimentoCost: 4.00,
    sugestaoVenda: 60.90,
  },
  {
    id: 'f3_2',
    name: 'Empadão Folhado de Frango e Milho',
    category: 'salgados',
    imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
    yieldInfo: '8 porções grandes (Forma 25cm)',
    ingredients: [
      { id: 'ie1', name: 'Massa Folhada & Manteiga', quantity: 1, unit: 'un', unitCost: 8.00, totalCost: 8.00 },
      { id: 'ie2', name: 'Peito de Frango Temperado', quantity: 500, unit: 'g', unitCost: 0.018, totalCost: 9.00 },
      { id: 'ie3', name: 'Milho Verde & Requeijão', quantity: 1, unit: 'un', unitCost: 6.00, totalCost: 6.00 },
    ],
    maoDeObraCost: 18.00,
    custoCost: 4.00,
    investimentoCost: 4.00,
    sugestaoVenda: 49.00,
  },

  // 4. SAUDÁVEIS & FIT
  {
    id: 'f4',
    name: 'Bolo Fit de Banana, Aveia e Cacau 70%',
    category: 'saudaveis',
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
    yieldInfo: '10 fatias (Forma Inglesa 22cm)',
    ingredients: [
      { id: 'is1', name: 'Bananas Caturra Maduras', quantity: 4, unit: 'un', unitCost: 0.75, totalCost: 3.00 },
      { id: 'is2', name: 'Aveia em Flocos Finos', quantity: 200, unit: 'g', unitCost: 0.012, totalCost: 2.40 },
      { id: 'is3', name: 'Ovos Caipiras', quantity: 3, unit: 'un', unitCost: 0.80, totalCost: 2.40 },
      { id: 'is4', name: 'Cacau em Pó 70%', quantity: 40, unit: 'g', unitCost: 0.035, totalCost: 1.40 },
      { id: 'is5', name: 'Castanha de Caju Picada', quantity: 50, unit: 'g', unitCost: 0.060, totalCost: 3.00 },
    ],
    maoDeObraCost: 16.00,
    custoCost: 3.50,
    investimentoCost: 3.50,
    sugestaoVenda: 35.20,
  },
  {
    id: 'f4_2',
    name: 'Brownie Low Carb de Amêndoas',
    category: 'saudaveis',
    imageUrl: 'https://images.unsplash.com/photo-1515037893149-de7f840978e2?w=600&auto=format&fit=crop&q=80',
    yieldInfo: '12 quadradinhos (Sem Glúten & Sem Açúcar)',
    ingredients: [
      { id: 'ib1', name: 'Farinha de Amêndoas', quantity: 150, unit: 'g', unitCost: 0.075, totalCost: 11.25 },
      { id: 'ib2', name: 'Chocolate 70% Cacau', quantity: 120, unit: 'g', unitCost: 0.060, totalCost: 7.20 },
      { id: 'ib3', name: 'Adoçante Xylitol/Eritritol', quantity: 80, unit: 'g', unitCost: 0.050, totalCost: 4.00 },
      { id: 'ib4', name: 'Manteiga Ghee Purificada', quantity: 60, unit: 'g', unitCost: 0.065, totalCost: 3.90 },
    ],
    maoDeObraCost: 18.00,
    custoCost: 4.00,
    investimentoCost: 4.00,
    sugestaoVenda: 52.35,
  },

  // 5. KIDS FRIENDLY
  {
    id: 'f5',
    name: 'Mini Cupcakes Coloridos Festivos',
    category: 'kids',
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=600&auto=format&fit=crop&q=80',
    yieldInfo: '24 mini cupcakes decorados',
    ingredients: [
      { id: 'ik1', name: 'Farinha de Trigo & Açúcar', quantity: 1, unit: 'un', unitCost: 3.50, totalCost: 3.50 },
      { id: 'ik2', name: 'Leite, Ovos & Manteiga', quantity: 1, unit: 'un', unitCost: 4.50, totalCost: 4.50 },
      { id: 'ik3', name: 'Chantilly & Confeitos Coloridos', quantity: 1, unit: 'un', unitCost: 7.00, totalCost: 7.00 },
      { id: 'ik4', name: 'Forminhas Especiais Kids', quantity: 24, unit: 'un', unitCost: 0.15, totalCost: 3.60 },
    ],
    maoDeObraCost: 18.00,
    custoCost: 4.00,
    investimentoCost: 4.00,
    sugestaoVenda: 44.60,
  },
  {
    id: 'f5_2',
    name: 'Picolé Saudável de Frutas com Iogurte',
    category: 'kids',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
    yieldInfo: '10 picolés artesanais',
    ingredients: [
      { id: 'ipf1', name: 'Morangos & Mangas Frescas', quantity: 300, unit: 'g', unitCost: 0.020, totalCost: 6.00 },
      { id: 'ipf2', name: 'Iogurte Natural Integral', quantity: 300, unit: 'g', unitCost: 0.015, totalCost: 4.50 },
      { id: 'ipf3', name: 'Mel Puro de Abelha', quantity: 50, unit: 'g', unitCost: 0.040, totalCost: 2.00 },
    ],
    maoDeObraCost: 12.00,
    custoCost: 2.50,
    investimentoCost: 2.50,
    sugestaoVenda: 29.50,
  },
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
  const [fichas, setFichas] = useState<FichaTecnica[]>(getStoredFichas());
  const [selectedCategory, setSelectedCategory] = useState<'bolos' | 'doces' | 'salgados' | 'saudaveis' | 'kids'>('bolos');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedFichaId, setExpandedFichaId] = useState<string | null>(null);
  const [launchSuccessMsg, setLaunchSuccessMsg] = useState<string | null>(null);

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
  const [maoDeObraCost, setMaoDeObraCost] = useState('20');
  const [custoCost, setCustoCost] = useState('5');
  const [investimentoCost, setInvestimentoCost] = useState('5');

  useEffect(() => {
    saveStoredFichas(fichas);
  }, [fichas]);

  const totalReposicao = ingredients.reduce((sum, ing) => sum + (ing.totalCost || 0), 0);
  const mdoNum = parseFloat(maoDeObraCost.replace(',', '.')) || 0;
  const cusNum = parseFloat(custoCost.replace(',', '.')) || 0;
  const invNum = parseFloat(investimentoCost.replace(',', '.')) || 0;
  const calculatedSuggestedPrice = totalReposicao + mdoNum + cusNum + invNum;

  const handleOpenAdd = () => {
    setName('');
    setCategory(selectedCategory);
    setImageUrl('');
    setYieldInfo('10 fatias');
    setIngredients([{ id: '1', name: 'Farinha de Trigo', quantity: 200, unit: 'g', unitCost: 0.005, totalCost: 1.00 }]);
    setMaoDeObraCost('20');
    setCustoCost('5');
    setInvestimentoCost('5');
    setEditingId(null);
    setIsCreating(true);
  };

  const handleOpenEdit = (ficha: FichaTecnica) => {
    setName(ficha.name);
    setCategory(ficha.category);
    setImageUrl(ficha.imageUrl || '');
    setYieldInfo(ficha.yieldInfo);
    setIngredients(ficha.ingredients || []);
    setMaoDeObraCost((ficha.maoDeObraCost || 0).toString());
    setCustoCost((ficha.custoCost || 0).toString());
    setInvestimentoCost((ficha.investimentoCost || 0).toString());
    setEditingId(ficha.id);
    setIsCreating(true);
  };

  const handleAddIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { id: Date.now().toString(), name: '', quantity: 100, unit: 'g', unitCost: 0.01, totalCost: 1.00 },
    ]);
  };

  const handleUpdateIngredient = (id: string, field: keyof IngredientUsage, val: any) => {
    setIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id !== id) return ing;
        const updated = { ...ing, [field]: val };
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

  const handleSaveFicha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newFicha: FichaTecnica = {
      id: editingId || Date.now().toString(),
      name: name.trim(),
      category,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
      yieldInfo: yieldInfo.trim() || '1 unidade',
      ingredients,
      maoDeObraCost: mdoNum,
      custoCost: cusNum,
      investimentoCost: invNum,
      sugestaoVenda: calculatedSuggestedPrice,
    };

    if (editingId) {
      setFichas((prev) => prev.map((f) => (f.id === editingId ? newFicha : f)));
    } else {
      setFichas((prev) => [newFicha, ...prev]);
    }

    setIsCreating(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir esta ficha técnica?')) {
      const updated = fichas.filter((f) => f.id !== id);
      saveStoredFichas(updated);
      setFichas(updated);
    }
  };

  const handleDuplicate = (fichaToDup: FichaTecnica) => {
    const duplicated: FichaTecnica = {
      ...fichaToDup,
      id: Date.now().toString(),
      name: `${fichaToDup.name} (Cópia)`,
      ingredients: (fichaToDup.ingredients || []).map((ing, idx) => ({ ...ing, id: `${Date.now()}_${idx}` })),
    };
    const updated = [duplicated, ...fichas];
    saveStoredFichas(updated);
    setFichas(updated);
    setLaunchSuccessMsg(`Ficha "${fichaToDup.name}" duplicada com sucesso!`);
    setTimeout(() => setLaunchSuccessMsg(null), 3500);
  };

  const handleLaunchSaleFromFicha = (ficha: FichaTecnica) => {
    if (!onAddTransaction) return;
    const today = new Date().toISOString().split('T')[0];
    const repoTotal = (ficha.ingredients || []).reduce((acc, i) => acc + (i.totalCost || 0), 0);

    onAddTransaction({
      type: 'venda',
      description: `${ficha.name} (${ficha.yieldInfo}) - Ficha Técnica`,
      quantity: 1,
      unitValue: ficha.sugestaoVenda,
      totalValue: ficha.sugestaoVenda,
      date: today,
      paymentStatus: 'pago',
      notes: `Lançado via Ficha Técnica. Reposição: ${formatMoney(repoTotal)}, Mão de Obra: ${formatMoney(ficha.maoDeObraCost)}, Custo/Invest: ${formatMoney((ficha.custoCost || 0) + (ficha.investimentoCost || 0))}`,
    });

    setLaunchSuccessMsg(`Venda de "${ficha.name}" no valor de ${formatMoney(ficha.sugestaoVenda)} lançada com sucesso no Caixa!`);
    setTimeout(() => setLaunchSuccessMsg(null), 4000);
  };

  const filteredFichas = fichas.filter((f) => f.category === selectedCategory);

  return (
    <div className="space-y-0 pb-12 animate-fadeIn overflow-hidden">
      {/* Header - Roxo Gradiente */}
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
        <form onSubmit={handleSaveFicha} className="bg-white rounded-[32px] p-5 sm:p-6 border-2 border-[var(--color-pastry-light-pink)] shadow-xl space-y-4 animate-slideUp">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h3 className="font-brand font-black text-lg text-[var(--color-pastry-chocolate)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--color-pastry-light-pink)]" />
              {editingId ? 'Editar Ficha Técnica' : 'Criar Nova Ficha Técnica'}
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[var(--color-pastry-chocolate)] mb-1">
                Nome do Pedido *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Bolo Vulcão Ninho com Nutella"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-[var(--color-pastry-chocolate)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-pastry-chocolate)] mb-1">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-extrabold text-[var(--color-pastry-chocolate)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] bg-white"
              >
                <option value="bolos">🎂 Bolos & Massas</option>
                <option value="doces">🧁 Doces & Sobremesas</option>
                <option value="salgados">🥟 Salgados & Lanches</option>
                <option value="saudaveis">🥗 Saudáveis & Fit</option>
                <option value="kids">🧸 Kids Friendly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-pastry-chocolate)] mb-1">
                Rendimento *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ex: 10 ou 500"
                  value={yieldInfo}
                  onChange={(e) => setYieldInfo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-[var(--color-pastry-chocolate)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                />

                <select
                  value={selectedYieldUnit}
                  onChange={(e) => handleApplyYieldUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-extrabold text-[var(--color-pastry-chocolate)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] bg-white cursor-pointer"
                >
                  <option value="fatias">🍰 Fatias</option>
                  <option value="gramas">⚖️ Gramas (g)</option>
                  <option value="unidades">📦 Unidades</option>
                  <option value="ml">🥛 ML</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-pastry-chocolate)] mb-1">
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImageUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
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
                <div key={ing.id} className="bg-white p-2.5 rounded-xl border border-[var(--color-pastry-light-pink)]/30 grid grid-cols-12 gap-2 items-center text-xs">
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Ingrediente (ex: Cacau)"
                      value={ing.name}
                      onChange={(e) => handleUpdateIngredient(ing.id, 'name', e.target.value)}
                      className="w-full px-2 py-1 border border-neutral-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="Qtd"
                      value={ing.quantity}
                      onChange={(e) => handleUpdateIngredient(ing.id, 'quantity', e.target.value)}
                      className="w-full px-1.5 py-1 border border-neutral-300 rounded-lg text-xs font-bold text-center"
                    />
                    <select
                      value={ing.unit}
                      onChange={(e) => handleUpdateIngredient(ing.id, 'unit', e.target.value)}
                      className="px-1 py-1 border border-neutral-300 rounded-lg text-[10px] font-bold"
                    >
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="un">un</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                  <div className="col-span-4 text-right">
                    <span className="text-[10px] text-neutral-500 block">Custo Gasto</span>
                    <span className="font-black text-xs text-[var(--color-pastry-chocolate)]">
                      {formatMoney(ing.totalCost || 0)}
                    </span>
                  </div>
                  <div className="col-span-1 text-right">
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

          {/* LABOR & COSTS & INVESTMENT BREAKDOWN */}
          <div className="grid grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[var(--color-pastry-chocolate)] mb-1">
                Mão de Obra ($)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={maoDeObraCost}
                onChange={(e) => setMaoDeObraCost(e.target.value)}
                className="w-full px-2.5 py-2 border border-neutral-300 rounded-xl font-bold text-[var(--color-pastry-chocolate)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--color-pastry-chocolate)] mb-1">
                Custo ($)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={custoCost}
                onChange={(e) => setCustoCost(e.target.value)}
                className="w-full px-2.5 py-2 border border-neutral-300 rounded-xl font-bold text-[var(--color-pastry-chocolate)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--color-pastry-chocolate)] mb-1">
                Investimento ($)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={investimentoCost}
                onChange={(e) => setInvestimentoCost(e.target.value)}
                className="w-full px-2.5 py-2 border border-neutral-300 rounded-xl font-bold text-[var(--color-pastry-chocolate)]"
              />
            </div>
          </div>

          {/* TOTAL SUGGESTED SELLING PRICE */}
          <div className="bg-[var(--color-pastry-chocolate)] p-4 rounded-lg text-white flex items-center justify-between">
            <div>
              <span className="label-sm tracking-wider text-[var(--color-pastry-pink)] block">
                Sugestão de Preço de Venda
              </span>
              <span className="font-marca text-3xl font-black text-[var(--color-pastry-cream)]">
                {formatMoney(calculatedSuggestedPrice)}
              </span>
            </div>
            <div className="text-right text-[11px] text-[var(--color-pastry-cream)]/80 font-medium">
              Insumos ({formatMoney(totalReposicao)}) + Mão de Obra ({formatMoney(mdoNum)}) + Custos ({formatMoney(cusNum + invNum)})
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
            const ingList = ficha.ingredients || [];
            const isExpanded = expandedFichaId === ficha.id;

            // Calcula os segmentos do gauge com base nos custos
            const circumference = 2 * Math.PI * 35;
            const repoTotal = ingList.reduce((acc, i) => acc + (i.totalCost || 0), 0);
            const maoDeObraTotal = ficha.maoDeObraCost || 0;
            const custosTotal = (ficha.custoCost || 0) + (ficha.investimentoCost || 0);
            const totalCosts = repoTotal + maoDeObraTotal + custosTotal;

            // Calcular stroke-dasharray para cada segmento
            const repoLength = (repoTotal / totalCosts) * circumference;
            const maoLength = (maoDeObraTotal / totalCosts) * circumference;
            const custosLength = (custosTotal / totalCosts) * circumference;

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
                    {/* BADGE DE FATIAS */}
                    <span
                      style={{
                        alignSelf: 'flex-start',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#5B4A6B',
                        background: '#F3E9F3',
                        padding: '4px 10px',
                        borderRadius: '999px',
                      }}
                    >
                      {ficha.yieldInfo}
                    </span>
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
                        strokeDasharray={`${repoLength} ${circumference}`}
                        strokeDashoffset="0"
                      ></circle>
                      {/* Mão de Obra - rosa */}
                      <circle
                        cx="41"
                        cy="41"
                        r="35"
                        fill="none"
                        stroke="#C4626F"
                        strokeWidth="10"
                        strokeDasharray={`${maoLength} ${circumference}`}
                        strokeDashoffset={-repoLength}
                      ></circle>
                      {/* Custos Op. - marrom */}
                      <circle
                        cx="41"
                        cy="41"
                        r="35"
                        fill="none"
                        stroke="#B08D57"
                        strokeWidth="10"
                        strokeDasharray={`${custosLength} ${circumference}`}
                        strokeDashoffset={-(repoLength + maoLength)}
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
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#241B2B',
                          marginTop: '3px',
                          fontFamily: "'Manrope', sans-serif",
                        }}
                      >
                        {formatMoney(ficha.sugestaoVenda)}
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
                      <span style={{ color: '#241B2B', marginLeft: 'auto', fontWeight: 400 }}>{formatMoney(ficha.maoDeObraCost)}</span>
                    </span>
                    {/* Custos */}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '10px', color: '#5B4A6B' }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: '#B08D57', flexShrink: 0 }}></span>
                      Custos Op.
                      <span style={{ color: '#241B2B', marginLeft: 'auto', fontWeight: 400 }}>{formatMoney((ficha.custoCost || 0) + (ficha.investimentoCost || 0))}</span>
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
                    onClick={() => handleDelete(ficha.id)}
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
      </div>
    </div>
  );
};

