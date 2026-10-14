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
