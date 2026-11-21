import { FichaTecnica, TamanhoOpcao } from '../types';
import { normalizeName } from './fichaMatcher';
import { CategoriaFicha, ConfigCategorias, ORDEM_DAS_CATEGORIAS, categoriasDeMontagem } from './categoriasFichas';

/**
 * "Montar bolo" no pedido: a cliente escolhe o tamanho, a massa, os recheios e
 * os extras, e o bolo vira UM item do pedido.
 *
 * Cada parte e uma ficha comum, cadastrada numa aba marcada para o Montar bolo
 * (utils/categoriasFichas.ts). O tamanho e escolhido uma vez e casado pelo
 * NOME do tamanho em cada ficha ("20 cm" na massa = "20 cm" no recheio), porque
 * os ids de tamanho sao de cada ficha.
 *
 * Preco, reposicao, despesas e investimento do bolo = soma das partes naquele
 * tamanho. A mao de obra tambem comeca pela soma (cada ficha guarda o tempo
 * daquela parte), mas a confeiteira pode trocar: o preco muda pela diferenca.
 * Ingredientes e despesas nunca mudam com isso — so o pagamento dela.
 */

export const BOLO_MONTADO = 'Bolo montado';

export interface MontagemState {
  /** Nome do tamanho como aparece nas fichas ("20 cm"). */
  tamanho: string;
  /** Ids das fichas escolhidas em cada aba, na ordem em que foram marcadas. */
  escolhas: Partial<Record<CategoriaFicha, string[]>>;
  /** Mao de obra digitada (por unidade). Vazio = a soma das partes. */
  maoDeObra?: string;
}

export interface ParteDaMontagem {
  fichaId: string;
  nome: string;
  categoria: CategoriaFicha;
  /** Id do tamanho NESTA ficha; null quando a ficha nao tem o tamanho escolhido. */
  tamanhoId: string | null;
  venda: number;
  reposicao: number;
  maoDeObra: number;
  custo: number;
  investimento: number;
}

export interface ContaDaMontagem {
  partes: ParteDaMontagem[];
  /** Nomes das partes escolhidas que nao tem o tamanho do bolo. */
  semOTamanho: string[];
  maoDeObraDasPartes: number;
  /** Ja com a mao de obra digitada, se houver. */
  maoDeObra: number;
  venda: number;
  reposicao: number;
  custo: number;
  investimento: number;
}

/** "20 cm", "20cm" e "20 CM" sao o mesmo tamanho: cada ficha foi digitada de um jeito. */
const chaveDoTamanho = (rotulo: string) => normalizeName(rotulo).replace(/\s+/g, '');

export const tamanhoDaFicha = (ficha: FichaTecnica, tamanho: string): TamanhoOpcao | undefined => {
  const alvo = chaveDoTamanho(tamanho);
  if (!alvo) return undefined;
  return (ficha.tamanhos || []).find((t) => chaveDoTamanho(t.descricao || '') === alvo);
};

const porNome = (a: FichaTecnica, b: FichaTecnica) =>
  a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base', numeric: true });

/** As fichas de uma aba, em ordem alfabetica (como na tela de Fichas). */
export const fichasDaAba = (fichas: FichaTecnica[], categoria: CategoriaFicha) =>
  fichas.filter((f) => f.category === categoria).sort(porNome);

/**
 * Os passos do Montar bolo: as abas marcadas e, se um pedido antigo tiver
 * escolha numa aba que deixou de ser marcada, essa aba tambem — senao a parte
 * contaria no preco sem aparecer na tela.
 */
export const passosDaMontagem = (config: ConfigCategorias, montagem?: MontagemState): CategoriaFicha[] => {
  const marcadas = new Set(categoriasDeMontagem(config));
  return ORDEM_DAS_CATEGORIAS.filter((c) => marcadas.has(c) || (montagem?.escolhas[c]?.length ?? 0) > 0);
};

/**
 * Os tamanhos que aparecem para escolher: todos os nomes de tamanho das fichas
 * das abas do Montar bolo, na ordem em que surgem (primeira aba primeiro).
 */
export const tamanhosDaMontagem = (fichas: FichaTecnica[], passos: CategoriaFicha[]): string[] => {
  const vistos = new Map<string, string>();
  for (const categoria of passos) {
    for (const ficha of fichasDaAba(fichas, categoria)) {
      for (const t of ficha.tamanhos || []) {
        const rotulo = (t.descricao || '').trim();
        const chave = chaveDoTamanho(rotulo);
        if (chave && !vistos.has(chave)) vistos.set(chave, rotulo);
      }
    }
  }
  return Array.from(vistos.values());
};

export const calcularMontagem = (
  montagem: MontagemState,
  fichas: FichaTecnica[],
  lerNumero: (texto: string) => number,
): ContaDaMontagem => {
  const partes: ParteDaMontagem[] = [];
  const semOTamanho: string[] = [];

  for (const categoria of ORDEM_DAS_CATEGORIAS) {
    for (const fichaId of montagem.escolhas[categoria] || []) {
      const ficha = fichas.find((f) => String(f.id) === String(fichaId));
      if (!ficha) continue;
      const tamanho = tamanhoDaFicha(ficha, montagem.tamanho);
      if (!tamanho) {
        semOTamanho.push(ficha.name);
        partes.push({ fichaId: ficha.id, nome: ficha.name, categoria, tamanhoId: null, venda: 0, reposicao: 0, maoDeObra: 0, custo: 0, investimento: 0 });
        continue;
      }
      partes.push({
        fichaId: ficha.id,
        nome: ficha.name,
        categoria,
        tamanhoId: tamanho.id,
        venda: tamanho.preco || 0,
        // Mesmo calculo do item comum do pedido (TransactionFormModal): a
        // reposicao e a soma dos insumos deste tamanho.
        reposicao: (tamanho.ingredients || []).reduce((s, ing) => s + (ing.totalCost || 0), 0),
        maoDeObra: tamanho.maoDeObraCost ?? ficha.maoDeObraCost ?? 0,
        custo: tamanho.custoCost ?? ficha.custoCost ?? 0,
        investimento: tamanho.investimentoCost ?? ficha.investimentoCost ?? 0,
      });
    }
  }

  const soma = (campo: keyof Pick<ParteDaMontagem, 'venda' | 'reposicao' | 'maoDeObra' | 'custo' | 'investimento'>) =>
    partes.reduce((s, p) => s + p[campo], 0);

  const maoDeObraDasPartes = soma('maoDeObra');
  const digitada = (montagem.maoDeObra || '').trim();
  const maoDeObra = digitada ? Math.max(0, lerNumero(digitada) || 0) : maoDeObraDasPartes;

  return {
    partes,
    semOTamanho,
    maoDeObraDasPartes,
    maoDeObra,
    venda: Math.max(0, soma('venda') + (maoDeObra - maoDeObraDasPartes)),
    reposicao: soma('reposicao'),
    custo: soma('custo'),
    investimento: soma('investimento'),
  };
};

/** "Bolo montado 20 cm" — o nome do item na folha e nas listas. */
export const nomeDoBoloMontado = (tamanho: string) => (tamanho ? `${BOLO_MONTADO} ${tamanho}` : BOLO_MONTADO);
