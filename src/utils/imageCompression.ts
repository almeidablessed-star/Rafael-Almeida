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
 * Le um arquivo de imagem e devolve um data URI reduzido e reencodado.
 *
 * Preserva a proporcao: so encolhe se a maior dimensao passar de MAX_DIMENSION,
 * e nunca amplia uma foto pequena.
 *
 * Se algo falhar (formato que o navegador nao decodifica, canvas bloqueado),
 * cai para o arquivo original em vez de perder a foto da usuaria — melhor uma
 * imagem pesada que nenhuma.
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

      const img = new Image();

      // Sem onerror o promise ficaria pendurado para sempre num arquivo
      // corrompido, e a interface travaria esperando.
      img.onerror = () => resolve(original);

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
            resolve(original);
            return;
          }

          // Fundo branco: JPEG nao tem canal alpha, e sem isto um PNG
          // transparente vira preto ao ser reencodado.
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, novaLargura, novaAltura);
          ctx.drawImage(img, 0, 0, novaLargura, novaAltura);

          resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
        } catch {
          resolve(original);
        }
      };

      img.src = original;
    };

    reader.readAsDataURL(file);
  });
