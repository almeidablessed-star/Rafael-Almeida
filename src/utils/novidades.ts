/**
 * Novidades do app, mostradas UMA VEZ num card no Inicio (ver CardNovidade).
 *
 * Para anunciar uma mudanca: acrescente um item NO TOPO, com `id` novo e
 * `data` do dia em que vai ao ar. O card aparece para quem abrir o app depois
 * disso e some quando a pessoa toca em "Entendi". Novidade com mais de
 * DIAS_DE_VALIDADE dias nao aparece mais — quem chegou depois nao precisa ler
 * o historico inteiro.
 *
 * O "ja vi" fica no aparelho (localStorage): quem usa celular e computador ve
 * o card uma vez em cada um. Quando as novidades forem para uma tabela no
 * Supabase, esta lista e esse controle saem daqui.
 */
export interface Novidade {
  id: string;
  /** AAAA-MM-DD, o dia em que foi ao ar. */
  data: string;
  titulo: string;
  resumo: string;
  /** Passos do "Ver como funciona". Opcional. */
  comoUsar?: string[];
}

export const DIAS_DE_VALIDADE = 30;

export const NOVIDADES: Novidade[] = [
  {
    id: '2026-11-20-montar-bolo',
    data: '2026-11-20',
    titulo: 'Montar bolo no pedido',
    resumo:
      'Vende o bolo montado pela cliente? Cadastre massas, recheios e coberturas uma vez e monte o bolo no pedido, com o preço somado na hora.',
    comoUsar: [
      'Em Fichas, toque em "Editar abas": dê nome às abas (Massas, Recheios, Coberturas…) e escolha quantas de cada a cliente pode pedir.',
      'Cadastre cada massa, recheio e cobertura como uma ficha, com os mesmos tamanhos em todas (ex.: 15 cm, 20 cm).',
      'Em Lançar Pedido → Produtos, toque em "Montar bolo", escolha o tamanho e as partes.',
      'A mão de obra vem somada das partes e pode ser trocada. No PDF, o bolo sai numa linha só, com as partes embaixo.',
    ],
  },
  {
    id: '2026-11-17-acrescimo-pedido',
    data: '2026-11-17',
    titulo: 'Acréscimo no pedido',
    resumo:
      'Agora dá para cobrar os extras que a cliente pediu (morango, Nutella…) em cima do preço da ficha.',
    comoUsar: [
      'Em Lançar Pedido → Produtos, escolha o bolo e o tamanho.',
      'No campo "+ Acréscimo", digite quanto quer cobrar a mais.',
      'O valor só soma, nunca diminui o preço da ficha, e entra todo como reposição.',
      'Se o extra der mais trabalho, aumente o tempo na ficha do bolo.',
    ],
  },
];

const CHAVE = 'carula_novidades_vistas';

export function lerVistas(): string[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    const lista = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export function marcarComoVista(id: string): void {
  try {
    const vistas = lerVistas();
    if (!vistas.includes(id)) localStorage.setItem(CHAVE, JSON.stringify([...vistas, id]));
  } catch {
    // Navegador sem localStorage: o card some agora e pode voltar na proxima vez.
  }
}

/** A novidade mais recente que a pessoa ainda nao viu e que ainda vale. */
export function proximaNovidade(hoje: Date = new Date()): Novidade | null {
  const vistas = lerVistas();
  const limite = hoje.getTime() - DIAS_DE_VALIDADE * 24 * 60 * 60 * 1000;
  return (
    NOVIDADES.find((n) => {
      const quando = new Date(`${n.data}T00:00:00`).getTime();
      return !vistas.includes(n.id) && quando >= limite && quando <= hoje.getTime();
    }) || null
  );
}
