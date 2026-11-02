/**
 * Datas que mudam de dia todo ano (Pascoa, Dia das Maes...). A lista guardava
 * so as de 2026: a partir de 2027 o app mostraria o dia errado.
 */
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** n-esimo dia da semana (0 = domingo) do mes (0 = janeiro). */
const enesimoDiaDaSemana = (ano: number, mes: number, diaDaSemana: number, n: number) => {
  const primeiro = new Date(ano, mes, 1);
  const dia = 1 + ((diaDaSemana - primeiro.getDay() + 7) % 7) + (n - 1) * 7;
  return new Date(ano, mes, dia);
};

/** Domingo de Pascoa (calendario gregoriano, metodo de Meeus). */
const pascoa = (ano: number) => {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
};

export type RegraDaData =
  | { fixa: string } // "MM-DD"
  | { pascoa: true }
  | { mes: number; diaDaSemana: number; n: number };

export const dataNoAno = (regra: RegraDaData, ano: number): string => {
  if ('fixa' in regra) return `${ano}-${regra.fixa}`;
  if ('pascoa' in regra) return iso(pascoa(ano));
  return iso(enesimoDiaDaSemana(ano, regra.mes, regra.diaDaSemana, regra.n));
};

const hojeIso = () => iso(new Date());

/** Proxima vez que a data acontece, contando hoje. */
export const proximaData = (regra: RegraDaData, hoje = hojeIso()): string => {
  const ano = Number(hoje.slice(0, 4));
  const esteAno = dataNoAno(regra, ano);
  return esteAno >= hoje ? esteAno : dataNoAno(regra, ano + 1);
};

/** Proximo aniversario de uma data qualquer ("1990-05-10" -> "2027-05-10"). */
export const proximoAniversario = (data: string, hoje = hojeIso()): string => {
  const mmdd = data.slice(5, 10);
  // 29/02 em ano que nao e bissexto cai no dia 28.
  const noAno = (ano: number) =>
    mmdd === '02-29' && new Date(ano, 1, 29).getMonth() !== 1 ? `${ano}-02-28` : `${ano}-${mmdd}`;
  const ano = Number(hoje.slice(0, 4));
  return noAno(ano) >= hoje ? noAno(ano) : noAno(ano + 1);
};
