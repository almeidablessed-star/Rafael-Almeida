import { describe, expect, it } from 'vitest';
import { calcularMontagem, tamanhosDaMontagem } from '../utils/boloMontado';
import { lerConfigCategorias } from '../utils/categoriasFichas';
import { parseNumeroDigitado } from '../utils/formatters';

const ficha = (id: string, category: string, tamanhos: [string, number, number, number][]) => ({
  id,
  name: id,
  category,
  ingredients: [],
  maoDeObraCost: 0,
  custoCost: 0,
  investimentoCost: 0,
  tamanhos: tamanhos.map(([descricao, preco, mao, insumo], i) => ({
    id: `${id}-${i}`,
    descricao,
    preco,
    maoDeObraCost: mao,
    custoCost: 2,
    investimentoCost: 1,
    ingredients: [{ id: 'x', stockItemId: '1', name: 'x', quantity: 1, unit: 'un', totalCost: insumo }],
  })),
}) as any;

const FICHAS = [
  ficha('massa', 'doces', [['15 cm', 45, 12, 10], ['20 cm', 65, 16, 18]]),
  ficha('recheio', 'salgados', [['20 cm', 35, 7, 12]]),
  ficha('extra', 'saudaveis', [['20cm', 25, 3, 13]]),
];

describe('bolo montado', () => {
  it('soma as partes no tamanho escolhido (casando o nome do tamanho)', () => {
    const c = calcularMontagem({ tamanho: '20 cm', escolhas: { doces: ['massa'], salgados: ['recheio'], saudaveis: ['extra'] } }, FICHAS, parseNumeroDigitado);
    expect(c.venda).toBe(125);
    expect(c.reposicao).toBe(43);
    expect(c.maoDeObra).toBe(26);
    expect(c.custo).toBe(6);
    expect(c.partes.map((p) => p.tamanhoId)).toEqual(['massa-1', 'recheio-0', 'extra-0']);
    expect(c.semOTamanho).toEqual([]);
  });

  it('mao de obra digitada muda o preco pela diferenca e nunca fica negativa', () => {
    const base = { tamanho: '20 cm', escolhas: { doces: ['massa'], salgados: ['recheio'] } };
    expect(calcularMontagem({ ...base, maoDeObra: '50' }, FICHAS, parseNumeroDigitado).venda).toBe(100 + (50 - 23));
    const zero = calcularMontagem({ ...base, maoDeObra: '-10' }, FICHAS, parseNumeroDigitado);
    expect(zero.maoDeObra).toBe(0);
    expect(zero.venda).toBe(100 - 23);
  });

  it('avisa a parte que nao tem o tamanho e nao cobra por ela', () => {
    const c = calcularMontagem({ tamanho: '15 cm', escolhas: { doces: ['massa'], salgados: ['recheio'] } }, FICHAS, parseNumeroDigitado);
    expect(c.semOTamanho).toEqual(['recheio']);
    expect(c.venda).toBe(45);
  });

  it('lista os tamanhos sem repetir', () => {
    expect(tamanhosDaMontagem(FICHAS, ['doces', 'salgados', 'saudaveis'])).toEqual(['15 cm', '20 cm']);
  });

  it('config estranha no banco volta ao padrao sem quebrar', () => {
    const c = lerConfigCategorias({ doces: { nome: '  Massas ', montagem: 7 }, kids: 'x' });
    expect(c.doces.nome).toBe('Massas');
    expect(c.doces.montagem).toBe(0);
    expect(c.kids.nome).toBe('Kids Friendly');
    expect(lerConfigCategorias(null).bolos.nome).toBe('Bolos & Massas');
  });
});
