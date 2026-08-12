import { Transaction, BakeryPreset } from '../types';
import { getTodayIso } from '../utils/formatters';

export const BAKERY_PRODUCT_PRESETS: BakeryPreset[] = [
  { id: 'p1', name: 'Bolo Decorado de Aniversário (2kg)', type: 'venda', defaultUnitValue: 140.00 },
  { id: 'p2', name: 'Cento de Brigadeiros Gourmet', type: 'venda', defaultUnitValue: 120.00 },
  { id: 'p3', name: 'Fatia de Torta Holandesa / Morango', type: 'venda', defaultUnitValue: 15.00 },
  { id: 'p4', name: 'Kit Festa Completo (Bolo + Doces)', type: 'venda', defaultUnitValue: 280.00 },
  { id: 'p5', name: 'Caixa de Cupcakes Decorados (4 un)', type: 'venda', defaultUnitValue: 48.00 },
  { id: 'p6', name: 'Bolo no Pote (Ninho com Nutella)', type: 'venda', defaultUnitValue: 12.00 },
  { id: 'p7', name: 'Pão de Mel Recheado', type: 'venda', defaultUnitValue: 8.50 },
  { id: 'p8', name: 'Torta Salgada de Frango (Aproximado)', type: 'venda', defaultUnitValue: 85.00 },
];

export const INGREDIENT_PRESETS: BakeryPreset[] = [
  { id: 'i1', name: 'Farinha de Trigo Premium 5kg', type: 'reposicao', defaultUnitValue: 22.50 },
  { id: 'i2', name: 'Caixa de Leite Condensado (27 un)', type: 'reposicao', defaultUnitValue: 145.00 },
  { id: 'i3', name: 'Creme de Leite 1kg', type: 'reposicao', defaultUnitValue: 18.00 },
  { id: 'i4', name: 'Manteiga Sem Sal 500g', type: 'reposicao', defaultUnitValue: 24.00 },
  { id: 'i5', name: 'Barra Chocolate Nobre 1kg', type: 'reposicao', defaultUnitValue: 58.00 },
  { id: 'i6', name: 'Embalagens Transparentes P/ Bolo', type: 'reposicao', defaultUnitValue: 42.00 },
  { id: 'i7', name: 'Granulado Gourmet Callebaut 500g', type: 'reposicao', defaultUnitValue: 45.00 },
  { id: 'i8', name: 'Massa / Pasta Americana 800g', type: 'reposicao', defaultUnitValue: 32.00 },
];

export const LABOR_PRESETS: BakeryPreset[] = [
  { id: 'l1', name: 'Minha Mão de Obra (Pro-labore Confeiteira)', type: 'maodeobra', defaultUnitValue: 150.00 },
  { id: 'l2', name: 'Ajudante de Confeitaria (Diária)', type: 'maodeobra', defaultUnitValue: 100.00 },
  { id: 'l3', name: 'Free-lancer Decoração de Bolos', type: 'maodeobra', defaultUnitValue: 120.00 },
  { id: 'l4', name: 'Taxa de Entregador / Motoboy', type: 'maodeobra', defaultUnitValue: 35.00 },
];

export const COST_PRESETS: BakeryPreset[] = [
  { id: 'c1', name: 'Gás de Cozinha (Botijão)', type: 'custo', defaultUnitValue: 115.00, categoryTag: 'fixo' },
  { id: 'c2', name: 'Conta de Energia Elétrica (Forno/Geladeira)', type: 'custo', defaultUnitValue: 190.00, categoryTag: 'fixo' },
  { id: 'c3', name: 'Taxas de Máquina de Cartão', type: 'custo', defaultUnitValue: 45.00, categoryTag: 'variavel' },
  { id: 'c4', name: 'Anúncios no Instagram / Divulgação', type: 'custo', defaultUnitValue: 60.00, categoryTag: 'variavel' },
  { id: 'inv1', name: 'Formas de Silicone & Cortadores Novos', type: 'investimento', defaultUnitValue: 135.00, categoryTag: 'investimento' },
  { id: 'inv2', name: 'Batedeira Planetária Profissional 12L', type: 'investimento', defaultUnitValue: 850.00, categoryTag: 'investimento' },
];

export const SAMPLE_INITIAL_TRANSACTIONS: Transaction[] = [];
