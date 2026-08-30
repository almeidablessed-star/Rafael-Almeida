import { FichaTecnica, StockItem } from '../types';
import { normalizeName } from './fichaMatcher';
import { convertQuantity } from './units';

/**
 * Decide O QUE baixar do estoque para um pedido, sem tocar em banco nenhum.
 *
 * Separado do EstoqueContext de proposito: esta e a parte que erra em silencio
 * — casamento de nome, conversao de unidade, soma de bolos que dividem insumo —
 * e ela precisa ser testavel sem rede, sem login e sem Supabase.
 *
 * O que a versao antiga (stockManager.ts, em localStorage) fazia de errado e
 * que aqui esta corrigido:
 *
 *   1. Nao convertia unidade. Fazia `estoque -= ficha.quantity` direto, entao
 *      uma ficha pedindo 200 g de um item guardado em kg tirava 200 kg.
 *   2. Criava um item de estoque do nada quando o insumo nao existia, e o
 *      deixava negativo. Agora o insumo sem correspondencia e RELATADO, nao
 *      inventado — item que a confeiteira nunca cadastrou nao aparece no
 *      Estoque dela por conta propria.
 *   3. Somava por id em um lugar e por nome em outro, entao a devolucao de um
 *      pedido cancelado as vezes nao achava o que devolver.
 */

/** Uma linha do plano: quanto tirar de qual item de estoque. */
export interface BaixaPlanejada {
  estoqueId: string;
  itemNome: string;
  /** Ja convertida para a unidade DO ESTOQUE. */
  quantidade: number;
  unidade: string;
  /** Quanto o item fica depois da baixa. Pode ficar negativo — ver nota abaixo. */
  quantidadeFinal: number;
  fichaIds: string[];
}

/** Insumo que a ficha pede mas o estoque nao consegue atender. */
export interface ProblemaBaixa {
  insumo: string;
  motivo: 'sem-item-no-estoque' | 'unidade-incompativel';
  unidadeFicha: string;
  unidadeEstoque?: string;
}

export interface PlanoBaixa {
  baixas: BaixaPlanejada[];
  problemas: ProblemaBaixa[];
}

/**
 * Monta o plano de baixa de um pedido inteiro.
 *
 * `items` sao os produtos vendidos com sua quantidade ("2x Bolo Matilda").
 * A ficha descreve UMA unidade, entao tudo e multiplicado pela quantidade.
 *
 * Insumos que aparecem em mais de um bolo viram UMA linha somada: dois bolos
 * que usam farinha geram um unico debito de farinha. Isso importa no estorno,
 * que percorre esta lista — linhas duplicadas devolveriam o valor certo por
 * acaso, mas o historico ficaria ilegivel.
 *
 * Estoque negativo e PERMITIDO de proposito. Bloquear a venda porque o cadastro
 * de estoque esta desatualizado seria pior do que registrar o saldo negativo e
 * deixar a confeiteira ver que precisa repor.
 */
export const planejarBaixa = (
  items: { ficha: FichaTecnica; quantity: number }[],
  estoque: StockItem[]
): PlanoBaixa => {
  const porItemDeEstoque = new Map<string, BaixaPlanejada>();
  const problemas: ProblemaBaixa[] = [];
  const jaRelatado = new Set<string>();

  const relatar = (p: ProblemaBaixa) => {
    // Um mesmo insumo faltando em tres bolos e UM problema, nao tres.
    const chave = `${normalizeName(p.insumo)}|${p.motivo}`;
    if (jaRelatado.has(chave)) return;
    jaRelatado.add(chave);
    problemas.push(p);
  };

  items.forEach(({ ficha, quantity }) => {
    const fator = Number(quantity) > 0 ? Number(quantity) : 1;

    (ficha.ingredients || []).forEach((insumo) => {
      const alvo = normalizeName(insumo.name);
      const itemEstoque = estoque.find((e) => normalizeName(e.name) === alvo);

      if (!itemEstoque) {
        relatar({
          insumo: insumo.name,
          motivo: 'sem-item-no-estoque',
          unidadeFicha: insumo.unit,
        });
        return;
      }

      const necessario = convertQuantity(
        insumo.quantity * fator,
        insumo.unit,
        itemEstoque.unit
      );

      if (necessario === null) {
        // g contra ml, ou pacote contra un: converter seria chute. Melhor a
        // confeiteira saber que este insumo nao baixou do que ver um numero
        // inventado no estoque.
        relatar({
          insumo: insumo.name,
          motivo: 'unidade-incompativel',
          unidadeFicha: insumo.unit,
          unidadeEstoque: itemEstoque.unit,
        });
        return;
      }

      const existente = porItemDeEstoque.get(itemEstoque.id);
      if (existente) {
        existente.quantidade += necessario;
        existente.quantidadeFinal = itemEstoque.quantity - existente.quantidade;
        if (!existente.fichaIds.includes(ficha.id)) existente.fichaIds.push(ficha.id);
      } else {
        porItemDeEstoque.set(itemEstoque.id, {
          estoqueId: itemEstoque.id,
          itemNome: itemEstoque.name,
          quantidade: necessario,
          unidade: itemEstoque.unit,
          quantidadeFinal: itemEstoque.quantity - necessario,
          fichaIds: [ficha.id],
        });
      }
    });
  });

  return { baixas: Array.from(porItemDeEstoque.values()), problemas };
};
