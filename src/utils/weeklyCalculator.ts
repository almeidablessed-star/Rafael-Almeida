import { Transaction, FichaTecnica } from '../types';
import { formatDateBr } from './formatters';

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
