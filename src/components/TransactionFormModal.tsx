import React, { useState, useEffect } from 'react';
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
import { getStoredCustomers } from './CustomersModule';
import { getStoredFichas } from './FichasTecnicasModule';
import { QuotePdfModal } from './QuotePdfModal';
import { FichaTecnicaSelector } from './FichaTecnicaSelector';
import {
  BAKERY_PRODUCT_PRESETS,
  INGREDIENT_PRESETS,
  LABOR_PRESETS,
  COST_PRESETS,
} from '../data/presetData';
import {
  BAKERY_CATALOG,
  UNIQUE_CAKE_NAMES,
  getCakeOptionsByName,
  getExactCakeRecipe,
  calculateProportionalBreakdown,
} from '../data/bakeryCatalog';
import { getTodayIso, formatCurrency, getTransactionTypeDetails } from '../utils/formatters';
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

export interface OrderItemState {
  id: string;
  productName: string;
  slices: number;
  quantity: number;
  customDescription?: string;
  customUnitValue?: string;
}

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
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'>, editingId?: string) => void;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  initialType,
  editingTransaction,
  onClose,
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);

  // Sales Order State (when type === 'venda')
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerPhotoUrl, setCustomerPhotoUrl] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>(getTodayIso());
  const [deliveryTime, setDeliveryTime] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [inspirationImage, setInspirationImage] = useState<string>('');
  const [showPdfQuoteModal, setShowPdfQuoteModal] = useState<boolean>(false);
  const [storedCustomers, setStoredCustomers] = useState<Customer[]>([]);
  const [storedFichas, setStoredFichas] = useState<FichaTecnica[]>([]);
  const [selectedFichaId, setSelectedFichaId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setStoredCustomers(getStoredCustomers());
      setStoredFichas(getStoredFichas());
    } else {
      // Reset ficha selection when modal closes
      setSelectedFichaId(undefined);
    }
  }, [isOpen]);

  const [orderItems, setOrderItems] = useState<OrderItemState[]>([
    { id: '1', productName: 'Bolo Maria', slices: 20, quantity: 1 },
  ]);

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
        // Look up if existing description matches a catalog cake name
        const matchedName = UNIQUE_CAKE_NAMES.find((name) =>
          (editingTransaction.description || '').toLowerCase().includes(name.toLowerCase())
        );

        if (matchedName) {
          const options = getCakeOptionsByName(matchedName);
          const matchedSlice = options.find((opt) =>
            editingTransaction.description.includes(`${opt.slices}`)
          );
          setOrderItems([
            {
              id: '1',
              productName: matchedName,
              slices: matchedSlice ? matchedSlice.slices : (options[0]?.slices || 20),
              quantity: editingTransaction.quantity || 1,
            },
          ]);
        } else {
          setOrderItems([
            {
              id: '1',
              productName: 'Outro / Personalizado',
              slices: 20,
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
      }
    } else {
      setType(initialType);
      setDate(getTodayIso());
      setPaymentMethod('zelle');
      setPaymentStatus('pago');
      setSupplier('');
      setLaborPeriod('diaria');
      setCostCategory(initialType === 'investimento' ? 'investimento' : 'fixo');
      setNotes('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerPhotoUrl('');
      setEventDate(getTodayIso());
      setDeliveryTime('');
      setDeliveryAddress('');
      setObservations('');
      setInspirationImage('');

      // Default sales items
      setOrderItems([{ id: '1', productName: 'Bolo Maria', slices: 20, quantity: 1 }]);
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

  // Categorize product names for dropdown
  const cakeNamesList = UNIQUE_CAKE_NAMES.filter(
    (n) => !n.includes('Cupcake') && !n.includes('Brigadeiro')
  );
  const sweetsNamesList = UNIQUE_CAKE_NAMES.filter(
    (n) => n.includes('Cupcake') || n.includes('Brigadeiro')
  );

  // --- Order Items Logic ---
  const getItemBreakdown = (item: OrderItemState) => {
    if (item.productName === 'Outro / Personalizado') {
      const customVenda = parseFloat(item.customUnitValue?.replace(',', '.') || '0') || 0;
      const prop = calculateProportionalBreakdown(customVenda);
      return {
        name: item.customDescription || 'Item Personalizado',
        slices: item.slices,
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

    const recipe = getExactCakeRecipe(item.productName, item.slices);
    if (recipe) {
      return {
        name: recipe.cakeName,
        slices: recipe.slices,
        unitVenda: recipe.venda,
        unitReposicao: recipe.reposicao,
        unitMaodeobra: recipe.maodeobra,
        unitCusto: recipe.custo,
        unitInvestimento: recipe.investimento,
        totalVenda: recipe.venda * item.quantity,
        totalReposicao: recipe.reposicao * item.quantity,
        totalMaodeobra: recipe.maodeobra * item.quantity,
        totalCusto: recipe.custo * item.quantity,
        totalInvestimento: recipe.investimento * item.quantity,
      };
    }

    // Fallback if size not found
    const options = getCakeOptionsByName(item.productName);
    const fallbackRecipe = options[0] || BAKERY_CATALOG[0];
    return {
      name: fallbackRecipe.cakeName,
      slices: fallbackRecipe.slices,
      unitVenda: fallbackRecipe.venda,
      unitReposicao: fallbackRecipe.reposicao,
      unitMaodeobra: fallbackRecipe.maodeobra,
      unitCusto: fallbackRecipe.custo,
      unitInvestimento: fallbackRecipe.investimento,
      totalVenda: fallbackRecipe.venda * item.quantity,
      totalReposicao: fallbackRecipe.reposicao * item.quantity,
      totalMaodeobra: fallbackRecipe.maodeobra * item.quantity,
      totalCusto: fallbackRecipe.custo * item.quantity,
      totalInvestimento: fallbackRecipe.investimento * item.quantity,
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
    setOrderItems((prev) => [
      ...prev,
      { id: Date.now().toString(), productName: 'Bolo Maria', slices: 20, quantity: 1 },
    ]);
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
            slices: 20,
            customDescription: '',
            customUnitValue: '',
          };
        }

        const availableOptions = getCakeOptionsByName(newProductName);
        const defaultSlices = availableOptions.length > 0 ? availableOptions[0].slices : 20;

        return {
          ...item,
          productName: newProductName,
          slices: defaultSlices,
        };
      })
    );
  };

  const handleUpdateItemSlices = (id: string, newSlices: number) => {
    setOrderItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, slices: newSlices } : item))
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'venda') {
      if (grandTotalSalePrice <= 0) {
        alert('Por favor, selecione ao menos um produto válido com valor maior que zero.');
        return;
      }

      // Build Order Description
      const descParts = orderItems.map((item, idx) => {
        const bd = itemsBreakdownList[idx];
        const unitLabel =
          bd.name.includes('Brigadeiro') || bd.name.includes('Cupcake') ? 'un' : 'cm';
        const qtyPrefix = item.quantity > 1 ? `${item.quantity}x ` : '';
        return `${qtyPrefix}${bd.name} (${bd.slices} ${unitLabel})`;
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
          date,
          paymentMethod,
          paymentStatus,
          notes: notesStr,
          fichaId: selectedFichaId || undefined,
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

    onSave(
      {
        type,
        description: description.trim(),
        quantity,
        unitValue: parsedUnit,
        totalValue: parsedTotal,
        date,
        supplier: type === 'reposicao' ? supplier.trim() : undefined,
        laborPeriod: type === 'maodeobra' ? laborPeriod : undefined,
        category: type === 'custo' || type === 'investimento' ? costCategory : undefined,
        notes: notes.trim(),
      },
      editingTransaction?.id
    );

    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-neutral-900/80 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl bg-white rounded-t-xl sm:rounded-xl shadow-highlight overflow-hidden max-h-[92vh] flex flex-col animate-slideUp" aria-labelledby="transactionModalTitle">
        {/* Modal Header */}
        <div className={`px-5 py-4 flex items-center justify-between ${typeDetails.badgeBg}`}>
          <div className="flex items-center gap-2">
            <span id="transactionModalTitle" className="heading-card-sm text-neutral-800">
              {editingTransaction
                ? 'Editar Lançamento'
                : type === 'venda'
                ? '🎂 Lançar Novo Pedido'
                : `Novo Registro: ${typeDetails.label}`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-neutral-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 stagger-children">
          {/* Type Selector (if adding new) */}
          {!editingTransaction && (
            <div>
              <label className="block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">
                Tipo do Lançamento:
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-100 rounded-lg">
                {[
                  { id: 'venda', label: 'Venda / Pedido' },
                  { id: 'reposicao', label: 'Estoque / Compra' },
                  { id: 'maodeobra', label: 'Mão de Obra' },
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
              <div className="bg-pink-50/90 p-4 rounded-xl border border-pink-200 shadow-card space-y-3">
                <div className="flex items-center justify-between border-b border-pink-200/80 pb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-pink-950 flex items-center gap-1.5">
                    👤 Dados da Cliente & Orçamento
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPdfQuoteModal(true)}
                    className="px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-card flex items-center gap-1 transition-all active:scale-95"
                    title="Gerar e imprimir folha fofa de orçamento em PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Gerar PDF Orçamento</span>
                  </button>
                </div>

                {storedCustomers.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-pink-900 mb-1 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-pink-600" /> Puxar Dados de Cliente Cadastrada:
                    </label>
                    <select
                      onChange={(e) => {
                        const found = storedCustomers.find((c) => c.id === e.target.value);
                        if (found) {
                          setCustomerName(found.name);
                          setCustomerPhone(found.phone || '');
                          setCustomerPhotoUrl(found.photoUrl || '');
                          if (found.eventDate) {
                            const parts = found.eventDate.split('-');
                            if (parts.length === 3) {
                              const year = parseInt(parts[0], 10);
                              const currentYear = new Date().getFullYear();
                              if (year < currentYear) {
                                setEventDate(`${currentYear}-${parts[1]}-${parts[2]}`);
                              } else {
                                setEventDate(found.eventDate);
                              }
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
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-pink-300 rounded-xl text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="">-- Selecionar Cliente da Minha Lista --</option>
                      {storedCustomers.map((c) => (
                        <option key={c.id} value={c.id}>
                          👤 {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-800 mb-1">
                      Nome da Cliente *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Camila Santos..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-pink-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
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
                      className="w-full px-3 py-2 bg-white border border-pink-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-800 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-semantic-info-600" /> Data do Evento
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-pink-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                      className="w-full px-3 py-2 bg-white border border-pink-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                      className="w-full px-3 py-2 bg-white border border-pink-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                      className="w-full px-3 py-2 bg-white border border-pink-300 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setInspirationImage(ev.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="inspiration-upload-input"
                      />
                      <label
                        htmlFor="inspiration-upload-input"
                        className="flex-1 py-2 px-3 bg-pink-100 hover:bg-pink-200 text-pink-900 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 border border-pink-300 text-center"
                      >
                        <Upload className="w-3.5 h-3.5 text-pink-700" />
                        <span className="truncate">{inspirationImage ? 'Trocar Foto' : 'Carregar Foto'}</span>
                      </label>
                      {inspirationImage && (
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-pink-300 shrink-0">
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

              {/* FICHA TÉCNICA SELECTOR */}
              <div className="bg-gradient-to-b from-white to-gray-50 p-4 rounded-lg border border-gray-200">
                <FichaTecnicaSelector
                  fichas={storedFichas}
                  selectedFichaId={selectedFichaId}
                  onSelect={setSelectedFichaId}
                />
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
                  const availableOptions = getCakeOptionsByName(item.productName);

                  return (
                    <div
                      key={item.id}
                      className="bg-pink-50/50 p-3.5 rounded-lg border border-pink-200/90 shadow-card space-y-3 relative"
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
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Remover este item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* 1. SELECT PRODUCT DROPDOWN */}
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                          Escolha o Bolo ou Doce do Catálogo *
                        </label>
                        <select
                          value={item.productName}
                          onChange={(e) => handleUpdateItemProduct(item.id, e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-extrabold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        >
                          <optgroup label="🎂 Bolos">
                            {cakeNamesList.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </optgroup>

                          <optgroup label="🧁 Doces & Brigadeiros">
                            {sweetsNamesList.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </optgroup>

                          <optgroup label="✨ Outro">
                            <option value="Outro / Personalizado">
                              ✨ Outro / Personalizado
                            </option>
                          </optgroup>
                        </select>
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
                              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pink-400"
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
                              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-pink-400"
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
                            {availableOptions.map((opt) => {
                              const isSelected = item.slices === opt.slices;
                              const unitTag =
                                opt.cakeName.includes('Brigadeiro') ||
                                opt.cakeName.includes('Cupcake')
                                  ? 'un'
                                  : 'cm';

                              return (
                                <button
                                  key={opt.slices}
                                  type="button"
                                  onClick={() => handleUpdateItemSlices(item.id, opt.slices)}
                                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                                    isSelected
                                      ? 'bg-pink-600 text-white border-pink-600 shadow-card'
                                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-pink-50'
                                  }`}
                                >
                                  {opt.slices} {unitTag} ({formatCurrency(opt.venda)})
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* QUANTITY & AUTO-FILLED BREAKDOWN PREVIEW */}
                      <div className="pt-2 border-t border-pink-200/80 flex flex-wrap items-center justify-between gap-3">
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
                      <div className="bg-white p-2 rounded-xl border border-pink-100 text-[10px] grid grid-cols-4 gap-1 text-center font-semibold text-neutral-600">
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
                  className="w-full py-2.5 px-4 bg-pink-50 hover:bg-pink-100 text-pink-800 font-brand font-bold text-xs rounded-lg border-2 border-dashed border-pink-300 transition-all flex items-center justify-center gap-2 active:scale-98 shadow-card"
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
                          ? 'bg-pink-600 text-white shadow-card'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      Sim
                    </button>
                  </div>
                </div>

                {hasDelivery && (
                  <div className="bg-pink-50/70 p-3 rounded-xl border border-pink-200 space-y-2 animate-fadeIn">
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
                            className="w-full pl-3 pr-16 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                      className="px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-200/80 text-pink-800 text-xs font-semibold whitespace-nowrap active:scale-95 transition-all"
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
                    className="w-full pl-9 pr-3.5 py-3 text-lg font-extrabold bg-pink-50/50 border-2 border-pink-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white"
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
              className="w-full py-4 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-brand text-base font-bold shadow-highlight shadow-pink-200 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              {editingTransaction ? 'Salvar Alterações' : 'Confirmar e Gravar'}
            </button>
          </div>
        </form>
      </div>

      {showPdfQuoteModal && (
        <QuotePdfModal
          transaction={{
            type: 'venda',
            description:
              itemsBreakdownList
                .map((i) => `${i.quantity}x ${i.productName} (${i.slices} fatias)`)
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

