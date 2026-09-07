import { Transaction, TimePeriod, SummaryTotals, FichaTecnica, AdministrativeCosts, DespesaEmpresa } from '../types';
import { getTodayIso, formatDateBr } from './formatters';
import { getCurrentWeekMonday, getCurrentWeekSunday, filterTransactionsByWeek } from './weeklyArchiveUtils';

/**
 * Motor unico de calculo financeiro do Carula.
 *
 * Reune o que antes vivia espalhado em cinco arquivos (`storage.ts`,
 * `weeklyCalculator.ts`, `salesCalculator.ts`, `balancesCalculator.ts`,
 * `custosFixos.ts`). Cada funcao aqui preserva exatamente o comportamento que
 * tinha no arquivo de origem — esta consolidacao so muda ONDE o codigo mora,
 * nao o que ele calcula. `parseSaleDetail` continua sendo a fonte unica da
 * composicao de uma venda; as demais funcoes agregam por cima dela com
 * recortes diferentes (periodo arbitrario vs. semana corrente, com ou sem
 * lancamentos avulsos de custo/investimento) — por isso continuam distintas
 * em vez de fundidas numa so.
 */

// ============================================================================
// Fatia media de custo por tamanho de ficha (ex-weeklyCalculator.ts)
// ============================================================================

/** Fatia media de cada custo dentro do preco de venda, em fracao de 0 a 1. */
export interface ProporcoesMedias {
  reposicao: number;
  maoDeObra: number;
  custos: number;
  investimento: number;
  /** Quantos tamanhos entraram na media. Zero = nao foi possivel derivar. */
  baseadoEm: number;
}

/**
 * Descobre a composicao media de custo a partir das fichas ja cadastradas.
 *
 * Existe para substituir os percentuais fixos que estavam escritos no codigo
 * (30% insumo / 33,33% mao de obra / 16,67% custo / 20% investimento). Aqueles
 * numeros somavam exatamente 100%, entao toda venda que caisse neles aparecia
 * com LUCRO ZERO — nao por calculo, por construcao.
 *
 * A media e por TAMANHO, nao por ficha: o mesmo bolo em 10 e em 30 fatias tem
 * proporcoes bem diferentes (o custo fixo dilui conforme o preco sobe), e cada
 * tamanho e uma venda possivel. Tamanho sem preco fica de fora — dividir por
 * zero nao produz proporcao, produz Infinity.
 *
 * Retorna `null` quando nao ha nada de onde derivar. Quem chama precisa tratar:
 * inventar um numero aqui seria repetir o defeito que esta funcao corrige.
 */
export const derivarProporcoes = (fichas: FichaTecnica[]): ProporcoesMedias | null => {
  const amostras: { rep: number; mdo: number; cus: number; inv: number }[] = [];

  (fichas || []).forEach((ficha) => {
    (ficha.tamanhos || []).forEach((t) => {
      const venda = Number(t.preco) || 0;
      if (venda <= 0) return;

      // Reposicao so existe no nivel da ficha; os demais aceitam valor
      // especifico do tamanho, com o da ficha como padrao.
      const rep = Number(ficha.reposicaoCost) || 0;
      const mdo = Number(t.maoDeObraCost ?? ficha.maoDeObraCost) || 0;
      const cus = Number(t.custoCost ?? ficha.custoCost) || 0;
      const inv = Number(t.investimentoCost ?? ficha.investimentoCost) || 0;

      amostras.push({ rep: rep / venda, mdo: mdo / venda, cus: cus / venda, inv: inv / venda });
    });
  });

  if (amostras.length === 0) return null;

  const media = (campo: 'rep' | 'mdo' | 'cus' | 'inv') =>
    amostras.reduce((soma, a) => soma + a[campo], 0) / amostras.length;

  return {
    reposicao: media('rep'),
    maoDeObra: media('mdo'),
    custos: media('cus'),
    investimento: media('inv'),
    baseadoEm: amostras.length,
  };
};

/**
 * Estima a composicao de custo de um valor de venda avulso.
 *
 * Usado quando nao ha ficha por tras do item — "Outro / Personalizado", em que
 * a confeiteira digita o preco e o sistema nao sabe o que aquilo consome.
 *
 * `proporcoes` vem de `derivarProporcoes(fichas)`: a media real do catalogo
 * dela. Ver a nota no ramo final sobre por que nao ha mais numero fixo aqui.
 */
