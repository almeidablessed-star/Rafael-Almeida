import { numeroComVirgula } from './formatters';

/**
 * Conferencia dos numeros de Minha Empresa antes de gravar. Sem ela, "abc" ou
 * vazio virava 0 em silencio, e 200% de lucro voltava com o erro do banco em
 * ingles. Devolve a mensagem para a pessoa, ou null quando esta tudo certo.
 */
export const erroDaEmpresa = (campos: {
  monthlyIncomeTarget?: number;
  horaTrabalho?: number;
  cmvTargetPercent?: number;
  investmentTargetPercent?: number;
  profitTargetPercent?: number;
}): string | null => {
  if (campos.monthlyIncomeTarget !== undefined && !(campos.monthlyIncomeTarget > 0))
    return 'Digite quanto você quer receber por mês, só com números (ex.: 3.000).';
  if (campos.horaTrabalho !== undefined && !(campos.horaTrabalho > 0))
    return 'Digite quanto vale sua hora de trabalho, só com números (ex.: 25).';
  const metas = [campos.cmvTargetPercent, campos.investmentTargetPercent, campos.profitTargetPercent];
  if (metas.some((m) => m !== undefined && !(m >= 0 && m < 100)))
    return 'Cada porcentagem precisa ficar entre 0 e 99.';
  if (metas.every((m) => m !== undefined)) {
    const soma = (metas as number[]).reduce((a, b) => a + b, 0);
    if (soma >= 100)
      return `Somadas, reposição, investimento e lucro dão ${numeroComVirgula(soma, 0)}%. Precisam ficar abaixo de 100%, senão não sobra nada para pagar você e as despesas.`;
  }
  return null;
};
