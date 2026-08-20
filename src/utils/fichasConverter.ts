import { FichaTecnica, TamanhoOpcao, IngredientUsage } from '../types';

/**
 * Converte uma ficha técnica antiga (com yieldInfo e sugestaoVenda)
 * para a nova estrutura com múltiplos tamanhos
 */
export function convertFichaAntiga(
  id: string,
  name: string,
  category: any,
  imageUrl: string | undefined,
  yieldInfo: string,
  ingredients: IngredientUsage[],
  maoDeObraCost: number,
  custoCost: number,
  investimentoCost: number,
  sugestaoVenda: number
): FichaTecnica {
  const tamanho: TamanhoOpcao = {
    id: `ts-${id}`,
    descricao: yieldInfo,
    preco: sugestaoVenda,
  };

  // Tenta extrair quantidade do yieldInfo
  const quantityMatch = yieldInfo.match(/^(\d+)/);
  if (quantityMatch) {
    tamanho.quantidade = parseInt(quantityMatch[1], 10);
  }

  return {
    id,
    name,
    category,
    imageUrl,
    tamanhos: [tamanho],
    ingredients,
    maoDeObraCost,
    custoCost,
    investimentoCost,
  };
}

/**
 * Cria uma ficha técnica com múltiplos tamanhos predefinidos
 * Útil para bolos que têm vários tamanhos disponíveis
 */
export function createFichaComMultiplosTamanhos(
  id: string,
  name: string,
  category: any,
  imageUrl: string | undefined,
  ingredients: IngredientUsage[],
  maoDeObraCost: number,
  custoCost: number,
  investimentoCost: number,
  tamanhos: TamanhoOpcao[]
): FichaTecnica {
  return {
    id,
    name,
    category,
    imageUrl,
    tamanhos,
    ingredients,
    maoDeObraCost,
    custoCost,
    investimentoCost,
  };
}
