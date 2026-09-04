import { BakeryPreset } from '../types';

/**
 * Atalhos de preenchimento dos formularios de compra, mao de obra e custos.
 *
 * SO NOMES. Nenhum preco, em nenhum item, nunca.
 *
 * Cada atalho ja trouxe um `defaultUnitValue` que era escrito direto no campo
 * de valor ao clicar — e o preco nao aparecia no botao, entao a confeiteira
 * clicava em "Gas de Cozinha" e o app preenchia 115 sem ela ver. Bastava salvar
 * sem reparar para o mes ganhar uma despesa que nunca existiu.
 *
 * O app e usado em regioes e moedas diferentes, e nenhum valor de referencia
 * sobrevive a isso: R$ 115 de botijao nao diz nada para quem paga gas encanado
 * na conta mensal, em outra moeda. O valor e sempre digitado por quem lanca.
 *
 * `categoryTag` fica: classifica a despesa como fixa, variavel ou investimento,
 * o que independe de regiao e de preco.
 *
 * BAKERY_PRODUCT_PRESETS (bolos, kits de festa) foi removido: alem dos precos,
 * era inalcancavel. Estes atalhos so aparecem quando o tipo NAO e venda, e o
 * pedido de venda tem seu proprio formulario, movido a fichas tecnicas.
 */

export const INGREDIENT_PRESETS: BakeryPreset[] = [
  { id: 'i1', name: 'Farinha de Trigo', type: 'reposicao' },
  { id: 'i2', name: 'Açúcar', type: 'reposicao' },
  { id: 'i3', name: 'Leite Condensado', type: 'reposicao' },
  { id: 'i4', name: 'Creme de Leite', type: 'reposicao' },
  { id: 'i5', name: 'Manteiga', type: 'reposicao' },
  { id: 'i6', name: 'Chocolate', type: 'reposicao' },
  { id: 'i7', name: 'Embalagens', type: 'reposicao' },
  { id: 'i8', name: 'Confeitos e Decoração', type: 'reposicao' },
];

export const LABOR_PRESETS: BakeryPreset[] = [
  { id: 'l1', name: 'Minha Mão de Obra', type: 'maodeobra' },
  { id: 'l2', name: 'Ajudante', type: 'maodeobra' },
  { id: 'l3', name: 'Freelancer de Decoração', type: 'maodeobra' },
  { id: 'l4', name: 'Entrega', type: 'maodeobra' },
];

export const COST_PRESETS: BakeryPreset[] = [
  { id: 'c1', name: 'Gás', type: 'custo', categoryTag: 'fixo' },
  { id: 'c2', name: 'Energia Elétrica', type: 'custo', categoryTag: 'fixo' },
  { id: 'c3', name: 'Água', type: 'custo', categoryTag: 'fixo' },
  { id: 'c4', name: 'Internet', type: 'custo', categoryTag: 'fixo' },
  { id: 'c5', name: 'Aluguel', type: 'custo', categoryTag: 'fixo' },
  { id: 'c6', name: 'Taxas de Pagamento', type: 'custo', categoryTag: 'variavel' },
  { id: 'c7', name: 'Divulgação e Anúncios', type: 'custo', categoryTag: 'variavel' },
  { id: 'c8', name: 'Combustível / Transporte', type: 'custo', categoryTag: 'variavel' },
  { id: 'inv1', name: 'Formas e Utensílios', type: 'investimento', categoryTag: 'investimento' },
  { id: 'inv2', name: 'Equipamento', type: 'investimento', categoryTag: 'investimento' },
];
