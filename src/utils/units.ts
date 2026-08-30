import { StockItem } from '../types';

/**
 * Conversao de unidades, fonte unica.
 *
 * Esta logica existia DUPLICADA em duas telas — `convertQuantityToTargetUnit`
 * no modulo de Compras e `convertCostToTargetUnit` no de Fichas — e faltava
 * por completo onde mais importava: a baixa de estoque do pedido subtraia
 * `ingredient.quantity` da quantidade em estoque sem olhar a unidade nenhuma
 * vez. Ficha pedindo 200 g de acucar de um estoque medido em kg tirava 200 kg.
 *
 * A guarda de familia (massa / volume / contagem) e nova. As versoes antigas
 * mapeavam todas as unidades para uma base so, entao converter g para ml dava
 * um numero — errado, mas plausivel, e portanto invisivel. Aqui isso vira um
 * `null` explicito, para quem chama decidir o que fazer com um dado que nao
 * faz sentido.
 */

export type Unit = StockItem['unit']; // 'g' | 'kg' | 'ml' | 'L' | 'un' | 'pacote'

type UnitFamily = 'massa' | 'volume' | 'contagem';

/** Quanto vale 1 unidade na base da sua familia (g, ml ou item). */
const UNIT_SPEC: Record<Unit, { family: UnitFamily; toBase: number }> = {
  g: { family: 'massa', toBase: 1 },
  kg: { family: 'massa', toBase: 1000 },
  ml: { family: 'volume', toBase: 1 },
  L: { family: 'volume', toBase: 1000 },
  un: { family: 'contagem', toBase: 1 },
  // 'pacote' e 'un' contam coisas, mas um pacote NAO e uma unidade: sem saber
  // quantas unidades vem no pacote, a conversao entre os dois e um chute. Ficam
  // em familias separadas de proposito, para o chute virar erro visivel.
  pacote: { family: 'contagem', toBase: 1 },
};

const spec = (unit: string) => UNIT_SPEC[unit as Unit];

/**
 * As duas unidades medem a mesma grandeza e podem ser convertidas?
 *
 * `pacote` so converte para `pacote`: ver a nota em UNIT_SPEC.
 */
export const areUnitsCompatible = (from: string, to: string): boolean => {
  const a = spec(from);
  const b = spec(to);
  if (!a || !b) return false;
  if (from === to) return true;
  if (a.family !== b.family) return false;
  if (from === 'pacote' || to === 'pacote') return false;
  return true;
};

/**
 * Converte uma QUANTIDADE de `from` para `to`.
 *
 * Retorna `null` quando as unidades sao incompativeis — 100 ml de leite nao
 * viram gramas sem saber a densidade. Quem chama precisa tratar esse caso;
 * silenciar aqui foi exatamente o que produziu o bug do acucar.
 */
export const convertQuantity = (
  quantity: number,
  from: string,
  to: string
): number | null => {
  if (!areUnitsCompatible(from, to)) return null;
  if (from === to) return quantity;
  return (quantity * spec(from).toBase) / spec(to).toBase;
};

/**
 * Converte um CUSTO POR UNIDADE de `from` para `to`.
 *
 * Anda no sentido inverso da quantidade: R$ 10 por kg e R$ 0,01 por g. Mais
 * unidade de medida por embalagem significa menos dinheiro por unidade.
 */
export const convertCostPerUnit = (
  costPerUnit: number,
  from: string,
  to: string
): number | null => {
  if (!areUnitsCompatible(from, to)) return null;
  if (from === to) return costPerUnit;
  return (costPerUnit * spec(to).toBase) / spec(from).toBase;
};
