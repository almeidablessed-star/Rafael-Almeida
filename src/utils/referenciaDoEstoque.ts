import { Produto } from '../types';
import { convertQuantity } from './units';

/**
 * "Estoque cheio" (`quantidadeReferencia`) que o anel do Estoque usa, depois
 * de uma atualizacao do produto. So aumento de quantidade reseta o cheio
 * (mesma regra de sempre); o resto mantem o cheio anterior.
 *
 * Tudo e comparado na unidade NOVA da embalagem. A compra converte o saldo
 * para a unidade dela (4725 g viram 4,725 kg) e troca a unidade do produto.
 * Antes a comparacao era feita nos numeros crus: 9,725 kg "parecia" menor que
 * 4725, o cheio ficava 5000 (que era em g) e passava a ser lido como 5000 kg
 * — o anel aparecia quase vazio com o pote cheio.
 *
 * Unidade trocada por outra que nao converte (g para un): o cheio antigo nao
 * quer dizer mais nada, entao o cheio passa a ser a quantidade nova.
 *
 * `undefined` = produto que nao estava na lista; quem chama nao mexe no cheio.
 */
export const referenciaDoCheio = (
  anterior: Pick<Produto, 'quantidadeAtual' | 'quantidadeReferencia' | 'unidadeEmbalagem'> | undefined,
  novo: Pick<Produto, 'quantidadeAtual' | 'unidadeEmbalagem'>
): number | null | undefined => {
  if (!anterior) return undefined;

  const naUnidadeNova = (quantidade: number): number | null =>
    anterior.unidadeEmbalagem === novo.unidadeEmbalagem
      ? quantidade
      : convertQuantity(quantidade, anterior.unidadeEmbalagem, novo.unidadeEmbalagem);

  const quantidadeAnterior = naUnidadeNova(anterior.quantidadeAtual ?? 0);
  if (quantidadeAnterior === null || (novo.quantidadeAtual ?? 0) > quantidadeAnterior) {
    return novo.quantidadeAtual;
  }

  return anterior.quantidadeReferencia == null
    ? anterior.quantidadeReferencia
    : naUnidadeNova(anterior.quantidadeReferencia);
};
