import { FichaTecnica, IngredientUsage, TamanhoOpcao } from '../types';

/**
 * Quais insumos um tamanho especifico consome.
 *
 * Existe para a regra de fallback morar em UM lugar so. A baixa de estoque, a
 * conta aberta da ficha e a folha de orcamento precisam todas responder a mesma
 * pergunta, e se cada uma resolvesse por conta propria elas divergiriam — que e
 * exatamente o defeito que esta auditoria vem desfazendo.
 *
 * A regra:
 *   1. Se o tamanho tem lista propria e nao vazia, e ela que vale.
 *   2. Senao, vale a lista da ficha.
 *
 * O passo 2 nao e cortesia: fichas cadastradas antes de existirem listas por
 * tamanho so tem a lista da ficha, e sem esse retorno elas parariam de baixar
 * estoque da noite para o dia, em silencio.
 */
export const insumosDoTamanho = (
  ficha: FichaTecnica,
  tamanhoId?: string
): IngredientUsage[] => {
  const tamanho = tamanhoId
    ? (ficha.tamanhos || []).find((t) => t.id === tamanhoId)
    : undefined;

  if (tamanho?.ingredients && tamanho.ingredients.length > 0) {
    return tamanho.ingredients;
  }

  return ficha.ingredients || [];
};

/** Mesma regra, quando ja se tem o tamanho em maos em vez do id. */
export const insumosDeTamanhoOpcao = (
  ficha: FichaTecnica,
  tamanho?: TamanhoOpcao
): IngredientUsage[] =>
  tamanho?.ingredients && tamanho.ingredients.length > 0
    ? tamanho.ingredients
    : ficha.ingredients || [];

/** Custo total dos insumos de um tamanho. */
export const custoInsumosDoTamanho = (ficha: FichaTecnica, tamanhoId?: string): number =>
  insumosDoTamanho(ficha, tamanhoId).reduce((soma, i) => soma + (Number(i.totalCost) || 0), 0);
