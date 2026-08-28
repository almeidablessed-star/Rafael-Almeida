import { Transaction } from '../types';
import { formatDateBr } from './formatters';

// Calculate proportional breakdown for any custom gross value based on catalog averages or a specific recipe
export const calculateProportionalBreakdown = (grossTotal: number, selectedRecipe?: any) => {
  if (grossTotal <= 0) {
    return {
      faturamentoBruto: 0,
      reposicao: 0,
      maodeobra: 0,
      custos: 0,
      investimento: 0,
      lucroLiquido: 0,
      reposicaoPct: 30,
      maodeobraPct: 33.3,
      custosPct: 16.7,
      investimentoPct: 20,
    };
  }

  // If a specific recipe is selected, use its exact cost ratios
  if (selectedRecipe && selectedRecipe.venda > 0) {
    const ratio = grossTotal / selectedRecipe.venda;
    const reposicao = selectedRecipe.reposicao * ratio;
    const maodeobra = selectedRecipe.maodeobra * ratio;
    const custos = selectedRecipe.custo * ratio;
    const investimento = selectedRecipe.investimento * ratio;
    const totalDespesas = reposicao + maodeobra + custos + investimento;
    const lucroLiquido = Math.max(0, grossTotal - totalDespesas);

    return {
      faturamentoBruto: grossTotal,
      reposicao,
      maodeobra,
      custos,
      investimento,
      lucroLiquido,
      reposicaoPct: (reposicao / grossTotal) * 100,
      maodeobraPct: (maodeobra / grossTotal) * 100,
      custosPct: (custos / grossTotal) * 100,
      investimentoPct: (investimento / grossTotal) * 100,
    };
  }

  // Default general bakery catalog proportions (Average: 30% Insumos, 33.3% Mão de obra, 16.7% Custos, 20% Investimento)
  const reposicao = grossTotal * 0.30;
  const maodeobra = grossTotal * 0.3333;
  const custos = grossTotal * 0.1667;
  const investimento = grossTotal * 0.20;
  const totalDespesas = reposicao + maodeobra + custos + investimento;
  const lucroLiquido = Math.max(0, grossTotal - totalDespesas);

  return {
    faturamentoBruto: grossTotal,
    reposicao,
    maodeobra,
    custos,
    investimento,
    lucroLiquido,
    reposicaoPct: (reposicao / grossTotal) * 100,
    maodeobraPct: (maodeobra / grossTotal) * 100,
    custosPct: (custos / grossTotal) * 100,
    investimentoPct: (investimento / grossTotal) * 100,
  };
};

export interface WeeklySaleDetail {
  transaction: Transaction;
  isPaid: boolean;
  totalValue: number;
  maoDeObra: number;
  adicionais: number;
  delivery: number;
  pagamentoPessoal: number;
  reposicao: number;
  custos: number;
  investimento: number;
  custosEInvestimento: number;
  caixaConfeitaria: number;
}

export interface WeeklySummary {
  startIso: string;
  endIso: string;
  formattedRange: string;
  isCurrentWeek: boolean;
  
  // 💰 Pagamento da Semana (pessoal)
  pagamentoPessoalTotal: number;
  maoDeObraTotal: number;
  adicionaisTotal: number;
  deliveryTotal: number;
  
  // 🏪 Caixa da Confeitaria (restante)
  caixaConfeitariaTotal: number;
  reposicaoTotal: number;
  custosEInvestimentoTotal: number;
  
  // 📊 Faturamento Total da Semana
  faturamentoTotalPago: number;
  
  // Pedidos e Pendentes
  pendingTotalValue: number;
  pendingCount: number;
  paidCount: number;
  
  // Listas detalhadas
  paidSalesDetails: WeeklySaleDetail[];
  pendingSalesDetails: WeeklySaleDetail[];
  allSalesDetails: WeeklySaleDetail[];
}

/**
 * Returns Monday and Sunday ISO dates for a given reference Date.
 * Week starts on Monday and ends on Sunday.
 */
export function getWeekRange(refDate: Date = new Date()): {
  startIso: string;
  endIso: string;
  startDate: Date;
  endDate: Date;
  formattedRange: string;
} {
  const d = new Date(refDate);
  d.setHours(0, 0, 0, 0);

  const day = d.getDay(); // 0 = Sunday, 1 = Monday... 6 = Saturday
  const isoDay = day === 0 ? 7 : day; // Convert Sunday to 7

  const monday = new Date(d);
  monday.setDate(d.getDate() - (isoDay - 1));

  const sunday = new Date(d);
  sunday.setDate(d.getDate() + (7 - isoDay));

  const startIso = monday.toISOString().split('T')[0];
  const endIso = sunday.toISOString().split('T')[0];

  const formattedRange = `Semana de ${formatDateBr(startIso).slice(0, 5)} a ${formatDateBr(endIso).slice(0, 5)}`;

  return {
    startIso,
    endIso,
    startDate: monday,
    endDate: sunday,
    formattedRange,
  };
}

/**
 * Parses individual breakdown components for a single sale transaction.
 */
