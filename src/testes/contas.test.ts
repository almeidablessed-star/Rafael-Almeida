// Contas de dinheiro conferidas sozinhas antes de publicar (npm test).
// Os valores esperados vieram da tela, conferidos a mao na conta de teste.
import { describe, expect, it } from 'vitest';
import { parseNumeroDigitado, numeroComVirgula, quantidadeDoInsumo } from '../utils/formatters';
import { situacaoPagamento, faltaReceberDoPedido } from '../utils/situacaoPagamento';
import { ajustarRecebimentos, recebidoNoPeriodo } from '../utils/recebimentos';
import {
  calcularEstruturaFinanceira,
  calcularTotalAReceberGeral,
  somarDespesasEmpresa,
} from '../utils/financialEngine';
import { telefoneParaWhatsApp } from '../utils/telefoneWhatsApp';
import { dataNoAno, proximaData, proximoAniversario } from '../utils/datasComemorativas';
import { erroDaEmpresa } from '../utils/validarEmpresa';
import { mensagemDeErro } from '../utils/mensagemDeErro';
import type { Transaction } from '../types';

const venda = (campos: Partial<Transaction>): Transaction =>
  ({ id: 1, type: 'venda', description: 'Bolo', date: '2026-11-02', totalValue: 100, createdAt: '2026-11-02T12:00:00Z', ...campos }) as Transaction;

describe('valor digitado', () => {
  it('le o jeito brasileiro e o americano', () => {
    expect(parseNumeroDigitado('1.234,56')).toBe(1234.56);
    expect(parseNumeroDigitado('1,234.56')).toBe(1234.56);
    expect(parseNumeroDigitado('25,90')).toBe(25.9);
    expect(parseNumeroDigitado('3.000')).toBe(3000);
    expect(parseNumeroDigitado('abc')).toBe(0);
  });
  it('quantidade de insumo com virgula vira numero', () => {
    expect(quantidadeDoInsumo('0,5')).toBe(0.5);
    expect(quantidadeDoInsumo(275)).toBe(275);
  });
  it('mostra com virgula', () => {
    expect(numeroComVirgula(34, 2)).toBe('34,00');
    expect(numeroComVirgula(117.66, 1)).toBe('117,7');
  });
});

describe('pagamento do pedido', () => {
  it('pendente, sinal e pago', () => {
    expect(situacaoPagamento({ paymentStatus: 'pendente', totalValue: 100 })).toBe('pendente');
    expect(situacaoPagamento({ paymentStatus: 'pago', signalValue: 30, totalValue: 100 })).toBe('sinal');
    expect(situacaoPagamento({ paymentStatus: 'pago', totalValue: 100 })).toBe('pago');
  });
  it('falta receber', () => {
    expect(faltaReceberDoPedido({ paymentStatus: 'pendente', totalValue: 92.19 })).toBe(92.19);
    expect(faltaReceberDoPedido({ paymentStatus: 'pago', signalValue: 50.5, totalValue: 100 })).toBe(49.5);
    expect(faltaReceberDoPedido({ paymentStatus: 'pago', totalValue: 100 })).toBe(0);
  });
  it('a receber geral soma pendentes e restantes', () => {
    const lista = [
      venda({ paymentStatus: 'pendente', totalValue: 92.19 }),
      venda({ paymentStatus: 'pago', signalValue: 30, totalValue: 100 }),
      venda({ paymentStatus: 'pago', totalValue: 92.19 }),
    ];
    expect(calcularTotalAReceberGeral(lista)).toBeCloseTo(162.19, 2);
  });
});

describe('dinheiro que entrou na semana', () => {
  it('o restante pago depois entra na semana em que foi pago', () => {
    const lista = ajustarRecebimentos([{ valor: 30, em: '2026-10-28' }], 100, '2026-11-02');
    expect(lista).toEqual([{ valor: 30, em: '2026-10-28' }, { valor: 70, em: '2026-11-02' }]);
    const tx = venda({ paymentStatus: 'pago', totalValue: 100, recebimentos: lista } as Partial<Transaction>);
    expect(recebidoNoPeriodo(tx, '2026-11-02', '2026-11-08')).toBe(70);
    expect(recebidoNoPeriodo(tx, '2026-10-26', '2026-11-01')).toBe(30);
  });
  it('voltar para pendente tira o que tinha entrado', () => {
    expect(ajustarRecebimentos([{ valor: 30, em: '2026-10-28' }, { valor: 70, em: '2026-11-02' }], 0, '2026-11-03')).toEqual([]);
  });
});

