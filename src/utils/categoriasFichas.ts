/**
 * As 5 abas da tela de Fichas, do jeito de cada confeiteira.
 *
 * As chaves continuam fixas (`bolos`, `doces`...) porque sao elas que ficam
 * gravadas em cada ficha (`fichas_tecnicas.categoria`). O que muda por conta e
 * so o que aparece: o nome, o emoji e se a aba entra no "Montar bolo" do pedido.
 *
 * Fica em `usuarias.categorias_fichas` (jsonb). Conta sem nada gravado — ou com
 * algo estranho la dentro — usa o padrao abaixo, que e exatamente o que o app
 * mostrava antes: ninguem ve diferenca ate mexer.
 *
 * "Montar bolo": quem vende o bolo montado pela cliente (massa + recheios +
 * extras) cadastra cada parte como ficha, numa aba propria, e marca aqui quantas
 * dessa aba a cliente pode escolher. O pedido soma o preco de cada parte no
 * tamanho escolhido. Ver utils/boloMontado.ts.
 */

export type CategoriaFicha = 'bolos' | 'doces' | 'salgados' | 'saudaveis' | 'kids';

export const ORDEM_DAS_CATEGORIAS: CategoriaFicha[] = ['bolos', 'doces', 'salgados', 'saudaveis', 'kids'];

/** 0 = a aba nao entra no "Montar bolo"; VARIOS = quantas quiser. */
export const VARIOS = 99;
export const ESCOLHAS_DE_MONTAGEM = [0, 1, 2, 3, 4, VARIOS] as const;

export interface ConfigCategoria {
  nome: string;
  icone: string;
  montagem: number;
}

export type ConfigCategorias = Record<CategoriaFicha, ConfigCategoria>;

export const CATEGORIAS_PADRAO: ConfigCategorias = {
  bolos: { nome: 'Bolos & Massas', icone: '🎂', montagem: 0 },
  doces: { nome: 'Doces & Sobremesas', icone: '🧁', montagem: 0 },
  salgados: { nome: 'Salgados & Lanches', icone: '🥟', montagem: 0 },
  saudaveis: { nome: 'Saudáveis & Fit', icone: '🥗', montagem: 0 },
  kids: { nome: 'Kids Friendly', icone: '🧸', montagem: 0 },
};

/**
 * Abas de quem comeca do zero (conta sem nenhuma ficha), combinado em 20/11/2026:
 * ja prontas para o "Montar bolo". Quem ja tinha fichas continua com
 * CATEGORIAS_PADRAO — os bolos inteiros dela moram na primeira aba, e chamar
 * essa aba de "Massas" so confundiria. Ver useCategoriasFichas.
 */
export const CATEGORIAS_CONTA_NOVA: ConfigCategorias = {
  bolos: { nome: 'Massas', icone: '🍰', montagem: 1 },
  doces: { nome: 'Recheios', icone: '🍫', montagem: 3 },
  salgados: { nome: 'Coberturas', icone: '🍓', montagem: VARIOS },
  saudaveis: { nome: 'Salgados & Lanches', icone: '🥟', montagem: 0 },
  kids: { nome: 'Bolos & Doces', icone: '🧁', montagem: 0 },
};

export const EMOJIS_DAS_CATEGORIAS = ['🎂', '🍰', '🧁', '🍫', '🍓', '🍒', '🥥', '🍪', '🍮', '🍩', '🥧', '🍬', '🥟', '🥐', '🥗', '🧸', '⭐'];

export const NOME_MAXIMO = 24;

/**
 * Le o que veio do banco e devolve sempre as 5 abas completas. Campo que faltar
 * ou vier invalido fica com o padrao daquela aba — nunca quebra a tela.
 */
export const lerConfigCategorias = (bruto: unknown): ConfigCategorias => {
  const fonte = bruto && typeof bruto === 'object' ? (bruto as Record<string, any>) : {};
  const config = {} as ConfigCategorias;
  for (const chave of ORDEM_DAS_CATEGORIAS) {
    const padrao = CATEGORIAS_PADRAO[chave];
    const salvo = fonte[chave] && typeof fonte[chave] === 'object' ? fonte[chave] : {};
    const nome = typeof salvo.nome === 'string' ? salvo.nome.trim().slice(0, NOME_MAXIMO) : '';
    const icone = typeof salvo.icone === 'string' && salvo.icone.trim() ? salvo.icone.trim().slice(0, 8) : padrao.icone;
    const montagem = (ESCOLHAS_DE_MONTAGEM as readonly number[]).includes(Number(salvo.montagem)) ? Number(salvo.montagem) : 0;
    config[chave] = { nome: nome || padrao.nome, icone, montagem };
  }
  return config;
};

/** As abas marcadas para o "Montar bolo", na ordem da tela de Fichas. */
export const categoriasDeMontagem = (config: ConfigCategorias): CategoriaFicha[] =>
  ORDEM_DAS_CATEGORIAS.filter((c) => config[c].montagem > 0);

/** "escolha 1", "até 3", "quantas quiser" — o rotulo de cada passo do Montar bolo. */
export const rotuloDaEscolha = (montagem: number): string =>
  montagem === 1 ? 'escolha 1' : montagem >= VARIOS ? 'quantos quiser' : `até ${montagem}`;
