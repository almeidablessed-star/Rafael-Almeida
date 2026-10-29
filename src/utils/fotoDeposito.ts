import { supabase } from '../lib/supabase';

/**
 * Fotos no deposito (Supabase Storage, bucket privado `fotos`), em vez de
 * texto base64 dentro das linhas do banco.
 *
 * No banco a coluna da foto passa a guardar so um ENDERECO curto:
 *   storage:<usuaria_id>/<pasta>/<nome>.jpg
 * As telas nunca veem esse endereco: quem le do banco chama `abrirFoto`, que o
 * troca por um link assinado (temporario) para o <img>. Quem grava chama
 * `guardarFoto`, que sobe a foto nova e devolve o endereco.
 *
 * Fotos antigas (data URI no banco) continuam funcionando: `abrirFoto` devolve
 * o valor como veio, e `guardarFoto` so envia ao deposito o que for foto nova.
 *
 * Regras do deposito (quem le, envia, troca, apaga) em
 * supabase/migrations/20261029120000_storage_fotos.sql: so a dona, na pasta com
 * o id dela, com a assinatura ativa.
 */

const BUCKET = 'fotos';
const PREFIXO = 'storage:';
/** Validade do link assinado. A tela que fica aberta mais que isso reabre a foto ao recarregar. */
const VALIDADE_SEGUNDOS = 6 * 60 * 60;

export type PastaFoto = 'pedidos' | 'clientes' | 'fichas' | 'perfil';

/**
 * Reducao automatica de imagens do Supabase (so no plano pago). Ligada, quem
 * pede `abrirFoto(valor, largura)` recebe a foto ja reduzida para aquela
 * largura, em vez da foto inteira. Desligada (plano Free), a largura e
 * ignorada e vem a foto como foi enviada.
 */
export const REDUCAO_AUTOMATICA_LIGADA = false;

export const ehEnderecoDeposito = (valor: unknown): valor is string =>
  typeof valor === 'string' && valor.startsWith(PREFIXO);

const caminhoDe = (endereco: string) => endereco.slice(PREFIXO.length);

/**
 * Links assinados ja gerados nesta sessao, nos dois sentidos:
 * - endereco -> link (e quando vence), para nao pedir um link novo a cada tela;
 * - link -> endereco, para reconhecer, ao salvar, que a foto nao mudou (a tela
 *   devolve o link que recebeu) e gravar de volta o endereco, sem reenviar.
 */
const linkPorEndereco = new Map<string, { url: string; venceEm: number }>();
const enderecoPorLink = new Map<string, string>();

/** Endereco do deposito -> link para mostrar. Qualquer outro valor volta como veio. */
export const abrirFoto = async (valor: string | null | undefined, largura?: number): Promise<string | null> => {
  if (!valor) return null;
  if (!ehEnderecoDeposito(valor)) return valor;

  const reduzir = REDUCAO_AUTOMATICA_LIGADA && !!largura;
  const chave = reduzir ? `${valor}|${largura}` : valor;
  const guardado = linkPorEndereco.get(chave);
  // Margem de 5 minutos para o link nao vencer com a foto ainda na tela.
  if (guardado && guardado.venceEm - Date.now() > 5 * 60 * 1000) return guardado.url;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(
      caminhoDe(valor),
      VALIDADE_SEGUNDOS,
      reduzir ? { transform: { width: largura, resize: 'contain' } } : undefined
    );
  if (error || !data?.signedUrl) {
    console.error('Nao foi possivel abrir a foto do deposito:', error);
    return null;
  }
  linkPorEndereco.set(chave, { url: data.signedUrl, venceEm: Date.now() + VALIDADE_SEGUNDOS * 1000 });
  enderecoPorLink.set(data.signedUrl, valor);
  return data.signedUrl;
};

/** Data URI -> arquivo para enviar. */
const paraArquivo = async (dataUri: string) => (await fetch(dataUri)).blob();

/** Nome unico por arquivo: a mesma foto nunca e sobrescrita. */
const nomeNovo = (extensao: string) =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.${extensao}`;

const extensaoDe = (tipo: string) => (tipo === 'image/png' ? 'png' : tipo === 'image/webp' ? 'webp' : 'jpg');

/**
 * Prepara o valor da foto para gravar no banco.
 *
 * - `undefined`: a tela nao mexeu na foto -> continua `undefined` (o chamador omite a coluna).
 * - vazio/null: foto removida -> `null`.
 * - data URI: foto nova -> sobe ao deposito e devolve o endereco.
 * - link assinado gerado por `abrirFoto`: a mesma foto de antes -> devolve o endereco dela.
 * - endereco do deposito ou qualquer outro texto: grava como esta.
 *
 * `novoRegistro`: num registro NOVO (criar, duplicar, restaurar), uma foto que
 * ja e de outro registro vira uma COPIA do arquivo. Sem isso, duplicar uma
 * ficha deixaria as duas apontando para o mesmo arquivo, e trocar a foto de uma
 * apagaria a da outra.
 *
 * Se o envio falhar, o erro sobe: melhor a tela avisar do que gravar o pedido
 * sem a foto em silencio.
 */
export const guardarFoto = async (
  valor: string | null | undefined,
  usuariaId: string,
  pasta: PastaFoto,
  { novoRegistro = false }: { novoRegistro?: boolean } = {}
): Promise<string | null | undefined> => {
  if (valor === undefined) return undefined;
  if (!valor) return null;

  const endereco = enderecoPorLink.get(valor) ?? (ehEnderecoDeposito(valor) ? valor : null);
  if (endereco) {
    if (!novoRegistro) return endereco;
    const destino = `${usuariaId}/${pasta}/${nomeNovo(caminhoDe(endereco).split('.').pop() || 'jpg')}`;
    const { error } = await supabase.storage.from(BUCKET).copy(caminhoDe(endereco), destino);
    if (error) throw new Error(`Não foi possível copiar a foto: ${error.message}`);
    return `${PREFIXO}${destino}`;
  }

  if (!valor.startsWith('data:image/')) return valor;

  const arquivo = await paraArquivo(valor);
  const caminho = `${usuariaId}/${pasta}/${nomeNovo(extensaoDe(arquivo.type))}`;
  const { error } = await supabase.storage.from(BUCKET).upload(caminho, arquivo, {
    contentType: arquivo.type || 'image/jpeg',
    // Nome unico por envio: a mesma foto nunca e sobrescrita, entao o
    // navegador pode guardar a copia por muito tempo.
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw new Error(`Não foi possível enviar a foto: ${error.message}`);
  return `${PREFIXO}${caminho}`;
};

/**
 * Apaga do deposito a foto que foi trocada ou removida. So age quando o valor
 * antigo era um endereco do deposito e o novo e diferente. Falha aqui nao
 * desfaz nada: no pior caso fica um arquivo sem uso, que nao aparece em lugar
 * nenhum.
 */
export const apagarFotoTrocada = async (antes: string | null | undefined, depois: string | null | undefined) => {
  if (!ehEnderecoDeposito(antes) || antes === depois || depois === undefined) return;
  const { error } = await supabase.storage.from(BUCKET).remove([caminhoDe(antes)]);
  if (error) console.error('Nao foi possivel apagar a foto antiga do deposito:', error);
};
