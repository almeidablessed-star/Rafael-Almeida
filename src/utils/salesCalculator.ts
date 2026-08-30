import { Transaction, FichaTecnica } from '../types';
import { parseSaleDetail } from './weeklyCalculator';

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
