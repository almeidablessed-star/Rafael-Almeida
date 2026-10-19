import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FichaTecnica, IngredientUsage, Transaction, TamanhoOpcao, StockItem, Produto } from '../types';
import { formatCurrency, parseNumeroDigitado } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import { useFichasTecnicas } from '../context/FichasTecnicasContext';
import { useProdutos } from '../context/ProdutosContext';
import { useCosts } from '../context/CostsContext';
import { calcularEstruturaFinanceira, calcularPrecoSugeridoProduto, somarDespesasEmpresa, fichaDesatualizada } from '../utils/financialEngine';
import { normalizeName } from '../utils/fichaMatcher';
import { capitalizeFirstLetter } from '../utils/textCase';
import { areUnitsCompatible, convertCostPerUnit } from '../utils/units';
import { StockItemAutocomplete } from './StockItemAutocomplete';
import { compressImageFile } from '../utils/imageCompression';
import { GenericDeleteConfirmModal } from './GenericDeleteConfirmModal';
import { DuplicateNameWarningModal } from './DuplicateNameWarningModal';
import { useDelayedDelete } from '../hooks/useDelayedDelete';
import { CampoComAjuda } from './onboarding/CampoComAjuda';
import { FieldValidationError } from './FieldValidationError';
import { CustomSelect } from './CustomSelect';
import { CARD_COMANDA, ROTULO_COMANDA, CAMPO_TINTA, CAIXA_NUMERO, NUMERO, CHIP_UNIDADE, ETIQUETA_VALOR, FuroEtiqueta, Picote } from './estiloComanda';
import {
  RENDIMENTO_UNIDADES,
  comporRendimentoParaGravar,
  deduzirUnidadeDoRendimento,
  getRendimentoSugerido,
} from '../utils/rendimento';
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
  Star,
  Scale,
  Clock,
  ArrowRight,
} from 'lucide-react';

/**
 * Teto de tamanhos por ficha.
 *
 * Nao ha regra de negocio exigindo cinco: e o ponto em que a lista deixa de
 * caber na tela do celular sem virar rolagem infinita. Se a confeiteira
 * precisar de mais, o numero vive aqui e nao espalhado pelo componente.
 */
const MAX_TAMANHOS = 5;

// Helpers para compatibilidade com a nova estrutura de tamanhos
const getPrincipalTamanho = (ficha: FichaTecnica) => {
  return ficha.tamanhos?.[0] || { id: 't1', descricao: '1', preco: 0 };
};

// Mesma funcao de sempre, agora com uma unica fonte em `utils/rendimento`, de
// onde a folha da cozinha tambem le — ate aqui cada lado tinha a sua regra.
const getYieldInfoCompat = (ficha: FichaTecnica) => getRendimentoSugerido(ficha);

const getSugestaoVendaCompat = (ficha: FichaTecnica) => {
  return getPrincipalTamanho(ficha).preco || 0;
};

const getTamanhoSelecionado = (ficha: FichaTecnica, selectedTamanhoId?: string) => {
  if (!selectedTamanhoId || !ficha.tamanhos) return getPrincipalTamanho(ficha);
  return ficha.tamanhos.find(t => t.id === selectedTamanhoId) || getPrincipalTamanho(ficha);
};

/**
 * Horas gravadas (decimais) -> os dois campos da tela: 1,5 vira "1" h e "30" min.
 * Ficha antiga sem horas abre com os dois VAZIOS, como antes.
 */
