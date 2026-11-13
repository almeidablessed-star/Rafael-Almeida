/**
 * Busca uma lista inteira do Supabase, de 1000 em 1000.
 *
 * O Supabase devolve no maximo 1000 linhas por pedido, sem avisar que cortou.
 * Uma lista pedida de uma vez so perdia, em silencio, tudo o que passasse
 * disso: os lancamentos mais antigos sumiam da tela e dos totais.
 *
 * `buscarPagina` recebe o intervalo (para o `.range(de, ate)`) e precisa pedir
 * as linhas numa ordem que nao empata (terminar com `id`), senao uma linha pode
 * aparecer em duas paginas e outra em nenhuma.
 *
 * Erro em qualquer pagina sobe: lista pela metade nao e devolvida.
 */
export const TAMANHO_DA_PAGINA = 1000;

export const buscarEmPaginas = async (
  buscarPagina: (de: number, ate: number) => PromiseLike<{ data: unknown; error: unknown }>,
  tamanho = TAMANHO_DA_PAGINA
): Promise<any[]> => {
  const todas: any[] = [];
  for (let inicio = 0; ; inicio += tamanho) {
    const { data, error } = await buscarPagina(inicio, inicio + tamanho - 1);
    if (error) throw error;
    const linhas = (data as any[] | null) || [];
    todas.push(...linhas);
    if (linhas.length < tamanho) return todas;
  }
};
