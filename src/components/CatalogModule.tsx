import React, { useState } from 'react';
import {
  BAKERY_CATALOG,
  CakeRecipeItem,
  UNIQUE_CAKE_NAMES,
  getCakeOptionsByName,
  calculateProportionalBreakdown,
} from '../data/bakeryCatalog';
import { formatCurrency } from '../utils/formatters';
import {
  Calculator,
  Cake,
  DollarSign,
  PieChart,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Info,
  HelpCircle,
  Truck,
  PackagePlus,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';

export interface AddonItem {
  id: string;
  description: string;
  value: string;
  hasCost?: boolean;
  costValue?: string;
}

interface CatalogModuleProps {
  onAddTransaction: (txData: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onNavigateToTab: (tab: any) => void;
}

export const CatalogModule: React.FC<CatalogModuleProps> = ({
  onAddTransaction,
  onNavigateToTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'catalogo' | 'fechamento' | 'duvidas'>('catalogo');

  // Catalog State
  const [selectedCakeName, setSelectedCakeName] = useState<string>('Bolo Franciele');
  const availableOptions = getCakeOptionsByName(selectedCakeName);
  const [selectedSlices, setSelectedSlices] = useState<number>(
    availableOptions.length > 0 ? availableOptions[0].slices : 20
  );
  const [addedSuccessMsg, setAddedSuccessMsg] = useState<string | null>(null);

  // Delivery State
  const [hasDelivery, setHasDelivery] = useState<boolean>(false);
  const [deliveryMiles, setDeliveryMiles] = useState<string>('');

  // Adicionais State
  const [hasAddons, setHasAddons] = useState<boolean>(false);
  const [addons, setAddons] = useState<AddonItem[]>([
    { id: '1', description: '', value: '', hasCost: false, costValue: '' },
  ]);

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
    setAddons((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateAddon = (id: string, field: keyof AddonItem, val: any) => {
    setAddons((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  // Get current active item
  const currentRecipe: CakeRecipeItem =
    availableOptions.find((item) => item.slices === selectedSlices) ||
    availableOptions[0] ||
    BAKERY_CATALOG[0];

  // Delivery Calculations ($1.50 per mile)
  const numericMiles = hasDelivery ? (parseFloat(deliveryMiles.replace(',', '.')) || 0) : 0;
  const deliveryFee = hasDelivery ? numericMiles * 1.50 : 0;

  // Addons Calculations
  const activeAddons = hasAddons
    ? addons.filter((a) => (parseFloat(a.value.replace(',', '.')) || 0) > 0 || a.description.trim() !== '')
    : [];

  const totalAddonsValue = hasAddons
    ? addons.reduce((sum, a) => sum + (parseFloat(a.value.replace(',', '.')) || 0), 0)
    : 0;

  const totalAddonsCost = hasAddons
    ? addons.reduce((sum, a) => {
        if (!a.hasCost) return sum;
        return sum + (parseFloat(a.costValue?.replace(',', '.') || '0') || 0);
      }, 0)
    : 0;

  const totalAddonsNetProfit = totalAddonsValue - totalAddonsCost;

  const totalSalePrice = currentRecipe.venda + deliveryFee + totalAddonsValue;
  const totalNetProfit = (currentRecipe.maodeobra + currentRecipe.investimento) + deliveryFee + totalAddonsNetProfit;

  // Fechamento State
  const [monthlyRevenueInput, setMonthlyRevenueInput] = useState<string>('6000');
  const numericMonthlyRev = parseFloat(monthlyRevenueInput.replace(',', '.')) || 0;
  const monthlyBreakdown = calculateProportionalBreakdown(numericMonthlyRev);

  // Quick Chat / Assistente state
  const [customQuestion, setCustomQuestion] = useState('');
  const [assistantAnswer, setAssistantAnswer] = useState<string | null>(null);

  const handleLaunchSale = () => {
    const today = new Date().toISOString().split('T')[0];
    const unitName = currentRecipe.cakeName.includes('Brigadeiro') || currentRecipe.cakeName.includes('Cupcake') ? 'unidades' : 'cm';
    const deliveryTag = hasDelivery && deliveryFee > 0 ? ` + Entrega (${numericMiles} mi)` : '';
    
    const validAddonsForSale = hasAddons
      ? addons.filter((a) => (parseFloat(a.value.replace(',', '.')) || 0) > 0 || a.description.trim() !== '')
      : [];
    
    const addonsTag = validAddonsForSale.length > 0
      ? ` + Adicional (${validAddonsForSale.map(a => a.description.trim() || 'Item').join(', ')})`
      : '';

    const desc = `${currentRecipe.cakeName} (${currentRecipe.slices} ${unitName})${deliveryTag}${addonsTag} - Tabela Relatório`;

    let notesText = `Breakdown do Relatório: Reposição ${formatCurrency(currentRecipe.reposicao)}, Mão de Obra ${formatCurrency(currentRecipe.maodeobra)}, Custos ${formatCurrency(currentRecipe.custo)}, Investimento ${formatCurrency(currentRecipe.investimento)}`;
    if (hasDelivery && deliveryFee > 0) {
      notesText += `, Taxa de Entrega ${formatCurrency(deliveryFee)} (${numericMiles} milhas)`;
    }
    if (validAddonsForSale.length > 0) {
      const addonsDetail = validAddonsForSale
        .map(a => `${a.description.trim() || 'Adicional'}: ${formatCurrency(parseFloat(a.value.replace(',', '.')) || 0)}`)
        .join(', ');
      notesText += `, Adicionais: ${addonsDetail}`;
    }

    // Add sale with status pendente by default
    onAddTransaction({
      type: 'venda',
      description: desc,
      quantity: 1,
      unitValue: totalSalePrice,
      totalValue: totalSalePrice,
      date: today,
      paymentStatus: 'pendente',
      notes: notesText,
    });

    const withDeliveryText = hasDelivery && deliveryFee > 0 ? ' com entrega' : '';
    const withAddonsText = validAddonsForSale.length > 0 ? ' e adicionais' : '';

    setAddedSuccessMsg(`Pedido de ${currentRecipe.cakeName} (${currentRecipe.slices} ${unitName})${withDeliveryText}${withAddonsText} registrado com sucesso com status Pendente!`);
    setTimeout(() => setAddedSuccessMsg(null), 4000);
  };

  const handleQuickQuestion = (qText: string) => {
    setCustomQuestion(qText);
    const lower = qText.toLowerCase();

    if (lower.includes('franciele') && lower.includes('20')) {
      const item = BAKERY_CATALOG.find(c => c.cakeName === 'Bolo Franciele' && c.slices === 20);
      if (item) {
        setAssistantAnswer(
          `🎂 **Bolo Franciele (20 cm)**\n\n` +
          `• **Preço de Venda**: ${formatCurrency(item.venda)}\n` +
          `• 🔄 **Reposição (Insumos)**: ${formatCurrency(item.reposicao)}\n` +
          `• 🛠️ **Mão de Obra (Salário)**: ${formatCurrency(item.maodeobra)}\n` +
          `• 📦 **Custos**: ${formatCurrency(item.custo)}\n` +
          `• 📈 **Investimento**: ${formatCurrency(item.investimento)}\n\n` +
          `💡 *Dividindo assim, você garante a compra de ingredientes para o próximo bolo e guarda ${formatCurrency(item.maodeobra)} direto no seu bolso de salário!*`
        );
        return;
      }
    }

    if (lower.includes('fechamento') || lower.includes('6000') || lower.includes('6.000')) {
      setAssistantAnswer(
        `📊 **Simulação de Fechamento Mensal ($ 6,000.00 faturados)**\n\n` +
        `• 💲 **Faturamento Bruto Total**: $ 6,000.00\n` +
        `• 🔄 **Reposição de Estoque**: $ 1,800.00 (30%)\n` +
        `• 🛠️ **Mão de Obra (Seu Salário)**: $ 2,000.00 (33.3%)\n` +
        `• 📦 **Custos da Confeitaria**: $ 1,000.00 (16.7%)\n` +
        `• 📈 **Investimento / Caixinha**: $ 1,200.00 (20%)\n\n` +
        `💡 *No fim das contas, você saca $ 2,000.00 limpos para suas contas pessoais e sua confeitaria fica 100% abastecida e com $ 1,200.00 de reserva!*`
      );
      return;
    }

    // Default intelligent breakdown calculation
    const matchVal = qText.match(/\d+/g);
    const val = matchVal ? parseInt(matchVal[0]) : 5000;
    const bd = calculateProportionalBreakdown(val);

    setAssistantAnswer(
      `📊 **Análise para o valor de ${formatCurrency(val)}**\n\n` +
      `• 💲 **Faturamento**: ${formatCurrency(bd.faturamentoBruto)}\n` +
      `• 🔄 **Reposição (Ingredientes)**: ${formatCurrency(bd.reposicao)}\n` +
      `• 🛠️ **Mão de Obra (Seu Salário)**: ${formatCurrency(bd.maodeobra)}\n` +
      `• 📦 **Custos Fixos/Op.**: ${formatCurrency(bd.custos)}\n` +
      `• 📈 **Investimento / Reserva**: ${formatCurrency(bd.investimento)}\n\n` +
      `💡 *Dica:* Mantenha os potes e contas bancárias separados para não misturar seu salário com o caixa do negócio!`
    );
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header Badge */}
      <div className="bg-gradient-to-r from-[#8E5CF0] via-[#E5613C] to-[#E9B839] rounded-2xl p-4 text-white shadow-md">
        <div className="flex items-center gap-2 mb-1 text-white/90 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-[#E9B839]" />
          Carula Confeitaria • Tabela Oficial
        </div>
        <h2 className="text-xl font-black tracking-tight">
          Relatório Consolidado de Precificação
        </h2>
        <p className="text-xs text-white/95 mt-1 opacity-90 leading-relaxed font-medium">
          Tabela oficial com os 16 modelos de bolos e doces. Calcule orçamentos e faça fechamentos mensais com a divisão exata de custos!
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex p-1 bg-[#FAF9F0] border border-[#EA869C]/30 rounded-xl">
        <button
          onClick={() => setActiveSubTab('catalogo')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'catalogo'
              ? 'bg-white text-[#E5613C] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cake className="w-4 h-4 text-[#E5613C]" />
          16 Bolos & Doces
        </button>
        <button
          onClick={() => setActiveSubTab('fechamento')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'fechamento'
              ? 'bg-white text-[#8E5CF0] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PieChart className="w-4 h-4 text-[#8E5CF0]" />
          Fechamento Mês
        </button>
        <button
          onClick={() => setActiveSubTab('duvidas')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'duvidas'
              ? 'bg-white text-[#521F6C] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-[#521F6C]" />
          Assistente IA
        </button>
      </div>

      {addedSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{addedSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: 16 BOLOS & DOCES */}
      {activeSubTab === 'catalogo' && (
        <div className="space-y-4">
          {/* Cake Selection */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              1. Selecione o Bolo ou Doce do Relatório
            </label>
            <select
              value={selectedCakeName}
              onChange={(e) => {
                const newName = e.target.value;
                setSelectedCakeName(newName);
                const opts = getCakeOptionsByName(newName);
                if (opts.length > 0) {
                  setSelectedSlices(opts[0].slices);
                }
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {UNIQUE_CAKE_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            {/* Sizes / Slices options */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                2. Tamanho / Medida (cm)
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {availableOptions.map((opt) => (
                  <button
                    key={opt.slices}
                    type="button"
                    onClick={() => setSelectedSlices(opt.slices)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                      selectedSlices === opt.slices
                        ? 'bg-pink-600 text-white shadow-sm ring-2 ring-pink-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {opt.slices} {opt.cakeName.includes('Brigadeiro') || opt.cakeName.includes('Cupcake') ? 'un' : 'cm'}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery Option */}
            <div className="pt-2.5 border-t border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-pink-600" />
                  3. Vai ter entrega?
                </label>
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setHasDelivery(false);
                      setDeliveryMiles('');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      !hasDelivery
                        ? 'bg-slate-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasDelivery(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      hasDelivery
                        ? 'bg-pink-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>

              {hasDelivery && (
                <div className="bg-pink-50/70 p-3 rounded-xl border border-pink-100 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Quantidade de Milhas da Entrega
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={deliveryMiles}
                          onChange={(e) => setDeliveryMiles(e.target.value)}
                          placeholder="Ex: 5"
                          className="w-full pl-3 pr-16 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 font-bold">
                          milhas
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pt-3">
                      <span className="text-[10px] text-slate-500 block font-bold">Taxa ($1.50/mi)</span>
                      <span className="text-sm font-black text-pink-700">
                        {formatCurrency(deliveryFee)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Adicionais Option */}
            <div className="pt-2.5 border-t border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <PackagePlus className="w-4 h-4 text-purple-600" />
                  4. Vai ter adicional?
                </label>
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setHasAddons(false);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      !hasAddons
                        ? 'bg-slate-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAddons(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      hasAddons
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>

              {!hasAddons && (
                <button
                  type="button"
                  onClick={() => handleToggleAddons(true)}
                  className="w-full py-2.5 px-3 bg-purple-50 hover:bg-purple-100/80 text-purple-700 font-bold text-xs rounded-xl border border-dashed border-purple-300 transition-all flex items-center justify-center gap-1.5 shadow-2xs mt-2"
                >
                  <PlusCircle className="w-4 h-4 text-purple-600" />
                  + Adicionar outro item ao mesmo pedido
                </button>
              )}

              {hasAddons && (
                <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-100 space-y-3 animate-fadeIn">
                  {addons.map((addon, index) => {
                    return (
                      <div key={addon.id} className="bg-white p-3 rounded-xl border border-purple-200/80 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-purple-900 flex items-center gap-1">
                            <span>🌸</span> Item Adicional #{index + 1}
                          </span>
                          {addons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAddonItem(addon.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50"
                              title="Remover item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Description field */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Descrição do item / produto
                            </label>
                            <input
                              type="text"
                              value={addon.description}
                              onChange={(e) => handleUpdateAddon(addon.id, 'description', e.target.value)}
                              placeholder="Ex: Flores, Topo de bolo, 50 docinhos..."
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                            />
                          </div>

                          {/* Value field */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Valor do item ($)
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                $
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={addon.value}
                                onChange={(e) => handleUpdateAddon(addon.id, 'value', e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-6 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Cost toggle */}
                        <div className="pt-1 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 font-medium select-none">
                            <input
                              type="checkbox"
                              checked={!!addon.hasCost}
                              onChange={(e) => handleUpdateAddon(addon.id, 'hasCost', e.target.checked)}
                              className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                            />
                            <span>Informar custo deste item?</span>
                          </label>

                          {addon.hasCost && (
                            <div className="flex items-center gap-1.5 animate-fadeIn">
                              <span className="text-slate-500 font-bold">Custo ($):</span>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={addon.costValue || ''}
                                onChange={(e) => handleUpdateAddon(addon.id, 'costValue', e.target.value)}
                                placeholder="0.00"
                                className="w-20 px-2 py-1 bg-amber-50 border border-amber-300 rounded text-xs font-bold text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add another item button */}
                  <button
                    type="button"
                    onClick={handleAddAddonItem}
                    className="w-full py-2.5 px-3 bg-white hover:bg-purple-100/50 text-purple-700 font-bold text-xs rounded-xl border border-dashed border-purple-300 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <PlusCircle className="w-4 h-4 text-purple-600" />
                    + Adicionar outro item ao mesmo pedido
                  </button>

                  {totalAddonsValue > 0 && (
                    <div className="flex items-center justify-between bg-purple-100/80 p-2 rounded-xl border border-purple-200 text-xs text-purple-900 font-bold">
                      <span>Total em Itens Adicionais:</span>
                      <span>{formatCurrency(totalAddonsValue)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="bg-white rounded-2xl border border-pink-100 shadow-md p-4 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                  Ficha do Relatório
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {currentRecipe.cakeName} ({currentRecipe.slices} {currentRecipe.cakeName.includes('Brigadeiro') || currentRecipe.cakeName.includes('Cupcake') ? 'unidades' : 'cm'})
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block font-medium">Preço Total de Venda</span>
                <span className="text-lg font-black text-emerald-600">
                  {formatCurrency(totalSalePrice)}
                </span>
                {(hasDelivery && deliveryFee > 0 || totalAddonsValue > 0) && (
                  <span className="text-[10px] font-bold text-pink-600 block">
                    (Bolo {formatCurrency(currentRecipe.venda)}
                    {hasDelivery && deliveryFee > 0 ? ` + Taxa ${formatCurrency(deliveryFee)}` : ''}
                    {totalAddonsValue > 0 ? ` + Adic. ${formatCurrency(totalAddonsValue)}` : ''})
                  </span>
                )}
              </div>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-100/80">
                <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
                  <span>🔄 Reposição</span>
                  <span>{formatCurrency(currentRecipe.reposicao)}</span>
                </div>
                <p className="text-[10px] text-amber-700/80 mt-0.5">Ingredientes / Insumos</p>
              </div>

              <div className="p-2.5 bg-purple-50/70 rounded-xl border border-purple-100/80">
                <div className="flex items-center justify-between text-purple-800 text-xs font-bold">
                  <span>🛠️ Mão de Obra</span>
                  <span>{formatCurrency(currentRecipe.maodeobra)}</span>
                </div>
                <p className="text-[10px] text-purple-700/80 mt-0.5">Seu Salário</p>
              </div>

              <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-100/80">
                <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
                  <span>📦 Custo Op.</span>
                  <span>{formatCurrency(currentRecipe.custo)}</span>
                </div>
                <p className="text-[10px] text-rose-700/80 mt-0.5">Gás, Luz, Embalagem</p>
              </div>

              <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100/80">
                <div className="flex items-center justify-between text-blue-800 text-xs font-bold">
                  <span>📈 Investimento</span>
                  <span>{formatCurrency(currentRecipe.investimento)}</span>
                </div>
                <p className="text-[10px] text-blue-700/80 mt-0.5">Caixa de Crescimento</p>
              </div>

              {/* Delivery Fee Line */}
              {hasDelivery && deliveryFee > 0 && (
                <div className="col-span-2 p-2.5 bg-pink-50 rounded-xl border border-pink-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🚗</span>
                    <div>
                      <span className="text-xs font-bold text-pink-900 block">
                        Taxa de Entrega ({numericMiles} {numericMiles === 1 ? 'milha' : 'milhas'})
                      </span>
                      <span className="text-[10px] text-pink-700 font-medium">
                        $1.50 por milha (Lucro adicional 100%)
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-pink-700">
                    +{formatCurrency(deliveryFee)}
                  </span>
                </div>
              )}

              {/* Addons Lines */}
              {hasAddons && activeAddons.map((addon, idx) => {
                const aVal = parseFloat(addon.value.replace(',', '.')) || 0;
                if (aVal <= 0 && !addon.description.trim()) return null;
                const aCost = addon.hasCost ? (parseFloat(addon.costValue?.replace(',', '.') || '0') || 0) : 0;
                const aProfit = aVal - aCost;
                const descText = addon.description.trim() || `Adicional #${idx + 1}`;

                return (
                  <div key={addon.id} className="col-span-2 p-2.5 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🌸</span>
                      <div>
                        <span className="text-xs font-bold text-purple-900 block">
                          🌸 Adicional ({descText})
                        </span>
                        <span className="text-[10px] text-purple-700 font-medium">
                          {addon.hasCost && aCost > 0
                            ? `Custo: ${formatCurrency(aCost)} | Lucro Extra: ${formatCurrency(aProfit)}`
                            : `Lucro extra 100%: ${formatCurrency(aVal)}`}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-purple-700">
                      +{formatCurrency(aVal)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Net Profit Callout */}
            {(hasDelivery && deliveryFee > 0 || totalAddonsValue > 0) && (
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center justify-between">
                <span>
                  💰 Lucro Líquido Final (Mão de Obra + Reserva
                  {hasDelivery && deliveryFee > 0 ? ' + Entrega' : ''}
                  {totalAddonsValue > 0 ? ' + Adicionais' : ''}):
                </span>
                <span className="font-extrabold text-emerald-700">
                  {formatCurrency(totalNetProfit)}
                </span>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleLaunchSale}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm rounded-xl shadow-md hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Lançar Venda de {formatCurrency(totalSalePrice)} no Caixa
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: FECHAMENTO DO MÊS */}
      {activeSubTab === 'fechamento' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Digite o Faturamento Bruto do Mês ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                $
              </span>
              <input
                type="number"
                value={monthlyRevenueInput}
                onChange={(e) => setMonthlyRevenueInput(e.target.value)}
                placeholder="Ex: 6000"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Preset quick buttons */}
            <div className="flex gap-2">
              {[3000, 4500, 6000, 8000, 10000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMonthlyRevenueInput(preset.toString())}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  $ {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Breakdown Results */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-500" />
              Divisão Proporcional do Mês ({formatCurrency(numericMonthlyRev)})
            </h3>

            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex items-center justify-between p-2.5 bg-amber-50 text-amber-900 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔄</span>
                  <div>
                    <span className="font-bold block">1. Reposição de Insumos (30%)</span>
                    <span className="text-[10px] text-amber-700">Comprar ingredientes para o próximo mês</span>
                  </div>
                </div>
                <span className="text-sm font-extrabold">{formatCurrency(monthlyBreakdown.reposicao)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-purple-50 text-purple-900 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛠️</span>
                  <div>
                    <span className="font-bold block">2. Sua Mão de Obra / Salário (33,3%)</span>
                    <span className="text-[10px] text-purple-700">Seu dinheiro limpo para contas pessoais</span>
                  </div>
                </div>
                <span className="text-sm font-extrabold">{formatCurrency(monthlyBreakdown.maodeobra)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-rose-50 text-rose-900 rounded-xl border border-rose-100">
                <div className="flex items-center gap-2">
                  <span className="text-base">📦</span>
                  <div>
                    <span className="font-bold block">3. Custos Operacionais (16,7%)</span>
                    <span className="text-[10px] text-rose-700">Gás, energia, água, embalagens</span>
                  </div>
                </div>
                <span className="text-sm font-extrabold">{formatCurrency(monthlyBreakdown.custos)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-blue-50 text-blue-900 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2">
                  <span className="text-base">📈</span>
                  <div>
                    <span className="font-bold block">4. Investimento / Reserva (20%)</span>
                    <span className="text-[10px] text-blue-700">Comprar bicos, formas, cursos e reserva</span>
                  </div>
                </div>
                <span className="text-sm font-extrabold">{formatCurrency(monthlyBreakdown.investimento)}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-700 space-y-1.5 border border-slate-200/60 mt-2">
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-pink-600" /> Resumo do Fechamento:
              </span>
              <p className="leading-relaxed text-[11px] text-slate-600">
                No fim do mês, de <strong>{formatCurrency(numericMonthlyRev)}</strong> faturados: você transfere <strong>{formatCurrency(monthlyBreakdown.maodeobra)}</strong> para sua conta pessoal como seu salário real, guarda <strong>{formatCurrency(monthlyBreakdown.reposicao)}</strong> na conta do estoque e <strong>{formatCurrency(monthlyBreakdown.investimento)}</strong> para melhorias da sua confeitaria!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ASSISTENTE IA & PERGUNTAS */}
      {activeSubTab === 'duvidas' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Perguntas Rápidas ao Assistente de Precificação
            </h3>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleQuickQuestion('Como funciona o Bolo Franciele de 20 cm?')}
                className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl text-left text-xs font-bold transition flex items-center justify-between"
              >
                <span>🎂 Bolo Franciele 20 cm (Divisão de custos)</span>
                <ArrowRight className="w-4 h-4 text-purple-600 shrink-0" />
              </button>

              <button
                onClick={() => handleQuickQuestion('Faturei $ 6,000 no mês. Como fica meu fechamento?')}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-900 rounded-xl text-left text-xs font-bold transition flex items-center justify-between"
              >
                <span>📊 Fechamento Mensal de $ 6,000.00</span>
                <ArrowRight className="w-4 h-4 text-rose-600 shrink-0" />
              </button>

              <button
                onClick={() => handleQuickQuestion('Vendi $ 4,500 no mês. Quanto posso tirar de salário?')}
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-left text-xs font-bold transition flex items-center justify-between"
              >
                <span>💰 Vendi $ 4,500. Quanto posso tirar de salário?</span>
                <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
              </button>
            </div>

            {/* Custom Input */}
            <div className="pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="Ex: Bolo Karina 25 cm ou Vendi $ 8,000..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => handleQuickQuestion(customQuestion)}
                  className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-purple-700 transition"
                >
                  Calcular
                </button>
              </div>
            </div>
          </div>

          {/* Answer Box */}
          {assistantAnswer && (
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-4 rounded-2xl shadow-md space-y-2 animate-fadeIn">
              <div className="flex items-center gap-1.5 text-purple-200 text-xs font-bold uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-amber-300" />
                Resposta do Assistente
              </div>
              <div className="text-xs leading-relaxed whitespace-pre-line text-purple-100">
                {assistantAnswer}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