export const calculateProportionalBreakdown = (
  grossTotal: number,
  selectedRecipe?: any,
  proporcoes?: ProporcoesMedias | null
) => {
  if (grossTotal <= 0) {
    return {
      faturamentoBruto: 0,
      reposicao: 0,
      maodeobra: 0,
      custos: 0,
      investimento: 0,
      lucroLiquido: 0,
      // Zerados: sem faturamento nao ha proporcao a exibir. Antes vinham
      // preenchidos com os percentuais fixos, o que fazia a tela mostrar
      // "30% reposicao" num pedido vazio.
      reposicaoPct: 0,
      maodeobraPct: 0,
      custosPct: 0,
      investimentoPct: 0,
      derivado: !!proporcoes,
      baseadoEm: proporcoes?.baseadoEm ?? 0,
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
      // Veio de uma receita concreta, nao de media: e o caso mais confiavel.
      derivado: true,
      baseadoEm: 1,
    };
  }

  // Proporcoes MEDIAS DAS FICHAS DA PROPRIA CONFEITEIRA.
  //
  // Aqui existiam quatro numeros fixos no codigo — 30% / 33,33% / 16,67% / 20%
  // — que somavam exatamente 100%. Toda venda que caisse neste ramo aparecia
  // com lucro zero, sempre, por construcao e nao por calculo.
  //
  // Sem proporcoes derivadas nao ha o que estimar, e chutar seria repetir o
  // defeito. Devolvemos custo zero com `derivado: false` para a tela poder
  // dizer que nao foi possivel estimar, em vez de exibir um numero inventado.
  const p = proporcoes;
  const reposicao = grossTotal * (p?.reposicao ?? 0);
  const maodeobra = grossTotal * (p?.maoDeObra ?? 0);
  const custos = grossTotal * (p?.custos ?? 0);
  const investimento = grossTotal * (p?.investimento ?? 0);
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
    derivado: !!p,
    baseadoEm: p?.baseadoEm ?? 0,
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

  // Pagamento da Semana (pessoal)
  pagamentoPessoalTotal: number;
  maoDeObraTotal: number;
  adicionaisTotal: number;
  deliveryTotal: number;

  // Caixa da Confeitaria (restante)
  caixaConfeitariaTotal: number;
  reposicaoTotal: number;
  custosEInvestimentoTotal: number;

  // Faturamento Total da Semana
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

  // CAMINHO PRINCIPAL: a composicao gravada junto da venda.
  //
  // Tudo abaixo disto e reconstrucao para pedidos ANTIGOS, lancados antes de
  // existir o campo `breakdown`. Pedido novo nunca chega la.
  if (sale.breakdown) {
    const b = sale.breakdown;
    const pagamentoPessoal = b.maoDeObra + b.adicionais + b.delivery;
    const custosEInvestimento = b.custos + b.investimento;
    return {
      transaction: sale,
      isPaid,
      totalValue: val,
      maoDeObra: b.maoDeObra,
      adicionais: b.adicionais,
      delivery: b.delivery,
      pagamentoPessoal,
      reposicao: b.reposicao,
      custos: b.custos,
      investimento: b.investimento,
      custosEInvestimento,
      caixaConfeitaria: Math.max(0, val - pagamentoPessoal - b.reposicao),
    };
  }

  const extractNum = (pattern: RegExp): number | null => {
    const match = notes.match(pattern);
    if (!match || !match[1]) return null;

    // O `.` final da frase entra na captura ("Investimento R$ 100,00." vira
    // "100,00."). Sem retirar, ele e lido como separador decimal e o ultimo
    // campo do texto — sempre o Investimento — saia 100x maior.
    const s = match[1].trim().replace(/[^\d.,]/g, '').replace(/[.,]+$/, '');

    // O texto foi escrito em pt-BR ("R$ 1.234,56"): ponto e milhar, virgula e
    // decimal. A versao antiga assumia en-US e, quando havia os dois
    // separadores, apagava a virgula — "1.234,56" virava "1.234.56" e o
    // parseFloat devolvia 1.234. Uma mao de obra de R$ 1.200 entrava como
    // R$ 1,20. Abaixo de mil o bug nao aparecia, o que o manteve escondido.
    const temVirgula = s.includes(',');
    const temPonto = s.includes('.');

    let normalizado: string;
    if (temVirgula && temPonto) {
      // O ultimo separador que aparece e o decimal.
      normalizado =
        s.lastIndexOf(',') > s.lastIndexOf('.')
          ? s.replace(/\./g, '').replace(',', '.') // pt-BR
          : s.replace(/,/g, ''); // en-US
    } else if (temVirgula) {
      normalizado = s.replace(',', '.');
    } else {
      normalizado = s;
    }

    const parsed = parseFloat(normalizado);
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

// ============================================================================
// Resumo por periodo arbitrario (ex-storage.ts)
// ============================================================================

/**
 * Calculo puro sobre transacoes: filtro por periodo e resumo financeiro.
 *
 * Este arquivo ja foi o dono das transacoes, gravando-as no `localStorage` e,
 * antes disso, movimentando tambem um estoque paralelo por meio do
 * `stockManager`. As duas responsabilidades sairam:
 *
 *   - O estoque virou [[EstoqueContext]], que fala com a tabela `estoque`.
 *   - As transacoes viraram [[TransacoesContext]], que fala com `transacoes`.
 *
 * Sobrou o que sempre foi funcao pura e nao precisa de banco nem de usuaria
 * logada — o que torna estas duas testaveis isoladamente.
 */

// Filter transactions by period
export const filterTransactionsByPeriod = (
  transactions: Transaction[],
  period: TimePeriod,
  customStartDate?: string,
  customEndDate?: string
): Transaction[] => {
  const todayIso = getTodayIso();
  const todayDate = new Date(todayIso + 'T00:00:00');

  return transactions.filter((tx) => {
    if (!tx.date) return false;
    const txDate = new Date(tx.date + 'T00:00:00');

    if (period === 'tudo') return true;

    if (period === 'hoje') {
      return tx.date === todayIso;
    }

    if (period === 'semana') {
      // Calculate start of current week (Monday)
      const dayOfWeek = todayDate.getDay() || 7; // Sunday is 7 in 1-based Monday week
      const monday = new Date(todayDate);
      monday.setDate(todayDate.getDate() - (dayOfWeek - 1));

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return txDate >= monday && txDate <= sunday;
    }

    if (period === 'mes') {
      return (
        txDate.getFullYear() === todayDate.getFullYear() &&
        txDate.getMonth() === todayDate.getMonth()
      );
    }

    if (period === 'ano') {
      return txDate.getFullYear() === todayDate.getFullYear();
    }

    if (period === 'personalizado' && customStartDate && customEndDate) {
      const start = new Date(customStartDate + 'T00:00:00');
      const end = new Date(customEndDate + 'T23:59:59');
      return txDate >= start && txDate <= end;
    }

    return true;
  });
};

// Calculate financial metrics summary
export const calculateSummary = (filteredTxs: Transaction[]): SummaryTotals => {
  let totalVendas = 0;
  let totalAReceber = 0;
  let totalReposicao = 0;
  let totalMaoDeObra = 0;
  let totalCustos = 0;
  let totalInvestimento = 0;

  filteredTxs.forEach((tx) => {
    const val = Number(tx.totalValue) || 0;
    switch (tx.type) {
      case 'venda':
        if (tx.paymentStatus === 'pendente') {
          totalAReceber += val;
        } else {
          // Se há signalValue, é o sinal que foi pago. O resto fica a receber.
          const paidAmount = tx.signalValue ? Number(tx.signalValue) : val;
          const pendingAmount = val - paidAmount;
          totalVendas += paidAmount;
          totalAReceber += pendingAmount;
          const detail = parseSaleDetail(tx);
          totalReposicao += detail.reposicao;
          totalMaoDeObra += detail.maoDeObra;
          totalCustos += detail.custos;
          totalInvestimento += detail.investimento;
        }
        break;
      case 'reposicao':
        totalReposicao += val;
        break;
      case 'maodeobra':
        totalMaoDeObra += val;
        break;
      case 'custo':
        totalCustos += val;
        break;
      case 'investimento':
        totalInvestimento += val;
        break;
    }
  });

  const totalSaidas = totalReposicao + totalMaoDeObra + totalCustos + totalInvestimento;
  const lucroLiquido = totalVendas - totalReposicao - totalMaoDeObra - totalCustos - totalInvestimento;

  return {
    totalVendas,
    totalAReceber,
    totalReposicao,
    totalMaoDeObra,
    totalCustos,
    totalInvestimento,
    totalSaidas,
    lucroLiquido,
    isPositive: lucroLiquido >= 0,
    totalTransactionsCount: filteredTxs.length,
  };
};

// ============================================================================
// Breakdown de vendas por lista arbitraria (ex-salesCalculator.ts)
// ============================================================================

export interface SalesBreakdownTotals {
  totalVendas: number;
  totalAReceber: number;
  totalReposicao: number;
  totalMaoDeObra: number;
  totalCustos: number;
  totalInvestimento: number;
  totalCustosEInvestimento: number;
  totalLucroLiquido: number;
  totalPaidCount: number;
  totalPendingCount: number;
}

/**
 * Calculates the category breakdown across paid sales transactions for a period.
 * Pending sales are summed separately in totalAReceber.
 */
export function calculateSalesBreakdown(sales: Transaction[], fichas: FichaTecnica[] = []): SalesBreakdownTotals {
  let totalVendas = 0;
  let totalAReceber = 0;
  let totalReposicao = 0;
  let totalMaoDeObra = 0;
  let totalCustos = 0;
  let totalInvestimento = 0;
  let totalPaidCount = 0;
  let totalPendingCount = 0;

  for (const sale of sales) {
    if (sale.type !== 'venda') continue;
    const val = Number(sale.totalValue) || 0;
    if (val <= 0) continue;

    if (sale.paymentStatus === 'pendente') {
      totalAReceber += val;
      totalPendingCount += 1;
      continue;
    }

    totalPaidCount += 1;
    totalVendas += val;

    // Fonte unica: a composicao gravada na venda, com fallback interno para
    // pedidos antigos. O recalculo pelos custos ATUAIS da ficha que existia
    // aqui reescrevia o resultado de vendas passadas toda vez que um insumo
    // mudava de preco — uma venda de marco virava outra venda em agosto.
    const detail = parseSaleDetail(sale);
    totalReposicao += detail.reposicao;
    totalMaoDeObra += detail.maoDeObra;
    totalCustos += detail.custos;
    totalInvestimento += detail.investimento;
  }

  const totalCustosEInvestimento = totalCustos + totalInvestimento;
  const totalLucroLiquido = totalVendas - totalReposicao - totalCustosEInvestimento;

  return {
    totalVendas,
    totalAReceber,
    totalReposicao,
    totalMaoDeObra,
    totalCustos,
    totalInvestimento,
    totalCustosEInvestimento,
    totalLucroLiquido,
    totalPaidCount,
    totalPendingCount,
  };
}

// ============================================================================
// Saldos por categoria, semana corrente (ex-balancesCalculator.ts)
// ============================================================================

export interface CategoryBalance {
  accumulatedInflow: number; // Sum from paid sales
  totalSpent: number;        // Sum from expenses registered in this category
  currentBalance: number;    // Inflow - Spent
  isNegative: boolean;
}

export interface SystemBalances {
  reposicao: CategoryBalance;
  maodeobra: CategoryBalance;
  investimento: CategoryBalance;
  custoEInvestimento: CategoryBalance & {
    custoHalf: number;
    investimentoHalf: number;
  };
  paidSalesCount: number;
  totalExpensesCount: number;
  totalPaidSales: number;
  totalAReceber: number;
  totalExpensesAmount: number;
}

/**
 * Calculates accumulated balances for Reposição, Mão de Obra, and Custo + Investimento in real-time.
 * Inflow comes automatically from all sales marked as "Pago".
 * Deductions come from expenses logged under 'reposicao', 'maodeobra', 'custo', 'investimento'.
 */
// calculateBalances foi removida: nenhuma tela a chamava, e ela retornava um
// `totalAReceber` que nunca era declarado no escopo — teria estourado em
// runtime se alguem a usasse. A versao viva e calculateWeeklyBalances, logo
// abaixo.

/**
 * Calculate balances for the current week only (Monday to Sunday)
 */
export function calculateWeeklyBalances(transactions: Transaction[], fichas: FichaTecnica[] = []): SystemBalances {
  const startDate = getCurrentWeekMonday();
  const endDate = getCurrentWeekSunday();
  const weeklyTransactions = filterTransactionsByWeek(transactions, startDate, endDate);

  // Inline balances calculation for current week
  let reposicaoInflow = 0;
  let maodeobraInflow = 0;
  let custoInflow = 0;
  let investimentoInflow = 0;
  let paidSalesCount = 0;
  let totalPaidSalesAmount = 0;
  let totalAReceber = 0;

  let reposicaoSpent = 0;
  let maodeobraSpent = 0;
  let custoSpent = 0;
  let investimentoSpent = 0;
  let totalExpensesCount = 0;
  let totalExpensesAmount = 0;

  for (const tx of weeklyTransactions) {
    const val = Number(tx.totalValue) || 0;

    if (tx.type === 'venda') {
      if (tx.paymentStatus !== 'pendente') {
        paidSalesCount += 1;
        // Usar signalValue se informado, caso contrário assume que foi pago o valor total
        const paidAmount = tx.signalValue ? Number(tx.signalValue) : val;
        totalPaidSalesAmount += paidAmount;
        // Se há sinal, o restante fica a receber
        if (tx.signalValue) {
          const remainingAmount = val - paidAmount;
          totalAReceber += remainingAmount;
        }

        // Fonte unica: a composicao gravada na venda (com fallback interno
        // para pedidos antigos). O recalculo pelos custos ATUAIS da ficha que
        // existia aqui reescrevia o lucro de pedidos ja fechados sempre que um
        // insumo mudava de preco — uma venda de marco virava outra em agosto.
        const detail = parseSaleDetail(tx);
        reposicaoInflow += detail.reposicao || 0;
        maodeobraInflow += (detail.maoDeObra || 0) + (detail.adicionais || 0) + (detail.delivery || 0);
        custoInflow += detail.custos || 0;
        investimentoInflow += detail.investimento || 0;
      } else {
        // Pendentes completamente a receber
        totalAReceber += val;
      }
    } else if (tx.type === 'reposicao') {
      totalExpensesCount += 1;
      totalExpensesAmount += val;
      reposicaoSpent += val;
    } else if (tx.type === 'maodeobra') {
      totalExpensesCount += 1;
      totalExpensesAmount += val;
      maodeobraSpent += val;
    } else if (tx.type === 'custo') {
      totalExpensesCount += 1;
      totalExpensesAmount += val;
      custoSpent += val;
    } else if (tx.type === 'investimento') {
      totalExpensesCount += 1;
      totalExpensesAmount += val;
      investimentoSpent += val;
    }
  }

  const saldoReposicao = reposicaoInflow - reposicaoSpent;
  const saldoMaodeobra = maodeobraInflow - maodeobraSpent;
  const saldoInvestimento = investimentoInflow - investimentoSpent;

  const combinedInflow = custoInflow + investimentoInflow;
  const combinedSpent = custoSpent + investimentoSpent;
  const saldoCombined = combinedInflow - combinedSpent;

  return {
    reposicao: {
      accumulatedInflow: reposicaoInflow,
      totalSpent: reposicaoSpent,
      currentBalance: saldoReposicao,
      isNegative: saldoReposicao < 0,
    },
    maodeobra: {
      accumulatedInflow: maodeobraInflow,
      totalSpent: maodeobraSpent,
      currentBalance: saldoMaodeobra,
      isNegative: saldoMaodeobra < 0,
    },
    investimento: {
      accumulatedInflow: investimentoInflow,
      totalSpent: investimentoSpent,
      currentBalance: saldoInvestimento,
      isNegative: saldoInvestimento < 0,
    },
    custoEInvestimento: {
      accumulatedInflow: combinedInflow,
      totalSpent: combinedSpent,
      currentBalance: saldoCombined,
      isNegative: saldoCombined < 0,
      custoHalf: saldoCombined / 2,
      investimentoHalf: saldoCombined / 2,
    },
    paidSalesCount,
    totalExpensesCount,
    totalPaidSales: totalPaidSalesAmount,
    totalAReceber,
    totalExpensesAmount,
  };
}

// ============================================================================
// Meta semanal de custo fixo (ex-custosFixos.ts)
// ============================================================================

/**
 * Quanto a confeitaria precisa faturar por semana so para cobrir os custos
 * fixos — e quanto ja faturou nesta semana.
 *
 * Os custos administrativos sao MENSAIS (aluguel, energia, internet...). A
 * conversao usa 12 meses / 52 semanas, e nao "dividir por 4": o mes tem em
 * media 4,35 semanas, e a diferenca nao e detalhe. Num custo fixo de R$ 2.000,
 * dividir por 4 daria uma meta de R$ 500 e um rombo de cerca de R$ 350 por mes,
 * justamente no numero que existe para evitar rombo.
 */
const SEMANAS_POR_MES = 52 / 12; // ≈ 4,3333

export interface MetaSemanal {
  /** Soma das despesas mensais. */
  custoFixoMensal: number;
  /** Quanto precisa entrar por semana so para empatar com os fixos. */
  necessarioPorSemana: number;
  /** Vendas PAGAS da semana corrente (segunda a domingo). */
  faturadoNaSemana: number;
  /** Quanto ainda falta. Zero quando a meta ja foi batida. */
  faltaFaturar: number;
  /** Fracao da meta ja coberta, de 0 a 1 (limitada em 1 para a barra). */
  progresso: number;
  /** A meta foi atingida ou superada. */
  metaAtingida: boolean;
  /** Sem custo fixo cadastrado nao ha meta: a tela deve convidar a preencher. */
  temCustoCadastrado: boolean;
}

export const calcularMetaSemanal = (
  custos: AdministrativeCosts | null,
  transacoes: Transaction[]
): MetaSemanal => {
  const custoFixoMensal = custos?.total || 0;
  const necessarioPorSemana = custoFixoMensal / SEMANAS_POR_MES;

  const { startIso, endIso } = getWeekRange();

  // So venda PAGA cobre custo. Pedido pendente e promessa, nao dinheiro em
  // caixa — incluir daria a impressao de meta batida com o dinheiro ainda na
  // mao da cliente.
  const faturadoNaSemana = transacoes.reduce((soma, tx) => {
    if (tx.type !== 'venda') return soma;
    if (tx.paymentStatus === 'pendente') return soma;
    if (!tx.date || tx.date < startIso || tx.date > endIso) return soma;

    // Com sinal, so o que foi efetivamente pago entra.
    const pago = tx.signalValue != null ? Number(tx.signalValue) : Number(tx.totalValue);
    return soma + (Number.isFinite(pago) ? pago : 0);
  }, 0);

  const faltaFaturar = Math.max(0, necessarioPorSemana - faturadoNaSemana);

  return {
    custoFixoMensal,
    necessarioPorSemana,
    faturadoNaSemana,
    faltaFaturar,
    progresso: necessarioPorSemana > 0
      ? Math.min(1, faturadoNaSemana / necessarioPorSemana)
      : 0,
    metaAtingida: necessarioPorSemana > 0 && faturadoNaSemana >= necessarioPorSemana,
    temCustoCadastrado: custoFixoMensal > 0,
  };
};

// ============================================================================
// Estrutura financeira individualizada da conta ("Minha Empresa")
// ============================================================================
//
// Implementa as formulas da Parte 2 do spec de precificacao: faturamento
// necessario, distribuicao percentual e preco sugerido por produto. Cada
// conta calcula os proprios numeros a partir dos proprios dados — nunca uma
// porcentagem de custo fixa igual para todo mundo (regra mais importante do
// spec). CMV/investimento/lucro sao METAS informadas pela usuaria, nao
// constantes deste arquivo.

/** Quanto uma despesa realmente pesa no negocio, depois do rateio. */
export const valorConsideradoDespesa = (despesa: Pick<DespesaEmpresa, 'valor' | 'percentualRateio'>): number =>
  (Number(despesa.valor) || 0) * (Number(despesa.percentualRateio) || 0) / 100;

/** Soma de todas as despesas da empresa, ja aplicado o rateio de cada uma. */
export const somarDespesasEmpresa = (despesas: DespesaEmpresa[]): number =>
  (despesas || []).reduce((soma, d) => soma + valorConsideradoDespesa(d), 0);

export interface MetaHorasTrabalho {
  horasPorMes: number;
  horasPorSemana: number;
  horasPorDia: number;
}

/**
 * Meta de horas de trabalho, so como REFERENCIA — nunca uma obrigacao de
 * carga horaria (spec Parte 2, item 5). Semana usa 4,33 (52/12 semanas por
 * mes), a mesma constante ja usada em `calcularMetaSemanal` — dividir por 4
 * sub-representa a semana e infla a meta diaria artificialmente.
 */
export const calcularMetaHoras = (
  recebimentoDesejado: number,
  valorHora: number,
  diasPorSemana: number
): MetaHorasTrabalho => {
  if (!valorHora || valorHora <= 0 || !diasPorSemana || diasPorSemana <= 0) {
    return { horasPorMes: 0, horasPorSemana: 0, horasPorDia: 0 };
  }
  const horasPorMes = recebimentoDesejado / valorHora;
  const horasPorSemana = horasPorMes / SEMANAS_POR_MES;
  const horasPorDia = horasPorSemana / diasPorSemana;
  return { horasPorMes, horasPorSemana, horasPorDia };
};

export interface ValidacaoEstruturaFinanceira {
  valido: boolean;
  /** Preenchida apenas quando `valido` e false. */
  mensagem?: string;
}

/**
 * Verifica se sobra espaco para custos e mao de obra antes de calcular o
 * faturamento (spec Parte 2, item 16). CMV + Investimento + Lucro tem que
 * ficar abaixo de 100% — do contrario a divisao do faturamento necessario
 * produz zero, negativo ou infinito.
 */
export const validarEstruturaFinanceira = (
  cmvTargetPercent: number,
  investmentTargetPercent: number,
  profitTargetPercent: number
): ValidacaoEstruturaFinanceira => {
  const somaMetas = (cmvTargetPercent || 0) + (investmentTargetPercent || 0) + (profitTargetPercent || 0);
  if (somaMetas >= 100) {
    return {
      valido: false,
      mensagem:
        'As metas informadas consomem 100% ou mais do faturamento. Reduza uma das porcentagens para que o sistema consiga calcular uma estrutura sustentável.',
    };
  }
  return { valido: true };
};

export interface EstruturaFinanceira {
  valido: boolean;
  mensagemErro?: string;

  recebimentoDesejado: number;
  despesasMensais: number;

  /** Faturamento necessario = (recebimento + despesas) / (1 - cmv% - investimento% - lucro%). */
  faturamentoNecessario: number;

  /** % real de custos da conta = despesasMensais / faturamentoNecessario * 100. Dinamico, nunca fixo. */
  custosPercent: number;
  /** % de mao de obra = recebimentoDesejado / faturamentoNecessario * 100. */
  maoDeObraPercent: number;

  cmvTargetPercent: number;
  investmentTargetPercent: number;
  profitTargetPercent: number;

  cmvAmount: number;
  investimentoAmount: number;
  lucroAmount: number;
  maoDeObraAmount: number;
  custosAmount: number;
}

const ESTRUTURA_INVALIDA = (
  recebimentoDesejado: number,
  despesasMensais: number,
  cmvTargetPercent: number,
  investmentTargetPercent: number,
  profitTargetPercent: number,
  mensagemErro: string
): EstruturaFinanceira => ({
  valido: false,
  mensagemErro,
  recebimentoDesejado,
  despesasMensais,
  faturamentoNecessario: 0,
  custosPercent: 0,
  maoDeObraPercent: 0,
  cmvTargetPercent,
  investmentTargetPercent,
  profitTargetPercent,
  cmvAmount: 0,
  investimentoAmount: 0,
  lucroAmount: 0,
  maoDeObraAmount: 0,
  custosAmount: 0,
});

/**
 * Calcula a estrutura financeira completa de uma conta: faturamento
 * necessario e a distribuicao entre CMV, custos, mao de obra e lucro (spec
 * Parte 2, itens 12 a 15). E o coracao do engine — toda tela (Dashboard,
 * Fichas, Minha Empresa) deve ler destes mesmos numeros, nunca recalcular por
 * conta propria (spec Parte 5, item 1).
 */
export const calcularEstruturaFinanceira = (
  recebimentoDesejado: number,
  despesasMensais: number,
  cmvTargetPercent: number,
  investmentTargetPercent: number,
  profitTargetPercent: number
): EstruturaFinanceira => {
  const validacao = validarEstruturaFinanceira(cmvTargetPercent, investmentTargetPercent, profitTargetPercent);
  if (!validacao.valido) {
    return ESTRUTURA_INVALIDA(
      recebimentoDesejado,
      despesasMensais,
      cmvTargetPercent,
      investmentTargetPercent,
      profitTargetPercent,
      validacao.mensagem!
    );
  }

  const fracaoRestante = 1 - (cmvTargetPercent + investmentTargetPercent + profitTargetPercent) / 100;
  const faturamentoNecessario = (recebimentoDesejado + despesasMensais) / fracaoRestante;

  if (!Number.isFinite(faturamentoNecessario) || faturamentoNecessario < 0) {
    return ESTRUTURA_INVALIDA(
      recebimentoDesejado,
      despesasMensais,
      cmvTargetPercent,
      investmentTargetPercent,
      profitTargetPercent,
      'Não foi possível calcular um faturamento válido com os valores informados.'
    );
  }

  const custosPercent = faturamentoNecessario > 0 ? (despesasMensais / faturamentoNecessario) * 100 : 0;
  const maoDeObraPercent = faturamentoNecessario > 0 ? (recebimentoDesejado / faturamentoNecessario) * 100 : 0;

  return {
    valido: true,
    recebimentoDesejado,
    despesasMensais,
    faturamentoNecessario,
    custosPercent,
    maoDeObraPercent,
    cmvTargetPercent,
    investmentTargetPercent,
    profitTargetPercent,
    cmvAmount: faturamentoNecessario * (cmvTargetPercent / 100),
    investimentoAmount: faturamentoNecessario * (investmentTargetPercent / 100),
    lucroAmount: faturamentoNecessario * (profitTargetPercent / 100),
    maoDeObraAmount: recebimentoDesejado,
    custosAmount: despesasMensais,
  };
};

export interface PrecoSugeridoProduto {
  maoDeObraProduto: number;
  precoMinimoPorCmv: number;
  precoMinimoPorEstrutura: number | null;
  /** Maior valor entre os dois preços mínimos — nunca inventado (spec Parte 2, item 21 e 30). */
  precoSugerido: number;
  /** Fração de faturamento disponível para mão de obra na estrutura da conta (100 - CMV% - Custos% - Investimento% - Lucro%). */
  percentMaoDeObraDisponivel: number | null;
}

/**
 * Calcula o preço sugerido de um produto: o maior entre o preço mínimo pelo
 * CMV e o preço necessário pela estrutura financeira da conta (spec Parte 2,
 * itens 19 a 21). A meta de lucro e um MINIMO, nunca um teto — se o CMV
 * empurrar o preço acima do necessário pela estrutura, o lucro projetado
 * naquele produto fica acima da meta, e isso e esperado (item 22).
 */
export const calcularPrecoSugeridoProduto = (
  cmvProduto: number,
  horasProducao: number,
  valorHora: number,
  cmvTargetPercent: number,
  estrutura: EstruturaFinanceira
): PrecoSugeridoProduto => {
  const maoDeObraProduto = (horasProducao || 0) * (valorHora || 0);
  const precoMinimoPorCmv = cmvTargetPercent > 0 ? cmvProduto / (cmvTargetPercent / 100) : 0;

  if (!estrutura.valido) {
    return {
      maoDeObraProduto,
      precoMinimoPorCmv,
      precoMinimoPorEstrutura: null,
      precoSugerido: precoMinimoPorCmv,
      percentMaoDeObraDisponivel: null,
    };
  }

  // % de mao de obra disponivel = 100 - CMV% - Custos% - Investimento% - Lucro%.
  // Equivale a maoDeObraPercent da propria estrutura: os cinco somam 100% por
  // construcao (spec Parte 5, item 7).
  const percentMaoDeObraDisponivel =
    100 - cmvTargetPercent - estrutura.custosPercent - estrutura.investmentTargetPercent - estrutura.profitTargetPercent;

  const precoMinimoPorEstrutura =
    percentMaoDeObraDisponivel > 0 ? maoDeObraProduto / (percentMaoDeObraDisponivel / 100) : null;

  const precoSugerido = Math.max(precoMinimoPorCmv, precoMinimoPorEstrutura ?? 0);

  return {
    maoDeObraProduto,
    precoMinimoPorCmv,
    precoMinimoPorEstrutura,
    precoSugerido,
    percentMaoDeObraDisponivel,
  };
};
