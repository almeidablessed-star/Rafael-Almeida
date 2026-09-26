import { Transaction, WeeklySummary } from '../types';
import { getIndiceNoMes, getJanela, getJanelaAtual } from './periodoReset';

/**
 * A aritmetica de calendario que morava aqui mudou-se para `periodoReset.ts`,
 * que a generaliza para semanal / quinzenal / mensal. As funcoes abaixo
 * permanecem como a fachada SEMANAL dessa aritmetica: mesma assinatura, mesmo
 * resultado, so que agora delegando em vez de reimplementar.
 *
 * Elas continuam existindo porque sao chamadas em varios pontos e porque
 * "semana" ainda e o unico periodo que o app expoe. Quando o periodo passar a
 * ser configuravel, os chamadores migram para `getJanela(data, periodo)` e
 * estas fachadas saem de cena.
 *
 * Toda a nota historica sobre fuso — por que nada aqui pode passar por
 * `.toISOString()` — vive agora no cabecalho de `periodoReset.ts`.
 */

/**
 * Get the Monday of the current week.
 */
export function getCurrentWeekMonday(): string {
  return getJanelaAtual('semanal').inicioIso;
}

/**
 * Get the Sunday of the current week.
 */
export function getCurrentWeekSunday(): string {
  return getJanelaAtual('semanal').fimIso;
}

/**
 * Get the Monday of a specific date's week.
 */
export function getWeekMonday(dateStr: string): string {
  return getJanela(dateStr, 'semanal').inicioIso;
}

/**
 * Get the Sunday of a specific date's week
 */
export function getWeekSunday(dateStr: string): string {
  return getJanela(dateStr, 'semanal').fimIso;
}

/**
 * Get week number in month (1-5, ocasionalmente 6 — ver a nota em
 * `getIndiceNoMes`, que preserva essa contagem).
 */
export function getWeekNumberInMonth(dateStr: string): number {
  return getIndiceNoMes(dateStr, 'semanal');
}

/**
 * Converte `createdAt` (timestamp em ms) para data local `YYYY-MM-DD` — o
 * mesmo criterio usado pelo Dashboard (financialEngine.calculateWeeklyBalances
 * e calcularMetaSemanal): filtra pela data em que o lancamento foi CRIADO no
 * sistema, nao pela data do evento/entrega escolhida no pedido (`tx.date`).
 */
export function createdAtToLocalIso(createdAt: number): string {
  const d = new Date(createdAt);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Filtra transacoes cujo lancamento (`createdAt`) caiu dentro do intervalo
 * [startDate, endDate] (segunda a domingo, inclusive).
 */
export function filterTransactionsByWeek(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): Transaction[] {
  return transactions.filter((tx) => {
    if (!tx.createdAt) return false;
    const lancadoEm = createdAtToLocalIso(tx.createdAt);
    return lancadoEm >= startDate && lancadoEm <= endDate;
  });
}

/**
 * Calculate totals for a week
 */
export function calculateWeeklyTotals(transactions: Transaction[]) {
  let lucroLiquido = 0;
  let vendidas = 0;
  let saldos = 0;
  let aReceber = 0;

  transactions.forEach((tx) => {
    if (tx.type === 'venda') {
      if (tx.paymentStatus === 'pago') {
        vendidas += tx.totalValue;
        lucroLiquido += tx.totalValue;
      } else {
        aReceber += tx.totalValue;
      }
    } else if (tx.type === 'reposicao' || tx.type === 'maodeobra' || tx.type === 'custo' || tx.type === 'investimento') {
      saldos += tx.totalValue;
      lucroLiquido -= tx.totalValue;
    }
  });

  return { lucroLiquido, vendidas, saldos, aReceber };
}

/**
 * Histórico semanal (card "📊 Histórico" na aba Compras).
 *
 * Antes vivia num "arquivo" congelado em localStorage (`carula_weekly_archives`),
 * criado so quando a usuaria abria o app numa segunda-feira especifica — dado
 * que sumia ao trocar de aparelho/navegador ou limpar o cache, e nunca surgia
 * se aquela segunda-feira passasse com o app fechado (o resto do Carula vive
 * inteiro no Supabase desde 04/09; esse card tinha ficado pra tras). As
 * funcoes abaixo derivam o mesmo histórico direto de `transactions` (sempre
 * as mesmas vindas do Supabase via TransacoesContext), recalculando sob
 * demanda em vez de depender de um snapshot salvo em algum lugar.
 */

/** Lista, sem duplicar, as semanas (segunda a domingo) que tem pelo menos 1 transacao lancada. */
function getWeeksWithTransactions(transactions: Transaction[]): { startDate: string; endDate: string }[] {
  // Agrupa pelo INICIO da janela: duas transacoes caem na mesma linha do
  // Historico exatamente quando `getJanela` devolve o mesmo inicio para as
  // duas. Escrito assim, trocar `'semanal'` por outro periodo reagrupa o
  // historico inteiro sem mais nenhuma mudanca aqui.
  const inicios = new Set<string>();
  transactions.forEach((tx) => {
    if (!tx.createdAt) return;
    inicios.add(getJanela(createdAtToLocalIso(tx.createdAt), 'semanal').inicioIso);
  });
  return Array.from(inicios)
    .sort()
    .map((startDate) => ({ startDate, endDate: getJanela(startDate, 'semanal').fimIso }));
}

/** Anos com pelo menos uma semana de transacoes lancadas, mais recente primeiro. */
export function getHistoryYears(transactions: Transaction[]): number[] {
  const years = new Set(
    getWeeksWithTransactions(transactions).map((w) => Number(w.startDate.slice(0, 4)))
  );
  return Array.from(years).sort((a, b) => b - a);
}

/** Meses daquele ano com pelo menos uma semana de transacoes lancadas. */
export function getHistoryMonthsByYear(transactions: Transaction[], year: number): number[] {
  const months = new Set(
    getWeeksWithTransactions(transactions)
      .filter((w) => Number(w.startDate.slice(0, 4)) === year)
      .map((w) => Number(w.startDate.slice(5, 7)))
  );
  return Array.from(months).sort((a, b) => a - b);
}

/** Resumo de cada semana (segunda a domingo) daquele ano/mes, com os totais recalculados na hora. */
export function getWeeklySummariesByYearMonth(
  transactions: Transaction[],
  year: number,
  month: number
): WeeklySummary[] {
  const weeks = getWeeksWithTransactions(transactions).filter(
    (w) => Number(w.startDate.slice(0, 4)) === year && Number(w.startDate.slice(5, 7)) === month
  );

  return weeks
    .map(({ startDate, endDate }) => {
      const weekTransactions = filterTransactionsByWeek(transactions, startDate, endDate);
      const totals = calculateWeeklyTotals(weekTransactions);
      return {
        id: `week-${startDate}`,
        year,
        month,
        weekNumber: getWeekNumberInMonth(startDate),
        startDate,
        endDate,
        transactionCount: weekTransactions.length,
        lucroLiquido: Math.round(totals.lucroLiquido * 100) / 100,
        vendidas: Math.round(totals.vendidas * 100) / 100,
        saldos: Math.round(totals.saldos * 100) / 100,
        aReceber: Math.round(totals.aReceber * 100) / 100,
      };
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
