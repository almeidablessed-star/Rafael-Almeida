import { FichaTecnica, FichaOrderItem } from '../types';

/**
 * Casamento automatico entre o produto vendido e a ficha tecnica que o produz.
 *
 * O formulario de pedido NAO mostra um seletor de ficha — a vendedora escolhe
 * o produto e o sistema descobre a ficha sozinho. Este modulo e essa ponte.
 *
 * Historico: ate o commit 4832836 existia um <FichaTecnicaSelector> na tela e
 * o vinculo vinha da escolha manual. Ao remover o seletor (a pedido, por ser
 * ruido visual) o vinculo caiu junto e a baixa automatica de estoque parou de
 * acontecer por completo. Este arquivo restaura o vinculo sem devolver o campo.
 */

/**
 * Normaliza para comparacao: minusculas, sem acento, sem pontuacao repetida,
 * espacos colapsados. "Bolo  Vulcão!" e "bolo vulcao" viram a mesma coisa.
 */
export const normalizeName = (value: string): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacriticos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Encontra a ficha correspondente a um nome de produto.
 *
 * A busca e feita em degraus, do mais preciso ao mais tolerante, e para no
 * primeiro que acertar:
 *   1. id exato          — cobre quem ja tem vinculo gravado
 *   2. nome identico     — "Bolo Matilda" == "bolo matilda"
 *   3. um contem o outro — "Bolo Matilda" casa "Bolo Matilda Especial"
 *
 * Retorna undefined quando nao ha candidato — e isso e um resultado legitimo,
 * nao um erro: produtos avulsos ("Outro / Personalizado") nao tem ficha e
 * simplesmente nao movimentam estoque.
 */
export const findFichaForProduct = (
  productName: string,
  fichas: FichaTecnica[]
): FichaTecnica | undefined => {
  const target = normalizeName(productName);
  if (!target || fichas.length === 0) return undefined;

  const byId = fichas.find((f) => f.id === productName);
  if (byId) return byId;

  const exact = fichas.find((f) => normalizeName(f.name) === target);
  if (exact) return exact;

  // Degrau tolerante: exige 4+ caracteres para nao casar por acidente
  // ("Bolo" sozinho casaria com qualquer bolo do catalogo).
  if (target.length < 4) return undefined;

  return fichas.find((f) => {
    const name = normalizeName(f.name);
    return name.includes(target) || target.includes(name);
  });
};

/** Um item de pedido, no formato minimo que o casamento precisa. */
export interface MatchableOrderItem {
  productName: string;
  quantity: number;
  customDescription?: string;
  selectedSlices?: number; // Número de fatias/medida selecionada (para encontrar TamanhoOpcao)
}

/**
 * Converte os itens do pedido em vinculos com ficha, agregando repeticoes.
 *
 * Se o mesmo bolo aparecer em duas linhas (2x + 3x), vira um unico vinculo de
 * 5 — assim o consumo bate com o total vendido em vez de gerar dois registros
 * que precisariam ser somados depois.
 */
export const buildFichaItems = (
  orderItems: MatchableOrderItem[],
  fichas: FichaTecnica[]
): FichaOrderItem[] => {
  const byFichaId = new Map<string, FichaOrderItem>();

  orderItems.forEach((item) => {
    // "Outro / Personalizado" nao tem nome de catalogo; usa o texto livre.
    const lookupName =
      item.productName === 'Outro / Personalizado'
        ? item.customDescription || ''
        : item.productName;

    const ficha = findFichaForProduct(lookupName, fichas);
    if (!ficha) return;

    const quantity = Number(item.quantity) || 0;
    if (quantity <= 0) return;

    // Encontrar o TamanhoOpcao selecionado pelo número de fatias
    const selectedTamanho =
      item.selectedSlices && ficha.tamanhos && ficha.tamanhos.length > 0
        ? ficha.tamanhos.find(t => t.quantidade === item.selectedSlices)
        : undefined;

    const existing = byFichaId.get(ficha.id);
    if (existing) {
      existing.quantity += quantity;
      // Se houver tamanho, atualiza (último tamanho selecionado vence)
      if (selectedTamanho) {
        existing.selectedTamanhoId = selectedTamanho.id;
      }
    } else {
      byFichaId.set(ficha.id, {
        fichaId: ficha.id,
        fichaName: ficha.name,
        quantity,
        selectedTamanhoId: selectedTamanho?.id,
      });
    }
  });

  return Array.from(byFichaId.values());
};
