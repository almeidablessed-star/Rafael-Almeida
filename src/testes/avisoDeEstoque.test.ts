// Aviso de compra em numero inteiro para produto contado (unidade, pacote).
import { describe, expect, it } from 'vitest';
import { avisoParaGravar, contaInteiro, sugestaoDeAviso } from '../utils/avisoDeEstoque';

describe('aviso de estoque', () => {
  it('unidade e pacote contam inteiro; peso e volume nao', () => {
    expect(['un', 'pacote'].map(contaInteiro)).toEqual([true, true]);
    expect(['g', 'kg', 'ml', 'L'].map(contaInteiro)).toEqual([false, false, false, false]);
  });

  it('embalagem de 2 un sugere aviso em 1 un, nao em 0,4', () => {
    expect(sugestaoDeAviso(2, 'un')).toBe('1');
    expect(sugestaoDeAviso(12, 'un')).toBe('2');
    expect(sugestaoDeAviso(1, 'pacote')).toBe('1');
  });

  it('peso continua em 20% da embalagem, com virgula', () => {
    expect(sugestaoDeAviso(5, 'kg')).toBe('1');
    expect(sugestaoDeAviso(2, 'kg')).toBe('0,4');
    expect(sugestaoDeAviso(1000, 'g')).toBe('200');
  });

  it('embalagem vazia ou invalida nao sugere nada', () => {
    expect(sugestaoDeAviso(0, 'un')).toBe('');
    expect(sugestaoDeAviso(NaN, 'kg')).toBe('');
  });

  it('aviso antigo com fracao em unidade sobe para o inteiro seguinte', () => {
    expect(avisoParaGravar(0.4, 'un')).toBe(1);
    expect(avisoParaGravar(2, 'un')).toBe(2);
    expect(avisoParaGravar(0, 'un')).toBe(0);
    expect(avisoParaGravar(2.5, 'kg')).toBe(2.5);
  });
});
