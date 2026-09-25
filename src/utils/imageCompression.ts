/**
 * Compressao de imagem antes de guardar como data URI.
 *
 * As fotos do app sao gravadas em base64 dentro do banco. Sem compressao, uma
 * foto de iPhone entra crua: a foto de perfil que motivou este arquivo tinha
 * 6048x8064 px (48,8 MP, 9 MB em base64, 186 MB ao decodificar) e era exibida
 * num circulo de 44 px.
 *
 * Isso quebrava o PDF no celular. O html-to-image serializa a folha inteira num
 * <svg><foreignObject> com as imagens embutidas; o iOS Safari tem um teto de
 * memoria de decodificacao bem menor que o Chrome de desktop, e ao encontrar
 * uma imagem desse tamanho ele desiste DAQUELA imagem e desenha o resto — dai o
 * layout sair perfeito com os quadros de foto vazios, so no celular.
 *
 * Reduzir na origem conserta o PDF e, junto, o peso do banco e o tempo de
 * carregamento do app.
 */

/** Maior dimensao permitida. Acima disso a imagem e reduzida proporcionalmente. */
const MAX_DIMENSION = 1200;

/** Qualidade do JPEG de saida. 0.82 mantem a foto boa com peso baixo. */
const JPEG_QUALITY = 0.82;

/**
 * Teto do caminho de FALLBACK, em bytes do arquivo original.
 *
 * Nao vale para o caminho normal: comprimida, uma foto de 40 MP sai com uns
 * 200 KB e passa sem discussao. Isto so limita o arquivo CRU, que e gravado
 * inteiro quando a compressao falha.
 *
 * 2,5 MB cobre com folga qualquer JPEG/PNG de camera que o navegador decodifique
 * mal, e barra o caso que realmente pesa: o HEIC do iPhone. O Safari decodifica
 * HEIC, o Chrome e o Android nao — ali o `img.onerror` dispara e, antes deste
 * teto, um arquivo de 3 a 5 MB ia cru para o banco em base64 (~4 a 6,7 MB) e
 * passava a ser baixado a cada abertura do orcamento.
 */
const MAX_FALLBACK_BYTES = 2.5 * 1024 * 1024;

/** Mensagem unica para os dois pontos que recusam o arquivo cru. */
const erroFallbackPesado = (file: File) =>
  new Error(
    `Nao foi possivel processar esta imagem (${(file.size / 1024 / 1024).toFixed(1)} MB) ` +
      'e ela e grande demais para ser guardada como esta. ' +
      'Isso costuma acontecer com fotos HEIC do iPhone: abra a foto na Galeria e ' +
      'salve ou compartilhe como JPEG, ou escolha uma imagem menor que 2,5 MB.'
  );

/**
 * Le um arquivo de imagem e devolve um data URI reduzido e reencodado.
 *
 * Preserva a proporcao: so encolhe se a maior dimensao passar de MAX_DIMENSION,
 * e nunca amplia uma foto pequena.
 *
 * Se algo falhar (formato que o navegador nao decodifica, canvas bloqueado),
 * cai para o arquivo original — mas so ate MAX_FALLBACK_BYTES. Acima disso
 * REJEITA com uma mensagem explicando o que fazer, em vez de gravar o arquivo
 * cru: "melhor uma imagem pesada que nenhuma" vale para uma foto de 800 KB, nao
 * para um HEIC de 5 MB que vai ser rebaixado em toda abertura do pedido pelo
 * resto da vida do pedido.
 */
export const compressImageFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Nao foi possivel ler o arquivo'));

    reader.onload = (event) => {
      const original = event.target?.result as string;
      if (!original) {
        reject(new Error('Arquivo vazio'));
        return;
      }

      /**
       * Caminho unico para os tres jeitos de a compressao falhar: formato que
       * o navegador nao decodifica, canvas indisponivel e excecao no desenho.
       *
       * Guarda o arquivo cru enquanto ele for pequeno; acima do teto recusa,
       * porque gravar esse arquivo e o que enche o banco e o egress.
       */
      const cairParaOriginal = () => {
        if (file.size > MAX_FALLBACK_BYTES) {
          reject(erroFallbackPesado(file));
          return;
        }
        resolve(original);
      };

      const img = new Image();

      // Sem onerror o promise ficaria pendurado para sempre num arquivo
      // corrompido, e a interface travaria esperando.
      img.onerror = cairParaOriginal;

      img.onload = () => {
        try {
          const { width, height } = img;
          const maior = Math.max(width, height);
          // Math.min(1, ...) impede ampliar: foto menor que o teto passa intacta
          // no tamanho, so muda o encode.
          const escala = Math.min(1, MAX_DIMENSION / maior);

          const novaLargura = Math.round(width * escala);
          const novaAltura = Math.round(height * escala);

          const canvas = document.createElement('canvas');
          canvas.width = novaLargura;
          canvas.height = novaAltura;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            cairParaOriginal();
            return;
          }

          // Fundo branco: JPEG nao tem canal alpha, e sem isto um PNG
          // transparente vira preto ao ser reencodado.
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, novaLargura, novaAltura);
          ctx.drawImage(img, 0, 0, novaLargura, novaAltura);

          resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
        } catch {
          cairParaOriginal();
        }
      };

      img.src = original;
    };

    reader.readAsDataURL(file);
  });
