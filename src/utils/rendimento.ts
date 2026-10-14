import { FichaTecnica } from '../types';

/**
 * Descricao do primeiro tamanho — o que servia de rendimento na epoca em que a
 * ficha nao tinha campo proprio para isso ("10 fatias" costumava ser a
 * descricao do tamanho tambem).
 *
 * E so uma APROXIMACAO, e desencaminha quando a descricao e um diametro
 * ("20 cm", um tamanho, nao uma contagem). Por isso serve para EXIBIR o que da
 * para exibir de uma ficha antiga — nunca para preencher um campo que vai ser
 * gravado: ver [[handleOpenEdit]], onde esse pre-preenchimento gravava o
 * diametro no lugar do rendimento sem ninguem perceber.
 */
export const getRendimentoSugerido = (ficha: FichaTecnica): string =>
  ficha.tamanhos?.[0]?.descricao || '1';

/**
 * Rendimento como deve APARECER (folha da cozinha, telas de leitura).
 *
 * Fichas salvas antes de `rendimento` passar a ser persistido (2026-09-10) tem
 * o campo vazio: sem este fallback a folha da cozinha imprime o rotulo
 * "Rendimento:" seguido de nada.
 */
export const formatRendimentoParaExibir = (ficha: FichaTecnica): string =>
  ficha.yieldInfo?.trim() || getRendimentoSugerido(ficha);

/**
 * Rotulo gravado para cada unidade do seletor de rendimento. Fonte unica:
 * o seletor e a composicao na gravacao leem daqui.
 */
export const RENDIMENTO_UNIDADES: Record<string, string> = {
  fatias: 'fatias',
  gramas: 'g',
  unidades: 'unidades',
  ml: 'ml',
};

/**
 * Texto do rendimento como ele deve ser GRAVADO: numero digitado + unidade do
 * seletor.
 *
 * Ate aqui a unidade so entrava se a pessoa abrisse o seletor e clicasse numa
 * opcao; quem aceitava o padrao gravava "10" e a folha da cozinha imprimia
 * "Rendimento: 10" — 10 do que? A unidade nao tem coluna propria, entao ela
 * viaja junto no texto.
 *
 * Só completa quando o que foi digitado e um numero puro. Texto que ja diz a
 * unidade ("10 fatias", "meia travessa") passa intacto, sem duplicar nada.
 */
export const comporRendimentoParaGravar = (valor: string, unidade: string): string => {
  const texto = (valor || '').trim();
  if (!texto) return '';
  if (!/^[\d.,]+$/.test(texto)) return texto;
  return `${texto} ${RENDIMENTO_UNIDADES[unidade] || unidade}`;
};

/**
 * Qual opcao do seletor corresponde a um rendimento ja gravado.
 *
 * Sem isto o seletor abriria sempre em "Fatias" — ou, pior, na unidade que
 * sobrou da ficha anterior aberta na mesma sessao —, e salvar uma ficha
 * gravada em gramas a converteria em fatias sem ninguem pedir.
 */
export const deduzirUnidadeDoRendimento = (texto?: string): string => {
  const t = (texto || '').toLowerCase();
  if (/fatias?/.test(t)) return 'fatias';
  if (/unidades?|\bun\b/.test(t)) return 'unidades';
  if (/\bml\b/.test(t)) return 'ml';
  if (/gramas?|\bg\b/.test(t)) return 'gramas';
  return 'fatias';
};
