/**
 * Carrega as duas bibliotecas do PDF (html-to-image e jspdf) so na hora de
 * gerar, e trata o caso de a tela estar velha.
 *
 * O PROBLEMA, medido em 16/11/2026: cada publicacao troca o NOME dos arquivos
 * do app (jspdf.es.min-CaBlpLGN.js, depois -DcBTUgr-, depois -Bk3hSSPu). Uma
 * aba que ficou aberta de antes da publicacao — comum num iPad ou num app
 * instalado — ainda pede o nome antigo. Esse arquivo nao existe mais, e a
 * Vercel nao responde 404: devolve a pagina inicial (HTTP 200, texto HTML), por
 * causa da regra que manda tudo para /index.html. O navegador recusa o HTML
 * como codigo ("Importing a module script failed" no Safari). E recusa DE NOVO
 * a cada tentativa seguinte, porque guarda a falha: so recarregar a pagina
 * resolve. Era exatamente o relato: erro, tentou outra vez, erro, fechou e
 * abriu, funcionou.
 */

export class AppDesatualizadoError extends Error {
  constructor() {
    super('Um arquivo do app mudou desde que esta tela abriu.');
    this.name = 'AppDesatualizadoError';
  }
}

/**
 * A falha e de arquivo do app que nao carregou (e nao um erro de dentro do
 * PDF)? Cada navegador escreve de um jeito: Safari "Importing a module script
 * failed", Chrome "Failed to fetch dynamically imported module" ou "Failed to
 * load module script ... MIME type", Firefox "error loading dynamically
 * imported module".
 */
export const ehFalhaDeArquivoDoApp = (err: unknown): boolean => {
  const e = err as { name?: unknown; message?: unknown } | null;
  const texto = `${e?.name ?? ''} ${e?.message ?? ''}`;
  return /dynamically imported module|importing a module script failed|failed to load module script|not a valid javascript mime type/i.test(
    texto
  );
};

export const carregarBibliotecasDoPdf = async () => {
  try {
    return await Promise.all([import('html-to-image'), import('jspdf')]);
  } catch (err) {
    if (ehFalhaDeArquivoDoApp(err)) throw new AppDesatualizadoError();
    throw err;
  }
};

/**
 * Texto para o console quando o erro nao e um `Error`. A biblioteca de captura
 * rejeita com o EVENTO de erro da imagem que nao carregou, e um evento vira
 * "[object Event]" no registro — nao diz nada. Aqui ele diz qual imagem
 * (sem o `?token=...` do link assinado).
 */
export const descreverErroDoPdf = (err: unknown): unknown => {
  if (typeof Event !== 'undefined' && err instanceof Event) {
    const alvo = err.target as { src?: string } | null;
    const endereco = typeof alvo?.src === 'string' ? alvo.src.split('?')[0].slice(0, 160) : 'sem endereco';
    return `Evento "${err.type}" em ${endereco}`;
  }
  return err;
};
