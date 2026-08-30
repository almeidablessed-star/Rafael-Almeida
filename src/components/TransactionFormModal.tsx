import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Transaction,
  TransactionType,
  PaymentMethod,
  LaborPeriod,
  CostCategory,
  BakeryPreset,
  Customer,
  FichaTecnica,
} from '../types';
import { useCustomers } from '../context/CustomersContext';
import { QuotePdfModal } from './QuotePdfModal';
import {
  BAKERY_PRODUCT_PRESETS,
  INGREDIENT_PRESETS,
  LABOR_PRESETS,
  COST_PRESETS,
} from '../data/presetData';
import { getTodayIso, formatCurrency, getTransactionTypeDetails } from '../utils/formatters';
import { buildFichaItems, normalizeName } from '../utils/fichaMatcher';
import { calculateProportionalBreakdown } from '../utils/weeklyCalculator';
import {
  X,
  Plus,
  Minus,
  Check,
  Sparkles,
  Cake,
  Trash2,
  PlusCircle,
  Truck,
  PackagePlus,
  ShoppingBag,
  DollarSign,
  Info,
  Printer,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Clock,
  Upload,
  Camera,
  Image as ImageIcon,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { compressImageFile } from '../utils/imageCompression';

export interface OrderItemState {
  id: string;
  productName: string;
  /**
   * Qual TamanhoOpcao da ficha foi escolhido. Vazio = nenhum.
   *
   * Substituiu o campo `slices`, que guardava o NUMERO DE FATIAS e era usado
   * para reencontrar o tamanho na ficha. Nao funcionava: `TamanhoOpcao.quantidade`
   * e opcional e esta indefinida em todas as fichas cadastradas, entao o
   * casamento por fatias nunca acertava. O resultado era o pedido usar sempre
   * `tamanhos[0]` — a confeiteira escolhia "30 fatias" e o sistema cobrava e
   * custeava pelo primeiro tamanho da lista.
   *
   * O `id` do tamanho sempre existe e nao muda, entao e por ele que se casa.
   */
  selectedTamanhoId: string;
  quantity: number;
  customDescription?: string;
  customUnitValue?: string;
}

/**
 * Item novo, SEM produto escolhido.
 *
 * Antes nascia com `productName: 'Bolo Maria'` — um nome de exemplo de uma fase
 * antiga, que nao existe em catalogo nenhum. Como o <select> recebia esse valor
 * inexistente, o navegador exibia a primeira opcao real da lista enquanto o
 * estado continuava com "Bolo Maria". A tela mostrava um bolo escolhido, o
 * estado nao tinha nenhum, e o pedido saia com subtotal R$ 0,00 se a
 * confeiteira apenas ajustasse a quantidade e salvasse.
 *
 * Nascer vazio, com um placeholder explicito no <select>, faz a tela dizer a
 * verdade: enquanto nada foi escolhido, nada aparece escolhido.
 */
export const criarItemVazio = (id: string): OrderItemState => ({
  id,
  productName: '',
  selectedTamanhoId: '',
  quantity: 1,
});

export interface AddonItemState {
  id: string;
  description: string;
  value: string;
  hasCost?: boolean;
  costValue?: string;
}

interface TransactionFormModalProps {
  isOpen: boolean;
  initialType: TransactionType;
  editingTransaction?: Transaction | null;
  prefilledDate?: string | null;
  prefilledLaborPeriod?: LaborPeriod | null;
  fichas: FichaTecnica[]; // Fichas já carregadas do contexto App
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'>, editingId?: string) => void;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  initialType,
  editingTransaction,
  prefilledDate,
  prefilledLaborPeriod,
  fichas,
  onClose,
  onSave,
}) => {
  // Clientes vem do Supabase (tabela `clientes`), a mesma fonte que a aba
  // Clientes grava via useCustomers.
  const { customers: storedCustomers, fetchCustomerPhoto } = useCustomers();

  const [type, setType] = useState<TransactionType>(initialType);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Sales Order State (when type === 'venda')
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerPhotoUrl, setCustomerPhotoUrl] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>(() => prefilledDate || getTodayIso());
  const [deliveryTime, setDeliveryTime] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [inspirationImage, setInspirationImage] = useState<string>('');
  const [showPdfQuoteModal, setShowPdfQuoteModal] = useState<boolean>(false);

  // --- Busca de cliente no proprio campo de nome ---
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [highlightedCustomer, setHighlightedCustomer] = useState(-1);
  const customerBoxRef = useRef<HTMLDivElement>(null);
  const customerListRef = useRef<HTMLUListElement>(null);
  const [hasMoreCustomersBelow, setHasMoreCustomersBelow] = useState(false);

  // Sincronizar prefilledDate com eventDate quando o formulário abre com data pré-preenchida
  useEffect(() => {
    if (isOpen && prefilledDate) {
      setEventDate(prefilledDate);
    }
  }, [isOpen, prefilledDate]);

  /**
   * Ha item escondido abaixo do corte da caixa?
   *
   * Alimenta o esmaecimento do rodape. A tolerancia de 1px evita que
   * arredondamento de sub-pixel mantenha a faixa acesa quando o scroll ja
   * chegou ao fim — sem ela, o aviso ficaria mentindo em algumas alturas.
   */
  const updateCustomerScrollHint = () => {
    const el = customerListRef.current;
    if (!el) {
      setHasMoreCustomersBelow(false);
      return;
    }
    setHasMoreCustomersBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 1);
  };

  /**
   * Clientes que combinam com o texto digitado.
   *
   * Casa por nome OU telefone, como a busca da aba Clientes, porque e comum
   * lembrar do numero e nao do nome. Acento e caixa sao ignorados: quem digita
   * "jessica" precisa achar "Jéssica".
   *
   * Campo vazio mostra a lista inteira — assim o foco no campo ainda revela
   * quem esta cadastrada, que era o papel do <select> removido.
   */
  const matchingCustomers = React.useMemo(() => {
    const q = normalizeName(customerName);
    if (!q) return storedCustomers;
    return storedCustomers.filter(
      (c) => normalizeName(c.name).includes(q) || (c.phone || '').includes(customerName.trim())
    );
  }, [customerName, storedCustomers]);

  /** Copia os dados da cliente escolhida para o formulario. */
  const applyCustomer = async (found: Customer) => {
    setCustomerName(found.name);
    setCustomerPhone(found.phone || '');
    setCustomerPhotoUrl(found.photoUrl || '');

    // Carregar foto sob demanda se não estiver em memória
    if (!found.photoUrl) {
      const photoUrl = await fetchCustomerPhoto(found.id);
      if (photoUrl) setCustomerPhotoUrl(photoUrl);
    }

    // A data de evento cadastrada costuma ser de um aniversario passado.
    // Trazer o dia/mes para o ano corrente evita lancar o pedido no passado.
    if (found.eventDate) {
      const parts = found.eventDate.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const currentYear = new Date().getFullYear();
        setEventDate(
          year < currentYear ? `${currentYear}-${parts[1]}-${parts[2]}` : found.eventDate
        );
      } else {
        setEventDate(getTodayIso());
      }
    } else {
      setEventDate(getTodayIso());
    }

    if (found.address || found.city) {
      setDeliveryAddress(`${found.address || ''}${found.city ? `, ${found.city}` : ''}`);
    }
    if (found.notes) setObservations(found.notes);

    setShowCustomerList(false);
    setHighlightedCustomer(-1);
  };

  const handleCustomerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showCustomerList || matchingCustomers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedCustomer((i) => (i + 1) % matchingCustomers.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedCustomer((i) => (i <= 0 ? matchingCustomers.length - 1 : i - 1));
    } else if (e.key === 'Enter' && highlightedCustomer >= 0) {
      // So intercepta o Enter quando ha item destacado; caso contrario o
      // Enter continua fazendo o que fazia no formulario.
      e.preventDefault();
      applyCustomer(matchingCustomers[highlightedCustomer]);
    } else if (e.key === 'Escape') {
      setShowCustomerList(false);
      setHighlightedCustomer(-1);
    }
  };

  // Reavalia o esmaecimento quando a lista abre ou o filtro muda: o conteudo
  // mudou de altura, entao "tem mais abaixo" pode ter virado verdade ou
  // mentira. O requestAnimationFrame e necessario porque neste tick o DOM
  // ainda nao refletiu a lista filtrada — medir agora leria a altura antiga.
  useEffect(() => {
    if (!showCustomerList) {
      setHasMoreCustomersBelow(false);
      return;
    }
    const id = requestAnimationFrame(updateCustomerScrollHint);
    return () => cancelAnimationFrame(id);
  }, [showCustomerList, matchingCustomers]);

  // Mantem o item destacado dentro da area visivel ao navegar com as setas.
  // Com a caixa travada em 4 linhas, a partir do 5o item a selecao sairia do
  // campo de visao e o teclado pareceria nao estar fazendo nada.
  useEffect(() => {
    if (highlightedCustomer < 0) return;
    const item = customerListRef.current?.children[highlightedCustomer] as
      | HTMLElement
      | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightedCustomer]);

  // Fecha a lista ao clicar fora. Sem isto ela ficaria aberta cobrindo os
  // campos seguintes do formulario.
  useEffect(() => {
    if (!showCustomerList) return;
    const onDocClick = (e: MouseEvent) => {
      if (customerBoxRef.current && !customerBoxRef.current.contains(e.target as Node)) {
        setShowCustomerList(false);
        setHighlightedCustomer(-1);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showCustomerList]);

  const [orderItems, setOrderItems] = useState<OrderItemState[]>([criarItemVazio('1')]);

  // Delivery State
  const [hasDelivery, setHasDelivery] = useState<boolean>(false);
  const [deliveryMiles, setDeliveryMiles] = useState<string>('');

  // Adicionais State
  const [hasAddons, setHasAddons] = useState<boolean>(false);
  const [addons, setAddons] = useState<AddonItemState[]>([
    { id: '1', description: '', value: '', hasCost: false, costValue: '' },
  ]);

  // Non-sale generic fields (when type !== 'venda')
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitValue, setUnitValue] = useState<string>('');
  const [totalValue, setTotalValue] = useState<string>('');
  const [signalValue, setSignalValue] = useState<string>('');

  // Common fields
  const [date, setDate] = useState<string>(getTodayIso());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('zelle');
  const [paymentStatus, setPaymentStatus] = useState<'pago' | 'pendente'>('pago');
  const [supplier, setSupplier] = useState('');
  const [laborPeriod, setLaborPeriod] = useState<LaborPeriod>('diaria');
  const [costCategory, setCostCategory] = useState<CostCategory>('fixo');
  const [notes, setNotes] = useState('');

  // Sync state when modal opens or editing transaction changes
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date || getTodayIso());
      setPaymentMethod(editingTransaction.paymentMethod || 'zelle');
      setPaymentStatus(editingTransaction.paymentStatus || 'pago');
      setSupplier(editingTransaction.supplier || '');
      setLaborPeriod(editingTransaction.laborPeriod || 'diaria');
      setCostCategory(editingTransaction.category || 'fixo');
      setNotes(editingTransaction.notes || '');

      if (editingTransaction.type === 'venda') {
        setCustomerName(editingTransaction.customerName || '');
        setCustomerPhone(editingTransaction.customerPhone || '');
        setCustomerPhotoUrl(editingTransaction.customerPhotoUrl || '');
        setEventDate(editingTransaction.eventDate || getTodayIso());
        setDeliveryTime(editingTransaction.deliveryTime || '');
        setDeliveryAddress(editingTransaction.deliveryAddress || '');
        setObservations(editingTransaction.observations || '');
        setInspirationImage(editingTransaction.inspirationImage || '');
        // Look up if existing description matches a ficha name
        const matchedFicha = fichas.find((ficha) =>
          (editingTransaction.description || '').toLowerCase().includes(ficha.name.toLowerCase())
        );

        if (matchedFicha) {
          setOrderItems([
            {
              id: '1',
              productName: matchedFicha.name,
              // Pedido antigo pode nao ter vinculo de tamanho gravado; nesse
              // caso o primeiro tamanho e o palpite honesto, e a confeiteira
              // ve qual esta marcado e pode trocar.
              selectedTamanhoId:
                editingTransaction.fichaItems?.[0]?.selectedTamanhoId ||
                matchedFicha.tamanhos?.[0]?.id ||
                '',
              quantity: editingTransaction.quantity || 1,
            },
          ]);
        } else {
          setOrderItems([
            {
              id: '1',
              productName: 'Outro / Personalizado',
              selectedTamanhoId: '',
              quantity: editingTransaction.quantity || 1,
              customDescription: editingTransaction.description,
              customUnitValue: String(editingTransaction.unitValue || editingTransaction.totalValue || ''),
            },
          ]);
        }
      } else {
        setDescription(editingTransaction.description);
        setQuantity(editingTransaction.quantity || 1);
        setUnitValue(String(editingTransaction.unitValue || 0));
        setTotalValue(String(editingTransaction.totalValue || 0));
        setSignalValue(String(editingTransaction.signalValue || editingTransaction.totalValue || 0));
      }
    } else {
      setType(initialType);
      setDate(getTodayIso());
      setPaymentMethod('zelle');
      setPaymentStatus('pago');
      setSupplier('');
      setLaborPeriod(prefilledLaborPeriod || 'diaria');
      setCostCategory(initialType === 'investimento' ? 'investimento' : 'fixo');
      setNotes('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerPhotoUrl('');
      // Não reseta eventDate se veio de um clique no calendário (prefilledDate)
      if (!prefilledDate) {
        setEventDate(getTodayIso());
      }
      setDeliveryTime('');
      setDeliveryAddress('');
      setSignalValue('');
      setObservations('');
      setInspirationImage('');

      // Default sales items
      setOrderItems([criarItemVazio('1')]);
      setHasDelivery(false);
      setDeliveryMiles('');
      setHasAddons(false);
      setAddons([{ id: '1', description: '', value: '', hasCost: false, costValue: '' }]);

      // Default non-sale fields
      setDescription('');
      setQuantity(1);
      setUnitValue('');
      setTotalValue('');
    }
  }, [isOpen, initialType, editingTransaction]);

  if (!isOpen) return null;

  const typeDetails = getTransactionTypeDetails(type);

  // Use fichas técnicas reais cadastradas pela confeiteira
  const cakeNamesList = fichas.map(f => f.name);
  const sweetsNamesList: string[] = [];

  // --- Order Items Logic ---
  const getItemBreakdown = (item: OrderItemState) => {
    if (item.productName === 'Outro / Personalizado') {
      const customVenda = parseFloat(item.customUnitValue?.replace(',', '.') || '0') || 0;
      const prop = calculateProportionalBreakdown(customVenda);
      return {
        name: item.customDescription || 'Item Personalizado',
        tamanhoLabel: '',
        unitVenda: customVenda,
        unitReposicao: prop.reposicao,
        unitMaodeobra: prop.maodeobra,
        unitCusto: prop.custos,
        unitInvestimento: prop.investimento,
        totalVenda: customVenda * item.quantity,
        totalReposicao: prop.reposicao * item.quantity,
        totalMaodeobra: prop.maodeobra * item.quantity,
        totalCusto: prop.custos * item.quantity,
        totalInvestimento: prop.investimento * item.quantity,
      };
    }

    // Match by ficha name (normalized)
    const matchingFicha = fichas.find(f => normalizeName(f.name) === normalizeName(item.productName));
    if (matchingFicha && matchingFicha.tamanhos && matchingFicha.tamanhos.length > 0) {
      // O tamanho ESCOLHIDO. O fallback para o primeiro cobre pedidos antigos
      // sendo editados, gravados antes de existir vinculo por id — nao o uso
      // normal, que era o defeito: preco e custos vinham sempre do tamanho 1.
      const tamanho =
        matchingFicha.tamanhos.find((t) => t.id === item.selectedTamanhoId) ||
        matchingFicha.tamanhos[0];

      const unitVenda = tamanho.preco || 0;
      const unitMaodeobra = tamanho.maoDeObraCost ?? matchingFicha.maoDeObraCost;
      const unitCusto = tamanho.custoCost ?? matchingFicha.custoCost;
      const unitInvestimento = tamanho.investimentoCost ?? matchingFicha.investimentoCost;
      const unitReposicao = matchingFicha.reposicaoCost;

      return {
        name: matchingFicha.name,
        tamanhoLabel: tamanho.descricao || '',
        unitVenda,
        unitReposicao,
        unitMaodeobra,
        unitCusto,
        unitInvestimento,
        totalVenda: unitVenda * item.quantity,
        totalReposicao: unitReposicao * item.quantity,
        totalMaodeobra: unitMaodeobra * item.quantity,
        totalCusto: unitCusto * item.quantity,
        totalInvestimento: unitInvestimento * item.quantity,
      };
    }

    // If not found, use zeros
    return {
      name: item.productName,
      tamanhoLabel: '',
      unitVenda: 0,
      unitReposicao: 0,
      unitMaodeobra: 0,
      unitCusto: 0,
      unitInvestimento: 0,
      totalVenda: 0,
      totalReposicao: 0,
      totalMaodeobra: 0,
      totalCusto: 0,
      totalInvestimento: 0,
    };
  };

  const itemsBreakdownList = orderItems.map(getItemBreakdown);

  const totalItemsVenda = itemsBreakdownList.reduce((sum, b) => sum + b.totalVenda, 0);
  const totalItemsReposicao = itemsBreakdownList.reduce((sum, b) => sum + b.totalReposicao, 0);
  const totalItemsMaodeobra = itemsBreakdownList.reduce((sum, b) => sum + b.totalMaodeobra, 0);
  const totalItemsCusto = itemsBreakdownList.reduce((sum, b) => sum + b.totalCusto, 0);
  const totalItemsInvestimento = itemsBreakdownList.reduce((sum, b) => sum + b.totalInvestimento, 0);

  // Delivery Calculations
  const numericMiles = hasDelivery ? parseFloat(deliveryMiles.replace(',', '.')) || 0 : 0;
  const deliveryFee = hasDelivery ? numericMiles * 1.5 : 0;

  // Addons Calculations
  const validAddons = hasAddons
    ? addons.filter((a) => (parseFloat(a.value.replace(',', '.')) || 0) > 0 || a.description.trim() !== '')
    : [];
  const totalAddonsValue = hasAddons
    ? addons.reduce((sum, a) => sum + (parseFloat(a.value.replace(',', '.')) || 0), 0)
    : 0;

  const grandTotalSalePrice = totalItemsVenda + deliveryFee + totalAddonsValue;

  // Order Items Manipulators
  const handleAddItem = () => {
    setOrderItems((prev) => [...prev, criarItemVazio(Date.now().toString())]);
  };

  const handleRemoveItem = (id: string) => {
    if (orderItems.length > 1) {
      setOrderItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleUpdateItemProduct = (id: string, newProductName: string) => {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (newProductName === 'Outro / Personalizado') {
          return {
            ...item,
            productName: newProductName,
            selectedTamanhoId: '',
            customDescription: '',
            customUnitValue: '',
          };
        }

        // Trocar de produto zera o tamanho: os ids sao de outra ficha agora.
        const matchingFicha = fichas.find(f => normalizeName(f.name) === normalizeName(newProductName));
        return {
          ...item,
          productName: newProductName,
          selectedTamanhoId: matchingFicha?.tamanhos?.[0]?.id || '',
        };
      })
    );
  };

  const handleUpdateItemTamanho = (id: string, tamanhoId: string) => {
    setOrderItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selectedTamanhoId: tamanhoId } : item))
    );
  };

  const handleUpdateItemQuantity = (id: string, newQty: number) => {
    const validQty = Math.max(1, newQty);
    setOrderItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: validQty } : item))
    );
  };

  const handleUpdateCustomField = (id: string, field: 'customDescription' | 'customUnitValue', value: string) => {
    setOrderItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Addons Manipulators
  const handleToggleAddons = (enable: boolean) => {
    setHasAddons(enable);
    if (enable && addons.length === 0) {
      setAddons([{ id: Date.now().toString(), description: '', value: '', hasCost: false, costValue: '' }]);
    }
  };

  const handleAddAddonItem = () => {
    setAddons((prev) => [
      ...prev,
      { id: Date.now().toString(), description: '', value: '', hasCost: false, costValue: '' },
    ]);
  };

  const handleRemoveAddonItem = (id: string) => {
    setAddons((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdateAddon = (id: string, field: keyof AddonItemState, val: any) => {
    setAddons((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: val } : a)));
  };

  // --- Non-sale Handlers ---
  const handleQuantityChange = (newQty: number) => {
    const validQty = Math.max(1, newQty);
    setQuantity(validQty);
    const unitValNum = parseFloat(unitValue.replace(',', '.')) || 0;
    if (unitValNum > 0) {
      setTotalValue((validQty * unitValNum).toFixed(2).replace('.', ','));
    }
  };

  const handleUnitValueChange = (valStr: string) => {
    setUnitValue(valStr);
    const unitValNum = parseFloat(valStr.replace(',', '.')) || 0;
    if (unitValNum >= 0 && quantity > 0) {
      setTotalValue((quantity * unitValNum).toFixed(2).replace('.', ','));
    }
  };

  const handleTotalValueChange = (valStr: string) => {
    setTotalValue(valStr);
    const totalValNum = parseFloat(valStr.replace(',', '.')) || 0;
    if (totalValNum > 0 && quantity > 0) {
      setUnitValue((totalValNum / quantity).toFixed(2).replace('.', ','));
    }
  };

  const applyPreset = (preset: BakeryPreset) => {
    setDescription(preset.name);
    setUnitValue(preset.defaultUnitValue.toFixed(2).replace('.', ','));
    setTotalValue((quantity * preset.defaultUnitValue).toFixed(2).replace('.', ','));
    if (
      preset.categoryTag &&
      (preset.categoryTag === 'fixo' ||
        preset.categoryTag === 'variavel' ||
        preset.categoryTag === 'investimento')
    ) {
      setCostCategory(preset.categoryTag as CostCategory);
    }
  };

  const getPresetsForCurrentType = (): BakeryPreset[] => {
    switch (type) {
      case 'venda':
        return BAKERY_PRODUCT_PRESETS;
      case 'reposicao':
        return INGREDIENT_PRESETS;
      case 'maodeobra':
        return LABOR_PRESETS;
      case 'custo':
      case 'investimento':
        return COST_PRESETS;
    }
  };

  // --- Form Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (type === 'venda') {
      // Item sem produto escolhido nao deve virar linha de pedido em silencio.
      // Era assim que o pedido saia com subtotal zero: o <select> exibia o
      // primeiro bolo da lista e ninguem percebia que nada fora escolhido.
      if (orderItems.some((item) => !item.productName)) {
        alert('⚠️ Escolha o produto de cada item do pedido antes de gravar.');
        return;
      }

      if (grandTotalSalePrice <= 0) {
        alert('Por favor, selecione ao menos um produto válido com valor maior que zero.');
        return;
      }

      // Build Order Description
      const descParts = orderItems.map((item, idx) => {
        const bd = itemsBreakdownList[idx];
        const qtyPrefix = item.quantity > 1 ? `${item.quantity}x ` : '';
        // A descricao do tamanho vem da ficha ("15 fatias", "20 cm"). Antes o
        // sufixo era montado aqui com o numero de fatias e uma unidade chutada
        // pelo nome do produto, o que produzia "(0 cm)" em todo pedido.
        return bd.tamanhoLabel
          ? `${qtyPrefix}${bd.name} (${bd.tamanhoLabel})`
          : `${qtyPrefix}${bd.name}`;
      });

      let descStr = descParts.join(' + ');
      if (hasDelivery && deliveryFee > 0) {
        descStr += ` + Entrega (${numericMiles} mi)`;
      }
      if (validAddons.length > 0) {
        const addonsNames = validAddons
          .map((a) => a.description.trim() || 'Adicional')
          .join(', ');
        descStr += ` + Adicional (${addonsNames})`;
      }

      // Build Order Notes for automatic calculation parsing
      let notesStr = `Breakdown: Reposição ${formatCurrency(
        totalItemsReposicao
      )}, Mão de Obra ${formatCurrency(totalItemsMaodeobra)}, Custos ${formatCurrency(
        totalItemsCusto
      )}, Investimento ${formatCurrency(totalItemsInvestimento)}.`;

      if (hasDelivery && deliveryFee > 0) {
        notesStr += ` Taxa de Entrega: ${formatCurrency(deliveryFee)} (${numericMiles} milhas).`;
      }

      if (validAddons.length > 0) {
        const details = validAddons
          .map(
            (a) =>
              `${a.description.trim() || 'Adicional'}: ${formatCurrency(
                parseFloat(a.value.replace(',', '.')) || 0
              )}`
          )
          .join(', ');
        notesStr += ` Adicionais: ${details}.`;
      }

      if (notes.trim()) {
        notesStr += ` Obs: ${notes.trim()}`;
      }

      // Trigger celebration confetti on new Sale!
      if (!editingTransaction) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#34d399', '#f472b6', '#fbbf24'],
          });
        } catch (e) {
          // Safe fail
        }
      }

      onSave(
        {
          type: 'venda',
          description: descStr,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          customerPhotoUrl: customerPhotoUrl || undefined,
          eventDate: eventDate || undefined,
          deliveryTime: deliveryTime.trim() || undefined,
          deliveryAddress: deliveryAddress.trim() || undefined,
          observations: observations.trim() || undefined,
          inspirationImage: inspirationImage || undefined,
          quantity: orderItems.reduce((acc, i) => acc + i.quantity, 0),
          unitValue: grandTotalSalePrice,
          totalValue: grandTotalSalePrice,
          signalValue: signalValue ? Number(signalValue.replace(',', '.')) : undefined,
          date: eventDate || getTodayIso(),
          paymentMethod,
          paymentStatus,
          notes: notesStr,
          // A ficha nao e escolhida na tela: o sistema casa cada item do pedido
          // com sua ficha pelo nome do produto. Ver utils/fichaMatcher.ts.
          fichaItems: buildFichaItems(
            orderItems.map(item => ({
              productName: item.productName,
              quantity: item.quantity,
              customDescription: item.customDescription,
              selectedTamanhoId: item.selectedTamanhoId,
            })),
            fichas
          ),
        },
        editingTransaction?.id
      );

      onClose();
      return;
    }

    // Standard submission for non-sale types
    if (!description.trim()) {
      alert('Por favor, informe uma descrição ou nome do lançamento.');
      return;
    }

    const parsedUnit = parseFloat(unitValue.replace(',', '.')) || 0;
    const parsedTotal =
      parseFloat(totalValue.replace(',', '.')) || quantity * parsedUnit;

    if (parsedTotal <= 0) {
      alert('Por favor, digite um valor válido maior que zero.');
      return;
    }

    const parsedSignalValue = type === 'venda' && signalValue
      ? parseFloat(signalValue.replace(',', '.'))
      : undefined;

    onSave(
      {
        type,
        description: description.trim(),
        quantity,
        unitValue: parsedUnit,
        totalValue: parsedTotal,
        signalValue: parsedSignalValue,
        date,
        supplier: type === 'reposicao' ? supplier.trim() : undefined,
        laborPeriod: type === 'maodeobra' ? laborPeriod : undefined,
        category: type === 'custo' || type === 'investimento' ? costCategory : undefined,
        notes: notes.trim(),
      },
      editingTransaction?.id
    );

    onClose();
    setIsSaving(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-neutral-900/80 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl bg-[#F6F2F5] rounded-t-xl sm:rounded-xl shadow-highlight overflow-hidden max-h-[92vh] flex flex-col animate-slideUp" aria-labelledby="transactionModalTitle">
        {/* Modal Header */}
        <div style={{ background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)' }} className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span id="transactionModalTitle" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '18px', color: 'white' }}>
              {editingTransaction
                ? 'Editar Lançamento'
                : type === 'venda'
                ? '🎂 Lançar Novo Pedido'
                : `Novo Registro: ${typeDetails.label}`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#3A2350] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ fontFamily: "'Manrope', sans-serif" }} className="p-5 overflow-y-auto space-y-4 flex-1 stagger-children">
          {/* Type Selector (if adding new) */}
          {!editingTransaction && (
            <div>
              <label style={{ fontFamily: "'Manrope', sans-serif" }} className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">
                Tipo do Lançamento:
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F6F2F5] rounded-lg">
                {[
                  { id: 'venda', label: 'Venda / Pedido' },
                  { id: 'reposicao', label: 'Estoque / Compra' },
                  { id: 'custo', label: 'Custo / Invest.' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const t = item.id as TransactionType;
                      setType(t);
                      if (t === 'investimento') setCostCategory('investimento');
                      else if (t === 'custo') setCostCategory('fixo');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      type === item.id || (type === 'investimento' && item.id === 'custo')
                        ? 'bg-white text-neutral-800 shadow-card'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* SALES ORDER FORM (WHEN type === 'venda')  */}
          {/* ========================================= */}
          {type === 'venda' && (
            <div className="space-y-4">
              {/* CUSTOMER & QUOTE DETAILS CARD */}
              <div className="bg-[#F6F2F5]/90 p-4 rounded-xl border border-[#E6E1DB] shadow-card space-y-3">
                <div className="flex items-center justify-between border-b border-[#E6E1DB]/80 pb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#3A2350] flex items-center gap-1.5">
                    👤 Dados da Cliente & Orçamento
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPdfQuoteModal(true)}
                    className="px-3 py-1 bg-[#6E3F72] hover:bg-[#5A3560] text-white rounded-xl text-xs font-bold shadow-card flex items-center gap-1 transition-all active:scale-95"
                    title="Gerar e imprimir folha fofa de orçamento em PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Gerar PDF Orçamento</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* O campo de nome e tambem a busca: digitar filtra as
                      clientes cadastradas em tempo real, e escolher uma
                      preenche o restante do formulario. Substituiu um <select>
                      separado que listava todas sem filtrar. */}
                  <div className="relative" ref={customerBoxRef}>
                    <label style={{ fontFamily: "'Manrope', sans-serif" }} className="block text-[11px] font-bold text-neutral-800 mb-1">
                      Nome da Cliente *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Camila Santos..."
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setShowCustomerList(true);
                        setHighlightedCustomer(-1);
                      }}
                      onFocus={() => setShowCustomerList(true)}
                      onKeyDown={handleCustomerKeyDown}
                      // Desliga o autocomplete do navegador: ele desenharia sua
                      // propria lista por cima da nossa.
                      autoComplete="off"
                      role="combobox"
                      aria-expanded={showCustomerList && matchingCustomers.length > 0}
                      aria-autocomplete="list"
                      aria-controls="lista-clientes"
                      className="w-full px-3 py-2 bg-white border border-[#E6E1DB] rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe"
                    />

                    {showCustomerList && matchingCustomers.length > 0 && (
                      <div className="absolute z-30 left-0 right-0 mt-1">
                        <div className="relative">
                      <ul
                        id="lista-clientes"
                        role="listbox"
                        ref={customerListRef}
                        onScroll={updateCustomerScrollHint}
                        // Altura travada em 4 itens (4 x 47px medidos). O limite
                        // e por altura, nao por contagem: uma cliente sem
                        // telefone rende um item mais baixo, e o que precisa ser
                        // garantido e que a caixa nunca cresca — com 5 ou com
                        // 500 cadastradas ela ocupa o mesmo espaco.
                        // Sem py-*: padding vertical faria a 5a linha assomar
                        // por alguns pixels e sujar o corte.
                        className="max-h-[188px] overflow-y-auto bg-white border border-[#E6E1DB] rounded-xl shadow-lg"
                      >
                        {matchingCustomers.map((c, i) => (
                          <li key={c.id} role="option" aria-selected={i === highlightedCustomer}>
                            <button
                              type="button"
                              // onMouseDown, nao onClick: o blur do input dispara
                              // antes do click e fecharia a lista, engolindo a
                              // escolha. mousedown chega primeiro.
                              onMouseDown={(e) => {
                                e.preventDefault();
                                applyCustomer(c);
                              }}
                              onMouseEnter={() => setHighlightedCustomer(i)}
                              className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                                i === highlightedCustomer ? 'bg-pink-100' : 'hover:bg-pink-50'
                              }`}
                            >
                              {c.photoUrl ? (
                                <img
                                  src={c.photoUrl}
                                  alt=""
                                  className="w-6 h-6 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <span className="w-6 h-6 rounded-full bg-pink-200 text-pink-900 text-[10px] font-black flex items-center justify-center shrink-0">
                                  {c.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                              <span className="min-w-0">
                                <span className="block text-xs font-bold text-neutral-900 truncate">
                                  {c.name}
                                </span>
                                {c.phone && (
                                  <span className="block text-[10px] text-neutral-600 truncate">
                                    {c.phone}
                                  </span>
                                )}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>

                          {/* Esmaecimento no rodape da caixa, so quando ainda
                              ha item abaixo do corte. Some ao chegar no fim do
                              scroll, entao nunca mente dizendo que continua.
                              pointer-events-none e essencial: sem isso a faixa
                              engoliria o clique no ultimo item visivel. */}
                          {hasMoreCustomersBelow && (
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute bottom-0 left-0 right-0 h-7 rounded-b-xl bg-gradient-to-t from-white via-white/80 to-transparent"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-800 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-pink-600" /> Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: (781) 420-6892"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E6E1DB] rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe"
                    />
                  </div>


                  <div>
                    <label className="block text-[11px] font-bold text-neutral-800 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-semantic-warning-600" /> Endereço de Entrega
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 103 Cabot St, Beverly..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E6E1DB] rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-800 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-semantic-info-600" /> Horário de Entrega / Retirada
                    </label>
                    <input
                      type="time"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E6E1DB] rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-800 mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-pink-600" /> Observações do Pedido
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Cliente escolheu folhas amarelas..."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E6E1DB] rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#6E3F72]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-800 mb-1 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-pink-600" /> Foto de Inspiração do Cliente
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setInspirationImage(await compressImageFile(file));
                          }
                        }}
                        className="hidden"
                        id="inspiration-upload-input"
                      />
                      <label
                        htmlFor="inspiration-upload-input"
                        className="flex-1 py-2 px-3 bg-pink-100 hover:bg-pink-200 text-pink-900 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 border border-[#E6E1DB] text-center"
                      >
                        <Upload className="w-3.5 h-3.5 text-pink-700" />
                        <span className="truncate">{inspirationImage ? 'Trocar Foto' : 'Carregar Foto'}</span>
                      </label>
                      {inspirationImage && (
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-[#E6E1DB] shrink-0">
                          <img src={inspirationImage} alt="Inspiração" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setInspirationImage('')}
                            className="absolute top-0 right-0 bg-semantic-error-600 text-white p-0.5"
                            title="Remover foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ORDER ITEMS LIST */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-pink-900 flex items-center gap-1.5">
                    <Cake className="w-4 h-4 text-pink-600" />
                    Produtos do Pedido ({orderItems.length})
                  </label>
                  <span className="text-[10px] text-neutral-500 font-semibold">
                    Valores preenchidos automaticamente
                  </span>
                </div>

                {orderItems.map((item, index) => {
                  const bd = itemsBreakdownList[index];
                  // Get available sizes from the matched ficha in fichas
                  const matchingFicha = fichas.find(f => normalizeName(f.name) === normalizeName(item.productName));
                  // Identificado por `id` e rotulado por `descricao` — os dois
                  // campos que a ficha realmente preenche. Antes usava
                  // `quantidade`, indefinida em todas as fichas, o que gerava
                  // tres botoes "0 cm" indistinguiveis (e com key duplicada).
                  const availableOptions = matchingFicha
                    ? matchingFicha.tamanhos.map((t) => ({
                        id: t.id,
                        label: t.descricao || 'Tamanho',
                        venda: t.preco,
                      }))
                    : [];

                  return (
                    <div
                      key={item.id}
                      className="bg-pink-50/50 p-3.5 rounded-lg border border-[#E6E1DB]/90 shadow-card space-y-3 relative"
                    >
                      {/* Item Header & Delete */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-pink-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[11px] font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          Item #{index + 1}
                        </span>

                        {orderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
                            title="Remover este item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* 1. SELECT PRODUCT DROPDOWN */}
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                          Escolha o Produto *
                        </label>
                        {fichas.length === 0 ? (
                          <div className="w-full px-3 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium text-neutral-600">
                            ⚠️ Nenhum produto cadastrado ainda. Cadastre produtos na aba <strong>Fichas Técnicas</strong>.
                          </div>
                        ) : (
                          <select
                            value={item.productName}
                            onChange={(e) => handleUpdateItemProduct(item.id, e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-extrabold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe"
                          >
                            {/* Sem este placeholder, um `value` fora da lista faz
                                o navegador exibir a primeira opcao enquanto o
                                estado segue vazio — a tela mostrava um bolo
                                escolhido e o pedido saia por R$ 0,00. */}
                            <option value="">Selecione o produto…</option>
                            {cakeNamesList.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                            <optgroup label="✨ Outro">
                              <option value="Outro / Personalizado">
                                ✨ Outro / Personalizado
                              </option>
                            </optgroup>
                          </select>
                        )}
                      </div>

                      {/* Custom input fields if 'Outro / Personalizado' */}
                      {item.productName === 'Outro / Personalizado' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-700 mb-1">
                              Nome / Descrição do Item
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: Bolo Especial Morango"
                              value={item.customDescription || ''}
                              onChange={(e) =>
                                handleUpdateCustomField(
                                  item.id,
                                  'customDescription',
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pink-400 input-mobile-safe"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-neutral-700 mb-1">
                              Preço de Venda ($)
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="0.00"
                              value={item.customUnitValue || ''}
                              onChange={(e) =>
                                handleUpdateCustomField(
                                  item.id,
                                  'customUnitValue',
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-pink-400 input-mobile-safe"
                            />
                          </div>
                        </div>
                      ) : (
                        /* 2. SELECT SIZE / SLICES */
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 mb-1.5">
                            Tamanho / Medida
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {availableOptions.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleUpdateItemTamanho(item.id, opt.id)}
                                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                                  item.selectedTamanhoId === opt.id
                                    ? 'bg-[#6E3F72] text-white border-pink-600 shadow-card'
                                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-pink-50'
                                }`}
                              >
                                {opt.label} ({formatCurrency(opt.venda)})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* QUANTITY & AUTO-FILLED BREAKDOWN PREVIEW */}
                      <div className="pt-3 border-t border-[#E6E1DB]/80 flex flex-wrap items-center justify-between gap-3">
                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-bold text-neutral-600">Qtd:</span>
                          <div className="flex items-center bg-white border border-neutral-300 rounded-xl overflow-hidden p-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center font-extrabold text-xs text-neutral-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Calculated Item Total Badge */}
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-500 font-bold block">
                            Subtotal do Item
                          </span>
                          <span className="text-sm font-black text-semantic-success-700">
                            {formatCurrency(bd.totalVenda)}
                          </span>
                        </div>
                      </div>

                      {/* Small Auto-Fill Cost Breakdown Pills */}
                      <div className="bg-white p-2 rounded-xl border border-pink-100 text-[10px] grid grid-cols-4 gap-2 text-center font-semibold text-neutral-600">
                        <div title="Reposição de Insumos">
                          <span className="block text-semantic-warning-700 font-bold">Reposição</span>
                          <span className="font-extrabold text-neutral-900">
                            {formatCurrency(bd.totalReposicao)}
                          </span>
                        </div>
                        <div title="Mão de Obra (Seu Salário)">
                          <span className="block text-semantic-info-700 font-bold">Mão Obra</span>
                          <span className="font-extrabold text-neutral-900">
                            {formatCurrency(bd.totalMaodeobra)}
                          </span>
                        </div>
                        <div title="Custos Operacionais">
                          <span className="block text-rose-700 font-bold">Custo</span>
                          <span className="font-extrabold text-neutral-900">
                            {formatCurrency(bd.totalCusto)}
                          </span>
                        </div>
                        <div title="Caixa de Investimento">
                          <span className="block text-blue-700 font-bold">Invest.</span>
                          <span className="font-extrabold text-neutral-900">
                            {formatCurrency(bd.totalInvestimento)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 5. ADD ANOTHER ITEM BUTTON */}
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2.5 px-4 bg-pink-50 hover:bg-pink-100 text-pink-800 font-brand font-bold text-xs rounded-lg border-2 border-dashed border-[#E6E1DB] transition-all flex items-center justify-center gap-2 active:scale-98 shadow-card"
                >
                  <PlusCircle className="w-4 h-4 text-pink-600 stroke-[2.5]" />
                  + Adicionar outro item ao mesmo pedido
                </button>
              </div>

              {/* DELIVERY OPTION */}
              <div className="pt-2 border-t border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-pink-600" />
                    Entrega (Delivery)?
                  </label>
                  <div className="flex bg-neutral-100 p-0.5 rounded-xl border border-neutral-200">
                    <button
                      type="button"
                      onClick={() => {
                        setHasDelivery(false);
                        setDeliveryMiles('');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        !hasDelivery
                          ? 'bg-neutral-700 text-white shadow-card'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasDelivery(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        hasDelivery
                          ? 'bg-[#6E3F72] text-white shadow-card'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      Sim
                    </button>
                  </div>
                </div>

                {hasDelivery && (
                  <div className="bg-pink-50/70 p-3 rounded-xl border border-[#E6E1DB] space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                          Quantidade de Milhas
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={deliveryMiles}
                            onChange={(e) => setDeliveryMiles(e.target.value)}
                            placeholder="Ex: 5"
                            className="w-full pl-3 pr-16 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#6E3F72]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-500 font-bold">
                            milhas
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pt-3">
                        <span className="text-[10px] text-neutral-500 block font-bold">
                          Taxa ($1.50/mi)
                        </span>
                        <span className="text-sm font-black text-pink-700">
                          {formatCurrency(deliveryFee)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ADICIONAIS OPTION */}
              <div className="pt-2 border-t border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide flex items-center gap-1.5">
                    <PackagePlus className="w-4 h-4 text-semantic-info-600" />
                    Adicionais (Flores, Velas, Topos)?
                  </label>
                  <div className="flex bg-neutral-100 p-0.5 rounded-xl border border-neutral-200">
                    <button
                      type="button"
                      onClick={() => handleToggleAddons(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        !hasAddons
                          ? 'bg-neutral-700 text-white shadow-card'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAddons(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        hasAddons
                          ? 'bg-semantic-info-600 text-white shadow-card'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      Sim
                    </button>
                  </div>
                </div>

                {hasAddons && (
                  <div className="bg-semantic-info-50/70 p-3 rounded-xl border border-semantic-info-200 space-y-2.5 animate-fadeIn">
                    {addons.map((addon, index) => (
                      <div
                        key={addon.id}
                        className="bg-white p-2.5 rounded-xl border border-semantic-info-200/80 shadow-card space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-semantic-info-900">
                            🌸 Adicional #{index + 1}
                          </span>
                          {addons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAddonItem(addon.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">
                              Descrição
                            </label>
                            <input
                              type="text"
                              value={addon.description}
                              onChange={(e) =>
                                handleUpdateAddon(addon.id, 'description', e.target.value)
                              }
                              placeholder="Ex: Topo em acrílico"
                              className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-semantic-info-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">
                              Valor ($)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={addon.value}
                              onChange={(e) =>
                                handleUpdateAddon(addon.id, 'value', e.target.value)
                              }
                              placeholder="0.00"
                              className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-semantic-info-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddAddonItem}
                      className="w-full py-1.5 px-3 bg-white text-semantic-info-700 font-bold text-xs rounded-xl border border-dashed border-semantic-info-300 transition flex items-center justify-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-semantic-info-600" />
                      + Adicionar outro adicional
                    </button>
                  </div>
                )}
              </div>

              {/* PAYMENT STATUS & METHOD & DATE */}
              <div className="pt-2 border-t border-neutral-200 space-y-3">
                {/* Status Toggle */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Status do Pagamento *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('pendente')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                        paymentStatus === 'pendente'
                          ? 'bg-semantic-warning-500 text-white border-amber-500 shadow-card'
                          : 'bg-semantic-warning-50 text-semantic-warning-900 border-semantic-warning-200 hover:bg-semantic-warning-100'
                      }`}
                    >
                      <span>⏳ Pendente (A Receber)</span>
                      {paymentStatus === 'pendente' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('pago')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                        paymentStatus === 'pago'
                          ? 'bg-semantic-success-600 text-white border-emerald-600 shadow-card'
                          : 'bg-semantic-success-50 text-semantic-success-900 border-semantic-success-200 hover:bg-emerald-100'
                      }`}
                    >
                      <span>✅ Pago (Recebido)</span>
                      {paymentStatus === 'pago' && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Forma de Pagamento *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'zelle', label: '⚡ Zelle' },
                      { id: 'cash', label: '💵 Cash (Dinheiro)' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPaymentMethod(item.id as PaymentMethod)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                          paymentMethod === item.id
                            ? 'bg-semantic-success-500 text-white border-emerald-500 shadow-card'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        <span>{item.label}</span>
                        {paymentMethod === item.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Data do Pedido
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                {/* Optional Notes */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Observações / Anotações do Cliente (Opcional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Entregar às 15h, sem glacê no topo..."
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
              </div>

              {/* GRAND TOTAL ORDER SUMMARY CARD */}
              <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div>
                    <span className="text-[10px] text-semantic-info-300 font-bold uppercase tracking-wider block">
                      Total Consolidado do Pedido
                    </span>
                    <span className="font-marca text-3xl font-black text-emerald-400">
                      {formatCurrency(grandTotalSalePrice)}
                    </span>
                  </div>

                  <div className="text-right text-[11px] text-slate-300 font-medium">
                    <div>{orderItems.length} {orderItems.length === 1 ? 'item' : 'itens'} no pedido</div>
                    {hasDelivery && deliveryFee > 0 && (
                      <div className="text-pink-300">+ Entrega: {formatCurrency(deliveryFee)}</div>
                    )}
                    {totalAddonsValue > 0 && (
                      <div className="text-semantic-info-300">+ Adic.: {formatCurrency(totalAddonsValue)}</div>
                    )}
                  </div>
                </div>

                {/* Combined Divisions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center text-[10px]">
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-amber-300 font-bold block">Reposição</span>
                    <span className="font-extrabold">{formatCurrency(totalItemsReposicao)}</span>
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-semantic-info-300 font-bold block">Mão de Obra</span>
                    <span className="font-extrabold">{formatCurrency(totalItemsMaodeobra)}</span>
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-rose-300 font-bold block">Custos</span>
                    <span className="font-extrabold">{formatCurrency(totalItemsCusto)}</span>
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-blue-300 font-bold block">Investimento</span>
                    <span className="font-extrabold">{formatCurrency(totalItemsInvestimento)}</span>
                  </div>
                </div>
              </div>

              {/* Signal Value (only for vendas) */}
              {type === 'venda' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center justify-between">
                    <span>Valor do Sinal/Entrada Pago (Opcional)</span>
                    <span className="text-[11px] font-medium text-neutral-500">{totalValue ? `Máx: $${totalValue}` : '-'}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-emerald-600 text-lg">
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Deixe em branco = valor total pago"
                      value={signalValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setSignalValue(val);
                        } else if (totalValue) {
                          const numVal = parseFloat(val.replace(',', '.'));
                          const totalNum = parseFloat(totalValue.replace(',', '.')) || 0;
                          if (numVal <= totalNum) {
                            setSignalValue(val);
                          }
                        } else {
                          setSignalValue(val);
                        }
                      }}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-emerald-50/30 border border-emerald-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================== */}
          {/* NON-SALE GENERIC FORM (type !== 'venda')       */}
          {/* ============================================== */}
          {type !== 'venda' && (
            <div className="space-y-4">
              {/* Quick Bakery Presets */}
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Atalhos Rápidos de Confeitaria:
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {getPresetsForCurrentType().map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 border border-[#E6E1DB]/80 text-pink-800 text-xs font-semibold whitespace-nowrap active:scale-95 transition-all"
                    >
                      + {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Descrição / Nome do Item ou Produto *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    type === 'reposicao'
                      ? 'Ex: Farinha de Trigo 5kg'
                      : type === 'maodeobra'
                      ? 'Ex: Diária de Ajudante'
                      : 'Ex: Conta de Luz / Batedeira'
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-3 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800 font-medium focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white"
                />
              </div>

              {/* Quantity & Values Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Quantity Counter */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Quantidade
                  </label>
                  <div className="flex items-center bg-neutral-100 border border-neutral-300 rounded-lg overflow-hidden p-1">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      className="w-10 h-10 rounded-xl bg-white text-neutral-700 flex items-center justify-center font-bold hover:bg-neutral-200 active:scale-95 transition-all"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="w-full text-center font-bold text-base bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="w-10 h-10 rounded-xl bg-white text-neutral-700 flex items-center justify-center font-bold hover:bg-neutral-200 active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Unit Value */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Valor Unitário ($)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={unitValue}
                    onChange={(e) => handleUnitValueChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800 font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* Total Value */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1 flex items-center justify-between">
                  <span>Valor Total ($) *</span>
                  <span className="text-[11px] font-medium text-neutral-500">Auto-calculado</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-pink-600 text-lg">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="0.00"
                    value={totalValue}
                    onChange={(e) => handleTotalValueChange(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-3 text-lg font-extrabold bg-pink-50/50 border-2 border-[#E6E1DB] rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* Date Picker */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Data do Lançamento
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              {/* Specific Optional Fields */}
              {type === 'reposicao' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Fornecedor / Loja (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Atacadão, Mercado Central, Embalagens & Cia"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
              )}

              {type === 'maodeobra' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Período de Referência
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'diaria', label: 'Diária' },
                      { id: 'semanal', label: 'Semanal' },
                      { id: 'mensal', label: 'Mensal' },
                      { id: 'encomenda', label: 'Por Encomenda' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLaborPeriod(item.id as LaborPeriod)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          laborPeriod === item.id
                            ? 'bg-semantic-info-600 text-white border-purple-600 shadow-card'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(type === 'custo' || type === 'investimento') && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Categoria de Despesa
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'fixo', label: 'Custo Fixo 🏢' },
                      { id: 'variavel', label: 'Custo Variável ⚡' },
                      { id: 'investimento', label: 'Investimento 🚀' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          const c = item.id as CostCategory;
                          setCostCategory(c);
                          if (c === 'investimento') setType('investimento');
                          else setType('custo');
                        }}
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                          costCategory === item.id
                            ? 'bg-rose-500 text-white border-rose-500 shadow-card'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className={`w-full py-4 rounded-lg text-white font-brand text-base font-bold shadow-highlight shadow-pink-200 active:scale-98 transition-all flex items-center justify-center gap-2 ${
                isSaving
                  ? 'bg-gradient-to-r from-pink-400 to-rose-400 opacity-75 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  {editingTransaction ? 'Salvar Alterações' : 'Confirmar e Gravar'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-4 left-4 right-4 sm:bottom-8 sm:right-8 sm:left-auto bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg animate-slideUp flex items-center gap-2 max-w-sm">
          <Check className="w-5 h-5" />
          <span className="font-bold">{editingTransaction ? 'Alterações salvas!' : 'Pedido gravado com sucesso!'}</span>
        </div>
      )}

      {showPdfQuoteModal && (
        <QuotePdfModal
          transaction={{
            type: 'venda',
            // Le de `orderItems` para a quantidade e do breakdown para nome e
            // tamanho. Antes lia `quantity`, `productName` e `slices` do
            // breakdown, que nunca teve nenhum dos tres — a folha de orcamento
            // saia com "undefinedx undefined (undefined fatias)".
            description:
              orderItems
                .map((item, idx) => {
                  const bd = itemsBreakdownList[idx];
                  const prefixo = item.quantity > 1 ? `${item.quantity}x ` : '';
                  return bd.tamanhoLabel
                    ? `${prefixo}${bd.name} (${bd.tamanhoLabel})`
                    : `${prefixo}${bd.name}`;
                })
                .filter((linha) => linha.trim())
                .join(' + ') || 'Pedido de Bolo / Doces',
            customerName: customerName.trim() || 'Cliente',
            customerPhone: customerPhone.trim(),
            eventDate,
            deliveryAddress,
            observations,
            quantity: orderItems.reduce((acc, i) => acc + i.quantity, 0),
            unitValue: grandTotalSalePrice,
            totalValue: grandTotalSalePrice,
            date,
            paymentMethod,
            paymentStatus,
            notes,
          }}
          onClose={() => setShowPdfQuoteModal(false)}
        />
      )}
    </div>,
    document.body
  );
};

