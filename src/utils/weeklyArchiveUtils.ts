import { Transaction, WeeklySummary } from '../types';

/**
 * Get the Monday of the current week
 */
export function getCurrentWeekMonday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * Get the Sunday of the current week
 */
export function getCurrentWeekSunday(): string {
  const monday = new Date(getCurrentWeekMonday());
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  return sunday.toISOString().split('T')[0];
}

/**
 * Get the Monday of a specific date's week.
 *
 * Constroi a data com `new Date(ano, mes, dia)` (horario LOCAL), nao
 * `new Date(dateStr + 'T00:00:00Z')` (UTC) — a versao antiga fazia isso, e
 * `getDay()`/`getDate()` interpretam esse instante UTC no fuso local. Para
 * qualquer usuaria num fuso atras de UTC (ex: EUA, UTC-4/-5, como a
 * confeitaria de teste em Massachusetts), meia-noite UTC cai na noite do dia
 * ANTERIOR no relogio local, jogando a semana inteira um dia pra tras.
 */
export function getWeekMonday(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  date.setDate(diff);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Get the Sunday of a specific date's week
 */
export function getWeekSunday(dateStr: string): string {
  const [year, month, day] = getWeekMonday(dateStr).split('-').map(Number);
  const sunday = new Date(year, month - 1, day + 6);
  return `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
}

/**
 * Get week number in month (1-5)
 */
export function getWeekNumberInMonth(dateStr: string): number {
  const monday = getWeekMonday(dateStr);
  const [year, month] = monday.split('-').map(Number);

  const firstDayOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const firstMonday = getWeekMonday(firstDayOfMonth);

  // UTC so de proposito aqui: as duas datas ja sao YYYY-MM-DD (sem hora), e
  // so precisamos da diferenca em dias entre elas — construir em UTC evita
  // qualquer risco de DST deslocar a contagem de semanas em 1h perto da
  // troca de horario de verao.
  const toUtcMs = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };

  return Math.round((toUtcMs(monday) - toUtcMs(firstMonday)) / (7 * 24 * 60 * 60 * 1000)) + 1;
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
  const mondays = new Set<string>();
  transactions.forEach((tx) => {
    if (!tx.createdAt) return;
    mondays.add(getWeekMonday(createdAtToLocalIso(tx.createdAt)));
  });
  return Array.from(mondays)
    .sort()
    .map((startDate) => ({ startDate, endDate: getWeekSunday(startDate) }));
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
