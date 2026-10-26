import { useMemo } from 'react';
import { FichaTecnica, IngredientUsage, Produto } from '../types';
import { useFichasTecnicas } from '../context/FichasTecnicasContext';
import { useProdutos } from '../context/ProdutosContext';
import { convertCostPerUnit } from '../utils/units';

/**
 * As fichas com o custo de cada insumo calculado pelo preco ATUAL do produto.
 *
 * A ficha guarda `unitCost`/`totalCost` copiados no instante em que o insumo foi
 * escolhido. Antes todas as telas liam essa copia: o granulado passava de $38
 * para $25 em Produtos (ou numa Compra) e a ficha continuava com $38 ate a
 * confeiteira excluir e adicionar o insumo de novo.
 *
 * Aqui o custo e refeito com o ultimo preco pago (preco / embalagem, convertido
 * para a unidade da ficha). Insumo sem produto vinculado, com produto apagado
 * ou com unidade incompativel fica com o valor guardado — que e o que ele tinha.
 *
 * Mora num hook, e nao no FichasTecnicasContext, porque esse provider fica por
 * FORA do de Produtos (App.tsx) e nao enxerga os precos. Use no lugar de
 * `useFichasTecnicas().fichas` onde o CUSTO dos insumos importa. Pedidos ja
 * lancados nao sao afetados: o custo deles esta congelado no `breakdown`.
 */
export const insumoComCustoAtual = (ing: IngredientUsage, produtos: Produto[]): IngredientUsage => {
  if (ing.produtoId == null) return ing;
  const produto = produtos.find((p) => p.id === Number(ing.produtoId));
  if (!produto || !(produto.quantidadeEmbalagem > 0)) return ing;
  const custoBase = produto.precoPago / produto.quantidadeEmbalagem;
  const unitCost = convertCostPerUnit(custoBase, produto.unidadeEmbalagem, ing.unit);
  if (unitCost == null) return ing;
  const totalCost = (Number(ing.quantity) || 0) * unitCost;
  if (unitCost === ing.unitCost && totalCost === ing.totalCost) return ing;
  return { ...ing, unitCost, totalCost };
};

export const fichaComCustoAtual = (ficha: FichaTecnica, produtos: Produto[]): FichaTecnica => ({
  ...ficha,
  ingredients: ficha.ingredients ? ficha.ingredients.map((i) => insumoComCustoAtual(i, produtos)) : ficha.ingredients,
  tamanhos: ficha.tamanhos
    ? ficha.tamanhos.map((t) => ({
        ...t,
        ingredients: t.ingredients ? t.ingredients.map((i) => insumoComCustoAtual(i, produtos)) : t.ingredients,
      }))
    : ficha.tamanhos,
});

export const useFichasComCustoAtual = () => {
  const contexto = useFichasTecnicas();
  const { produtos } = useProdutos();
  const fichas = useMemo(
    () => contexto.fichas.map((f) => fichaComCustoAtual(f, produtos)),
    [contexto.fichas, produtos]
  );
  return { ...contexto, fichas };
};
