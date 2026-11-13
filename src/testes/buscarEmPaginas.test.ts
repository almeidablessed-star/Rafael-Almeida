// A lista inteira chega mesmo passando de 1000 itens (limite do Supabase por pedido).
import { describe, expect, it } from 'vitest';
import { buscarEmPaginas } from '../utils/buscarEmPaginas';

/** Faz de conta que e o Supabase: devolve so o pedaco pedido, no maximo 1000. */
const bancoCom = (total: number) => {
  const linhas = Array.from({ length: total }, (_, i) => ({ id: i + 1 }));
  const pedidos: [number, number][] = [];
  const buscar = async (de: number, ate: number) => {
    pedidos.push([de, ate]);
    return { data: linhas.slice(de, Math.min(ate + 1, de + 1000)), error: null };
  };
  return { buscar, pedidos };
};

describe('buscarEmPaginas', () => {
  it('traz os 2500 lancamentos, sem repetir nem pular', async () => {
    const { buscar, pedidos } = bancoCom(2500);
    const todas = await buscarEmPaginas(buscar);
    expect(todas).toHaveLength(2500);
    expect(new Set(todas.map((l) => l.id)).size).toBe(2500);
    expect(pedidos).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
  });

  it('com exatamente 1000, confere se ha mais e para', async () => {
    const { buscar, pedidos } = bancoCom(1000);
    expect(await buscarEmPaginas(buscar)).toHaveLength(1000);
    expect(pedidos).toHaveLength(2);
  });

  it('lista pequena custa um pedido so', async () => {
    const { buscar, pedidos } = bancoCom(37);
    expect(await buscarEmPaginas(buscar)).toHaveLength(37);
    expect(pedidos).toHaveLength(1);
  });

  it('conta vazia devolve lista vazia', async () => {
    expect(await buscarEmPaginas(async () => ({ data: null, error: null }))).toEqual([]);
  });

  it('erro numa pagina sobe, em vez de devolver lista pela metade', async () => {
    const { buscar } = bancoCom(2500);
    const falhaNaSegunda = async (de: number, ate: number) =>
      de === 1000 ? { data: null, error: new Error('sem rede') } : buscar(de, ate);
    await expect(buscarEmPaginas(falhaNaSegunda)).rejects.toThrow('sem rede');
  });
});