describe('meta da empresa', () => {
  it('faturamento necessario igual ao da tela', () => {
    const despesas = somarDespesasEmpresa([
      { nome: 'Aluguel', valor: 200, percentualRateio: 100, ordem: 0 },
      { nome: 'Energia', valor: 75, percentualRateio: 100, ordem: 1 },
      { nome: 'Água', valor: 20, percentualRateio: 100, ordem: 2 },
      { nome: 'Internet', valor: 24, percentualRateio: 100, ordem: 3 },
    ] as any);
    expect(despesas).toBe(319);
    const e = calcularEstruturaFinanceira(3000, despesas, 34, 5, 13);
    expect(e.valido).toBe(true);
    expect(e.faturamentoNecessario).toBeCloseTo(6914.58, 2);
  });
  it('recusa metas impossiveis com mensagem em portugues', () => {
    expect(erroDaEmpresa({ profitTargetPercent: 200 })).toMatch(/entre 0 e 99/);
    expect(erroDaEmpresa({ cmvTargetPercent: 60, investmentTargetPercent: 20, profitTargetPercent: 30 })).toMatch(/abaixo de 100%/);
    expect(erroDaEmpresa({ monthlyIncomeTarget: 0 })).toMatch(/receber por mês/);
    expect(erroDaEmpresa({ monthlyIncomeTarget: 3000, horaTrabalho: 20 })).toBeNull();
  });
});

describe('WhatsApp', () => {
  it('celular de Sao Paulo vai para o Brasil', () => {
    expect(telefoneParaWhatsApp('(11) 98765-4321')).toBe('5511987654321');
    expect(telefoneParaWhatsApp('(21) 98765-4321')).toBe('5521987654321');
  });
  it('numero americano continua americano', () => {
    expect(telefoneParaWhatsApp('7814206892')).toBe('17814206892');
    expect(telefoneParaWhatsApp('+1 781 420 6892')).toBe('17814206892');
    expect(telefoneParaWhatsApp('1 (781) 420-6892')).toBe('17814206892');
  });
  it('numero com o pais na frente nao muda', () => {
    expect(telefoneParaWhatsApp('+55 11 98765-4321')).toBe('5511987654321');
  });
});

describe('datas comemorativas', () => {
  it('datas moveis de 2026 e 2027', () => {
    expect(dataNoAno({ pascoa: true }, 2026)).toBe('2026-04-05');
    expect(dataNoAno({ pascoa: true }, 2027)).toBe('2027-03-28');
    expect(dataNoAno({ mes: 4, diaDaSemana: 0, n: 2 }, 2027)).toBe('2027-05-09'); // Dia das Maes
    expect(dataNoAno({ mes: 10, diaDaSemana: 4, n: 4 }, 2026)).toBe('2026-11-26'); // Thanksgiving
  });
  it('proxima vez que acontece', () => {
    expect(proximaData({ fixa: '10-31' }, '2026-11-02')).toBe('2027-10-31');
    expect(proximaData({ fixa: '12-25' }, '2026-11-02')).toBe('2026-12-25');
    expect(proximoAniversario('1990-02-29', '2026-11-02')).toBe('2027-02-28');
  });
});

describe('mensagens de erro', () => {
  it('traduz os erros tecnicos', () => {
    expect(mensagemDeErro(new TypeError('Failed to fetch'))).toMatch(/internet/);
    expect(mensagemDeErro({ message: 'JWT expired' })).toMatch(/sessão/);
    expect(mensagemDeErro({ message: 'new row violates check constraint "x"' })).toMatch(/fora do permitido/);
    expect(mensagemDeErro(new Error('Pedido sem produto'))).toBe('Pedido sem produto');
  });
});
