import { Transaction, WeeklyArchive } from '../types';
import { getTodayIso } from './formatters';

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
 * Get the Monday of a specific date's week
 */
export function getWeekMonday(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  const dayOfWeek = date.getDay();
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * Get the Sunday of a specific date's week
 */
export function getWeekSunday(dateStr: string): string {
  const monday = new Date(getWeekMonday(dateStr) + 'T00:00:00Z');
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  return sunday.toISOString().split('T')[0];
}

/**
 * Get week number in month (1-5)
 */
export function getWeekNumberInMonth(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00Z');
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfWeek = firstDay.getDay();
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));

  const firstMonday = new Date(firstDay.getTime());
  const firstMondayDayOfWeek = firstMonday.getDay();
  const diffFirstMonday = firstMonday.getDate() - firstMondayDayOfWeek + (firstMondayDayOfWeek === 0 ? -6 : 1);
  firstMonday.setDate(diffFirstMonday);

  return Math.floor((monday.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
}

/**
 * Filter transactions for a specific week
 */
export function filterTransactionsByWeek(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): Transaction[] {
  return transactions.filter((tx) => {
    return tx.date >= startDate && tx.date <= endDate;
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
 * Create a weekly archive entry
 */
export function createWeeklyArchive(
  startDate: string,
  endDate: string,
  totals: ReturnType<typeof calculateWeeklyTotals>,
  transactionCount: number
): WeeklyArchive {
  const start = new Date(startDate + 'T00:00:00Z');
  const year = start.getFullYear();
  const month = start.getMonth() + 1;
  const weekNumber = getWeekNumberInMonth(startDate);

  return {
    id: `archive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    year,
    month,
    weekNumber,
    startDate,
    endDate,
    archivedAt: new Date().toISOString(),
    lucroLiquido: Math.round(totals.lucroLiquido * 100) / 100,
    vendidas: Math.round(totals.vendidas * 100) / 100,
    saldos: Math.round(totals.saldos * 100) / 100,
    aReceber: Math.round(totals.aReceber * 100) / 100,
    transactionCount,
  };
}

/**
 * Check if a new week has started (Monday at 00:00)
 */
export function hasNewWeekStarted(lastArchiveDate?: string): boolean {
  if (!lastArchiveDate) return false;

  const today = getTodayIso();
  const todayDate = new Date(today + 'T00:00:00Z');
  const dayOfWeek = todayDate.getDay();

  // Check if today is Monday
  if (dayOfWeek !== 1) return false;

  const lastArchive = new Date(lastArchiveDate);
  const lastArchiveDay = lastArchive.getDay();

  // If last archive was on a different week, new week started
  return lastArchiveDay !== 1 || lastArchive.toDateString() !== todayDate.toDateString();
}

/**
 * Get or create weekly archives from localStorage
 */
export function getWeeklyArchives(): WeeklyArchive[] {
  try {
    const stored = localStorage.getItem('carula_weekly_archives');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save weekly archives to localStorage
 */
export function saveWeeklyArchives(archives: WeeklyArchive[]): void {
  localStorage.setItem('carula_weekly_archives', JSON.stringify(archives));
}

/**
 * Archive current week's data
 */
export function archiveCurrentWeek(transactions: Transaction[]): WeeklyArchive | null {
  const startDate = getCurrentWeekMonday();
  const endDate = getCurrentWeekSunday();

  const weekTransactions = filterTransactionsByWeek(transactions, startDate, endDate);

  if (weekTransactions.length === 0) return null;

  const totals = calculateWeeklyTotals(weekTransactions);
  const archive = createWeeklyArchive(startDate, endDate, totals, weekTransactions.length);

  const archives = getWeeklyArchives();
  archives.push(archive);
  saveWeeklyArchives(archives);

  return archive;
}

/**
 * Get archives for a specific year and month
 */
export function getArchivesByYearMonth(year: number, month: number): WeeklyArchive[] {
  const archives = getWeeklyArchives();
  return archives.filter((a) => a.year === year && a.month === month);
}

/**
 * Get all unique years from archives
 */
export function getArchiveYears(): number[] {
  const archives = getWeeklyArchives();
  const years = new Set(archives.map((a) => a.year));
  return Array.from(years).sort((a, b) => b - a);
}

/**
 * Get months that have archives for a specific year
 */
export function getArchiveMonthsByYear(year: number): number[] {
  const archives = getWeeklyArchives();
  const months = new Set(archives.filter((a) => a.year === year).map((a) => a.month));
  return Array.from(months).sort((a, b) => a - b);
}
