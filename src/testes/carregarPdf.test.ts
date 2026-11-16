// Aba aberta de antes de uma publicacao: o arquivo do PDF mudou de nome.
import { describe, expect, it } from 'vitest';
import { ehFalhaDeArquivoDoApp, descreverErroDoPdf } from '../utils/carregarPdf';

describe('falha de arquivo do app (aba velha)', () => {
  it('reconhece a mensagem de cada navegador', () => {
    expect(ehFalhaDeArquivoDoApp(new TypeError('Importing a module script failed.'))).toBe(true); // Safari
    expect(ehFalhaDeArquivoDoApp(new TypeError('Failed to fetch dynamically imported module: https://app.exemplo.com/assets/jspdf.es.min-CaBlpLGN.js'))).toBe(true); // Chrome
    expect(ehFalhaDeArquivoDoApp(new TypeError('error loading dynamically imported module: https://app.exemplo.com/assets/x.js'))).toBe(true); // Firefox
    // A mensagem exata do iPad do cliente, registrada no Sentry em 16/11/2026.
    expect(ehFalhaDeArquivoDoApp(new TypeError("'text/html' is not a valid JavaScript MIME type."))).toBe(true);
    expect(ehFalhaDeArquivoDoApp(new TypeError('Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html".'))).toBe(true);
  });

  it('erro de dentro do PDF nao e confundido com isso', () => {
    expect(ehFalhaDeArquivoDoApp(new Error('Failed to generate PDF image on second attempt'))).toBe(false);
    expect(ehFalhaDeArquivoDoApp(new TypeError('Failed to fetch'))).toBe(false);
    expect(ehFalhaDeArquivoDoApp(null)).toBe(false);
    expect(ehFalhaDeArquivoDoApp('texto solto')).toBe(false);
  });
});

describe('descrever o erro do PDF', () => {
  it('evento de imagem que nao carregou diz qual imagem, sem o token do link', () => {
    const img = { src: 'https://x.supabase.co/storage/v1/object/sign/fotos/u/pedidos/a.jpg?token=SEGREDO' };
    const evento = new Event('error');
    Object.defineProperty(evento, 'target', { value: img });
    const texto = String(descreverErroDoPdf(evento));
    expect(texto).toContain('a.jpg');
    expect(texto).not.toContain('SEGREDO');
  });

  it('erro comum passa como esta', () => {
    const erro = new Error('x');
    expect(descreverErroDoPdf(erro)).toBe(erro);
  });
});
