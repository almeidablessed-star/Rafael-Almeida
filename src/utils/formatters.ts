import { TransactionType, LaborPeriod, CostCategory } from '../types';

const LOCALE_POR_MOEDA: Record<'BRL' | 'USD' | 'EUR', string> = {
  BRL: 'pt-BR',
  USD: 'en-US',
  EUR: 'pt-PT',
};

const SIMBOLO_FALLBACK_POR_MOEDA: Record<'BRL' | 'USD' | 'EUR', string> = {
  BRL: 'R$ 0,00',
  USD: '$ 0.00',
  EUR: '€ 0,00',
};

export const formatCurrency = (value: number, currency: 'BRL' | 'USD' | 'EUR' = 'BRL'): string => {
  if (isNaN(value)) return SIMBOLO_FALLBACK_POR_MOEDA[currency];

  return new Intl.NumberFormat(LOCALE_POR_MOEDA[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Corrige exibicao de imprecisao de ponto flutuante (ex: "-0.8999999999999999")
// sem alterar o valor real armazenado — arredonda so para mostrar na tela,
// mantendo casas decimais apenas quando o valor nao e um numero inteiro.
export const formatQuantity = (value: number): string => {
  if (isNaN(value)) return '0';
  const rounded = Math.round(value * 100) / 100;
  return rounded.toLocaleString('pt-BR', {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

export const parseCurrencyInput = (input: string): number => {
  // Removes $, spaces, commas, replaces comma with dot
  const clean = input.replace(/[^\d,.-]/g, '').replace(/,/g, '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

/**
 * Le um numero do jeito que uma pessoa no Brasil digita num campo de valor.
 *
 * O campo usa `type="text"` e nao `type="number"`: com `type="number"` o
 * browser considera "3.000" invalido e devolve string vazia em
 * `e.target.value`, entao `Number(e.target.value)` virava 0 sem nenhum aviso —
 * a pessoa digitava tres mil e o app salvava zero.
 *
 * A virgula e SEMPRE decimal, como manda a convencao pt-BR: "3000,50" sao tres
 * mil e cinquenta centavos. O ponto e ambiguo — pode ser milhar pt-BR
 * ("3.000" = tres mil) ou decimal en-US ("3.5" = tres e meio) — e a regra de
 * desempate e o tamanho do grupo: um unico ponto seguido de exatamente 3
 * digitos e milhar; qualquer outro tamanho e decimal. Mais de um ponto sao
 * todos milhar ("3.000.000").
 *
 * Quando os dois separadores aparecem, o ultimo manda: "3.000,50" -> 3000.5.
 * Entrada vazia ou sem nenhum digito devolve 0.
 */
export const parseNumeroDigitado = (input: string): number => {
  const limpo = String(input ?? '').replace(/[^\d.,-]/g, '');
  const negativo = limpo.startsWith('-');
  const corpo = limpo.replace(/-/g, '');
  if (!/\d/.test(corpo)) return 0;

  const ultimaVirgula = corpo.lastIndexOf(',');
  const ultimoPonto = corpo.lastIndexOf('.');

  let posDecimal = -1;
  if (ultimaVirgula > ultimoPonto) {
    posDecimal = ultimaVirgula;
  } else if (ultimoPonto > ultimaVirgula) {
    const digitosDepois = corpo.length - ultimoPonto - 1;
    const temOutroPonto = corpo.indexOf('.') !== ultimoPonto;
    posDecimal = temOutroPonto || digitosDepois === 3 ? -1 : ultimoPonto;
  }

  const parteInteira = (posDecimal >= 0 ? corpo.slice(0, posDecimal) : corpo).replace(/[.,]/g, '');
  const parteDecimal = posDecimal >= 0 ? corpo.slice(posDecimal + 1).replace(/[.,]/g, '') : '';

  const n = parseFloat(`${parteInteira || '0'}.${parteDecimal || '0'}`);
  if (!Number.isFinite(n)) return 0;
  return negativo ? -n : n;
};

/**
 * Inverso de `parseNumeroDigitado`, para preencher o campo com um valor que
 * veio do banco: virgula decimal e NENHUM separador de milhar, para que o
 * texto exibido seja exatamente o que o parser le de volta sem ambiguidade.
 */
export const formatNumeroParaEdicao = (value: number): string => {
  if (!Number.isFinite(value) || value === 0) return '';
  return String(value).replace('.', ',');
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
