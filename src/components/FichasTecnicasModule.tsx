import React, { useState, useEffect } from 'react';
import { FichaTecnica, IngredientUsage, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
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
      notes: `Lançado via Ficha Técnica. Reposição: ${formatCurrency(repoTotal)}, Mão de Obra: ${formatCurrency(ficha.maoDeObraCost)}, Custo/Invest: ${formatCurrency((ficha.custoCost || 0) + (ficha.investimentoCost || 0))}`,
    });

    setLaunchSuccessMsg(`Venda de "${ficha.name}" no valor de ${formatCurrency(ficha.sugestaoVenda)} lançada com sucesso no Caixa!`);
    setTimeout(() => setLaunchSuccessMsg(null), 4000);
  };

  const filteredFichas = fichas.filter((f) => f.category === selectedCategory);

  return (
    <div className="space-y-5 pb-12 animate-fadeIn">
      {/* Banner Header - Roxo Gradiente */}
      <div
        className="rounded-2xl p-6 text-white shadow-highlight relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{
          background: 'linear-gradient(155deg, var(--color-brand-900) 0%, var(--color-brand-700) 60%, var(--color-brand-500) 100%)',
        }}
      >
        <div>
          <h2 className="font-marca text-3xl text-white tracking-tight" style={{ lineHeight: 1 }}>
            Fichas Técnicas
          </h2>
          <p className="text-xs text-white/80 font-semibold mt-2">Gestão de receitas e cálculo de custos</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-full text-xs font-black uppercase transition-all active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
          style={{
            background: 'var(--color-rose-200)',
            color: 'var(--color-brand-900)',
          }}
        >
          <Plus className="w-4 h-4" />
          <span>Nova Ficha</span>
        </button>
      </div>

      {launchSuccessMsg && (
        <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)] text-[var(--color-primary)] text-xs p-3.5 rounded-lg flex items-center gap-2.5 animate-fadeIn shadow-card">
          <Check className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
          <span className="font-bold">{launchSuccessMsg}</span>
        </div>
      )}

      {/* Category Tabs Bar - Retaining all 5 tabs with colorful emoji icons */}
      <div className="flex items-center gap-1.5 bg-[var(--color-pastry-cream)] p-1.5 rounded-[24px] border border-[var(--color-pastry-light-pink)]/40 overflow-x-auto no-scrollbar shadow-card">
        <button
          onClick={() => setSelectedCategory('bolos')}
          className={`px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            selectedCategory === 'bolos'
              ? 'bg-[var(--color-pastry-chocolate)] text-[var(--color-pastry-pink)] shadow-sm scale-102'
              : 'bg-white/80 text-[var(--color-pastry-chocolate)] hover:bg-white'
          }`}
        >
          <span>🎂 Bolos</span>
        </button>

        <button
          onClick={() => setSelectedCategory('doces')}
          className={`px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            selectedCategory === 'doces'
              ? 'bg-[var(--color-pastry-chocolate)] text-[var(--color-pastry-pink)] shadow-sm scale-102'
              : 'bg-white/80 text-[var(--color-pastry-chocolate)] hover:bg-white'
          }`}
        >
          <span>🧁 Doces & Sobremesas</span>
        </button>

        <button
          onClick={() => setSelectedCategory('salgados')}
          className={`px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            selectedCategory === 'salgados'
              ? 'bg-[var(--color-pastry-chocolate)] text-[var(--color-pastry-pink)] shadow-sm scale-102'
              : 'bg-white/80 text-[var(--color-pastry-chocolate)] hover:bg-white'
          }`}
        >
          <span>🥟 Salgados</span>
        </button>

        <button
          onClick={() => setSelectedCategory('saudaveis')}
          className={`px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            selectedCategory === 'saudaveis'
              ? 'bg-[var(--color-pastry-chocolate)] text-[var(--color-pastry-pink)] shadow-sm scale-102'
              : 'bg-white/80 text-[var(--color-pastry-chocolate)] hover:bg-white'
          }`}
        >
          <span>🥗 Saudáveis & Fit</span>
        </button>

        <button
          onClick={() => setSelectedCategory('kids')}
          className={`px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            selectedCategory === 'kids'
              ? 'bg-[var(--color-pastry-chocolate)] text-[var(--color-pastry-pink)] shadow-sm scale-102'
              : 'bg-white/80 text-[var(--color-pastry-chocolate)] hover:bg-white'
          }`}
        >
          <span>🧸 Kids Friendly</span>
        </button>
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
                      {formatCurrency(ing.totalCost || 0)}
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
                {formatCurrency(totalReposicao)}
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
                {formatCurrency(calculatedSuggestedPrice)}
              </span>
            </div>
            <div className="text-right text-[11px] text-[var(--color-pastry-cream)]/80 font-medium">
              Insumos ({formatCurrency(totalReposicao)}) + Mão de Obra ({formatCurrency(mdoNum)}) + Custos ({formatCurrency(cusNum + invNum)})
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

      {/* FICHAS CARDS LIST USING THE REFERENCE BLOCK LAYOUT ("Destaque de Vendas" Layout Structure) */}
      <div className="space-y-4">
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
          filteredFichas.map((ficha, index) => {
            const ingList = ficha.ingredients || [];
            const repoTotal = ingList.reduce((acc, i) => acc + (i.totalCost || 0), 0);
            const isExpanded = expandedFichaId === ficha.id;
            const bgClass = PALETTE_BG_CLASSES[index % PALETTE_BG_CLASSES.length];
            const catInfo = CATEGORY_LABELS[ficha.category] || CATEGORY_LABELS.bolos;

            return (
              <div
                key={ficha.id}
                className={`${bgClass} rounded-[32px] p-5 sm:p-6 shadow-card transition-all hover:shadow-sm relative overflow-hidden`}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  
                  {/* Left Column (Content & Breakdowns) */}
                  <div className="md:col-span-7 space-y-3.5">
                    {/* Main Title: Exact Recipe Name */}
                    <h3 className="font-bold text-2xl sm:text-3xl text-[var(--color-pastry-chocolate)] leading-snug">
                      {ficha.name}
                    </h3>

                    {/* Yield Info */}
                    <p className="text-xs text-[var(--color-pastry-chocolate)]/80 font-semibold flex items-center gap-1.5">
                      <span className="bg-white/60 px-2.5 py-0.5 font-bold rounded-full">{ficha.yieldInfo}</span>
                    </p>

                    {/* Breakdown Cost Metrics - Premium Design */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
                      {/* Reposição */}
                      <div className="bg-[#C8E6D7]/20 border border-[#C8E6D7]/50 rounded-lg p-2.5 flex flex-col min-h-[86px] shadow-card">
                        <span className="text-[7px] font-bold uppercase text-[#3A5A4A] h-[14px] leading-[14px]">🧂 Reposição</span>
                        <strong className="text-[12px] font-black text-[#3A5A4A] flex-1 flex items-center">{formatCurrency(repoTotal)}</strong>
                        <span className="text-[7px] text-[#3A5A4A]/70 font-normal h-[14px] leading-[14px]">Ingredientes</span>
                      </div>

                      {/* Mão de Obra */}
                      <div className="bg-[#E8B4B8]/20 border border-[#E8B4B8]/50 rounded-lg p-2.5 flex flex-col min-h-[86px] shadow-card">
                        <span className="text-[7px] font-bold uppercase text-[#6B3E42] h-[14px] leading-[14px]">👷 Mão de Obra</span>
                        <strong className="text-[12px] font-black text-[#6B3E42] flex-1 flex items-center">{formatCurrency(ficha.maoDeObraCost)}</strong>
                        <span className="text-[7px] text-[#6B3E42]/70 font-normal h-[14px] leading-[14px]">Produção</span>
                      </div>

                      {/* Custos Operacionais */}
                      <div className="bg-[#B8D4E8]/20 border border-[#B8D4E8]/50 rounded-lg p-2.5 flex flex-col min-h-[86px] shadow-card">
                        <span className="text-[7px] font-bold uppercase text-[#3A4A5A] h-[14px] leading-[14px] whitespace-nowrap">⚙️ Custos</span>
                        <strong className="text-[12px] font-black text-[#3A4A5A] flex-1 flex items-center">
                          {formatCurrency((ficha.custoCost || 0) + (ficha.investimentoCost || 0))}
                        </strong>
                        <span className="text-[7px] text-[#3A4A5A]/70 font-normal h-[14px] leading-[14px] whitespace-nowrap">Operacional</span>
                      </div>

                      {/* Sugestão de Preço */}
                      <div className="bg-[var(--color-brand-900)] border border-[var(--color-brand-900)]/80 rounded-lg p-2.5 flex flex-col min-h-[86px] shadow-card">
                        <span className="text-[7px] font-bold uppercase text-[var(--color-rose-200)] h-[14px] leading-[14px]">💰 Sugestão</span>
                        <strong className="text-[12px] font-black text-white flex-1 flex items-center">{formatCurrency(ficha.sugestaoVenda)}</strong>
                        <span className="text-[7px] text-[var(--color-rose-200)]/80 font-normal h-[14px] leading-[14px]">Venda</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        onClick={() => setExpandedFichaId(isExpanded ? null : ficha.id)}
                        className="px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-[var(--color-pastry-chocolate)] font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-card"
                      >
                        <span>{isExpanded ? 'Ocultar Insumos' : `Ver ${ingList.length} Insumos`}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Expandable Ingredients Details */}
                    {isExpanded && (
                      <div className="bg-white/90 p-3.5 rounded-lg border border-black/5 text-xs space-y-2 animate-fadeIn mt-2">
                        <span className="text-[10px] font-black uppercase text-[var(--color-pastry-chocolate)]/60 tracking-wider block">
                          Ingredientes & Custos de Produção:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-medium text-[var(--color-pastry-chocolate)]">
                          {ingList.map((ing) => (
                            <div key={ing.id} className="flex items-center justify-between border-b border-black/5 pb-1">
                              <span>
                                {ing.quantity} {ing.unit} de {ing.name}
                              </span>
                              <strong className="text-[var(--color-pastry-chocolate)]">
                                {formatCurrency(ing.totalCost)}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column (Reference Image & Management Buttons) */}
                  <div className="md:col-span-5 flex flex-col gap-2.5">
                    <div className="relative h-48 sm:h-52 rounded-[28px] overflow-hidden border-2 border-white shadow-card group">
                      <img
                        src={ficha.imageUrl}
                        alt={ficha.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Action buttons directly below the cake image */}
                    <div className="flex items-center justify-center sm:justify-end gap-1.5 pt-0.5 flex-wrap">
                      <button
                        onClick={() => handleOpenEdit(ficha)}
                        className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-[var(--color-pastry-chocolate)] text-xs font-bold transition shadow-card flex items-center gap-1 cursor-pointer"
                        title="Editar Ficha"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[var(--color-pastry-chocolate)]" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleDuplicate(ficha)}
                        className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-[var(--color-pastry-chocolate)] text-xs font-bold transition shadow-card flex items-center gap-1 cursor-pointer"
                        title="Duplicar Ficha"
                      >
                        <Copy className="w-3.5 h-3.5 text-[var(--color-pastry-chocolate)]" />
                        <span>Duplicar</span>
                      </button>

                      <button
                        onClick={() => handleDelete(ficha.id)}
                        className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-semantic-error-100 text-semantic-error-700 text-xs font-bold transition shadow-card flex items-center gap-1 cursor-pointer"
                        title="Excluir Ficha"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    </div>
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

