import { supabase } from '../lib/supabase';

/**
 * Limpeza das fotos sem uso no deposito (bucket `fotos`), no app de cada dona.
 *
 * Excluir um registro com foto nao apaga o arquivo: o app tem "Desfazer", e o
 * backup guarda o endereco da foto. Entao o arquivo so sai depois de ficar
 * DIAS_DE_ESPERA dias seguidos sem uso. A data em que ele foi visto sem uso pela
 * primeira vez fica na tabela `fotos_sem_uso`
 * (supabase/migrations/20261029140000_fotos_sem_uso.sql):
 * - arquivo sem uso e sem anotacao: ganha a anotacao com a data de hoje;
 * - arquivo que voltou a ser usado (ex.: backup restaurado): a anotacao sai;
 * - arquivo sem uso ha mais de DIAS_DE_ESPERA dias: e apagado do deposito.
 * Arquivo enviado ha menos de um dia e ignorado: pode ser uma foto no meio do
 * envio, antes de o registro ganhar o endereco.
 *
 * Roda uma vez por sessao, depois da migracao das fotos antigas, e nunca derruba
 * o app: erro so vai para o console.
 */

const BUCKET = 'fotos';
const PASTAS = ['fichas', 'clientes', 'pedidos', 'perfil'];
export const DIAS_DE_ESPERA = 30;
const UM_DIA_MS = 24 * 60 * 60 * 1000;

/** Colunas que guardam endereco de foto, por tabela, e a coluna da dona. */
const COLUNAS_DE_FOTO: { tabela: string; colunas: string[]; dona: string }[] = [
  { tabela: 'fichas_tecnicas', colunas: ['foto_url'], dona: 'usuaria_id' },
  { tabela: 'clientes', colunas: ['photoUrl'], dona: 'usuaria_id' },
  { tabela: 'transacoes', colunas: ['cliente_foto_url', 'imagem_inspiracao'], dona: 'usuaria_id' },
  { tabela: 'usuarias', colunas: ['foto_url'], dona: 'id' },
];

let jaRodouNestaSessao = false;

/** Todos os arquivos das pastas da dona, com a data de envio. */
const listarArquivos = async (usuariaId: string) => {
  const arquivos: { caminho: string; criadoEm: number }[] = [];
  for (const pasta of PASTAS) {
    const PAGINA = 1000;
    for (let inicio = 0; ; inicio += PAGINA) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(`${usuariaId}/${pasta}`, { limit: PAGINA, offset: inicio });
      if (error) throw error;
      for (const item of data || []) {
        // Pasta (sem id) nao e arquivo.
        if (!item.id) continue;
        arquivos.push({ caminho: `${usuariaId}/${pasta}/${item.name}`, criadoEm: new Date(item.created_at).getTime() });
      }
      if (!data || data.length < PAGINA) break;
    }
  }
  return arquivos;
};

/** Caminhos de todas as fotos do deposito que algum registro da dona usa. */
const listarEmUso = async (usuariaId: string) => {
  const emUso = new Set<string>();
  for (const { tabela, colunas, dona } of COLUNAS_DE_FOTO) {
    for (const coluna of colunas) {
      // De 1000 em 1000 (limite do Supabase por consulta): uma lista cortada
      // faria foto em uso parecer sem uso, e ela seria apagada.
      const PAGINA = 1000;
      for (let inicio = 0; ; inicio += PAGINA) {
        const { data, error } = await supabase
          .from(tabela)
          .select(`id,${coluna}`)
          .eq(dona, usuariaId)
          .like(coluna, 'storage:%')
          .order('id', { ascending: true })
          .range(inicio, inicio + PAGINA - 1);
        if (error) throw error;
        for (const linha of (data || []) as unknown as Record<string, string>[]) emUso.add(linha[coluna].slice('storage:'.length));
        if (!data || data.length < PAGINA) break;
      }
    }
  }
  return emUso;
};

/**
 * `diasDeEspera` e `idadeMinimaMs` so mudam em teste (para nao esperar 30 dias);
 * o app sempre chama com os padroes. `simular` nao grava nem apaga nada: so
 * devolve o que seria anotado e o que seria apagado, para conferir antes.
 */
export const limparFotosSemUso = async (
  usuariaId: string,
  {
    diasDeEspera = DIAS_DE_ESPERA,
    idadeMinimaMs = UM_DIA_MS,
    simular = false,
  }: { diasDeEspera?: number; idadeMinimaMs?: number; simular?: boolean } = {}
): Promise<{ anotaria: string[]; desanotaria: string[]; apagaria: string[] } | void> => {
  if (!usuariaId) return;
  if (!simular) {
    if (jaRodouNestaSessao) return;
    jaRodouNestaSessao = true;
  }

  try {
    const [arquivos, emUso] = await Promise.all([listarArquivos(usuariaId), listarEmUso(usuariaId)]);
    const { data: anotadas, error: erroAnotadas } = await supabase
      .from('fotos_sem_uso')
      .select('caminho,visto_em')
      .eq('usuaria_id', usuariaId);
    if (erroAnotadas) throw erroAnotadas;

    const agora = Date.now();
    const existe = new Set(arquivos.map((a) => a.caminho));
    const semUso = arquivos.filter((a) => !emUso.has(a.caminho) && agora - a.criadoEm >= idadeMinimaMs);
    const semUsoSet = new Set(semUso.map((a) => a.caminho));
    const anotacao = new Map((anotadas || []).map((a) => [a.caminho as string, new Date(a.visto_em).getTime()]));

    // Anotacoes que nao valem mais: o arquivo voltou a ser usado ou ja nao existe.
    const desanotar = [...anotacao.keys()].filter((c) => !semUsoSet.has(c) || !existe.has(c));
    const novos = semUso.filter((a) => !anotacao.has(a.caminho)).map((a) => ({ caminho: a.caminho, usuaria_id: usuariaId }));
    const prazoMs = diasDeEspera * UM_DIA_MS;
    const vencidos = semUso.filter((a) => anotacao.has(a.caminho) && agora - (anotacao.get(a.caminho) as number) >= prazoMs).map((a) => a.caminho);
    if (simular) return { anotaria: novos.map((n) => n.caminho), desanotaria: desanotar, apagaria: vencidos };

    if (desanotar.length) await supabase.from('fotos_sem_uso').delete().eq('usuaria_id', usuariaId).in('caminho', desanotar);

    // Sem uso pela primeira vez: anota a data de hoje.
    if (novos.length) await supabase.from('fotos_sem_uso').insert(novos);

    // Sem uso ha mais do que o prazo: apaga do deposito e tira a anotacao.
    if (vencidos.length) {
      const { error } = await supabase.storage.from(BUCKET).remove(vencidos);
      if (error) throw error;
      await supabase.from('fotos_sem_uso').delete().eq('usuaria_id', usuariaId).in('caminho', vencidos);
      console.info(`[fotos] ${vencidos.length} foto(s) sem uso ha mais de ${diasDeEspera} dias apagada(s) do deposito.`);
    }
  } catch (err) {
    console.error('Nao foi possivel limpar as fotos sem uso:', err);
  }
};
