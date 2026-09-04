import React, { useState, useEffect, useMemo } from 'react';
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
  AlertTriangle,
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

// DEFAULT_FICHAS, getStoredFichas e saveStoredFichas foram removidos: eram uma
// ficha de exemplo ("Bolo Vulcao Ninho com Nutella") mais leitura e escrita em
// localStorage, de uma fase anterior, exportadas e nunca chamadas. As fichas
// reais vem do Supabase por [[FichasTecnicasContext]].

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
  // Lista da ficha, hoje so um espelho do primeiro tamanho na gravacao. Nasce
  // vazia: antes vinha com "Farinha de Trigo 200 g" de uma ficha de exemplo,
  // que entrava em toda ficha nova sem ninguem ter pedido.
  const [ingredients, setIngredients] = useState<IngredientUsage[]>([]);
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
    ingredients: IngredientUsage[];
    maoDeObraCost: string;
    custoCost: string;
    investimentoCost: string;
  }>>([
    // Tamanhos em branco. Antes nasciam com preco 55/75/90 e custos 20/5/5 —
    // numeros de uma ficha de exemplo de outra fase. Quem nao reparasse
    // cadastrava um bolo com o preco de um bolo que nunca existiu.
    { id: 'ts-1', descricao: '1', preco: '', horasTrabalho: '', valorHora: '', ingredients: [], maoDeObraCost: '', custoCost: '', investimentoCost: '' },
    { id: 'ts-2', descricao: '2', preco: '', horasTrabalho: '', valorHora: '', ingredients: [], maoDeObraCost: '', custoCost: '', investimentoCost: '' },
    { id: 'ts-3', descricao: '3', preco: '', horasTrabalho: '', valorHora: '', ingredients: [], maoDeObraCost: '', custoCost: '', investimentoCost: '' },
  ]);

  // Fichas são agora gerenciadas pelo hook useFichasTecnicas (salva no Supabase)

  /**
   * Tamanhos cujo preco nao acompanha o tamanho: um bolo maior saindo mais
   * barato que um menor.
   *
   * Existe porque nada no app impedia isso, e o erro so aparecia la na frente,
   * na hora de lancar o pedido — com a confeiteira cobrando pelo valor errado
   * sem perceber. Uma ficha real de teste tinha 25 fatias mais barato que 15.
   *
   * O "tamanho" sai do primeiro numero da descricao ("25 fatias" -> 25, "20 cm"
   * -> 20). E o unico dado comparavel que existe: `quantidade` e opcional e
   * esta indefinida em todas as fichas cadastradas. Descricao sem numero
   * ("Grande", "P") fica de fora da checagem em vez de virar 0 e disparar
   * alarme falso.
   *
   * E AVISO, nao bloqueio: pode haver motivo real (promocao, tamanho com menos
   * decoracao), e travar o salvamento por um palpite nosso seria pior.
   */
  const avisosDePreco = useMemo(() => {
    const comparaveis = tamanhos
      .map((t) => {
        const medida = parseFloat((t.descricao || '').replace(',', '.').match(/\d+(?:[.,]\d+)?/)?.[0] || '');
        const preco = parseFloat((t.preco || '').replace(',', '.'));
        return { descricao: t.descricao, medida, preco };
      })
      // Preco 0/vazio significa "ainda nao preencheu", nao "de graca".
      .filter((t) => Number.isFinite(t.medida) && Number.isFinite(t.preco) && t.preco > 0);

    const avisos: string[] = [];
    for (const maior of comparaveis) {
      for (const menor of comparaveis) {
        if (maior.medida > menor.medida && maior.preco < menor.preco) {
          avisos.push(`"${maior.descricao}" está mais barato que "${menor.descricao}".`);
        }
      }
    }
    return avisos;
  }, [tamanhos]);

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
    setIngredients([]);
    setReposicaoCost('0');
    setTamanhos([
      { id: 'ts-1', descricao: '1', preco: '', horasTrabalho: '', valorHora: tarifaSugerida, ingredients: [], maoDeObraCost: '', custoCost: '', investimentoCost: '' },
      { id: 'ts-2', descricao: '2', preco: '', horasTrabalho: '', valorHora: tarifaSugerida, ingredients: [], maoDeObraCost: '', custoCost: '', investimentoCost: '' },
      { id: 'ts-3', descricao: '3', preco: '', horasTrabalho: '', valorHora: tarifaSugerida, ingredients: [], maoDeObraCost: '', custoCost: '', investimentoCost: '' },
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
          // Ficha antiga so tem a lista da ficha: cada tamanho abre com uma
          // COPIA dela, pronta para ser ajustada. Sem isso a confeiteira
          // encontraria os tamanhos vazios e acharia que perdeu a receita.
          ingredients:
            t.ingredients && t.ingredients.length > 0
              ? t.ingredients.map((ing, k) => ({ ...ing, id: ing.id || `${t.id}_${k}` }))
              : (ficha.ingredients || []).map((ing, k) => ({ ...ing, id: `${t.id}_base_${k}` })),
          maoDeObraCost: (t.maoDeObraCost || 0).toString(),
          custoCost: (t.custoCost || 0).toString(),
          investimentoCost: (t.investimentoCost || 0).toString(),
        }))
      );
    } else {
      // Se não há tamanhos, usar padrão
      setTamanhos([
        { id: 'ts-1', descricao: '1', preco: '0', horasTrabalho: '', valorHora: '', ingredients: [], maoDeObraCost: '0', custoCost: '0', investimentoCost: '0' },
        { id: 'ts-2', descricao: '2', preco: '0', horasTrabalho: '', valorHora: '', ingredients: [], maoDeObraCost: '0', custoCost: '0', investimentoCost: '0' },
        { id: 'ts-3', descricao: '3', preco: '0', horasTrabalho: '', valorHora: '', ingredients: [], maoDeObraCost: '0', custoCost: '0', investimentoCost: '0' },
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

  /**
   * Aplica a edicao de um campo a um insumo, recalculando o custo.
   *
   * Extraida para poder ser usada tanto na lista da ficha quanto nas listas de
   * cada tamanho, sem duplicar a regra de conversao de unidade.
   */
  const aplicarEdicaoDeInsumo = (
    ing: IngredientUsage,
    field: keyof IngredientUsage,
    val: any
  ): IngredientUsage => {
    const updated = { ...ing, [field]: val };

    // Nome ou UNIDADE: o custo vem do Estoque e depende dos dois.
    //
    // A unidade estava de fora, e o efeito passava despercebido: cadastrar
    // "leite 100 ml" e depois trocar para "g" mantinha o custo por ml. O numero
    // continuava plausivel na tela, so que errado — e alimentava a conta aberta
    // e o preco do bolo.
    if (field === 'name' || field === 'unit') {
      const nome = field === 'name' ? String(val) : ing.name;
      const unidade = field === 'unit' ? String(val) : ing.unit;
      const stockItem = estoque.find(item => item.name.toLowerCase() === (nome || '').toLowerCase());

      if (stockItem && stockItem.costPerUnit > 0) {
        const convertedCost = convertCostToTargetUnit(stockItem.costPerUnit, stockItem.unit, unidade);
        updated.unitCost = convertedCost;
        updated.totalCost = (Number(ing.quantity) || 0) * convertedCost;
      }
    }

    if (field === 'quantity' || field === 'unitCost') {
      const q = field === 'quantity' ? parseFloat(val) || 0 : ing.quantity;
      const c = field === 'unitCost' ? parseFloat(val) || 0 : ing.unitCost;
      updated.totalCost = q * c;
    }
    return updated;
  };

  const handleUpdateIngredient = (id: string, field: keyof IngredientUsage, val: any) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? aplicarEdicaoDeInsumo(ing, field, val) : ing))
    );
  };

  // --- Insumos POR TAMANHO ---

  const handleAddInsumoTamanho = (tamanhoId: string) => {
    setTamanhos((prev) =>
      prev.map((t) =>
        t.id === tamanhoId
          ? {
              ...t,
              ingredients: [
                ...t.ingredients,
                { id: `${Date.now()}`, name: '', quantity: 0, unit: 'g' as const, unitCost: 0, totalCost: 0 },
              ],
            }
          : t
      )
    );
  };

  const handleUpdateInsumoTamanho = (
    tamanhoId: string,
    insumoId: string,
    field: keyof IngredientUsage,
    val: any
  ) => {
    setTamanhos((prev) =>
      prev.map((t) =>
        t.id === tamanhoId
          ? {
              ...t,
              ingredients: t.ingredients.map((ing) =>
                ing.id === insumoId ? aplicarEdicaoDeInsumo(ing, field, val) : ing
              ),
            }
          : t
      )
    );
  };

  const handleRemoveInsumoTamanho = (tamanhoId: string, insumoId: string) => {
    setTamanhos((prev) =>
      prev.map((t) =>
        t.id === tamanhoId
          ? { ...t, ingredients: t.ingredients.filter((ing) => ing.id !== insumoId) }
          : t
      )
    );
  };

  /**
   * Copia os insumos do tamanho anterior.
   *
   * Cadastrar cinco listas do zero para o mesmo bolo e o custo real da escolha
   * por listas separadas. Copiar e ajustar as quantidades cobre o caminho
   * comum sem impor a proporcao linear que a opcao por multiplicador imporia.
   */
  const handleCopiarInsumosDoAnterior = (tamanhoId: string) => {
    setTamanhos((prev) => {
      const idx = prev.findIndex((t) => t.id === tamanhoId);
      if (idx <= 0) return prev;
      const origem = prev[idx - 1].ingredients;
      return prev.map((t, i) =>
        i === idx
          ? {
              ...t,
              ingredients: origem.map((ing, k) => ({ ...ing, id: `${Date.now()}_${k}` })),
            }
          : t
      );
    });
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
        ingredients: [],
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
        // Insumos deste tamanho, sem as linhas em branco que ficaram por engano.
        ingredients: t.ingredients.filter((ing) => (ing.name || '').trim()),
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
      // A lista da FICHA vira um espelho do primeiro tamanho. A lista que vale
      // e a de cada tamanho; esta so atende quem ainda le o campo antigo (a
      // folha de orcamento) e serve de rede para fichas sem lista por tamanho.
      ingredients: tamanhosData[0]?.ingredients || [],
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

      {/* Editor Modal / Form
          O corpo segue o mesmo tratamento do formulario de Pedidos: fundo claro
          #F6F2F5 com os campos brancos por cima. Antes era branco sobre branco,
          sem separacao entre o formulario e os campos — o que deixava a tela
          chapada em comparacao com a de Pedidos. */}
      {isCreating && (
        <form onSubmit={handleSaveFicha} className="rounded-[32px] p-5 sm:p-6 border-2 border-[var(--color-pastry-light-pink)] shadow-xl space-y-4 animate-slideUp" style={{ background: '#F6F2F5' }}>
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F3E9F3] text-xs font-bold text-[var(--color-pastry-chocolate)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F3E9F3] text-xs font-extrabold text-[var(--color-pastry-chocolate)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] bg-white"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F3E9F3] text-xs font-bold text-[var(--color-pastry-chocolate)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                style={{ fontFamily: "'Manrope', sans-serif" }}
                />

                <select
                  value={selectedYieldUnit}
                  onChange={(e) => handleApplyYieldUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F3E9F3] text-xs font-extrabold text-[var(--color-pastry-chocolate)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] bg-white cursor-pointer"
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

          {/* A lista de ingredientes saiu daqui e foi para DENTRO de cada
              tamanho: um bolo de 10 fatias e um de 30 nao consomem o mesmo,
              e uma lista unica fazia a baixa de estoque debitar a mesma
              quantidade para qualquer tamanho vendido. Manter tambem uma
              lista no nivel da ficha colocaria duas listas concorrentes na
              mesma tela. Ver [[insumosDoTamanho]]. */}


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
              {tamanhos.map((tamanho, index) => (
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

                  {/* INSUMOS DESTE TAMANHO */}
                  <div className="pt-2 border-t border-[var(--color-pastry-light-pink)]/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-[var(--color-pastry-chocolate)]">
                        Insumos deste tamanho ({tamanho.ingredients.length})
                      </span>
                      <div className="flex items-center gap-2">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleCopiarInsumosDoAnterior(tamanho.id)}
                            className="text-[10px] font-bold text-[var(--color-pastry-chocolate)] hover:underline cursor-pointer"
                            title="Copiar a lista do tamanho anterior para ajustar as quantidades"
                          >
                            Copiar anterior
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAddInsumoTamanho(tamanho.id)}
                          className="text-[10px] font-bold text-[var(--color-pastry-chocolate)] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-[var(--color-pastry-light-pink)]" />
                          <span>Adicionar</span>
                        </button>
                      </div>
                    </div>

                    {tamanho.ingredients.length === 0 && (
                      <p className="text-[10px]" style={{ color: '#9A8FA0' }}>
                        Sem insumos neste tamanho — ele não vai baixar estoque.
                      </p>
                    )}

                    {tamanho.ingredients.map((ing) => (
                      <div key={ing.id} className="bg-white p-2 rounded-lg border border-[var(--color-pastry-light-pink)]/30 grid grid-cols-12 gap-1.5 text-xs">
                        <div className="col-span-12">
                          <StockItemAutocomplete
                            value={ing.name}
                            onChange={(val) => handleUpdateInsumoTamanho(tamanho.id, ing.id, 'name', val)}
                            onSelect={() => {}}
                            stockItems={estoque}
                            isEnabled={true}
                            placeholder="Ingrediente (ex: Cacau)"
                          />
                        </div>
                        <div className="col-span-4">
                          {/* Insumo novo nasce com quantidade 0, e o 0 aparecia
                              digitado no campo: escrever 200 dava 0200. Zero
                              vira campo vazio, com "Qtd" de dica. */}
                          <input
                            type="number"
                            placeholder="Qtd"
                            value={ing.quantity || ''}
                            onChange={(e) => handleUpdateInsumoTamanho(tamanho.id, ing.id, 'quantity', e.target.value)}
                            className="w-full px-1.5 py-1 border border-[#F3E9F3] rounded-lg text-xs font-bold text-center"
                            style={{ fontFamily: "'Manrope', sans-serif" }}
                          />
                        </div>
                        <div className="col-span-3">
                          <select
                            value={ing.unit}
                            onChange={(e) => handleUpdateInsumoTamanho(tamanho.id, ing.id, 'unit', e.target.value)}
                            className="w-full px-1 py-1 border border-[#F3E9F3] rounded-lg text-[10px] font-bold"
                            style={{ fontFamily: "'Manrope', sans-serif" }}
                          >
                            <option value="g">g</option>
                            <option value="ml">ml</option>
                            <option value="un">un</option>
                            <option value="kg">kg</option>
                          </select>
                        </div>
                        <div className="col-span-4 text-right flex flex-col justify-center">
                          <span className="text-[9px] text-neutral-500 block">Custo</span>
                          <span className="font-black text-[11px] text-[var(--color-pastry-chocolate)]">
                            {formatMoney(ing.totalCost || 0)}
                          </span>
                        </div>
                        <div className="col-span-1 flex justify-end items-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveInsumoTamanho(tamanho.id, ing.id)}
                            className="p-0.5 text-neutral-400 hover:text-semantic-error-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* A CONTA ABERTA — de onde vem cada real deste tamanho.
                      Os quatro numeros ja existiam espalhados pelo formulario,
                      mas nada os somava nem comparava com o preco: dava para
                      cadastrar um bolo que custa mais do que vende sem nada na
                      tela avisar. Custo fixo NAO entra aqui de proposito — ele
                      vive na meta semanal do Inicio, porque ratear por bolo
                      exigiria supor um volume mensal que ninguem sabe. */}
                  {(() => {
                    // Insumos DESTE tamanho, nao mais uma soma unica da ficha.
                    const insumos =
                      tamanho.ingredients.reduce((s, i) => s + (Number(i.totalCost) || 0), 0) +
                      repoNum;
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

          {/* Aviso de preco que nao acompanha o tamanho. Nao bloqueia o
              salvamento — ver a nota em `avisosDePreco`. */}
          {avisosDePreco.length > 0 && (
            <div
              className="p-3.5 rounded-xl border animate-fadeIn"
              style={{ background: '#FFF6E8', borderColor: '#F0D2A0' }}
              role="status"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#B27A16' }} />
                <div>
                  <p
                    className="text-xs font-bold mb-1"
                    style={{ color: '#7A5310', fontFamily: "'Manrope', sans-serif" }}
                  >
                    Confira os preços por tamanho
                  </p>
                  <ul className="space-y-0.5">
                    {avisosDePreco.map((aviso) => (
                      <li
                        key={aviso}
                        className="text-[11px] leading-relaxed"
                        style={{ color: '#7A5310', fontFamily: "'Manrope', sans-serif" }}
                      >
                        {aviso}
                      </li>
                    ))}
                  </ul>
                  <p
                    className="text-[11px] mt-1.5"
                    style={{ color: '#9A7430', fontFamily: "'Manrope', sans-serif" }}
                  >
                    Se for de propósito, pode salvar normalmente.
                  </p>
                </div>
              </div>
            </div>
          )}

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

