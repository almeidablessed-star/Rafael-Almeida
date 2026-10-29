import { supabase } from '../lib/supabase';
import { guardarFoto, PastaFoto } from './fotoDeposito';

/**
 * Passo 3 de "fotos para o Storage": leva as fotos ANTIGAS (base64 dentro das
 * linhas) para o deposito, uma por vez, em segundo plano.
 *
 * Cada app so move as fotos da propria dona: as regras do deposito e das
 * tabelas so deixam mexer no que e dela. Por isso roda no app de cada
 * confeiteira, ao abrir, e nao num processo central.
 *
 * Nada some no caminho:
 * - a foto sobe ao deposito ANTES de a linha mudar;
 * - logo antes de trocar, a linha e relida: se a foto mudou nesse meio-tempo
 *   (a pessoa editou o registro), nao troca e apaga o arquivo recem-enviado;
 * - qualquer falha deixa a foto antiga onde estava, e a proxima abertura do
 *   app tenta de novo.
 * As telas continuam mostrando a foto o tempo todo: `abrirFoto` aceita as duas
 * formas (base64 e endereco do deposito).
 */

type Alvo = {
  tabela: string;
  coluna: string;
  pasta: PastaFoto;
  /** Coluna que diz de quem e a linha (`id` em usuarias, que e o proprio id da pessoa). */
  dona: string;
};

const ALVOS: Alvo[] = [
  { tabela: 'fichas_tecnicas', coluna: 'foto_url', pasta: 'fichas', dona: 'usuaria_id' },
  { tabela: 'clientes', coluna: 'photoUrl', pasta: 'clientes', dona: 'usuaria_id' },
  { tabela: 'transacoes', coluna: 'imagem_inspiracao', pasta: 'pedidos', dona: 'usuaria_id' },
  { tabela: 'transacoes', coluna: 'cliente_foto_url', pasta: 'pedidos', dona: 'usuaria_id' },
  { tabela: 'usuarias', coluna: 'foto_url', pasta: 'perfil', dona: 'id' },
];

/** Pausa entre uma foto e outra: nao disputar a rede com quem esta usando o app no 4G. */
const PAUSA_MS = 1500;
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

let jaRodouNestaSessao = false;

const lerFoto = async (alvo: Alvo, id: string | number, usuariaId: string) => {
  const { data, error } = await supabase
    .from(alvo.tabela)
    .select(alvo.coluna)
    .eq('id', id)
    .eq(alvo.dona, usuariaId)
    .single();
  if (error) throw error;
  return (data as unknown as Record<string, string | null> | null)?.[alvo.coluna] ?? null;
};

const moverUma = async (alvo: Alvo, id: string | number, usuariaId: string): Promise<boolean> => {
  const antes = await lerFoto(alvo, id, usuariaId);
  if (!antes || !antes.startsWith('data:image/')) return false;

  const endereco = await guardarFoto(antes, usuariaId, alvo.pasta);
  if (!endereco || endereco === antes) return false;
  const caminho = endereco.replace(/^storage:/, '');

  // Relida logo antes de trocar: so troca se ainda e a mesma foto.
  const agora = await lerFoto(alvo, id, usuariaId);
  if (agora !== antes) {
    await supabase.storage.from('fotos').remove([caminho]);
    return false;
  }

  const { error } = await supabase
    .from(alvo.tabela)
    .update({ [alvo.coluna]: endereco })
    .eq('id', id)
    .eq(alvo.dona, usuariaId);
  if (error) {
    // A linha continua com a foto antiga; o arquivo enviado fica sem uso.
    await supabase.storage.from('fotos').remove([caminho]);
    throw error;
  }
  return true;
};

/**
 * Move as fotos antigas da pessoa logada. Roda uma vez por sessao e nunca
 * derruba o app: erro so vai para o console, e a proxima abertura tenta de novo.
 */
export const migrarFotosAntigas = async (usuariaId: string) => {
  if (jaRodouNestaSessao || !usuariaId) return;
  jaRodouNestaSessao = true;

  let movidas = 0;
  for (const alvo of ALVOS) {
    try {
      const { data, error } = await supabase
        .from(alvo.tabela)
        .select('id')
        .eq(alvo.dona, usuariaId)
        .like(alvo.coluna, 'data:image/%');
      if (error) throw error;

      for (const { id } of (data || []) as { id: string | number }[]) {
        try {
          if (await moverUma(alvo, id, usuariaId)) movidas++;
        } catch (err) {
          console.error(`Nao foi possivel mover a foto (${alvo.tabela} ${id}):`, err);
        }
        await esperar(PAUSA_MS);
      }
    } catch (err) {
      console.error(`Nao foi possivel procurar fotos antigas em ${alvo.tabela}:`, err);
    }
  }
  if (movidas > 0) console.info(`[fotos] ${movidas} foto(s) antiga(s) movida(s) para o deposito.`);
};