export function parseSaleDetail(sale: Transaction): WeeklySaleDetail {
  const isPaid = sale.paymentStatus !== 'pendente';
  const val = Number(sale.totalValue) || 0;
  const notes = sale.notes || '';

  const extractNum = (pattern: RegExp): number | null => {
    const match = notes.match(pattern);
    if (!match || !match[1]) return null;
    let s = match[1].trim().replace(/[^\d.,]/g, '');
    if (s.includes(',') && s.includes('.')) {
      s = s.replace(/,/g, '');
    } else if (s.includes(',')) {
      s = s.replace(/,/g, '.');
    }
    const parsed = parseFloat(s);
    return isNaN(parsed) ? null : parsed;
  };

  // 1. Delivery fee
  let delivery = 0;
  const deliveryFeeParsed = extractNum(/(?:Taxa de Entrega|Entrega)[:\s]+[R\$]*\s*([0-9.,]+)/i);
  if (deliveryFeeParsed !== null && deliveryFeeParsed > 0) {
    delivery = deliveryFeeParsed;
  }

  // 2. Adicionais
  let adicionais = 0;
  const addonsMatch = notes.match(/Adicionais?:\s*([^,\n]+(?:,[^,\n]+)*)/i);
  if (addonsMatch && addonsMatch[1]) {
    const items = addonsMatch[1].split(',');
    for (const item of items) {
      const valMatch = item.match(/([0-9]+(?:[.,][0-9]{1,2})?)/);
      if (valMatch) {
        const parsed = parseFloat(valMatch[1].replace(',', '.'));
        if (!isNaN(parsed)) adicionais += parsed;
      }
    }
  }

  const baseValue = Math.max(0, val - delivery - adicionais);

  let reposicao = 0;
  let maoDeObra = 0;
  let custos = 0;
  let investimento = 0;

  const repFromNotes = extractNum(/Reposição[:\s]+[R\$]*\s*([0-9.,]+)/i);
  const mdoFromNotes = extractNum(/Mão de Obra[:\s]+[R\$]*\s*([0-9.,]+)/i);
  const cusFromNotes = extractNum(/Custos?[:\s]+[R\$]*\s*([0-9.,]+)/i);
  const invFromNotes = extractNum(/Investimento[:\s]+[R\$]*\s*([0-9.,]+)/i);

  if (
    repFromNotes !== null &&
    mdoFromNotes !== null &&
    cusFromNotes !== null &&
    invFromNotes !== null
  ) {
    reposicao = repFromNotes;
    maoDeObra = mdoFromNotes;
    custos = cusFromNotes;
    investimento = invFromNotes;
  } else {
    const prop = calculateProportionalBreakdown(baseValue > 0 ? baseValue : val);
    reposicao = prop.reposicao;
    maoDeObra = prop.maodeobra;
    custos = prop.custos;
    investimento = prop.investimento;
  }

  const pagamentoPessoal = maoDeObra + adicionais + delivery;
  const custosEInvestimento = custos + investimento;
  const caixaConfeitaria = reposicao + custosEInvestimento;

  return {
    transaction: sale,
    isPaid,
    totalValue: val,
    maoDeObra,
    adicionais,
    delivery,
    pagamentoPessoal,
    reposicao,
    custos,
    investimento,
    custosEInvestimento,
    caixaConfeitaria,
  };
}

/**
 * Calculates weekly closing totals for transactions within the specified date range.
 */
export function calculateWeeklyClosing(
  transactions: Transaction[],
  refDate: Date = new Date()
): WeeklySummary {
  const { startIso, endIso, formattedRange } = getWeekRange(refDate);

  const currentWeekRange = getWeekRange(new Date());
  const isCurrentWeek = startIso === currentWeekRange.startIso;

  const weeklySales = transactions.filter(
    (tx) => tx.type === 'venda' && tx.date >= startIso && tx.date <= endIso
  );

  let pagamentoPessoalTotal = 0;
  let maoDeObraTotal = 0;
  let adicionaisTotal = 0;
  let deliveryTotal = 0;

  let caixaConfeitariaTotal = 0;
  let reposicaoTotal = 0;
  let custosEInvestimentoTotal = 0;

  let faturamentoTotalPago = 0;

  let pendingTotalValue = 0;
  let pendingCount = 0;
  let paidCount = 0;

  const paidSalesDetails: WeeklySaleDetail[] = [];
  const pendingSalesDetails: WeeklySaleDetail[] = [];
  const allSalesDetails: WeeklySaleDetail[] = [];

  for (const sale of weeklySales) {
    const detail = parseSaleDetail(sale);
    allSalesDetails.push(detail);

    if (detail.isPaid) {
      paidCount += 1;
      paidSalesDetails.push(detail);

      maoDeObraTotal += detail.maoDeObra;
      adicionaisTotal += detail.adicionais;
      deliveryTotal += detail.delivery;
      pagamentoPessoalTotal += detail.pagamentoPessoal;

      reposicaoTotal += detail.reposicao;
      custosEInvestimentoTotal += detail.custosEInvestimento;
      caixaConfeitariaTotal += detail.caixaConfeitaria;

      faturamentoTotalPago += detail.totalValue;
    } else {
      pendingCount += 1;
      pendingSalesDetails.push(detail);
      pendingTotalValue += detail.totalValue;
    }
  }

  return {
    startIso,
    endIso,
    formattedRange,
    isCurrentWeek,
    pagamentoPessoalTotal,
    maoDeObraTotal,
    adicionaisTotal,
    deliveryTotal,
    caixaConfeitariaTotal,
    reposicaoTotal,
    custosEInvestimentoTotal,
    faturamentoTotalPago,
    pendingTotalValue,
    pendingCount,
    paidCount,
    paidSalesDetails,
    pendingSalesDetails,
    allSalesDetails,
  };
}
