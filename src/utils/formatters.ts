import { PaymentMethod, TransactionType, LaborPeriod, CostCategory } from '../types';

export const formatCurrency = (value: number, currency: 'BRL' | 'USD' = 'BRL'): string => {
  if (isNaN(value)) return currency === 'BRL' ? 'R$ 0,00' : '$ 0.00';

  if (currency === 'BRL') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
};

export const parseCurrencyInput = (input: string): number => {
  // Removes $, spaces, commas, replaces comma with dot
  const clean = input.replace(/[^\d,.-]/g, '').replace(/,/g, '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

export const getTodayIso = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateBr = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
};

export const formatDayMonthOnly = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [, month, day] = parts;
    return `${day}/${month}`;
  }
  return dateStr;
};

export const formatDateShort = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
};

export const getPaymentMethodLabel = (method?: PaymentMethod): string => {
  switch (method) {
    case 'pix': return 'Pix ⚡';
    case 'dinheiro': return 'Dinheiro 💵';
    case 'cartao_credito': return 'Cartão Crédito 💳';
    case 'cartao_debito': return 'Cartão Débito 💳';
    case 'transferencia': return 'Transferência 🏦';
    case 'outro': return 'Outro 📝';
    default: return 'Não especificado';
  }
};

export const getLaborPeriodLabel = (period?: LaborPeriod): string => {
  switch (period) {
    case 'diaria': return 'Diária';
    case 'semanal': return 'Semanal';
    case 'mensal': return 'Mensal';
    case 'encomenda': return 'Por Encomenda';
    default: return 'Período';
  }
};

export const getCostCategoryLabel = (category?: CostCategory): string => {
  switch (category) {
    case 'fixo': return 'Custo Fixo 🏢';
    case 'variavel': return 'Custo Variável ⚡';
    case 'investimento': return 'Investimento 🚀';
    default: return 'Geral';
  }
};

export const getTransactionTypeDetails = (type: TransactionType) => {
  switch (type) {
    case 'venda':
      return {
        label: 'Venda',
        plural: 'Vendas',
        color: 'text-rose-700 bg-rose-50 border-rose-200',
        badgeBg: 'bg-gradient-to-r from-rose-300 to-pink-300 text-rose-900',
        icon: 'TrendingUp',
        isPositive: true,
      };
    case 'reposicao':
      return {
        label: 'Reposição',
        plural: 'Reposição / Estoque',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        badgeBg: 'bg-amber-100 text-amber-800',
        icon: 'ShoppingCart',
        isPositive: false,
      };
    case 'maodeobra':
      return {
        label: 'Mão de Obra',
        plural: 'Mão de Obra',
        color: 'text-purple-700 bg-purple-50 border-purple-200',
        badgeBg: 'bg-purple-100 text-purple-800',
        icon: 'UserCheck',
        isPositive: false,
      };
    case 'custo':
      return {
        label: 'Custo',
        plural: 'Custos Operacionais',
        color: 'text-rose-700 bg-rose-50 border-rose-200',
        badgeBg: 'bg-rose-100 text-rose-800',
        icon: 'Receipt',
        isPositive: false,
      };
    case 'investimento':
      return {
        label: 'Investimento',
        plural: 'Investimentos',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        badgeBg: 'bg-blue-100 text-blue-800',
        icon: 'Sparkles',
        isPositive: false,
      };
  }
};