const separarHorasEMinutos = (horas?: number) => {
  if (horas == null) return { horasTrabalho: '', minutosTrabalho: '' };
  let h = Math.floor(horas);
  let m = Math.round((horas - h) * 60);
  if (m === 60) { h += 1; m = 0; }
  return { horasTrabalho: String(h), minutosTrabalho: m > 0 ? String(m) : '' };
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

// Unidades disponíveis no seletor de insumo. Opções incompatíveis com a
// unidade de compra do produto vinculado ficam desabilitadas (não somem —
// senão a usuária nao entenderia por que uma unidade "existente" cadastrada
// antes some da lista).
const UNIDADES_INSUMO = ['g', 'ml', 'un', 'kg', 'L', 'pacote'] as const;

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
  const { formatCurrency: formatMoney, symbol } = useCurrency();
  const { fichas, isLoading: isLoadingFichas, error: fichasError, addFicha, updateFicha, deleteFicha, fetchFichaPhoto } = useFichasTecnicas();
  const { produtos, addProduto, custoPorUnidade } = useProdutos();

  const produtosParaAutocomplete = useMemo<StockItem[]>(() => produtos.map((p) => ({
    id: String(p.id),
    name: p.nome,
    quantity: p.quantidadeAtual || 0,
    unit: p.unidadeEmbalagem,
    minThreshold: p.nivelMinimo || 0,
    minThresholdUnit: p.nivelMinimoUnidade || p.unidadeEmbalagem,
    costPerUnit: custoPorUnidade(p),
    fullQuantity: p.quantidadeReferencia || 0,
  })), [produtos, custoPorUnidade]);

  // Tarifa sugerida, vinda de Custos Administrativos. Só PREENCHE tamanhos
  // novos; cada tamanho continua editável, porque a hora varia por bolo — um
  // decorado vale mais que um simples. Ficha ja salva nunca e alterada por
  // mudanca nesta sugestao.
  const { administrativeCosts, ultimaMudancaMetas } = useCosts();
  const tarifaSugerida = administrativeCosts?.horaTrabalho
    ? String(administrativeCosts.horaTrabalho)
    : '';

  // Estrutura financeira da conta, mesma fonte que Dashboard e "Minha
  // Empresa" (spec Parte 5, Teste 10). Calculada uma vez aqui em cima e
  // reaproveitada por tamanho, nunca recalculada com formula propria.
  const despesasMensaisFichas = somarDespesasEmpresa(administrativeCosts?.despesas || []);
  const estruturaFinanceira = administrativeCosts
    ? calcularEstruturaFinanceira(
        administrativeCosts.monthlyIncomeTarget,
        despesasMensaisFichas,
        administrativeCosts.cmvTargetPercent,
        administrativeCosts.investmentTargetPercent,
        administrativeCosts.profitTargetPercent
      )
    : null;
  const [selectedCategory, setSelectedCategory] = useState<'bolos' | 'doces' | 'salgados' | 'saudaveis' | 'kids'>('bolos');
  const [isCreating, setIsCreating] = useState(false);
  // PREVIEW do formulario em 3 passos (Identificacao/Insumos/Preco) — ver
  // "Ficha Tecnica - Opcoes.dc.html". Reseta pra 1 sempre que o formulario
  // abre (handleOpenAdd/handleOpenEdit), pra nunca abrir num passo do meio.
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  // Tamanho aberto nos passos 2 e 3: um de cada vez, escolhido no seletor do
  // topo. Com ate 5 tamanhos empilhados a lista ficava longa e era facil
  // confundir de qual tamanho era cada insumo ou preco. `null` = o primeiro.
  const [tamanhoAtivoId, setTamanhoAtivoId] = useState<string | null>(null);
  const stepFormRef = useRef<HTMLFormElement>(null);
  /** Id do campo obrigatorio vazio, pra mostrar o card de erro custom no lugar do balao nativo do navegador. */
  const [invalidFieldId, setInvalidFieldId] = useState<string | null>(null);

  /**
   * Guarda de duplo-clique no botao primario do rodape.
   *
   * "Continuar" e "Salvar ficha tecnica" ocupam a mesma posicao no rodape
   * fixo — mesmo risco confirmado e corrigido no formulario de Pedido
   * (TransactionFormModal.tsx): um duplo-clique/duplo-toque real faz o
   * primeiro clique avancar de passo e o segundo cair em cima do botao que
   * acabou de trocar de lugar por baixo do dedo, submetendo a ficha antes da
   * hora. Aplicado aqui preventivamente, mesmo sem relato ainda.
   */
  const fichaLastStepChangeRef = useRef<number>(0);
  useEffect(() => {
    fichaLastStepChangeRef.current = performance.now();
  }, [formStep]);
  const fichaStepChangeIsFresh = () => performance.now() - fichaLastStepChangeRef.current < 400;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmandoAvancarSemInsumos, setConfirmandoAvancarSemInsumos] = useState(false);
  const [deletingFicha, setDeletingFicha] = useState<FichaTecnica | null>(null);

  /** Ficha duplicada achada ao salvar (criar ou renomear) — guarda os dados
   * prontos pra salvar, pra "Criar mesmo assim" nao precisar remontar tudo. */
  const [duplicateWarning, setDuplicateWarning] = useState<{ data: Omit<FichaTecnica, 'id' | 'createdAt'>; existing: FichaTecnica } | null>(null);

  /**
   * Exclusao de ficha com desfazer de verdade: ao confirmar, a ficha some da
   * lista na hora (via `pendingDeleteFichas`, filtrada no render) mas o
   * DELETE so e enviado ao Supabase 10s depois. "Desfazer" dentro da janela
   * cancela o timer sem nunca ter tocado o banco.
   *
   * Usa o hook compartilhado (`useDelayedDelete`, tambem usado em Produtos,
   * Transacoes e Clientes) em vez de uma implementacao local — esta tela foi
   * onde o padrao nasceu, mas a versao local guardava so UMA exclusao
   * pendente por vez; excluir uma segunda ficha antes dos 10s da primeira
   * sobrescrevia o timer sem cancela-lo, deletando a ficha errada cedo demais
   * e nunca de fato excluindo a primeira. O hook compartilhado ja foi
   * corrigido pra suportar varias pendentes ao mesmo tempo, cada uma com seu
   * proprio timer.
   */
  const {
    pendingItems: pendingDeleteFichas,
    requestDelete: requestDeleteFicha,
    cancelDelete: cancelDeleteFicha,
  } = useDelayedDelete<FichaTecnica>({
    deleteFn: async (ficha) => {
      try {
        await deleteFicha(ficha.id);
      } catch (err: any) {
        console.error('Erro ao deletar ficha técnica:', err);
        alert('Erro ao deletar ficha técnica: ' + (err.message || JSON.stringify(err)));
      }
    },
  });
  const [expandedFichaId, setExpandedFichaId] = useState<string | null>(null);
  const [launchSuccessMsg, setLaunchSuccessMsg] = useState<string | null>(null);
  const [expandedTamanhosId, setExpandedTamanhosId] = useState<string | null>(null);
  const [selectedTamanhoIdByFicha, setSelectedTamanhoIdByFicha] = useState<Record<string, string>>({}); // Rastreia tamanho selecionado por ficha

  // `fetchFichas` (FichasTecnicasContext) nao traz `foto_url` na listagem —
  // mesmo motivo do perfil e da cliente: evitar carregar um data URI pesado
  // pra cada linha so pra montar a lista. Isso deixava a foto do bolo em
  // branco na lista principal, e so aparecia depois de abrir "Editar" (que
  // busca sob demanda via `fetchFichaPhoto`). Mesma correcao aplicada aqui:
  // busca sob demanda a partir da propria lista, uma vez por ficha, cacheada
  // neste estado local.
  const [fichaPhotos, setFichaPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    const semFoto = fichas.filter((f) => !f.imageUrl && !fichaPhotos[f.id]);
    if (semFoto.length === 0) return;

    let cancelado = false;
    (async () => {
      for (const ficha of semFoto) {
        const url = await fetchFichaPhoto(ficha.id);
        if (!cancelado && url) {
          setFichaPhotos((prev) => (prev[ficha.id] ? prev : { ...prev, [ficha.id]: url }));
        }
      }
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fichas]);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'bolos' | 'doces' | 'salgados' | 'saudaveis' | 'kids'>('bolos');
  const [imageUrl, setImageUrl] = useState('');
  const [yieldInfo, setYieldInfo] = useState('');
  const [selectedYieldUnit, setSelectedYieldUnit] = useState<string>('fatias');

  const handleApplyYieldUnit = (unitKey: string) => {
    setSelectedYieldUnit(unitKey);
    const label = RENDIMENTO_UNIDADES[unitKey] || unitKey;
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
    // Minutos alem das horas cheias. Na tela sao dois campos; no banco segue
    // um numero so de horas (1 h 30 min = 1,5), sem mudar o formato gravado.
    minutosTrabalho: string;
    valorHora: string;
    ingredients: IngredientUsage[];
    maoDeObraCost: string;
    custoCost: string;
    investimentoCost: string;
  }>>([
    // Tamanhos em branco. Antes nasciam com preco 55/75/90 e custos 20/5/5 —
    // numeros de uma ficha de exemplo de outra fase. Quem nao reparasse
    // cadastrava um bolo com o preco de um bolo que nunca existiu.
    { id: 'ts-1', descricao: '1', preco: '', horasTrabalho: '', minutosTrabalho: '', valorHora: '', ingredients: [], maoDeObraCost: '', custoCost: '', investimentoCost: '' },
    { id: 'ts-2', descricao: '2', preco: '', horasTrabalho: '', minutosTrabalho: '', valorHora: '', ingredients: [], maoDeObraCost: '', custoCost: '', investimentoCost: '' },
    { id: 'ts-3', descricao: '3', preco: '', horasTrabalho: '', minutosTrabalho: '', valorHora: '', ingredients: [], maoDeObraCost: '', custoCost: '', investimentoCost: '' },
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
        const medida = parseNumeroDigitado((t.descricao || '').match(/\d+(?:[.,]\d+)?/)?.[0] || '');
        const preco = parseNumeroDigitado(t.preco || '');
        return { descricao: t.descricao, medida, preco };
      })
      // Preco 0/vazio significa "ainda nao preencheu", nao "de graca". A
      // medida entra na mesma regra: parseNumeroDigitado devolve 0 — e nao
      // NaN — quando a descricao nao tem numero nenhum, entao e o "> 0" que
      // tira esses tamanhos da comparacao, no lugar do Number.isFinite antigo.
      .filter((t) => t.medida > 0 && t.preco > 0);

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

  /** Horas + minutos do tamanho, em horas decimais (1 h 30 min = 1,5). */
  const horasTotais = (t: { horasTrabalho: string; minutosTrabalho: string }) =>
    (parseNumeroDigitado(t.horasTrabalho || '') || 0) + (parseNumeroDigitado(t.minutosTrabalho || '') || 0) / 60;

  /**
   * Mão de obra de um tamanho: horas x tarifa.
   *
   * Sem horas ou sem tarifa, devolve o valor que ja estava gravado — e o que
   * mantem valida uma ficha cadastrada antes destes campos existirem.
   */
  const calcularMaoDeObra = (t: { horasTrabalho: string; minutosTrabalho: string; valorHora: string; maoDeObraCost: string }) => {
    const horas = horasTotais(t);
    const tarifa = parseNumeroDigitado((t.valorHora || '')) || 0;
    const calculada = horas * tarifa;
    return calculada > 0 ? calculada : parseNumeroDigitado((t.maoDeObraCost || '')) || 0;
  };

  /**
   * Custo administrativo e investimento de um tamanho: fatia do preco de
   * venda, do mesmo tamanho percentual configurado em "Minha Empresa"
   * (estruturaFinanceira.custosPercent e investmentTargetPercent) — a mesma
   * fonte usada no preco sugerido, nunca uma conta separada.
   *
   * Antes eram dois campos de texto que a confeiteira preenchia no chute, um
   * por tamanho, sem nenhuma ligacao com a estrutura financeira que ela ja
   * configurou. Sem meta valida ou sem preco preenchido ainda, devolve o
   * valor que ja estava gravado — mesma regra de preservacao da mao de obra,
   * para nao zerar uma ficha antiga so por abrir e salvar de novo.
   */
  const calcularCustoAdmAutomatico = (t: { preco: string; custoCost: string }) => {
    const preco = parseNumeroDigitado((t.preco || '')) || 0;
    if (estruturaFinanceira?.valido && preco > 0) {
      return preco * (estruturaFinanceira.custosPercent / 100);
    }
    return parseNumeroDigitado((t.custoCost || '')) || 0;
  };

  const calcularInvestimentoAutomatico = (t: { preco: string; investimentoCost: string }) => {
    const preco = parseNumeroDigitado((t.preco || '')) || 0;
    if (estruturaFinanceira?.valido && administrativeCosts && preco > 0) {
      return preco * (administrativeCosts.investmentTargetPercent / 100);
    }
    return parseNumeroDigitado((t.investimentoCost || '')) || 0;
  };

  const handleOpenAdd = () => {
    setName('');
    setCategory(selectedCategory);
    setImageUrl('');
    setYieldInfo('1');
    // Volta ao padrao: o seletor nao era reiniciado, entao a unidade escolhida
    // numa ficha continuava valendo na proxima aberta na mesma sessao — e
    // agora que a unidade entra no texto gravado, isso viraria dado errado.
    setSelectedYieldUnit('fatias');
    setIngredients([]);
    // UM tamanho, e nao tres. Cada confeiteira tem uma realidade: umas vendem
    // um tamanho so, outras varios. Abrir com tres campos vazios alongava o
    // formulario a toa e sugeria que era preciso preencher os tres. Quem
    // precisa de mais usa o "+ Adicionar", um de cada vez.
    setTamanhos([
      { id: 'ts-1', descricao: '', preco: '', horasTrabalho: '', minutosTrabalho: '', valorHora: tarifaSugerida, ingredients: [], maoDeObraCost: '', custoCost: '', investimentoCost: '' },
    ]);
    setEditingId(null);
    setInvalidFieldId(null);
    setIsCreating(true);
    setFormStep(1);
    setTamanhoAtivoId(null);
  };

  const handleOpenEdit = async (ficha: FichaTecnica) => {
    setName(ficha.name);
    setCategory(ficha.category);
    setImageUrl(ficha.imageUrl || '');
    // Ficha antiga, sem rendimento gravado, abre o campo VAZIO.
    //
    // Antes caia em `getYieldInfoCompat` — a descricao do primeiro tamanho — e
    // o campo abria com "20 cm" ja preenchido. Quem editasse a ficha por outro
    // motivo e salvasse gravava esse diametro na coluna `rendimento`, sem
    // nenhum aviso e sem jeito de distinguir depois do que foi digitado de
    // proposito. A sugestao de tela nao pode ser o que vai para o banco: o
    // rendimento so e gravado quando alguem o digita.
    setYieldInfo(ficha.yieldInfo || '');
    // O seletor abre na unidade que o proprio texto gravado declara ("500 g"
    // abre em Gramas). Sem isto ele abriria em Fatias — ou na unidade que
    // sobrou da ficha anterior — e salvar converteria gramas em fatias.
    setSelectedYieldUnit(deduzirUnidadeDoRendimento(ficha.yieldInfo));
    setIngredients(ficha.ingredients || []);

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
          ...separarHorasEMinutos(t.horasTrabalho),
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
        { id: 'ts-1', descricao: '1', preco: '0', horasTrabalho: '', minutosTrabalho: '', valorHora: '', ingredients: [], maoDeObraCost: '0', custoCost: '0', investimentoCost: '0' },
        { id: 'ts-2', descricao: '2', preco: '0', horasTrabalho: '', minutosTrabalho: '', valorHora: '', ingredients: [], maoDeObraCost: '0', custoCost: '0', investimentoCost: '0' },
        { id: 'ts-3', descricao: '3', preco: '0', horasTrabalho: '', minutosTrabalho: '', valorHora: '', ingredients: [], maoDeObraCost: '0', custoCost: '0', investimentoCost: '0' },
      ]);
    }

    setEditingId(ficha.id);
    setIsCreating(true);
    setFormStep(1);
    setTamanhoAtivoId(null);
    setInvalidFieldId(null);

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

    // Nome ou UNIDADE: o custo vem do catalogo Produtos e depende dos dois.
    //
    // A unidade estava de fora, e o efeito passava despercebido: cadastrar
    // "leite 100 ml" e depois trocar para "g" mantinha o custo por ml. O numero
    // continuava plausivel na tela, so que errado — e alimentava a conta aberta
    // e o preco do bolo.
    //
    // Casamento por nome NORMALIZADO (mesma logica de normalizeName usada no
    // vinculo em massa das fichas existentes), nao mais texto exato — "Leite"
    // e "leite" ou "Leite " precisam casar com o mesmo Produto.
    if (field === 'name' || field === 'unit') {
      const nome = field === 'name' ? String(val) : ing.name;
      let unidade = field === 'unit' ? String(val) : ing.unit;
      const alvo = normalizeName(nome || '');
      const produto = alvo ? produtos.find((p) => normalizeName(p.nome) === alvo) : undefined;

      if (produto) {
        // Trocar de produto (via nome) pode deixar a unidade antiga presa e
        // incompatível com a nova compra (ficha em "kg" casando agora com um
        // produto vendido em "L") — sem isso o <select> ficaria filtrado mas
        // o valor ja selecionado continuaria escondido e errado.
        if (!areUnitsCompatible(produto.unidadeEmbalagem, unidade)) {
          unidade = produto.unidadeEmbalagem;
          updated.unit = unidade as IngredientUsage['unit'];
        }
        const custoBase = custoPorUnidade(produto);
        // `unidade` acima ja foi forcada a ser compativel com
        // `produto.unidadeEmbalagem` (mesma guarda de `areUnitsCompatible`) —
        // o `?? custoBase` e so defensivo, nunca deveria disparar na pratica.
        const convertedCost = convertCostPerUnit(custoBase, produto.unidadeEmbalagem, unidade) ?? custoBase;
        updated.unitCost = convertedCost;
        updated.totalCost = (Number(ing.quantity) || 0) * convertedCost;
        updated.produtoId = produto.id;
      } else if (field === 'name') {
        // Nome mudou e nao bate mais com nenhum produto: solta o vinculo
        // antigo, senao o custo continuaria vindo de um produto que nao e
        // mais este insumo.
        updated.produtoId = undefined;
      }
    }

    if (field === 'quantity' || field === 'unitCost') {
      const q = field === 'quantity' ? parseNumeroDigitado(val) || 0 : ing.quantity;
      const c = field === 'unitCost' ? parseNumeroDigitado(val) || 0 : ing.unitCost;
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
                { id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, name: '', quantity: 0, unit: 'g' as const, unitCost: 0, totalCost: 0 },
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

  // --- Cadastro rapido de Produto, direto do insumo da ficha (spec Modulo
  // Produtos, secao 3: "fluxo guiado"). Abre um mini-formulario SEM navegar
  // pra outra aba, e ao salvar vincula o produtoId no proprio insumo que
  // estava sendo editado — a usuaria continua exatamente de onde parou.

  const [criandoProdutoInsumo, setCriandoProdutoInsumo] = useState<{ tamanhoId: string; insumoId: string } | null>(null);
  const [novoProdutoNome, setNovoProdutoNome] = useState('');
  const [novoProdutoCategoria, setNovoProdutoCategoria] = useState('');
  const [novoProdutoPreco, setNovoProdutoPreco] = useState('');
  const [novoProdutoQtdEmbalagem, setNovoProdutoQtdEmbalagem] = useState('');
  const [novoProdutoUnidade, setNovoProdutoUnidade] = useState<Produto['unidadeEmbalagem']>('g');
  const [novoProdutoControlaEstoque, setNovoProdutoControlaEstoque] = useState(true);
  const [novoProdutoQtdAtual, setNovoProdutoQtdAtual] = useState('');
  const [novoProdutoNivelMinimo, setNovoProdutoNivelMinimo] = useState('');
  /** Ver a mesma ideia em ProdutosModule: enquanto a pessoa nao mexe no alerta,
   * digitar a quantidade da embalagem re-sugere 20% dela. Depois de mexer, a
   * sugestao nunca mais toca no campo — inclusive se ela zerar de proposito. */
  const [novoProdutoAlertaTocado, setNovoProdutoAlertaTocado] = useState(false);
  const [salvandoNovoProduto, setSalvandoNovoProduto] = useState(false);

  const handleAbrirCriarProduto = (tamanhoId: string, insumoId: string, nomeSugerido: string) => {
    setCriandoProdutoInsumo({ tamanhoId, insumoId });
    setNovoProdutoNome(nomeSugerido);
    setNovoProdutoCategoria('');
    setNovoProdutoPreco('');
    setNovoProdutoQtdEmbalagem('');
    setNovoProdutoUnidade('g');
    setNovoProdutoControlaEstoque(true);
    setNovoProdutoQtdAtual('');
    setNovoProdutoNivelMinimo('');
    setNovoProdutoAlertaTocado(false);
  };

  const handleSalvarNovoProdutoInline = async () => {
    if (!criandoProdutoInsumo || !novoProdutoNome.trim()) return;

    // Pega a confusao no momento em que ela acontece. Com o controle de
    // estoque LIGADO e o campo vazio, o produto nasce com zero e ja aparece
    // como CRITICO no Estoque — foi assim que um insumo real acabou zerado,
    // porque a quantidade tinha sido digitada no campo de cima ("quanto a
    // receita usa"). Nao bloqueia: zero e uma resposta legitima para quem
    // ainda nao comprou o item.
    if (novoProdutoControlaEstoque && !novoProdutoQtdAtual.trim()) {
      const seguir = window.confirm(
        'Você não informou quanto já tem guardado deste item, então ele vai entrar com estoque zero.\n\n' +
          'Esse campo é o seu estoque de hoje — não o quanto a receita usa, que é o de cima.\n\n' +
          'Quer salvar assim mesmo?'
      );
      if (!seguir) return;
    }

    setSalvandoNovoProduto(true);
    try {
      const precoNum = parseNumeroDigitado(novoProdutoPreco) || 0;
      const qtdEmbNum = parseNumeroDigitado(novoProdutoQtdEmbalagem) || 1;
      const qtdAtualNum = parseNumeroDigitado(novoProdutoQtdAtual) || 0;

      const produto = await addProduto({
        nome: novoProdutoNome.trim(),
        categoria: novoProdutoCategoria.trim() || null,
        precoPago: precoNum,
        quantidadeEmbalagem: qtdEmbNum,
        unidadeEmbalagem: novoProdutoUnidade,
        controlaEstoque: novoProdutoControlaEstoque,
        quantidadeAtual: novoProdutoControlaEstoque ? qtdAtualNum : null,
        quantidadeReferencia: null,
        nivelMinimo: novoProdutoControlaEstoque
          ? parseNumeroDigitado(novoProdutoNivelMinimo) || 0
          : null,
        nivelMinimoUnidade: novoProdutoControlaEstoque ? novoProdutoUnidade : null,
      });

      // Nao basta reaplicar o casamento por nome (aplicarEdicaoDeInsumo): o
      // `produtos` fechado neste componente ainda nao tem o item recem-criado
      // no momento em que o `await` acima resolve. Gravamos direto os campos
      // que o casamento normal preencheria — inclusive a conversao de
      // unidade: a linha do insumo mantem a unidade que a usuaria ja tinha
      // escolhido (o seletor ao lado da quantidade), e o custo do Produto e
      // que se converte para ela. Antes este bloco sobrescrevia a unidade do
      // insumo pela unidade de embalagem do Produto sem converter a
      // quantidade — "200 g" virava "200 kg" quando o Produto era cadastrado
      // em kg, inflando o custo em 1000x.
      const { tamanhoId, insumoId } = criandoProdutoInsumo;
      const custoBase = custoPorUnidade(produto);
      setTamanhos((prev) =>
        prev.map((t) =>
          t.id === tamanhoId
            ? {
                ...t,
                ingredients: t.ingredients.map((ing) => {
                  if (ing.id !== insumoId) return ing;
                  const unidade = areUnitsCompatible(produto.unidadeEmbalagem, ing.unit)
                    ? ing.unit
                    : produto.unidadeEmbalagem;
                  // `unidade` acima ja foi forcada a ser compativel com
                  // `produto.unidadeEmbalagem` (mesma guarda de `areUnitsCompatible`) —
                  // o `?? custoBase` e so defensivo, nunca deveria disparar na pratica.
                  const convertedCost = convertCostPerUnit(custoBase, produto.unidadeEmbalagem, unidade) ?? custoBase;
                  return {
                    ...ing,
                    name: produto.nome,
                    produtoId: produto.id,
                    unit: unidade,
                    unitCost: convertedCost,
                    totalCost: (Number(ing.quantity) || 0) * convertedCost,
                  };
                }),
              }
            : t
        )
      );

      setCriandoProdutoInsumo(null);
    } catch (err) {
      alert((err as any).message || 'Erro ao criar produto');
    } finally {
      setSalvandoNovoProduto(false);
    }
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
    // Teto de cinco. A checagem fica AQUI, e nao so no botao: esconder o botao
    // e a pista visual, mas quem garante o limite e a funcao que altera o
    // estado — sem isto, qualquer outro caminho que chame `handleAddTamanho`
    // passaria de cinco sem aviso.
    if (tamanhos.length >= MAX_TAMANHOS) return;

    const newId = `ts-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setTamanhos((prev) => {
      const anterior = prev[prev.length - 1];
      return [
        ...prev,
        {
          id: newId,
          descricao: '',
          preco: '0',
          // Repete a tarifa do tamanho anterior: quem cadastra varios tamanhos do
          // mesmo bolo costuma cobrar a mesma hora, e so as horas mudam.
          horasTrabalho: '',
          minutosTrabalho: '',
          valorHora: anterior?.valorHora || tarifaSugerida,
          // Nasce com os MESMOS insumos do tamanho anterior (so a quantidade
          // muda entre tamanhos do mesmo bolo). Nascer vazio e o que fazia a
          // confeiteira esquecer de recadastrar um insumo em um tamanho novo
          // e a baixa de estoque falhar em silencio para ele.
          ingredients: (anterior?.ingredients || []).map((ing, k) => ({
            ...ing,
            id: `${Date.now()}_${k}`,
          })),
          maoDeObraCost: maoDeObraCost,
          custoCost: custoCost,
          investimentoCost: investimentoCost,
        },
      ];
    });
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
      const horas = horasTotais(t);
      const tarifa = parseNumeroDigitado(t.valorHora) || 0;
      const maoDeObraCalculada = horas * tarifa;

      return {
        id: t.id,
        descricao: t.descricao,
        preco: parseNumeroDigitado(t.preco) || 0,
        horasTrabalho: horas > 0 ? horas : undefined,
        valorHora: tarifa > 0 ? tarifa : undefined,
        // Insumos deste tamanho, sem as linhas em branco que ficaram por engano.
        ingredients: t.ingredients.filter((ing) => (ing.name || '').trim()),
        // Com horas e tarifa preenchidas, a mao de obra vem da conta. Sem elas,
        // o valor que ja estava gravado e PRESERVADO — do contrario abrir uma
        // ficha antiga e salvar zeraria a mao de obra dela sem aviso.
        maoDeObraCost: maoDeObraCalculada > 0
          ? maoDeObraCalculada
          : parseNumeroDigitado(t.maoDeObraCost) || 0,
        custoCost: calcularCustoAdmAutomatico(t),
        investimentoCost: calcularInvestimentoAutomatico(t),
      };
    });

    const fichaData: Omit<FichaTecnica, 'id' | 'createdAt'> = {
      name: name.trim(),
      category,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
      // Numero digitado + unidade do seletor, sempre — nao so quando alguem
      // abre o seletor e clica. A unidade nao tem coluna propria, entao ou ela
      // entra aqui no texto ou se perde. Ver [[comporRendimentoParaGravar]].
      yieldInfo: comporRendimentoParaGravar(yieldInfo, selectedYieldUnit) || undefined,
      tamanhos: tamanhosData,
      // A lista da FICHA vira um espelho do primeiro tamanho. A lista que vale
      // e a de cada tamanho; esta so atende quem ainda le o campo antigo (a
      // folha de orcamento) e serve de rede para fichas sem lista por tamanho.
      ingredients: tamanhosData[0]?.ingredients || [],
      maoDeObraCost: parseNumeroDigitado(maoDeObraCost) || 0,
      custoCost: parseNumeroDigitado(custoCost) || 0,
      investimentoCost: parseNumeroDigitado(investimentoCost) || 0,
    };

    // Mesmo nome (ignorando maiuscula/minuscula, acento e pontuacao — ver
    // normalizeName) de outra ficha ja cadastrada: pra criacao ou pra
    // renomear uma existente pra um nome que ja e de outra. Decisao de
    // produto: avisa mas nao bloqueia, ver
    // docs/pendencia-nomes-duplicados-produto-cliente-ficha.md.
    const duplicada = fichas.find(
      (f) => f.id !== editingId && normalizeName(f.name) === normalizeName(fichaData.name)
    );
    if (duplicada) {
      setDuplicateWarning({ data: fichaData, existing: duplicada });
      return;
    }

    await performSaveFicha(fichaData);
  };

  const performSaveFicha = async (fichaData: Omit<FichaTecnica, 'id' | 'createdAt'>) => {
    try {
      if (editingId) {
        await updateFicha(editingId, fichaData);
      } else {
        await addFicha(fichaData);
      }
      setIsCreating(false);
      setEditingId(null);
      setDuplicateWarning(null);
    } catch (err) {
      alert('Erro ao salvar ficha técnica: ' + (err as any).message);
    }
  };

  const handleDelete = (ficha: FichaTecnica) => {
    setDeletingFicha(ficha);
  };

  const handleConfirmDelete = (id: string) => {
    const fichaToDelete = fichas.find((f) => f.id === id);
    if (!fichaToDelete) return;
    requestDeleteFicha(fichaToDelete);
  };

  const handleDuplicate = async (fichaToDup: FichaTecnica) => {
    try {
      const fichaData: Omit<FichaTecnica, 'id' | 'createdAt'> = {
        name: `${fichaToDup.name} (Cópia)`,
        category: fichaToDup.category,
        imageUrl: fichaToDup.imageUrl,
        tamanhos: fichaToDup.tamanhos,
        ingredients: (fichaToDup.ingredients || []).map((ing, idx) => ({ ...ing, id: `${Date.now()}_${idx}` })),
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

  // Some da lista (e da contagem por categoria, abaixo) assim que a exclusao
  // e confirmada, mesmo o DELETE real so acontecendo 10s depois — ver
  // `pendingDeleteFichas`. Mais de uma pode estar pendente ao mesmo tempo.
  const fichasVisiveis = pendingDeleteFichas.length > 0
    ? fichas.filter((f) => !pendingDeleteFichas.some((pend) => pend.id === f.id))
    : fichas;
  const filteredFichas = fichasVisiveis.filter((f) => f.category === selectedCategory);

  // Tamanho aberto nos passos 2 e 3. Se o escolhido foi removido no passo 1,
  // cai no primeiro.
  const tamanhoAtivo = tamanhos.find((t) => t.id === tamanhoAtivoId) ?? tamanhos[0];

  /**
   * Seletor do topo dos passos 2 e 3: um botao por tamanho cadastrado no
   * passo 1. Cada botao mostra um resumo do tamanho (insumos no passo 2,
   * preco no passo 3) e um alerta quando falta algo, para nada ficar
   * esquecido no tamanho que nao esta aberto.
   */
  const seletorDeTamanho = (passo: 2 | 3) => (
    <div className="flex flex-col gap-2">
      <span style={ROTULO_COMANDA}>TAMANHO</span>
      {/* Uma linha so, com os botoes dividindo a largura por igual: cada
          tamanho novo entra ao lado e todos encolhem para caber. Com
          flex-wrap os 5 quebravam em duas linhas. Nome comprido corta com
          "…". */}
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${tamanhos.length}, minmax(0, 1fr))` }}
        role="tablist"
        aria-label="Tamanho"
      >
        {tamanhos.map((t, i) => {
          const ativo = t.id === tamanhoAtivo?.id;
          const preco = parseNumeroDigitado(t.preco || '') || 0;
          const custoTotal = passo === 3
            ? t.ingredients.reduce((soma, ing) => soma + (Number(ing.totalCost) || 0), 0)
              + calcularMaoDeObra(t) + calcularCustoAdmAutomatico(t) + calcularInvestimentoAutomatico(t)
            : 0;
          const alerta = passo === 2
            ? t.ingredients.length === 0
            : preco <= 0 || preco < custoTotal;
          const resumo = passo === 2
            ? `${t.ingredients.length} insumo${t.ingredients.length === 1 ? '' : 's'}`
            // Sem centavos no botao: com 5 tamanhos cada um tem ~60px no
            // celular. O valor completo aparece no card do tamanho aberto.
            : preco > 0 ? formatMoney(preco).replace(/[.,]\d{2}$/, '') : '—';
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => setTamanhoAtivoId(t.id)}
              className="relative flex flex-col items-center gap-0.5 min-w-0 cursor-pointer transition-transform hover:-translate-y-0.5"
              style={{
                padding: '8px 4px 9px',
                borderRadius: '14px',
                border: ativo ? 'none' : '1px solid rgba(110,63,114,.18)',
                background: ativo ? '#3A2350' : '#FFFFFF',
                boxShadow: ativo ? '0 10px 20px rgba(58,35,80,.3)' : '0 4px 12px rgba(58,35,80,.06)',
                textAlign: 'center',
              }}
            >
              <span className="max-w-full truncate" style={{ fontSize: '13px', fontWeight: 800, color: ativo ? '#FFFFFF' : '#241B2B', whiteSpace: 'nowrap' }}>
                {t.descricao.trim() || `Tamanho ${i + 1}`}
              </span>
              <span className="flex items-center justify-center gap-0.5 max-w-full" style={{ fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap', color: alerta ? (ativo ? '#F5B9C6' : '#C4626F') : (ativo ? 'rgba(255,255,255,.7)' : '#7A6E80') }}>
                {alerta && <AlertTriangle className="w-2.5 h-2.5 shrink-0" strokeWidth={2.6} />}
                {resumo}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-0 pb-12 animate-fadeIn" style={{ background: '#F6F2F5', minHeight: '100vh' }}>
      {/* Header - Roxo Gradiente */}
      <div
        className="overflow-hidden"
        style={{
          // Sem sombra: este envolucro e a pagina inteira, nao um cartao — a sombra
          // roxa caia abaixo da borda de baixo dele e aparecia como faixa no fim da
          // tela no iPhone. Mesma correcao da aba Pedidos.
          background: '#F6F2F5',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '-100px',
          paddingBottom: '100px',
          // Sangra para cima cobrindo a safe area, mesmo padrao do header do
          // Dashboard — ver comentario em OrdersModule.tsx.
          marginTop: 'calc(0px - env(safe-area-inset-top, 0px))',
        }}
      >
        {/* Header with Title only */}
        <div
          className="px-5 flex items-center justify-between gap-4"
          style={{
            background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
            borderRadius: '0px 0px 0px 0px',
            paddingTop: 'calc(40px + env(safe-area-inset-top, 0px))',
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
            background: '#F6F2F5',
            borderRadius: '28px 28px 0 0',
            position: 'relative',
            padding: '20px',
            marginLeft: 'calc(-0.5 * var(--app-bleed) + 50%)',
            marginRight: 'calc(-0.5 * var(--app-bleed) + 50%)',
            paddingLeft: 'calc(20px + max(0px, env(safe-area-inset-left)))',
            paddingRight: 'calc(20px + max(0px, env(safe-area-inset-right)))',
            zIndex: 50,
            // Sem sombra interna: ela escurecia as bordas de cima e de baixo da
            // folha com um tom roxo e era isso que aparecia como variacao de cor no
            // fim da tela. Nenhuma outra aba tem isto; o Inicio nao tem.
          }}
        >

      {launchSuccessMsg && (
        <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)] text-[var(--color-primary)] text-xs p-3.5 rounded-lg flex items-center gap-2.5 animate-fadeIn shadow-card">
          <Check className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
          <span className="font-bold">{launchSuccessMsg}</span>
        </div>
      )}

      {/* Category chips — ver "Fichas - Aba.dc.html". Layout novo (pilula
          com contador), mesmas categorias/labels/contagens reais de sempre —
          antes eram 5 blocos quase identicos repetidos a mao, um por
          categoria. */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((key) => {
          const cat = CATEGORY_LABELS[key];
          const isActive = selectedCategory === key;
          const count = fichasVisiveis.filter((f) => f.category === key).length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedCategory(key as typeof selectedCategory)}
              className="flex-shrink-0 whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-all"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                padding: '9px 14px',
                borderRadius: '999px',
                color: isActive ? '#FFFFFF' : '#3A2350',
                background: isActive ? '#3A2350' : '#FFFFFF',
                border: `1px solid ${isActive ? '#3A2350' : 'rgba(58,35,80,0.12)'}`,
                boxShadow: isActive ? '0 8px 16px rgba(58,35,80,0.3)' : '0 2px 4px rgba(58,35,80,0.08)',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = '#A85E86'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(58,35,80,0.12)'; }}
            >
              <span>{cat.icon} {cat.label}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.65 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Formulario de criar/editar ficha, reestruturado em 3 passos — ver
          "Ficha Tecnica - Opcoes.dc.html" e o plano aprovado. Os 3 passos
          ficam sempre montados no DOM (visibilidade por `display`, nao por
          desmontar) para a validacao nativa "required" do Passo 1 continuar
          funcionando mesmo se a usuaria for direto pro Passo 3 e clicar
          Salvar. */}
      {/* Form em tela cheia, no mesmo padrao de Clientes e Produtos. Antes
          era um card na pagina com o corpo limitado a 65vh, e rolava "por
          dentro" enquanto a pagina tambem rolava. */}
      {isCreating && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-900/80 backdrop-blur-xs p-0 sm:p-4" role="dialog" aria-modal="true">
        <div
          className="w-full h-full sm:h-auto sm:max-w-[430px] sm:max-h-[90vh] sm:rounded-[24px] overflow-hidden flex flex-col"
          style={{ background: '#FFFFFF', boxShadow: '0 30px 70px rgba(58,35,80,0.26)' }}
        >
          {/* Cabecalho gradiente com navegacao de passos */}
          <div
            style={{ background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 55%, #A85E86 100%)', paddingTop: 'calc(18px + env(safe-area-inset-top, 0px))' }}
            className="px-5 pb-4 flex flex-col gap-3.5 flex-shrink-0"
          >
            <div className="flex items-center justify-between">
              <span className="font-serif-display text-white" style={{ fontSize: '23px' }}>
                {editingId ? 'Editar Ficha Técnica' : 'Criar Nova Ficha Técnica'}
              </span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="w-8 h-8 rounded-[10px] bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              {([
                { n: 1 as const, label: 'Identificação' },
                { n: 2 as const, label: 'Insumos' },
                { n: 3 as const, label: 'Preço' },
              ]).map((s) => (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => {
                    // Pular direto pro Passo 3 pelo indicador tambem contorna
                    // o aviso de insumos, do mesmo jeito que o botao
                    // "Continuar" contornava antes de ganhar a checagem.
                    if (s.n === 3 && formStep < 3 && tamanhos.some((t) => t.ingredients.length === 0)) {
                      setConfirmandoAvancarSemInsumos(true);
                      return;
                    }
                    setFormStep(s.n);
                  }}
                  className="flex-1 flex flex-col gap-1.5 cursor-pointer"
                >
                  <div style={{ height: '3px', borderRadius: '2px', background: formStep >= s.n ? '#F5B9C6' : 'rgba(255,255,255,0.25)' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: formStep === s.n ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                    {s.n} · {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Corpo com rolagem */}
          <div className="flex-1 min-h-0 overflow-y-auto p-[18px]" style={{ background: '#F6F2F5' }}>
            <form id="form-ficha-stepped" ref={stepFormRef} onSubmit={handleSaveFicha} noValidate>

              {/* PASSO 1 — IDENTIFICAÇÃO */}
              <div data-step={1} style={{ display: formStep === 1 ? 'flex' : 'none', flexDirection: 'column', gap: '14px' }}>
                <div className="text-[13px]" style={{ color: '#7A6E80' }}>Comece pelo básico da receita.</div>

                <div className="bg-white rounded-2xl p-[18px] flex flex-col gap-3.5" style={{ boxShadow: '0 8px 20px rgba(58,35,80,.09)' }}>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: '#7A6E80' }}>Nome do pedido *</label>
                    <input
                      id="ficha-nome"
                      type="text"
                      required
                      placeholder="Ex: Bolo Vulcão Ninho com Nutella"
                      value={name}
                      onChange={(e) => {
                        setName(capitalizeFirstLetter(e.target.value));
                        if (invalidFieldId === 'ficha-nome') setInvalidFieldId(null);
                      }}
                      className="border rounded-[10px] px-3 py-3 text-[15px]"
                      style={{ borderColor: 'rgba(58,35,80,0.14)', background: '#FAF7FA' }}
                    />
                    {invalidFieldId === 'ficha-nome' && <FieldValidationError />}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: '#7A6E80' }}>Categoria *</label>
                    <CustomSelect
                      value={category}
                      onChange={(v) => setCategory(v as any)}
                      options={[
                        { value: 'bolos', label: '🎂 Bolos & Massas' },
                        { value: 'doces', label: '🧁 Doces & Sobremesas' },
                        { value: 'salgados', label: '🥟 Salgados & Lanches' },
                        { value: 'saudaveis', label: '🥗 Saudáveis & Fit' },
                        { value: 'kids', label: '🧸 Kids Friendly' },
                      ]}
                      ariaLabel="Categoria da ficha técnica"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: '#7A6E80' }}>Foto</label>
                    {imageUrl ? (
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0" style={{ border: '2px solid #F3E9F3' }}>
                          <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="text-xs font-bold"
                          style={{ color: '#C4626F' }}
                        >
                          Remover foto
                        </button>
                      </div>
                    ) : (
                      <label
                        className="flex items-center gap-3 border border-dashed rounded-xl p-3 cursor-pointer transition-colors"
                        style={{ borderColor: 'rgba(58,35,80,0.22)', background: '#FAF7FA' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#A85E86'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(58,35,80,0.22)'; }}
                      >
                        <div className="w-11 h-11 rounded-[10px] flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#F3E9F3' }}>🍰</div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold" style={{ color: '#3A2350' }}>Escolher foto</span>
                          <span className="text-xs" style={{ color: '#7A6E80' }}>PNG ou JPG, até 5 MB</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setImageUrl(await compressImageFile(file));
                            } catch (err: any) {
                              alert(err?.message || 'Nao foi possivel usar esta imagem.');
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Tamanhos — decisao estrutural (quantos tamanhos esta ficha
                    tem), separada do CONTEUDO de cada um (insumos no Passo 2,
                    preco no Passo 3). O mockup nao mostra isso porque a ficha
                    de exemplo dele so tem 1 tamanho; o formulario real
                    suporta varios. */}
                <div className="bg-white rounded-2xl p-4 flex flex-col gap-3" style={{ boxShadow: '0 8px 20px rgba(58,35,80,.09)' }}>
                  <div className="flex items-center justify-between">
                    <div className="font-serif-display text-lg" style={{ color: '#3A2350' }}>
                      Tamanhos ({tamanhos.length})
                    </div>
                    {tamanhos.length < MAX_TAMANHOS && (
                      <button
                        type="button"
                        onClick={handleAddTamanho}
                        className="text-xs font-bold cursor-pointer"
                        style={{ color: '#6E3F72' }}
                      >
                        + Adicionar
                      </button>
                    )}
                  </div>
                  <CampoComAjuda microcopy="Se o mesmo bolo sai em mais de um tamanho (P/M/G, por exemplo), adicione todos aqui em vez de criar uma ficha nova pra cada um. Os insumos continuam os mesmos — só a quantidade de cada um muda por tamanho, no Passo 2." />
                  {tamanhos.map((tamanho) => (
                    <div key={tamanho.id} className="flex items-center gap-2.5">
                      <input
                        type="text"
                        placeholder="Ex: 20 cm, 15 fatias"
                        value={tamanho.descricao}
                        onChange={(e) => handleUpdateTamanho(tamanho.id, 'descricao', e.target.value)}
                        className="flex-1 min-w-0 border rounded-[10px] px-3 py-2.5 text-sm font-semibold"
                        style={{ borderColor: 'rgba(58,35,80,0.14)', background: '#FAF7FA' }}
                      />
                      {tamanhos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTamanho(tamanho.id)}
                          className="text-xs font-bold flex-shrink-0"
                          style={{ color: '#C4626F' }}
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* PASSO 2 — INSUMOS de um tamanho por vez, escolhido no seletor
                  do topo (ver `tamanhoAtivoId`). Os outros continuam no
                  estado e sao gravados igual; so nao aparecem na tela. */}
              <div data-step={2} style={{ display: formStep === 2 ? 'flex' : 'none', flexDirection: 'column', gap: '14px', fontFamily: "'Manrope', sans-serif", color: '#241B2B' }}>
                {/* Visual do design "Ficha Tecnica · Insumos" (Claude Design):
                    cada insumo e uma comanda com numero, nome a tinta, picote,
                    quantidade com chip de unidade e etiqueta de custo. O que o
                    design nao trazia e o app ja tinha (titulo de cada tamanho,
                    aviso de tamanho sem insumos, copiar do tamanho anterior,
                    cadastrar produto novo, rendimento) segue o mesmo estilo. */}
                {tamanhos.length > 1 && seletorDeTamanho(2)}
                {tamanhos.map((tamanho, index) => tamanho.id !== tamanhoAtivo?.id ? null : (
                  <div key={tamanho.id} className="flex flex-col gap-3">
                    {/* Com mais de um tamanho, o seletor do topo ja diz qual
                        esta aberto e quantos insumos tem. */}
                    {tamanhos.length === 1 && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="whitespace-nowrap" style={{ background: '#3A2350', color: '#F5B9C6', fontSize: '11px', fontWeight: 800, padding: '6px 12px', borderRadius: '999px' }}>
                        Tamanho · {tamanho.descricao || '(sem nome)'}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#7A6E80' }}>
                        {tamanho.ingredients.length} insumo{tamanho.ingredients.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    )}

                    {tamanho.ingredients.length === 0 && (
                      <div className="flex items-start gap-2.5" style={{ background: '#FBF6EC', borderRadius: '18px', padding: '12px 14px', border: '1px solid #F0D2A0' }} role="status">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#B27A16' }} />
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#7A5310', lineHeight: 1.45 }}>
                          Sem insumos — não vai calcular custo real (CMV) nem baixar estoque.
                        </p>
                      </div>
                    )}

                    {tamanho.ingredients.map((ing, ingIndex) => (
                      <section key={ing.id} className="relative" style={{ ...CARD_COMANDA, padding: 0 }}>
                        {/* Ingrediente */}
                        <div className="flex items-end gap-3" style={{ padding: '14px 14px 12px 16px' }}>
                          <span aria-hidden="true" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '32px', lineHeight: 1, color: '#D6B8E0', paddingBottom: '6px' }}>
                            {String(ingIndex + 1).padStart(2, '0')}
                          </span>
                          <label className="flex-1 min-w-0 flex flex-col" style={{ borderBottom: '1.5px dashed rgba(110,63,114,.25)' }}>
                            <span style={ROTULO_COMANDA}>INGREDIENTE</span>
                            <StockItemAutocomplete
                              value={ing.name}
                              onChange={(val) => handleUpdateInsumoTamanho(tamanho.id, ing.id, 'name', capitalizeFirstLetter(val))}
                              onSelect={(item) => {
                                const produto = produtos.find((p) => String(p.id) === item.id);
                                if (!produto) return;
                                const custoBase = custoPorUnidade(produto);
                                setTamanhos((prev) =>
                                  prev.map((t) =>
                                    t.id === tamanho.id
                                      ? {
                                          ...t,
                                          ingredients: t.ingredients.map((i2) => {
                                            if (i2.id !== ing.id) return i2;
                                            // Mesma guarda de aplicarEdicaoDeInsumo: trocar o produto
                                            // vinculado pode deixar a unidade escolhida antes incompatível
                                            // com a nova compra.
                                            const unidade = areUnitsCompatible(produto.unidadeEmbalagem, i2.unit)
                                              ? i2.unit
                                              : produto.unidadeEmbalagem;
                                            // `unidade` acima ja foi forcada a ser compativel com
                                            // `produto.unidadeEmbalagem` (mesma guarda de `areUnitsCompatible`) —
                                            // o `?? custoBase` e so defensivo, nunca deveria disparar na pratica.
                                            const convertedCost = convertCostPerUnit(custoBase, produto.unidadeEmbalagem, unidade) ?? custoBase;
                                            return {
                                              ...i2,
                                              name: produto.nome,
                                              produtoId: produto.id,
                                              unit: unidade,
                                              unitCost: convertedCost,
                                              totalCost: (Number(i2.quantity) || 0) * convertedCost,
                                            };
                                          }),
                                        }
                                      : t
                                  )
                                );
                              }}
                              stockItems={produtosParaAutocomplete}
                              isEnabled={true}
                              placeholder="Ex: Cacau em pó"
                              inputStyle={{ ...CAMPO_TINTA, background: 'transparent', border: 'none', borderRadius: 0, minHeight: 0, outline: 'none' }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveInsumoTamanho(tamanho.id, ing.id)}
                            aria-label={`Remover insumo ${ingIndex + 1}`}
                            className="self-center flex items-center justify-center flex-shrink-0 cursor-pointer transition-transform hover:-translate-y-0.5"
                            style={{ width: '32px', height: '32px', border: 'none', borderRadius: '10px', background: '#FBECEE' }}
                          >
                            <Trash2 className="w-3.5 h-3.5" style={{ color: '#C4626F' }} strokeWidth={2} />
                          </button>
                        </div>

                        <Picote />

                        {/* Quantidade + custo */}
                        <div className="flex items-end gap-2.5" style={{ padding: '10px 14px 14px 16px' }}>
                          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                            <span style={ROTULO_COMANDA}>QTD. NA RECEITA</span>
                            <div className="flex items-center gap-2" style={CAIXA_NUMERO}>
                              <input
                                type="text"
                                inputMode="decimal"
                                /* "Qtd" sozinho nao dizia de que: perto daqui fica
                                   "quanto voce ja tem guardado", no cadastro de
                                   produto novo, e os dois pediam "quantidade". Ja
                                   houve um insumo cadastrado com estoque zero por
                                   causa disso. */
                                placeholder="Ex: 450"
                                title="Quanto a receita usa deste ingrediente por vez"
                                aria-label="Quanto a receita usa"
                                value={ing.quantity || ''}
                                onChange={(e) => handleUpdateInsumoTamanho(tamanho.id, ing.id, 'quantity', e.target.value)}
                                className="flex-1 w-full min-w-0 bg-transparent outline-none placeholder:text-[#B3A6B8]"
                                style={NUMERO}
                              />
                              {(() => {
                                const produtoVinculado = ing.produtoId ? produtos.find((p) => p.id === ing.produtoId) : undefined;
                                return (
                                  <CustomSelect
                                    value={ing.unit}
                                    onChange={(v) => handleUpdateInsumoTamanho(tamanho.id, ing.id, 'unit', v)}
                                    chip
                                    ariaLabel="Unidade do insumo"
                                    style={CHIP_UNIDADE}
                                    // `disabled` por opcao preserva a regra que ja
                                    // existia: unidade incompativel com a embalagem
                                    // do produto vinculado continua visivel, porem
                                    // inescolhivel — some-la esconderia o porque.
                                    options={UNIDADES_INSUMO.map((u) => ({
                                      value: u,
                                      label: u,
                                      disabled: !!produtoVinculado && !areUnitsCompatible(produtoVinculado.unidadeEmbalagem, u),
                                    }))}
                                  />
                                );
                              })()}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 flex-shrink-0" style={{ width: '92px' }}>
                            <span style={{ ...ROTULO_COMANDA, textAlign: 'right' }}>CUSTO</span>
                            <div className="flex items-center justify-end" style={{ ...ETIQUETA_VALOR, paddingRight: '12px' }}>
                              <FuroEtiqueta />
                              <span className="tabular-nums" style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-.02em', color: '#3A2350' }}>
                                {formatMoney(ing.totalCost || 0)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {ing.name.trim() !== '' && !ing.produtoId && criandoProdutoInsumo?.insumoId !== ing.id && (
                          <div style={{ padding: '0 16px 14px' }}>
                            <button
                              type="button"
                              onClick={() => handleAbrirCriarProduto(tamanho.id, ing.id, ing.name)}
                              className="flex items-center gap-1.5 text-left hover:underline cursor-pointer"
                              style={{ fontSize: '11px', fontWeight: 700, color: '#6E3F72' }}
                            >
                              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                              "{ing.name}" não está cadastrado ainda — adicionar agora?
                            </button>
                          </div>
                        )}

                        {criandoProdutoInsumo?.tamanhoId === tamanho.id && criandoProdutoInsumo?.insumoId === ing.id && (
                          <>
                            <Picote />
                            <div className="flex flex-col gap-2.5 animate-slideUp" style={{ padding: '12px 16px 16px' }}>
                              <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '20px', lineHeight: 1.15 }}>Cadastrar novo produto</span>
                              <label className="flex flex-col" style={{ borderBottom: '1.5px dashed rgba(110,63,114,.25)' }}>
                                <span style={ROTULO_COMANDA}>NOME</span>
                                <input
                                  type="text"
                                  placeholder="Nome"
                                  value={novoProdutoNome}
                                  onChange={(e) => setNovoProdutoNome(e.target.value)}
                                  className="w-full bg-transparent outline-none placeholder:italic placeholder:text-[#B3A6B8]"
                                  style={{ ...CAMPO_TINTA, fontSize: '19px' }}
                                />
                              </label>
                              <label className="flex flex-col" style={{ borderBottom: '1.5px dashed rgba(110,63,114,.25)' }}>
                                <span style={ROTULO_COMANDA}>CATEGORIA</span>
                                <input
                                  type="text"
                                  list="categorias-sugeridas-ficha-v2"
                                  placeholder="Categoria (opcional)"
                                  value={novoProdutoCategoria}
                                  onChange={(e) => setNovoProdutoCategoria(e.target.value)}
                                  className="w-full bg-transparent outline-none placeholder:italic placeholder:text-[#B3A6B8]"
                                  style={{ ...CAMPO_TINTA, fontSize: '19px' }}
                                />
                              </label>
                              <datalist id="categorias-sugeridas-ficha-v2">
                                <option value="Massa" />
                                <option value="Recheio" />
                                <option value="Cobertura" />
                                <option value="Decoração" />
                                <option value="Embalagem" />
                              </datalist>
                              <div className="flex items-end gap-2">
                                <label className="flex flex-col gap-1.5 flex-shrink-0" style={{ width: '104px' }}>
                                  <span style={ROTULO_COMANDA}>PREÇO PAGO</span>
                                  <span className="flex items-center gap-1" style={{ ...ETIQUETA_VALOR, padding: '0 10px 0 22px' }}>
                                    <FuroEtiqueta />
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#C4626F' }}>{symbol}</span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      placeholder="0"
                                      aria-label="Preço pago"
                                      value={novoProdutoPreco}
                                      onChange={(e) => setNovoProdutoPreco(e.target.value)}
                                      className="w-full min-w-0 bg-transparent outline-none placeholder:text-[#B3A6B8]"
                                      style={{ ...NUMERO, fontSize: '16px', color: '#3A2350' }}
                                    />
                                  </span>
                                </label>
                                <label className="flex-1 min-w-0 flex flex-col gap-1.5">
                                  <span style={ROTULO_COMANDA}>QTD. EMBALAGEM</span>
                                  <span className="flex items-center gap-2" style={CAIXA_NUMERO}>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      placeholder="0"
                                      aria-label="Qtd. embalagem"
                                      value={novoProdutoQtdEmbalagem}
                                      onChange={(e) => {
                                        setNovoProdutoQtdEmbalagem(e.target.value);
                                        // 20% da embalagem como alerta sugerido, na
                                        // unidade dela. 20% porque o vermelho do anel
                                        // dispara em 1,25x o alerta: acende com um
                                        // quarto do pacote ainda na prateleira.
                                        if (!novoProdutoAlertaTocado) {
                                          const qtd = parseNumeroDigitado(e.target.value);
                                          setNovoProdutoNivelMinimo(
                                            Number.isFinite(qtd) && qtd > 0
                                              ? String(Math.round(qtd * 0.2 * 100) / 100).replace('.', ',')
                                              : ''
                                          );
                                        }
                                      }}
                                      className="flex-1 w-full min-w-0 bg-transparent outline-none placeholder:text-[#B3A6B8]"
                                      style={{ ...NUMERO, fontSize: '16px' }}
                                    />
                                    <CustomSelect
                                      value={novoProdutoUnidade}
                                      onChange={(v) => setNovoProdutoUnidade(v as any)}
                                      chip
                                      ariaLabel="Unidade do produto novo"
                                      style={CHIP_UNIDADE}
                                      options={['g', 'kg', 'ml', 'L', 'un', 'pacote'].map((u) => ({ value: u, label: u }))}
                                    />
                                  </span>
                                </label>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#5B4A6B' }}>Controlar estoque deste produto?</span>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={novoProdutoControlaEstoque}
                                  aria-label="Controlar estoque do produto novo"
                                  onClick={() => setNovoProdutoControlaEstoque((v) => !v)}
                                  className="relative flex-shrink-0"
                                  style={{ width: '44px', height: '26px', border: 'none', borderRadius: '999px', cursor: 'pointer', background: novoProdutoControlaEstoque ? 'linear-gradient(120deg, #6E3F72, #A85E86)' : '#E6E1DB', boxShadow: 'inset 0 1px 3px rgba(36,27,43,.25)' }}
                                >
                                  <span className="absolute rounded-full" style={{ top: '3px', left: novoProdutoControlaEstoque ? '21px' : '3px', width: '20px', height: '20px', background: '#FFFFFF', boxShadow: '0 2px 6px rgba(36,27,43,.3)', transition: 'left .2s' }} />
                                </button>
                              </div>
                              {novoProdutoControlaEstoque && (
                                <div className="flex flex-col gap-2.5">
                                  <div className="flex flex-col gap-1.5">
                                    <span style={ROTULO_COMANDA}>QUANTO VOCÊ JÁ TEM GUARDADO</span>
                                    <span className="flex items-center" style={CAIXA_NUMERO}>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0"
                                        aria-label="Quanto você já tem guardado"
                                        value={novoProdutoQtdAtual}
                                        onChange={(e) => setNovoProdutoQtdAtual(e.target.value)}
                                        className="flex-1 w-full min-w-0 bg-transparent outline-none placeholder:text-[#B3A6B8]"
                                        style={{ ...NUMERO, fontSize: '16px' }}
                                      />
                                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#7A6E80', paddingRight: '10px' }}>{novoProdutoUnidade}</span>
                                    </span>
                                    {/* O "?" explica a diferenca para o campo de
                                        cima, que e o outro "quanto". Mesmo
                                        padrao de ajuda ja usado no app. */}
                                    <CampoComAjuda
                                      microcopy="Seu estoque de hoje — não o quanto a receita usa."
                                      exemploDinamico={
                                        'É quanto você já tem em casa hoje, não quanto a receita usa. ' +
                                        'Pode deixar vazio se não quiser controlar.'
                                      }
                                    />
                                  </div>
                                  {/* Este campo nao existia aqui: o alerta era
                                      gravado em 0 sem a pessoa ver. Agora vem
                                      sugerido em 20% da embalagem, na unidade
                                      dela, visivel e editavel antes de salvar —
                                      o valor gravado e sempre a escolha dela. */}
                                  <div className="flex flex-col gap-1.5">
                                    <span className="flex items-center gap-1.5" style={{ ...ROTULO_COMANDA, color: '#C4626F' }}>
                                      <AlertTriangle className="w-[11px] h-[11px]" strokeWidth={2.4} />
                                      AVISAR QUANDO RESTAR MENOS DE
                                    </span>
                                    <span className="flex items-center" style={{ ...CAIXA_NUMERO, background: '#FDF4F5', border: '1px solid rgba(196,98,111,.18)', boxShadow: 'none' }}>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0"
                                        aria-label="Alerta mínimo do produto novo"
                                        value={novoProdutoNivelMinimo}
                                        onChange={(e) => {
                                          setNovoProdutoNivelMinimo(e.target.value);
                                          setNovoProdutoAlertaTocado(true);
                                        }}
                                        className="flex-1 w-full min-w-0 bg-transparent outline-none placeholder:text-[#B3A6B8]"
                                        style={{ ...NUMERO, fontSize: '16px' }}
                                      />
                                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#7A6E80', paddingRight: '10px' }}>{novoProdutoUnidade}</span>
                                    </span>
                                  </div>
                                </div>
                              )}
                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setCriandoProdutoInsumo(null)}
                                  className="flex-shrink-0"
                                  style={{ height: '40px', padding: '0 16px', borderRadius: '13px', border: '1px solid rgba(110,63,114,.18)', background: '#FFFFFF', fontSize: '13px', fontWeight: 800, color: '#3A2350' }}
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSalvarNovoProdutoInline}
                                  disabled={salvandoNovoProduto || !novoProdutoNome.trim()}
                                  className="flex-1 flex items-center justify-center gap-1.5 disabled:opacity-50"
                                  style={{ height: '40px', borderRadius: '13px', border: 'none', background: '#3A2350', boxShadow: '0 8px 16px rgba(58,35,80,.25)', fontSize: '13px', fontWeight: 800, color: '#F5B9C6' }}
                                >
                                  <Check className="w-3.5 h-3.5" strokeWidth={2.6} />
                                  {salvandoNovoProduto ? 'Salvando...' : 'Salvar e usar'}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </section>
                    ))}

                    {/* Adicionar insumo (e copiar a lista do tamanho anterior) */}
                    <div className="flex gap-2">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleCopiarInsumosDoAnterior(tamanho.id)}
                          className="flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer transition-transform hover:-translate-y-0.5"
                          style={{ height: '52px', padding: '0 14px', borderRadius: '18px', border: '1.5px solid rgba(110,63,114,.25)', background: '#FFFFFF', fontSize: '12px', fontWeight: 800, color: '#6E3F72' }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copiar anterior
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAddInsumoTamanho(tamanho.id)}
                        className="flex-1 flex items-center justify-center gap-2.5 cursor-pointer transition-transform hover:-translate-y-0.5"
                        style={{ height: '52px', borderRadius: '18px', border: '1.5px dashed rgba(110,63,114,.35)', background: 'transparent', fontFamily: "'Instrument Serif', serif", fontSize: '20px', color: '#3A2350' }}
                      >
                        <span className="flex items-center justify-center" style={{ width: '28px', height: '28px', borderRadius: '10px', background: '#F5B9C6', boxShadow: '0 6px 12px rgba(196,98,111,.3)' }}>
                          <Plus className="w-3 h-3" style={{ color: '#3A2350' }} strokeWidth={3} />
                        </span>
                        Adicionar insumo
                      </button>
                    </div>

                    {/* Mao de obra: relogio HH : MM x valor da hora */}
                    <section className="relative" style={{ ...CARD_COMANDA, padding: 0 }}>
                      <div style={{ padding: '14px 16px 12px' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span style={ROTULO_COMANDA}>TEMPO DE PRODUÇÃO</span>
                            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '23px', lineHeight: 1.15 }}>Mão de obra</span>
                          </div>
                          <span className="flex items-center justify-center" style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#F3E9F3' }}>
                            <Clock className="w-[17px] h-[17px]" style={{ color: '#6E3F72' }} strokeWidth={2.2} />
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          {([
                            { campo: 'horasTrabalho' as const, rotulo: 'HORAS', modo: 'decimal' as const },
                            { campo: 'minutosTrabalho' as const, rotulo: 'MINUTOS', modo: 'numeric' as const },
                          ]).map((c, i) => (
                            <React.Fragment key={c.campo}>
                              {i === 1 && <span aria-hidden="true" style={{ fontSize: '24px', fontWeight: 800, color: '#D6B8E0' }}>:</span>}
                              <label className="flex-1 min-w-0 flex flex-col items-center justify-center" style={{ height: '66px', borderRadius: '18px', background: '#F6F2F5', boxShadow: 'inset 0 1px 3px rgba(58,35,80,.08)' }}>
                                <input
                                  type="text"
                                  inputMode={c.modo}
                                  placeholder="00"
                                  aria-label={c.rotulo === 'HORAS' ? 'Horas' : 'Minutos'}
                                  value={tamanho[c.campo]}
                                  onChange={(e) => handleUpdateTamanho(tamanho.id, c.campo, e.target.value)}
                                  className="w-full min-w-0 bg-transparent outline-none text-center placeholder:text-[#B3A6B8]"
                                  style={{ ...NUMERO, fontSize: '28px', letterSpacing: '-.03em', lineHeight: 1.1 }}
                                />
                                <span style={ROTULO_COMANDA}>{c.rotulo}</span>
                              </label>
                            </React.Fragment>
                          ))}
                          <span aria-hidden="true" style={{ fontSize: '15px', fontWeight: 800, color: '#D6B8E0' }}>×</span>
                          <label className="flex flex-col items-center justify-center flex-shrink-0" style={{ width: '88px', height: '66px', borderRadius: '18px', background: '#FCEFF2', border: '1px solid rgba(196,98,111,.2)' }}>
                            <span className="flex items-baseline justify-center w-full" style={{ fontSize: '14px', fontWeight: 800, color: '#3A2350' }}>
                              {symbol}
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0"
                                aria-label={`${symbol} por hora`}
                                value={tamanho.valorHora}
                                onChange={(e) => handleUpdateTamanho(tamanho.id, 'valorHora', e.target.value)}
                                className="bg-transparent outline-none text-center placeholder:text-[#B3A6B8]"
                                style={{ ...NUMERO, fontSize: '24px', letterSpacing: '-.03em', width: '48px', color: '#3A2350' }}
                              />
                            </span>
                            <span style={{ ...ROTULO_COMANDA, color: '#C4626F' }}>POR HORA</span>
                          </label>
                        </div>
                      </div>
                      <Picote />
                      <div className="flex items-center justify-between" style={{ padding: '12px 16px 14px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#5B4A6B' }}>Total de mão de obra</span>
                        <span className="tabular-nums" style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-.03em', color: '#3A2350' }}>{formatMoney(calcularMaoDeObra(tamanho))}</span>
                      </div>
                    </section>
                  </div>
                ))}

                {/* Rendimento: veio do Passo 1 para ficar junto de horas e mao
                    de obra. E um campo da FICHA (nao de cada tamanho), entao
                    aparece uma vez so, depois do ultimo tamanho. */}
                <section className="flex flex-col gap-1.5" style={CARD_COMANDA}>
                  <span style={ROTULO_COMANDA}>RENDIMENTO <span style={{ color: '#C4626F' }}>*</span></span>
                  <div className="flex items-center gap-2" style={CAIXA_NUMERO}>
                    <input
                      id="ficha-rendimento"
                      type="text"
                      required
                      placeholder="Ex: 10 ou 500"
                      value={yieldInfo}
                      onChange={(e) => {
                        setYieldInfo(e.target.value);
                        if (invalidFieldId === 'ficha-rendimento') setInvalidFieldId(null);
                      }}
                      className="flex-1 w-full min-w-0 bg-transparent outline-none placeholder:text-[#B3A6B8]"
                      style={NUMERO}
                    />
                    <CustomSelect
                      value={selectedYieldUnit}
                      onChange={handleApplyYieldUnit}
                      chip
                      ariaLabel="Unidade de rendimento"
                      style={CHIP_UNIDADE}
                      options={[
                        { value: 'fatias', label: 'fatias' },
                        { value: 'gramas', label: 'g' },
                        { value: 'quilos', label: 'kg' },
                        { value: 'unidades', label: 'unidades' },
                        { value: 'ml', label: 'ml' },
                      ]}
                    />
                  </div>
                  {invalidFieldId === 'ficha-rendimento' && <FieldValidationError />}
                  <CampoComAjuda microcopy="Quantas porções esse tamanho rende — em fatias, gramas, quilos, unidades ou ml, o que fizer mais sentido pro seu produto. É só uma referência pra você e pra cliente; não entra na conta do custo." />
                </section>
              </div>

              {/* PASSO 3 — PREÇO, no visual do design "Ficha Tecnica · Preco"
                  (Claude Design): um card-comanda por tamanho com o preco de
                  venda a tinta, os custos com linha pontilhada, o custo total e
                  o lucro. O que o design nao trazia e o app ja tinha (aviso de
                  metas mudadas, configurar metas, preco sugerido x atual,
                  percentual e prejuizo, aviso de precos por tamanho) segue o
                  mesmo estilo. */}
              <div data-step={3} style={{ display: formStep === 3 ? 'flex' : 'none', flexDirection: 'column', gap: '14px', fontFamily: "'Manrope', sans-serif", color: '#241B2B' }}>
                {editingId && fichaDesatualizada(
                  fichas.find((f) => f.id === editingId) || { updatedAt: undefined },
                  ultimaMudancaMetas
                ) && (
                  <div className="flex items-start gap-2.5" style={{ background: '#FBF6EC', borderRadius: '18px', padding: '12px 14px', border: '1px solid rgba(178,122,22,0.25)' }}>
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#B27A16' }} />
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#7A5310', lineHeight: 1.45 }}>
                      As metas da empresa (CMV/Investimento/Despesas) mudaram desde que essa ficha foi
                      salva pela última vez. O preço calculado abaixo pode não refletir mais a meta
                      atual — revise se quiser atualizar.
                    </p>
                  </div>
                )}
                {tamanhos.length > 1 && seletorDeTamanho(3)}
                {tamanhos.map((tamanho) => {
                  if (tamanho.id !== tamanhoAtivo?.id) return null;
                  const insumos =
                    tamanho.ingredients.reduce((s, i) => s + (Number(i.totalCost) || 0), 0);
                  const mdo = calcularMaoDeObra(tamanho);
                  const cus = calcularCustoAdmAutomatico(tamanho);
                  const inv = calcularInvestimentoAutomatico(tamanho);
                  const custoTotal = insumos + mdo + cus + inv;
                  const preco = parseNumeroDigitado((tamanho.preco || '')) || 0;
                  const margem = preco - custoTotal;
                  const margemPct = preco > 0 ? (margem / preco) * 100 : 0;
                  const noPrejuizo = preco > 0 && margem < 0;
                  const horasNum = horasTotais(tamanho);
                  const tarifaNum = parseNumeroDigitado((tamanho.valorHora || '')) || 0;
                  const precoCalculado =
                    administrativeCosts && estruturaFinanceira?.valido && insumos > 0
                      ? calcularPrecoSugeridoProduto(insumos, horasNum, tarifaNum, administrativeCosts.cmvTargetPercent, estruturaFinanceira)
                      : null;
                  const abaixoDaMeta = precoCalculado != null && preco > 0 && preco < precoCalculado.precoSugerido;

                  return (
                    <section key={tamanho.id} className="relative" style={{ ...CARD_COMANDA, padding: 0 }}>
                      {/* Preco de venda */}
                      <div style={{ padding: '14px 16px' }}>
                        <div className="flex items-center justify-between gap-2">
                          <span style={ROTULO_COMANDA}>PREÇO DE VENDA</span>
                          <span className="whitespace-nowrap truncate" style={{ background: '#F3E9F3', color: '#3A2350', fontSize: '10px', fontWeight: 800, padding: '5px 10px', borderRadius: '999px', maxWidth: '60%' }}>
                            Tamanho · {tamanho.descricao || '(sem nome)'}
                          </span>
                        </div>
                        <label className="flex items-end gap-2.5 mt-2" style={{ borderBottom: '1.5px dashed rgba(110,63,114,.25)' }}>
                          <span aria-hidden="true" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '32px', lineHeight: 1, color: '#D6B8E0', paddingBottom: '10px' }}>{symbol}</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            aria-label={`Preço de venda (${symbol})`}
                            value={tamanho.preco}
                            onChange={(e) => handleUpdateTamanho(tamanho.id, 'preco', e.target.value)}
                            className="w-full min-w-0 bg-transparent outline-none text-right placeholder:text-[#C9BCCD]"
                            style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-.03em', color: '#241B2B', padding: '0 0 6px' }}
                          />
                        </label>
                        {!estruturaFinanceira?.valido && (
                          <p className="mt-2" style={{ fontSize: '11px', fontWeight: 600, color: '#9A8FA0' }}>
                            Configure as metas em Minha Empresa para calcular custo e investimento automaticamente.
                          </p>
                        )}
                      </div>

                      <Picote />

                      {/* CUSTOS — as quatro partes, com a nomenclatura fechada do
                          app: "Despesas", e nao "Despesas fixas", porque e o
                          mesmo conceito que Minha Empresa e o Pedido ja chamam
                          assim. */}
                      <div className="flex flex-col gap-2" style={{ padding: '12px 16px' }}>
                        <span style={ROTULO_COMANDA}>CUSTOS</span>
                        {([
                          ['Insumos', insumos, '#6E3F72'],
                          ['Mão de obra', mdo, '#C4626F'],
                          ['Despesas', cus, '#B08D57'],
                          ['Investimento', inv, '#D6B8E0'],
                        ] as const).map(([rotulo, valor, cor]) => (
                          <div key={rotulo} className="flex items-baseline gap-2" style={{ fontSize: '13px', fontWeight: 600, color: '#5B4A6B' }}>
                            <span aria-hidden="true" className="flex-shrink-0" style={{ width: '8px', height: '8px', borderRadius: '3px', background: cor }} />
                            {rotulo}
                            <span aria-hidden="true" className="flex-1" style={{ borderBottom: '1.5px dotted rgba(110,63,114,.25)', transform: 'translateY(-3px)' }} />
                            <span className="tabular-nums" style={{ fontWeight: 800, color: '#241B2B' }}>{formatMoney(valor)}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between mt-1" style={{ padding: '10px 14px', borderRadius: '16px', background: '#F6F2F5' }}>
                          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '20px', lineHeight: 1 }}>Custo total</span>
                          <span className="tabular-nums" style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-.02em' }}>{formatMoney(custoTotal)}</span>
                        </div>
                      </div>

                      <Picote />

                      {/* Lucro (ou prejuizo) */}
                      <div className="flex flex-col gap-2" style={{ padding: '12px 16px 16px' }}>
                        <div
                          className="flex items-center justify-between gap-3"
                          style={{
                            padding: '12px 14px',
                            borderRadius: '18px',
                            background: noPrejuizo ? '#FDF4F5' : 'rgba(169,216,184,.28)',
                            border: noPrejuizo ? '1px solid rgba(196,98,111,.25)' : '1px solid rgba(76,115,88,.18)',
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex items-center justify-center flex-shrink-0" style={{ width: '32px', height: '32px', borderRadius: '10px', background: noPrejuizo ? '#F5B9C6' : '#A9D8B8' }}>
                              {noPrejuizo
                                ? <AlertTriangle className="w-[15px] h-[15px]" style={{ color: '#6E2231' }} strokeWidth={2.4} />
                                : <TrendingUp className="w-[15px] h-[15px]" style={{ color: '#26402F' }} strokeWidth={2.4} />}
                            </span>
                            <div className="flex flex-col">
                              <span style={{ ...ROTULO_COMANDA, color: noPrejuizo ? '#C4626F' : '#4C7358' }}>{noPrejuizo ? 'PREJUÍZO' : 'LUCRO'}</span>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: noPrejuizo ? '#6E2231' : '#26402F' }}>
                                neste preço{preco > 0 && ` · ${margemPct.toFixed(0)}%`}
                              </span>
                            </div>
                          </div>
                          <span className="tabular-nums whitespace-nowrap flex-shrink-0" style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-.03em', color: noPrejuizo ? '#C4626F' : '#26402F' }}>
                            {formatMoney(margem)}
                          </span>
                        </div>
                        {noPrejuizo && (
                          <p style={{ fontSize: '11px', fontWeight: 600, lineHeight: 1.45, color: '#C4626F' }}>
                            Este tamanho custa mais do que você cobra por ele.
                          </p>
                        )}

                        {precoCalculado && (
                          <div className="flex flex-col gap-2.5" style={{ padding: '12px 14px', borderRadius: '18px', background: '#F6F2F5' }}>
                            <div className="flex items-baseline justify-between" style={{ fontSize: '12px', fontWeight: 600, color: '#7A6E80' }}>
                              <span>Preço atual</span>
                              <span className="tabular-nums">{preco > 0 ? formatMoney(preco) : '—'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '20px', lineHeight: 1 }}>Preço sugerido</span>
                              {/* O numero que esta tela existe para entregar. O
                                  halo usa `carGlow`, o pulso que ja mora no
                                  index.css — quem pulsa e o brilho ATRAS, nao a
                                  pilula: o numero nunca treme enquanto a pessoa
                                  le. */}
                              <span className="relative inline-flex flex-shrink-0">
                                <span
                                  aria-hidden="true"
                                  className="absolute rounded-full"
                                  style={{ inset: '-3px', background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)', filter: 'blur(7px)', opacity: 0.45, animation: 'carGlow 2.8s ease-in-out infinite' }}
                                />
                                <span
                                  className="relative inline-flex items-center gap-1.5 rounded-full tabular-nums"
                                  style={{ padding: '8px 15px', fontSize: '15px', fontWeight: 800, color: '#FFFFFF', background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)', boxShadow: '0 8px 18px rgba(58,35,80,.32)' }}
                                >
                                  <Star className="w-3.5 h-3.5 shrink-0" fill="#F5B9C6" strokeWidth={0} />
                                  {formatMoney(precoCalculado.precoSugerido)}
                                </span>
                              </span>
                            </div>
                            {preco > 0 && (
                              abaixoDaMeta ? (
                                <span className="inline-flex items-center gap-1.5 self-start" style={{ fontSize: '11px', fontWeight: 800, padding: '5px 11px', borderRadius: '999px', background: '#FDF4F5', color: '#C4626F', border: '1px solid rgba(196,98,111,.25)' }}>
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  Abaixo da meta em {formatMoney(precoCalculado.precoSugerido - preco)}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 self-start" style={{ fontSize: '11px', fontWeight: 800, padding: '5px 11px', borderRadius: '999px', background: 'rgba(169,216,184,.28)', color: '#26402F', border: '1px solid rgba(76,115,88,.18)' }}>
                                  <Check className="w-3 h-3 shrink-0" strokeWidth={3} />
                                  Esse preço já cobre a meta sugerida
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}

                {avisosDePreco.length > 0 && (
                  <div className="flex items-start gap-2.5 animate-fadeIn" style={{ background: '#FBF6EC', borderRadius: '18px', padding: '12px 14px', border: '1px solid #F0D2A0' }} role="status">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#B27A16' }} />
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 800, color: '#7A5310', marginBottom: '4px' }}>
                        Confira os preços por tamanho
                      </p>
                      <ul className="space-y-0.5">
                        {avisosDePreco.map((aviso) => (
                          <li key={aviso} style={{ fontSize: '11px', lineHeight: 1.5, color: '#7A5310' }}>
                            {aviso}
                          </li>
                        ))}
                      </ul>
                      <p style={{ fontSize: '11px', marginTop: '6px', color: '#9A7430' }}>
                        Se for de propósito, pode salvar normalmente.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Rodape fixo */}
          <div
            className="flex-shrink-0 bg-white flex gap-2.5 items-center justify-between px-4 pt-3.5"
            style={{ paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid rgba(36,27,43,.06)', boxShadow: '0 -8px 24px rgba(58,35,80,.07)', fontFamily: "'Manrope', sans-serif" }}
          >
            <button
              type="button"
              onClick={() => (formStep === 1 ? setIsCreating(false) : setFormStep((s) => (s - 1) as 1 | 2 | 3))}
              className="flex-shrink-0 transition-transform hover:-translate-y-0.5"
              style={{ width: '96px', height: '50px', borderRadius: '16px', border: '1px solid rgba(110,63,114,.18)', background: '#FFFFFF', boxShadow: '0 4px 12px rgba(58,35,80,.08)', fontSize: '14px', fontWeight: 800, color: '#3A2350' }}
            >
              {formStep === 1 ? 'Cancelar' : 'Voltar'}
            </button>
            {formStep < 3 ? (
              <button
                key="ficha-continuar"
                type="button"
                onClick={() => {
                  if (fichaStepChangeIsFresh()) return;
                  if (formStep === 2 && tamanhos.some((t) => t.ingredients.length === 0)) {
                    setConfirmandoAvancarSemInsumos(true);
                    return;
                  }
                  setFormStep((s) => (s + 1) as 1 | 2 | 3);
                }}
                className="flex-1 flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
                style={{ height: '50px', borderRadius: '16px', border: 'none', background: '#3A2350', boxShadow: '0 10px 20px rgba(58,35,80,.3)', fontSize: '15px', fontWeight: 800, color: '#F5B9C6' }}
              >
                Continuar
                <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
              </button>
            ) : (
              <button
                key="ficha-confirmar"
                type="submit"
                form="form-ficha-stepped"
                className="flex-1 flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
                style={{ height: '50px', borderRadius: '16px', border: 'none', background: '#3A2350', boxShadow: '0 10px 20px rgba(58,35,80,.3)', fontSize: '15px', fontWeight: 800, color: '#F5B9C6' }}
                onClick={(e) => {
                  if (fichaStepChangeIsFresh()) {
                    e.preventDefault();
                    return;
                  }
                  const form = stepFormRef.current;
                  if (!form || form.checkValidity()) {
                    setInvalidFieldId(null);
                    return;
                  }
                  e.preventDefault();
                  const invalidField = form.querySelector<HTMLElement>(':invalid');
                  const invalidStepEl = invalidField?.closest<HTMLElement>('[data-step]');
                  const invalidStep = invalidStepEl ? (Number(invalidStepEl.dataset.step) as 1 | 2 | 3) : 1;
                  setFormStep(invalidStep);
                  setInvalidFieldId(invalidField?.id || null);
                  requestAnimationFrame(() => invalidField?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
                }}
              >
                <Check className="w-4 h-4" strokeWidth={2.6} />
                Salvar ficha técnica
              </button>
            )}
          </div>
        </div>

        {/* Os dois avisos que o form dispara ficam dentro do portal: fora
            dele, o z-50 deles caia atras do form em tela cheia (z-[99999]). */}
        {/* Confirmacao ao tentar avancar do Passo 2 (Insumos) com algum tamanho
            zerado: nao bloqueia (pode ser proposital, ex: item so de
            referencia de preco), so garante que a decisao foi consciente —
            sem isso a ficha calcula CMV como zero em silencio. */}
        {confirmandoAvancarSemInsumos && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4 animate-fadeIn" role="dialog" aria-modal="true">
            <div className="w-full max-w-sm bg-white rounded-xl shadow-highlight overflow-hidden animate-scaleUp">
              <div className="p-5 text-center">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"
                  style={{ background: '#FFF6E8', color: '#B27A16' }}
                >
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <h3 className="font-brand font-bold text-base text-neutral-900 mb-1">
                  Continuar sem insumos?
                </h3>

                <p className="text-xs text-neutral-600 mb-4">
                  Essa ficha não vai calcular custo real (CMV). Pode ser proposital (ex: item só de referência de preço) — se não for, volte e adicione os insumos.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmandoAvancarSemInsumos(false)}
                    className="py-2.5 px-4 bg-white border border-[#E6E1DB] text-neutral-700 font-bold text-xs rounded-xl hover:bg-neutral-50 shadow-card transition-all active:scale-95"
                  >
                    Voltar e adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmandoAvancarSemInsumos(false);
                      setFormStep(3);
                    }}
                    className="py-2.5 px-4 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95"
                    style={{ background: '#3A2350' }}
                  >
                    Continuar assim
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <DuplicateNameWarningModal
          isOpen={!!duplicateWarning}
          itemType="ficha"
          nome={duplicateWarning?.data.name || ''}
          onClose={() => setDuplicateWarning(null)}
          onCriarMesmoAssim={() => {
            if (duplicateWarning) performSaveFicha(duplicateWarning.data);
          }}
          onUsarExistente={() => {
            if (duplicateWarning) handleOpenEdit(duplicateWarning.existing);
            setDuplicateWarning(null);
          }}
        />

        </div>,
        document.body
      )}

      {/* FICHAS CARDS LIST - SEGUINDO FIELMENTE O DESIGN DE REFERÊNCIA */}
      <div className="space-y-3">
        {filteredFichas.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 text-center"
            style={{
              background: '#fff',
              border: '1px solid rgba(58,35,80,0.1)',
              borderRadius: '20px',
              boxShadow: '0 8px 20px rgba(58,35,80,.09)',
              padding: '40px 20px',
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#F3E9F3' }}
            >
              <BookOpen className="w-[30px] h-[30px]" style={{ color: '#6E3F72' }} strokeWidth={2} />
            </div>
            <div className="font-serif-display" style={{ fontSize: '22px', color: '#3A2350' }}>
              Nenhuma ficha em {CATEGORY_LABELS[selectedCategory].label} ainda
            </div>
            <div className="text-sm" style={{ color: '#7A6E80', maxWidth: '380px' }}>
              Cadastre a receita uma vez e o Carula calcula custo, mão de obra e preço sugerido de cada tamanho.
            </div>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="transition-colors"
              style={{
                marginTop: '8px',
                background: '#3A2350',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                padding: '13px 22px',
                borderRadius: '11px',
                cursor: 'pointer',
                boxShadow: '0 10px 20px rgba(58,35,80,.3)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#6E3F72'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#3A2350'; }}
            >
              Adicionar primeira ficha
            </button>
          </div>
        ) : (
          filteredFichas.map((ficha) => {
            // Converter descrição de tamanho quando exibir
            // O botao mostra o nome que a confeiteira deu ao tamanho ("20 cm",
            // "1kg", "3 andares"). Antes, nomes com "cm" ou "fatias" viravam o
            // numero da posicao, e ela via "1" no lugar do "20 cm" que digitou.
            const getTamanhoDisplay = (tamanho: any, index: number) =>
              (tamanho.descricao || '').trim() || String(index + 1);

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
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
                      {fichaDesatualizada(ficha, ultimaMudancaMetas) && (
                        <span
                          title="As metas da empresa (CMV/Investimento/Despesas) mudaram desde que essa ficha foi salva pela última vez — o preço calculado pode não refletir mais a meta atual."
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '9px',
                            fontWeight: 800,
                            color: '#B27A16',
                            background: '#FBF0DD',
                            padding: '3px 7px',
                            borderRadius: '999px',
                            fontFamily: "'Manrope', sans-serif",
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Metas mudaram
                        </span>
                      )}
                    </div>
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
                    src={ficha.imageUrl || fichaPhotos[ficha.id]}
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
                      {/* "SUGESTÃO" so faz sentido antes do preco ser
                          confirmado (Passo 3, ainda uma proposta de calculo).
                          Depois que a ficha e salva com preco > 0, esse ja e
                          o preco real do bolo — manter a palavra aqui dava a
                          entender que a confeiteira nunca tinha decidido o
                          preco de venda. */}
                      {!tamanhoSelecionado.preco && (
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
                      )}
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

                {/* INSUMOS EXPANDÍVEL + rendimento ao lado */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setExpandedFichaId(isExpanded ? null : ficha.id)}
                  style={{
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

                {/* So exibe o rendimento que a confeiteira gravou na ficha (no
                    Passo 2 do form). Ficha sem rendimento nao mostra nada: o
                    fallback de `formatRendimentoParaExibir` usaria o nome do
                    tamanho ("1kg") e pareceria que o bolo "rende 1kg". */}
                {ficha.yieldInfo?.trim() && (
                  <span
                    style={{
                      background: '#F6F2F5',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: '#3A2350',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 13px',
                      borderRadius: '999px',
                    }}
                  >
                    <Scale className="w-3 h-3" />
                    Rende {ficha.yieldInfo.trim()}
                  </span>
                )}
                </div>

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

      {/* Toast de exclusao pendente: um por item, empilhados — cada um some
          quando os 10s de "Desfazer" DELE completarem (ver
          `pendingDeleteFichas`). Mais de um pode estar visivel ao mesmo
          tempo se a usuaria excluir varias fichas em sequencia rapida. */}
      {pendingDeleteFichas.map((ficha, index) => (
        <div
          key={ficha.id}
          className="fixed left-1/2 -translate-x-1/2 z-50"
          style={{ bottom: `${96 + index * 56}px` }}
        >
          <div
            className="flex items-center gap-3.5 animate-fadeIn"
            style={{ padding: '10px 12px 10px 18px', borderRadius: '999px', background: '#3A2350', boxShadow: '0 20px 36px rgba(58,35,80,0.26)' }}
          >
            <span className="flex items-center gap-2 text-sm font-bold text-white whitespace-nowrap">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A9D8B8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Ficha deletada
            </span>
            <button
              type="button"
              onClick={() => cancelDeleteFicha(ficha.id)}
              className="flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
              style={{ padding: '8px 14px', borderRadius: '999px', border: 'none', background: '#F5B9C6', color: '#6E2231', cursor: 'pointer' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11" />
              </svg>
              Desfazer
            </button>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};

