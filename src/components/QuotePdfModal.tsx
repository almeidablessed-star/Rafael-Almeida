import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Transaction } from '../types';
import { formatCurrency, formatDateBr } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useFichasTecnicas } from '../context/FichasTecnicasContext';
import { useTransacoes } from '../context/TransacoesContext';
import { useCustomers } from '../context/CustomersContext';
import { compressImageFile } from '../utils/imageCompression';
import { normalizeName } from '../utils/fichaMatcher';
import { formatRendimentoParaExibir } from '../utils/rendimento';
import {
  Printer,
  X,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Calendar,
  Sparkles,
  Copy,
  Check,
  User,
  ShoppingBag,
  Clock,
  FileText,
  ChefHat,
  Camera,
  Layers,
  Download,
  ChevronDown,
  ChevronUp,
  Upload,
  Trash2,
  Truck,
  Flower2,
  Cake,
  Pencil,
  Zap,
} from 'lucide-react';

/**
 * CSS do Google Fonts (Instrument Serif + Manrope) com os arquivos de fonte
 * embutidos como base64, para a captura de PDF via html-to-image.
 *
 * A autodetecao de fontes da propria biblioteca (`getFontEmbedCSS`) le
 * `document.styleSheets[...].cssRules` de toda folha carregada — inclusive a
 * do Google Fonts, um `<link>` sem `crossorigin`, cuja leitura o navegador
 * bloqueia por seguranca (SecurityError, sempre no console em toda geracao
 * de PDF). Nao e so ruido: a mesma autodetecao tambem falha em EMBUTIR
 * "Instrument Serif" (nome com espaco) mesmo quando o erro nao aparece —
 * confirmado inspecionando o CSS que ela realmente gera, que so contem
 * "Manrope" (nome de uma palavra so). O titulo do orcamento saia impresso
 * com a serifada padrao do navegador, nao a fonte real.
 *
 * A correcao busca o MESMO endpoint via `fetch()` direto, em vez de ler o
 * `<link>` — o Google libera CORS para o fetch do texto do CSS (a restricao
 * e so sobre ler `.cssRules` de uma stylesheet ja carregada), baixa cada
 * arquivo de fonte referenciado e o embute como `data:` URI. O resultado e
 * passado pronto pra `toPng()` via `fontEmbedCSS`, que pula a autodetecao
 * da biblioteca por completo — sem o erro de CORS, com as duas fontes
 * embutidas corretamente.
 *
 * Buscado uma unica vez e reaproveitado nas geracoes seguintes: as fontes
 * nao mudam durante a sessao, e cada geracao ja faz duas capturas (o
 * "aquecimento" do iOS Safari, ver `handleDownloadPdf`).
 */
const GOOGLE_FONTS_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;600;700;800&display=swap";

let cachedFontEmbedCss: Promise<string> | null = null;

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const buildFontEmbedCss = async (): Promise<string> => {
  const cssText = await fetch(GOOGLE_FONTS_CSS_URL).then((r) => r.text());
  const fontFaceBlocks = cssText.match(/@font-face\s*{[^}]+}/g) || [];

  const embeddedBlocks = await Promise.all(
    fontFaceBlocks.map(async (block) => {
      const urlMatch = block.match(/url\((https:\/\/[^)]+)\)/);
      if (!urlMatch) return block;
      const fontUrl = urlMatch[1];
      try {
        const fontBlob = await fetch(fontUrl).then((r) => r.blob());
        const dataUrl = await blobToDataUrl(fontBlob);
        return block.replace(fontUrl, dataUrl);
      } catch (err) {
        // Uma fonte que falhou no embed cai pro fallback do proprio
        // font-family (`, serif` / `, sans-serif`) — igual ao que ja
        // acontecia antes desta correcao, so que agora so pra essa fonte
        // especifica, nao pra todas.
        console.error('Falha ao embutir fonte no PDF:', fontUrl, err);
        return block;
      }
    })
  );

  return embeddedBlocks.join('\n');
};

/** Memoizado a nivel de modulo: buscado uma vez, reaproveitado em toda geracao de PDF desta sessao de pagina. */
const getFontEmbedCssCached = (): Promise<string> => {
  if (!cachedFontEmbedCss) {
    cachedFontEmbedCss = buildFontEmbedCss().catch((err) => {
      // Falhou buscar/montar de vez — nao guarda a falha em cache, deixa a
      // proxima geracao tentar de novo. `undefined` como CSS efetivamente
      // volta pro comportamento antigo (autodetecao da biblioteca) so
      // desta vez.
      cachedFontEmbedCss = null;
      console.error('Falha ao montar CSS de fontes embutidas para o PDF:', err);
      return '';
    });
  }
  return cachedFontEmbedCss;
};

/**
 * Largura em que a folha e diagramada no PDF (a largura que ela tem no
 * computador). Em tela mais estreita, a pre-visualizacao mostra a folha nessa
 * largura, reduzida — uma miniatura do PDF, e nao uma versao empilhada que o
 * PDF nunca teria.
 */
const LARGURA_FOLHA = 656;

interface QuotePdfModalProps {
  transaction: Omit<Transaction, 'id' | 'createdAt'> | Transaction;
  onClose: () => void;
}

export const QuotePdfModal: React.FC<QuotePdfModalProps> = ({
  transaction,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'cliente' | 'cozinha'>('cliente');
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [inspirationImage, setInspirationImage] = useState<string>(transaction.inspirationImage || '');

  // Miniatura da folha no celular: a folha e montada com LARGURA_FOLHA e
  // reduzida para caber, entao a tela mostra exatamente o que sai no PDF. Na
  // captura, `handleDownloadPdf` alarga o documento para 668px; a area
  // disponivel passa de LARGURA_FOLHA e a reducao some sozinha.
  const miniaturaRef = useRef<HTMLDivElement>(null);
  const folhaRef = useRef<HTMLDivElement>(null);
  const [miniatura, setMiniatura] = useState<{ escala: number; altura: number } | null>(null);
  useLayoutEffect(() => {
    const area = miniaturaRef.current;
    const folha = folhaRef.current;
    if (!area || !folha) return;
    const medir = () => {
      const disponivel = area.clientWidth;
      if (disponivel >= LARGURA_FOLHA) {
        setMiniatura(null);
        return;
      }
      const escala = disponivel / LARGURA_FOLHA;
      // offsetHeight ignora o transform: e a altura real da folha montada.
      setMiniatura({ escala, altura: folha.offsetHeight * escala });
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(area);
    observador.observe(folha);
    return () => observador.disconnect();
  }, []);
  const { updateTransacao, fetchTransacaoFotos } = useTransacoes();

  /**
   * Busca a foto de referencia sob demanda ao abrir o orcamento.
   *
   * A lista de pedidos nao traz mais `imagem_inspiracao` — ver a nota em
   * `COLUNAS_SEM_FOTO`. Sem isto o quadro da foto abria vazio para todo pedido
   * gravado numa sessao anterior, e a folha de orcamento saia sem a referencia
   * que a cliente mandou.
   */
  useEffect(() => {
    if (inspirationImage) return;
    if (!('id' in transaction) || !transaction.id) return;

    let cancelado = false;
    fetchTransacaoFotos(transaction.id).then(({ inspirationImage: foto }) => {
      // So preenche o vazio: se a confeiteira escolheu uma foto nova enquanto
      // a busca corria, a escolha dela manda.
      if (!cancelado && foto) setInspirationImage((prev) => prev || foto);
    });

    return () => {
      cancelado = true;
    };
    // Roda uma vez por pedido aberto. `inspirationImage` fica fora das
    // dependencias de proposito: incluir faria a busca reagir a remocao da
    // foto e traze-la de volta do banco logo depois de apaga-la.
  }, [transaction, fetchTransacaoFotos]);

  /**
   * Grava a foto de inspiracao no pedido.
   *
   * O modal tambem e aberto a partir do FORMULARIO, com um pedido que ainda nao
   * foi gravado — por isso o `id` e checado antes. Nesse caso a foto vive so no
   * estado da tela e e persistida junto quando a venda for salva.
   */
  const persistirImagem = async (imagem: string) => {
    if (!('id' in transaction) || !transaction.id) return;
    try {
      await updateTransacao(transaction.id, { ...transaction, inspirationImage: imagem });
    } catch (err: any) {
      alert(`⚠️ A foto não pôde ser salva no pedido:\n\n${err?.message || err}`);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma foto de até 8MB.');
      return;
    }

    try {
      const result = await compressImageFile(file);
      if (result) {
        setInspirationImage(result);
        await persistirImagem(result);
      }
    } catch (err: any) {
      alert(err?.message || 'Nao foi possivel usar esta imagem.');
    }
  };

  const handleRemoveImage = async () => {
    setInspirationImage('');
    await persistirImagem('');
  };
  
  // Kitchen sheet expandable items accordion state (all open by default)
  const [expandedItems, setExpandedItems] = useState<{ [key: number]: boolean }>({
    0: true,
    1: true,
    2: true,
    3: true,
  });

  // Dados de quem vende, lidos do perfil real no Supabase.
  //
  // Antes isto vinha de duas chaves de localStorage que NENHUMA tela do app
  // escrevia: `carula_user_profile` so era gravada por UserProfileModal, que
  // e renderizado apenas pelo Header (codigo morto), e `carula_profile` nao
  // era escrita por lugar nenhum. O perfil que a confeiteira preenchia ia
  // para o Supabase e nunca chegava aqui. Na falta dos dois, caia num
  // DEFAULT_PROFILE fixo com o nome, telefone e e-mail pessoal da dona do
  // app — ou seja, toda compradora emitia orcamento com o contato dela.
  //
  // `nome_confeitaria` e o nome do NEGOCIO (o que deve encabecar a folha);
  // `nome` e o da pessoa. Sao campos distintos desde o cadastro.
  const { user, userProfile, fetchUserPhoto } = useAuth();

  // O e-mail vive em auth.users, nao em `usuarias` — nao ha coluna espelho de
  // proposito, para nao criar duas fontes de verdade para o mesmo dado.
  const sellerEmail = user?.email || '';
  const sellerName = userProfile?.nome_confeitaria || userProfile?.nome || '';
  const sellerPhone = userProfile?.telefone || '';
  const sellerInstagram = userProfile?.instagram || '';
  const sellerAddress = userProfile?.endereco || '';
  /**
   * A foto NAO vem junto do perfil: `fetchUserProfile` deixa `foto_url` de fora
   * do select de propósito, para nao arrastar um data URI de centenas de KB em
   * toda abertura de sessao. Quem precisa dela pede por `fetchUserPhoto`, que
   * usa a copia em memoria quando existe e so vai ao banco quando falta — o
   * mesmo padrao de [[fetchCustomerPhoto]] e [[fetchFichaPhoto]].
   *
   * Ler `userProfile.foto_url` direto, como era feito aqui, dava vazio em toda
   * sessao recem-aberta: o orcamento saia sem foto, e o Perfil parecia ter
   * perdido a imagem que continuava gravada no banco.
   *
   * A carga assincrona nao corre risco de perder a captura: a geracao do PDF
   * espera todas as <img> carregarem antes de fotografar a folha.
   */
  const [sellerPhotoUrl, setSellerPhotoUrl] = useState<string>(userProfile?.foto_url || '');

  useEffect(() => {
    if (sellerPhotoUrl) return;
    let cancelado = false;
    fetchUserPhoto().then((url) => {
      if (!cancelado && url) setSellerPhotoUrl(url);
    });
    return () => {
      cancelado = true;
    };
  }, [sellerPhotoUrl, fetchUserPhoto]);

  const { fichas } = useFichasTecnicas();

  /**
   * `transaction.customerPhotoUrl` e uma FOTO no momento em que o pedido foi
   * lancado, gravada na propria transacao (`cliente_foto_url`) — o pedido nao
   * guarda o id da cliente, so nome/telefone. Pedidos lancados antes da
   * cliente ter foto cadastrada (ou por uma falha pontual ao capturar a foto
   * na hora de salvar) ficam com esse retrato permanentemente vazio, mesmo
   * que a cliente tenha foto no cadastro dela hoje.
   *
   * Mesmo padrao de [[sellerPhotoUrl]] acima: quando falta a foto na propria
   * transacao, procura a cliente pelo nome/telefone em [[useCustomers]] e busca
   * a foto atual dela sob demanda, em vez de deixar o espaco vazio para sempre.
   */
  const { customers, fetchCustomerPhoto } = useCustomers();
  const [custPhoto, setCustPhoto] = useState<string>(transaction.customerPhotoUrl || '');

  /**
   * Trava do fallback: enquanto a busca do retrato do pedido nao termina, o
   * efeito que procura a cliente no cadastro fica parado.
   *
   * Sem isto os dois correriam juntos com o retrato vazio, e a foto atual da
   * cliente — que costuma chegar primeiro, porque `customers` ja esta em
   * memoria — venceria a corrida contra o retrato do dia do pedido.
   */
  const [retratoDoPedidoChecado, setRetratoDoPedidoChecado] = useState(false);

  /**
   * Primeiro tenta o retrato gravado no proprio pedido.
   *
   * A lista nao traz mais `cliente_foto_url`, entao sem esta busca o efeito
   * seguinte assumiria o comando sempre e o orcamento passaria a exibir a foto
   * ATUAL da cliente em todo pedido antigo — perdendo o retrato do dia do
   * pedido, que e justamente o que a nota acima explica que deve ser mostrado.
   */
  useEffect(() => {
    if (custPhoto || !('id' in transaction) || !transaction.id) {
      // Pedido ainda nao gravado, ou retrato ja em maos: nao ha o que buscar,
      // e o fallback pode seguir.
      setRetratoDoPedidoChecado(true);
      return;
    }

    let cancelado = false;
    fetchTransacaoFotos(transaction.id).then(({ customerPhotoUrl }) => {
      if (cancelado) return;
      if (customerPhotoUrl) setCustPhoto((prev) => prev || customerPhotoUrl);
      setRetratoDoPedidoChecado(true);
    });

    return () => {
      cancelado = true;
    };
    // `custPhoto` fora das dependencias: a busca e uma tentativa unica por
    // pedido aberto, nao uma reacao a cada mudanca do retrato na tela.
  }, [transaction, fetchTransacaoFotos]);

  useEffect(() => {
    if (!retratoDoPedidoChecado || custPhoto || !transaction.customerName) return;
    const match = customers.find(
      (c) =>
        normalizeName(c.name) === normalizeName(transaction.customerName || '') &&
        (!transaction.customerPhone || (c.phone || '') === transaction.customerPhone)
    );
    if (!match) return;

    let cancelado = false;
    fetchCustomerPhoto(match.id).then((url) => {
      if (!cancelado && url) setCustPhoto(url);
    });
    return () => {
      cancelado = true;
    };
  }, [
    retratoDoPedidoChecado,
    custPhoto,
    transaction.customerName,
    transaction.customerPhone,
    customers,
    fetchCustomerPhoto,
  ]);

  const handlePrint = () => {
    window.print();
  };

  // Download PDF document directly using html-to-image
  const handleDownloadPdf = async () => {
    const docElem = document.getElementById('quote-pdf-document');
    if (!docElem) {
      console.error('PDF document element not found');
      return;
    }

    // Estilos originais, guardados para serem devolvidos depois da captura.
    //
    // Declarados FORA do `try` de proposito. Estavam dentro dele, e o `catch`
    // — que existe justamente para desfazer as alteracoes quando algo falha —
    // nao enxerga `const` de outro bloco. Na pratica: qualquer erro na geracao
    // do PDF fazia o proprio tratamento de erro estourar um ReferenceError, e a
    // folha ficava com os estilos de captura aplicados (sem recorte, sem
    // altura maxima) ate a pagina ser recarregada.
    const overflowStates: Array<{ elem: Element; overflow: string }> = [];
    const imageHeightStates: Array<{ elem: Element; maxHeight: string }> = [];
    const containerStates: Array<{ elem: Element; maxHeight: string }> = [];
    const noPrintStates: Array<{ elem: HTMLElement; display: string }> = [];

    /**
     * `#quote-pdf-document` agora rola dentro de uma altura limitada (o modal
     * ganhou `max-h-[92vh]` para nao cortar o scroll nem esconder o botao de
     * fechar — ver o card em volta dele). Isso quer dizer que so a parte
     * visivel (client-height) existe de fato na tela; o resto do conteudo so
     * aparece ao rolar.
     *
     * `toPng()` fotografa o elemento do jeito que ele esta renderizado — se
     * ele so mede a altura visivel, a foto (e o PDF gerado a partir dela) sai
     * cortada onde a rolagem parava, mesmo com o conteudo inteiro presente no
     * DOM. Por isso a folha e temporariamente esticada para a altura natural
     * dela (removendo o limite e a rolagem) soh durante a captura, e devolvida
     * ao normal logo depois.
     */
    const docElemOriginalStyle = {
      overflow: docElem.style.overflow,
      flex: docElem.style.flex,
      minHeight: docElem.style.minHeight,
      maxHeight: docElem.style.maxHeight,
      height: docElem.style.height,
      width: docElem.style.width,
      minWidth: docElem.style.minWidth,
      maxWidth: docElem.style.maxWidth,
    };

    /** Devolve a folha ao estado normal. Roda no sucesso e no erro. */
    const restaurarEstilos = () => {
      docElem.style.overflow = docElemOriginalStyle.overflow;
      docElem.style.flex = docElemOriginalStyle.flex;
      docElem.style.minHeight = docElemOriginalStyle.minHeight;
      docElem.style.maxHeight = docElemOriginalStyle.maxHeight;
      docElem.style.height = docElemOriginalStyle.height;
      docElem.style.width = docElemOriginalStyle.width;
      docElem.style.minWidth = docElemOriginalStyle.minWidth;
      docElem.style.maxWidth = docElemOriginalStyle.maxWidth;
      noPrintStates.forEach(({ elem, display }) => {
        elem.style.display = display;
      });

      overflowStates.forEach(({ elem, overflow }) => {
        (elem as HTMLElement).style.overflow = overflow;
      });
      imageHeightStates.forEach(({ elem, maxHeight }) => {
        const imgElement = elem as HTMLElement;
        if (maxHeight) {
          imgElement.style.maxHeight = maxHeight;
        } else {
          imgElement.style.removeProperty('max-height');
        }
        imgElement.style.removeProperty('height');
        imgElement.style.removeProperty('width');
      });
      containerStates.forEach(({ elem, maxHeight }) => {
        const containerElement = elem as HTMLElement;
        if (maxHeight) {
          containerElement.style.maxHeight = maxHeight;
        } else {
          containerElement.style.removeProperty('max-height');
        }
        containerElement.style.removeProperty('height');
        containerElement.style.removeProperty('overflow');
        containerElement.style.removeProperty('min-height');
      });
    };

    try {
      setIsGeneratingPdf(true);

      // Estica a folha para a altura natural dela antes de mais nada — ver o
      // comentario em `docElemOriginalStyle` acima. Precisa acontecer antes do
      // carregamento das imagens porque o layout (e a posicao delas) muda com
      // a rolagem removida.
      docElem.style.setProperty('overflow', 'visible', 'important');
      docElem.style.setProperty('flex', 'none', 'important');
      docElem.style.setProperty('min-height', '0', 'important');
      docElem.style.setProperty('max-height', 'none', 'important');
      docElem.style.setProperty('height', 'auto', 'important');

      // No celular a folha mede ~370px, e o layout com a foto ao lado dos
      // itens fica espremido (nomes em tres linhas, horario cortado). Durante
      // a captura ela e montada na largura que tem no computador (668px): as
      // colunas da folha do cliente nao dependem de breakpoint, entao o
      // conteudo reflui de verdade para essa largura. No computador a folha
      // ja tem essa largura e nada muda. Restaurado em `restaurarEstilos`.
      if (docElem.offsetWidth < 640) {
        docElem.style.setProperty('width', '668px', 'important');
        docElem.style.setProperty('min-width', '668px', 'important');
        docElem.style.setProperty('max-width', 'none', 'important');
      }

      // `no-print` marca o que so serve na tela ("Alterar Foto", "Remover",
      // o convite para enviar foto). O CSS de impressao ja os escondia, mas
      // `toPng` nao passa por ele: saiam no PDF. Escondidos de verdade (e nao
      // so filtrados da imagem) para a folha encolher no lugar deles.
      docElem.querySelectorAll<HTMLElement>('.no-print').forEach((elem) => {
        noPrintStates.push({ elem, display: elem.style.display });
        elem.style.setProperty('display', 'none', 'important');
      });

      // Wait for all images to load before generating PDF
      const images = docElem.querySelectorAll('img');

      // Force set crossorigin on all images for proper CORS handling
      Array.from(images).forEach((img) => {
        if (!img.hasAttribute('crossorigin')) {
          img.setAttribute('crossorigin', 'anonymous');
        }
      });

      const imageLoadPromises = Array.from(images).map((img, idx) => {
        return new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            resolve();
          }, 3500);

          const handleLoad = () => {
            clearTimeout(timeout);
            img.removeEventListener('load', handleLoad);
            img.removeEventListener('error', handleError);
            resolve();
          };

          const handleError = () => {
            clearTimeout(timeout);
            img.removeEventListener('load', handleLoad);
            img.removeEventListener('error', handleError);
            resolve();
          };

          // Check if image is already fully loaded
          if (img.complete && img.naturalHeight > 0) {
            clearTimeout(timeout);
            resolve();
          } else {
            img.addEventListener('load', handleLoad, { once: true });
            img.addEventListener('error', handleError, { once: true });

            // Force re-load for data URLs to ensure they're rendered
            if (img.src && img.src.startsWith('data:')) {
              const src = img.src;
              img.src = '';
              Promise.resolve().then(() => {
                img.src = src;
              });
            }
          }
        });
      });

      await Promise.all(imageLoadPromises);
      // Extra time to ensure browser has rendered everything
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Force image elements to be visible and ensure they have dimensions
      // Temporarily remove overflow-hidden from image containers to allow html-to-image to capture them.
      // Exclui `.inspiration-image-container`: o overflow-hidden dele nao serve pra evitar corte
      // de altura (isso e resolvido separadamente abaixo, zerando o max-height) — serve pra
      // ARREDONDAR a foto de referencia (border-radius + overflow-hidden). Removido daqui, a foto
      // saia quadrada no PDF mesmo aparecendo redonda na tela.
      //
      // `.rounded-photo-container` (o retrato da cliente e a foto da confeitaria) sai pelo
      // mesmo motivo, e o caso e ainda mais claro: a imagem la dentro e exatamente do tamanho
      // da caixa (`w-full h-full`), entao nao existe nada transbordando para ser cortado — o
      // overflow-hidden dali SO arredonda. Com ele removido, a foto preenchia os cantos e as
      // duas saiam quadradas no PDF, com a borda arredondada desenhada por baixo.
      //
      // Marque com essa classe qualquer foto nova que dependa de border-radius +
      // overflow-hidden, em vez de acrescentar mais um `:not()` aqui a cada vez.
      const overflowElements = docElem.querySelectorAll(
        '[class*="overflow-hidden"]:not(.inspiration-image-container):not(.rounded-photo-container)'
      );
      overflowElements.forEach(elem => {
        const currentOverflow = window.getComputedStyle(elem).overflow;
        overflowStates.push({ elem, overflow: currentOverflow });
        (elem as HTMLElement).style.overflow = 'visible';
      });

      // Temporarily remove max-height restrictions from inspiration images
      const inspirationImages = docElem.querySelectorAll('.inspiration-image');

      inspirationImages.forEach(img => {
        const imgElement = img as HTMLElement;
        const currentMaxHeight = imgElement.style.maxHeight;

        imageHeightStates.push({ elem: img, maxHeight: currentMaxHeight });

        // Use !important to override Tailwind classes and ensure visibility
        imgElement.style.setProperty('max-height', 'none', 'important');
        imgElement.style.setProperty('height', 'auto', 'important');
        imgElement.style.setProperty('width', '100%', 'important');
        imgElement.style.setProperty('display', 'block', 'important');
        imgElement.style.setProperty('visibility', 'visible', 'important');
        imgElement.style.setProperty('opacity', '1', 'important');
        imgElement.style.setProperty('min-height', '50px', 'important');

      });

      // Also ensure image containers don't hide overflow
      const imageContainers = docElem.querySelectorAll('.inspiration-image-container');
      imageContainers.forEach(container => {
        const containerElement = container as HTMLElement;
        const currentMaxHeight = containerElement.style.maxHeight;
        containerStates.push({ elem: container, maxHeight: currentMaxHeight });

        // Force container to show all content. `overflow` fica INTOCADO de proposito
        // (continua `hidden`, do CSS original) — e o que arredonda a foto de referencia;
        // com o max-height zerado abaixo, nao ha mais altura pra cortar, entao manter o
        // overflow-hidden so arredonda, nao corta nada.
        containerElement.style.setProperty('max-height', 'none', 'important');
        containerElement.style.setProperty('height', 'auto', 'important');
        containerElement.style.setProperty('min-height', '100px', 'important');

      });

      // Detect if running on iOS (Safari mobile has known timing issues with html-to-image)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIosSafari = isIOS && /Safari/.test(navigator.userAgent) && !/Chrome|Firefox/.test(navigator.userAgent);

      // Extra delay to let browser re-render without overflow-hidden and max-height restrictions
      // Increased to 1500ms for desktop, 2500ms for iOS due to Safari WebKit rendering differences
      const delayMs = isIosSafari ? 2500 : 1500;
      await new Promise(resolve => setTimeout(resolve, delayMs));

      try {
        // Verify images are still in DOM before capturing
        const imgsBeforeCapture = docElem.querySelectorAll('img');

        // Additional check: if no images found, something is wrong with timing or selectors
        if (imgsBeforeCapture.length === 0) {
          console.warn('⚠️ WARNING: No images found in DOM before PDF capture. This suggests the image state has not updated the DOM yet.');
        }
        imgsBeforeCapture.forEach((img, idx) => {
          const imgElement = img as HTMLElement;
          const isVisible = imgElement.offsetHeight > 0 && imgElement.offsetWidth > 0;
        });

        // Captura a folha no tamanho natural dela. A pagina do PDF e que sera
        // criada com essa mesma proporcao, mais abaixo — assim a imagem preenche
        // a pagina de canto a canto por construcao, sem faixa branca em lado
        // nenhum.
        //
        // Nao adianta forcar a moldura da captura (ja tentei 794x1123, A4 a
        // 96dpi): ampliar o container NAO estica o conteudo. A folha usa
        // breakpoints do Tailwind (sm:p-1.5, sm:space-y-2), que respondem a
        // largura da JANELA, nao a do elemento. Num iPhone de 375px o `sm:`
        // nunca ativa, o conteudo continua diagramado para ~355px e o resto da
        // moldura vira branco — media a sobra em 883px, 56% da largura, tudo do
        // lado direito. Trocava margem centrada por margem de um lado so.
        //
        // O PDF nao e mais um A4 exato, e isso e intencional: e um arquivo para
        // enviar ao cliente, nao para imprimir.
        // Fontes embutidas por nos, nao pela autodetecao da biblioteca — ver
        // o comentario em `buildFontEmbedCss` no topo do arquivo.
        const fontEmbedCSS = await getFontEmbedCssCached();

        const capturaFolha = {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: '#FFFFFF',
          fontEmbedCSS,
        };

        // iOS Safari has known issue: first toPng() call often returns blank, second succeeds
        // Solution: Always do internal double attempt (user only sees single click)
        let imgData: string | undefined;

        // First attempt (discarded) - primes the canvas/rendering pipeline
        try {
          await toPng(docElem, capturaFolha);
        } catch (err) {
        }

        // Wait between attempts - gives browser time to update canvas state
        await new Promise(resolve => setTimeout(resolve, 300));

        // Second attempt (used) - this should have the image
        imgData = await toPng(docElem, capturaFolha);

        const capturedSize = imgData ? imgData.length : 0;

        if (!imgData) {
          throw new Error('Failed to generate PDF image on second attempt');
        }

        // Create image from data and get dimensions
        const img = new Image();
        img.onload = () => {
          // A pagina e criada com a proporcao da propria folha, em vez de
          // encaixar a folha num A4. Assim a imagem preenche a pagina de canto a
          // canto e nao sobra branco em lado nenhum — no visualizador do celular
          // o PDF encosta nas bordas da tela.
          //
          // unit 'px' para casar 1:1 com o PNG capturado; sem conversao para mm
          // nao ha arredondamento que deixe uma fresta de um pixel na borda.
          //
          // Deliberadamente NAO e A4: este PDF e para enviar ao cliente e
          // guardar, nao para imprimir.
          const pdf = new jsPDF({
            orientation: img.height >= img.width ? 'portrait' : 'landscape',
            unit: 'px',
            format: [img.width, img.height],
          });

          pdf.addImage(imgData, 'PNG', 0, 0, img.width, img.height);

          const isCozinha = activeTab === 'cozinha';
          const clientName = (transaction.customerName || 'Cliente').replace(/\s+/g, '_');
          const timestamp = new Date().getTime();
          const filename = isCozinha
            ? `Ficha_Cozinha_${clientName}_${timestamp}.pdf`
            : `Folha_Cliente_${clientName}_${timestamp}.pdf`;

          pdf.save(filename);
          restaurarEstilos();
        };
        img.src = imgData;

      } catch (err) {
        console.error('Error in html-to-image conversion:', err);
        throw err;
      }

    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Erro ao gerar PDF. Tente novamente.');
      restaurarEstilos();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // handleDownloadImage foi removida: baixava a folha como PNG via html2canvas,
  // mas nao estava ligada a botao nenhum — codigo inalcancavel. Levava junto a
  // dependencia html2canvas para o bundle sem ninguem poder usa-la. O caminho
  // vivo e handleDownloadPdf, que usa html-to-image.

  const handleCopyText = () => {
    // Cada linha da confeitaria so entra se houver dado. Antes elas eram
    // sempre montadas e, com o perfil vazio, imprimiam o contato fixo da dona
    // do app — ou "undefined" — na mensagem enviada a cliente.
    const sellerLines = [
      sellerName ? `👤 *Confeitaria:* ${sellerName}` : '',
      [sellerPhone ? `📞 *Contato:* ${sellerPhone}` : '', sellerEmail ? `✉️ ${sellerEmail}` : '']
        .filter(Boolean).join(' | '),
      sellerAddress ? `📍 *Endereço:* ${sellerAddress}` : '',
      sellerInstagram ? `📷 *Instagram:* ${sellerInstagram}` : '',
    ].filter(Boolean).join('\n');

    const text = `
✨ *PEDIDO DE ENCOMENDA${sellerName ? ` - ${sellerName.toUpperCase()}` : ''}* 🎂
────────────────────────
${sellerLines}
────────────────────────
👤 *Cliente:* ${transaction.customerName || 'Cliente'}
📞 *Telefone:* ${transaction.customerPhone || 'Não informado'}
📅 *Data do Evento:* ${transaction.eventDate ? formatDateBr(transaction.eventDate) : formatDateBr(transaction.date)}
⏰ *Horário:* ${transaction.deliveryTime || 'A combinar'}
📍 *Endereço/Entrega:* ${transaction.deliveryAddress || 'Retirada na Confeitaria'}

🎂 *ITENS DO PEDIDO:*
${transaction.description}

${transaction.observations ? `📝 *Observações:* ${transaction.observations}` : ''}

💰 *VALOR TOTAL DO PEDIDO:* ${formatCurrency(transaction.totalValue)}
${transaction.signalValue ? `✅ *Sinal/Entrada Pago:* ${formatCurrency(transaction.signalValue)}\n📋 *Restante a Pagar na Entrega:* ${formatCurrency(transaction.totalValue - transaction.signalValue)}` : ''}
💳 *Pagamento:* ${
  transaction.paymentMethod === 'cash' ? '💵 Cash (Dinheiro)'
  : transaction.paymentMethod === 'pix' ? '💸 Pix'
  : transaction.paymentMethod === 'zelle' ? '⚡ Zelle'
  : 'A combinar'
}

💖 _${sellerName ? `Obrigada(o) por escolher a ${sellerName}!` : 'Obrigada(o) pela preferência!'} Feito com amor._ ✨
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Helper to find technical recipe details for kitchen sheet
  const getRecipeDetailsForItem = (lineItem: string) => {
    const matchedFicha = fichas.find((f) =>
      lineItem.toLowerCase().includes(f.name.toLowerCase()) ||
      f.name.toLowerCase().includes(lineItem.toLowerCase())
    );
    return matchedFicha;
  };

  // Parse items list
  const itemLines = transaction.description
    .split(/\n|,|;|\+/)
    .map((l) => l.trim())
    .filter(Boolean);

  /**
   * Os itens da folha do cliente, cada um com o seu preco.
   *
   * A fonte boa e `breakdown.itens`, a lista estruturada que o pedido grava
   * com nome, quantidade e valor de cada linha. Ela e que permite mostrar o
   * preco ao lado do item — antes so o total do pedido aparecia, la embaixo.
   *
   * Pedidos gravados antes dessa lista existir (anteriores a 30/09) caem no
   * texto da descricao, como sempre foi, e saem SEM preco por item: inventar
   * um rateio do total seria mostrar a cliente um numero que ninguem cobrou.
   */
  const itensDaFolha: { nome: string; quantidade: number; valorTotal: number | null; adicional?: boolean; entrega?: boolean }[] =
    transaction.breakdown?.itens?.length
      ? transaction.breakdown.itens.map((i) => ({
          nome: i.nome,
          quantidade: Number(i.quantidade) || 1,
          valorTotal: Number(i.valorTotal) || 0,
        }))
      : itemLines.map((line) => ({ nome: line, quantidade: 1, valorTotal: null }));

  // Os adicionais (flores, topo, vela...) entram na lista, um por linha. Antes
  // so os produtos apareciam: o total ja somava o adicional e a cliente via
  // $260 com um bolo de $240 e nenhuma explicacao para os outros $20. So no
  // caminho estruturado — no antigo, o texto da descricao ja traz o adicional.
  // Pedido que gravou so o TOTAL dos adicionais (sem a lista) sai numa linha.
  if (transaction.breakdown?.itens?.length) {
    const detalhados = transaction.breakdown.adicionaisDetalhados || [];
    if (detalhados.length > 0) {
      detalhados.forEach((a) => {
        itensDaFolha.push({ nome: a.nome || 'Adicional', quantidade: 1, valorTotal: Number(a.valor) || 0, adicional: true });
      });
    } else if ((Number(transaction.breakdown.adicionais) || 0) > 0) {
      itensDaFolha.push({ nome: 'Adicionais', quantidade: 1, valorTotal: Number(transaction.breakdown.adicionais) });
    }
    // A taxa de entrega tambem soma no total; sem esta linha a conta nao fechava.
    const taxaEntrega = Number(transaction.breakdown.delivery) || 0;
    if (taxaEntrega > 0) {
      itensDaFolha.push({ nome: 'Taxa de entrega', quantidade: 1, valorTotal: taxaEntrega, entrega: true });
    }
  }

  // Avatar da cliente sem foto: as iniciais do nome ("Marina Prado" -> "MP").
  const iniciaisDaCliente = (transaction.customerName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((parte) => parte[0])
    .filter((_, i, todas) => i === 0 || i === todas.length - 1)
    .join('')
    .toUpperCase() || 'C';

  // Filter out delivery and fee items for the Kitchen Production sheet
  const recipeItems = itemLines.filter((line) => {
    const lower = line.toLowerCase();
    return (
      !lower.includes('entrega') &&
      !lower.includes('delivery') &&
      !lower.includes('frete') &&
      !lower.includes('adicional') &&
      !lower.includes('taxa')
    );
  });

  const toggleAccordion = (idx: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0" role="dialog" aria-modal="true">
      {/* Strict Print CSS for Single Page output */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 4mm;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #quote-pdf-document, #quote-pdf-document * {
            visibility: visible !important;
          }
          #quote-pdf-document {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 8px !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            display: block !important;
            position: static !important;
          }
          #quote-pdf-document * {
            background-color: white !important;
            color: black !important;
            border-color: #dddddd !important;
          }
          .no-print {
            display: none !important;
          }
          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-xl max-w-2xl w-full shadow-highlight overflow-hidden flex flex-col max-h-[92vh] print:shadow-none print:rounded-none print:max-h-none border-2 border-pink-200 relative" aria-label="Orçamento PDF">

        {/* STICKY TOP CONTROL BAR - ALWAYS VISIBLE & CLEAR ON ALL DEVICES */}
        <div className="p-2.5 sm:p-3 bg-gradient-to-r from-[#3A2350] to-[#A85E86] text-white flex items-center justify-between gap-2 no-print shrink-0 sticky top-0 z-50 border-b border-white/10 shadow-sm">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('cliente')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'cliente'
                  ? 'bg-[#F5B9C6] text-[#3A2350] shadow-sm font-extrabold'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" /> Folha do Cliente
            </button>
            <button
              onClick={() => setActiveTab('cozinha')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'cozinha'
                  ? 'bg-[#A9D8B8] text-[#3A2350] shadow-sm font-extrabold'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <ChefHat className="w-3 h-3" /> Cozinha
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Direct PDF Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#F5B9C6] hover:bg-[#E8A0B0] text-[#3A2350] text-[11px] sm:text-xs font-black flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Baixar arquivo PDF no seu celular ou computador"
            >
              <FileText className="w-3 h-3" />
              <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Baixar PDF'}</span>
            </button>

            {/* Close Button - Icon Only */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Fechar Janela"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div
          id="quote-pdf-document"
          className="@container p-1 sm:p-1.5 flex-1 min-h-0 overflow-y-auto space-y-1 sm:space-y-2 bg-[#F6F2F5] text-[#241B2B] print:p-1 print:bg-white print:overflow-visible print:flex-none"
        >
          {/* Barra so da miniatura (celular): os botoes de foto da folha ficam
              minusculos reduzidos, entao aparecem aqui em tamanho normal. E
              no-print, e some na captura (a miniatura e desligada nela). */}
          {miniatura && (
            <div className="no-print flex items-center justify-between gap-2" style={{ padding: '6px 4px 4px', fontFamily: "'Manrope', sans-serif" }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#7A6E80' }}>Prévia do PDF</span>
              <div className="flex items-center gap-1.5">
                <label className="px-3 py-1.5 rounded-xl bg-[#F5B9C6] text-[#3A2350] font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-sm">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{inspirationImage ? 'Alterar foto' : 'Adicionar foto'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {inspirationImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-2.5 py-1.5 rounded-xl bg-red-100 text-red-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    title="Remover Foto de Referência"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Remover</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div ref={miniaturaRef} style={miniatura ? { height: `${miniatura.altura}px`, overflow: 'hidden' } : undefined}>
          <div
            ref={folhaRef}
            className={miniatura ? '@container [&_.no-print]:hidden' : '@container'}
            style={miniatura ? { width: `${LARGURA_FOLHA}px`, transform: `scale(${miniatura.escala})`, transformOrigin: 'top left' } : undefined}
          >
          {activeTab === 'cliente' ? (
            /* ======================================================== */
            /* TAB 1: FOLHA DO CLIENTE (GROOVY COMPACT 1-PAGE LAYOUT)   */
            /* ======================================================== */
            <div className="flex flex-col gap-3 p-2 @min-[600px]:p-4" style={{ background: '#F6F2F5', fontFamily: "'Manrope', sans-serif", color: '#241B2B' }}>
              {/* Visual da "Versao final · combinada" desenhada no Claude Design
                  (artefato "Pedido Carula Cake"): cabecalho em forma de ticket,
                  cards brancos com rotulos roxos, foto em pe a direita e o
                  pagamento em versao clara. Cores e fontes literais porque as
                  variaveis --color-* nao existem em runtime. */}

              {/* Cabecalho: nome da confeitaria + contatos do perfil */}
              <header
                className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-2 print-avoid-break"
                style={{ minHeight: '72px', padding: '12px 18px 12px 28px', borderRadius: '20px', background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)', boxShadow: '0 14px 30px rgba(58,35,80,.3)' }}
              >
                <span aria-hidden="true" className="absolute top-1/2 -translate-y-1/2 rounded-full" style={{ left: '-11px', width: '22px', height: '22px', background: '#F6F2F5' }} />
                <span aria-hidden="true" className="absolute top-1/2 -translate-y-1/2 rounded-full" style={{ right: '-11px', width: '22px', height: '22px', background: '#F6F2F5' }} />
                <div className="flex items-center gap-3 min-w-0">
                  {/* Logo so quando a confeitaria cadastrou uma. A classe
                      `rounded-photo-container` mantem o arredondamento na
                      captura do PDF — ver o seletor em `handleDownloadPdf`. */}
                  {sellerPhotoUrl && (
                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-white rounded-photo-container">
                      <img src={sellerPhotoUrl} alt={sellerName || 'Logo da confeitaria'} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5 min-w-0" style={{ borderLeft: '2px dashed rgba(245,185,198,.5)', paddingLeft: '14px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.24em', color: 'rgba(247,220,225,.8)' }}>CONFEITARIA</span>
                    {/* Sem fallback de nome: perfil incompleto sai em branco.
                        Um orcamento com o nome de outra confeitaria e pior do
                        que um orcamento sem nome. */}
                    <span className="truncate" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '32px', lineHeight: 1, color: '#FFFFFF' }}>{sellerName}</span>
                  </div>
                </div>
                {(sellerPhone || sellerInstagram || sellerAddress) && (
                  <div className="flex flex-wrap gap-2">
                    {[
                      { valor: sellerPhone, Icone: Phone },
                      { valor: sellerInstagram, Icone: Instagram },
                      { valor: sellerAddress, Icone: MapPin },
                    ].filter((c) => c.valor).map(({ valor, Icone }) => (
                      <span key={valor} className="flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,.14)', color: '#FFFFFF', fontSize: '11px', fontWeight: 700, padding: '7px 11px', borderRadius: '11px' }}>
                        <Icone className="w-3 h-3 shrink-0" style={{ color: '#F5B9C6' }} strokeWidth={2.2} />
                        {valor}
                      </span>
                    ))}
                  </div>
                )}
              </header>

              {/* Com foto: cliente, evento e itens a esquerda e a foto em pe a
                  direita, na altura deles. Sem foto, uma coluna so (o convite
                  para enviar foto e no-print, a direita ficaria vazia no PDF).
                  As colunas seguem a largura da FOLHA (container query), nao
                  da janela: um "sm:" responderia a janela e no celular nunca
                  ativaria. Na tela do celular empilham; no PDF, montado com
                  668px em handleDownloadPdf, ficam lado a lado. */}
              <div className={inspirationImage ? 'grid grid-cols-1 @min-[600px]:grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
                <div className="flex flex-col gap-3 min-w-0">
                  {/* Cliente */}
                  <section className="print-avoid-break" style={{ background: '#FFFFFF', borderRadius: '22px', boxShadow: '0 8px 20px rgba(58,35,80,.09)', padding: '14px 18px' }}>
                    <div className="flex items-center gap-[7px]" style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.12em', color: '#6E3F72' }}>
                      <User className="w-[13px] h-[13px]" strokeWidth={2.2} />
                      DADOS DA(O) CLIENTE
                    </div>
                    <div className="flex items-center gap-3 mt-2.5">
                      {/* Foto da cliente quando existe; senao as iniciais.
                          Mesma marcacao da logo: sem ela o retrato sai quadrado
                          no PDF. */}
                      <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center rounded-photo-container" style={{ background: '#F3E9F3', fontFamily: "'Instrument Serif', serif", fontSize: '20px', color: '#6E3F72' }}>
                        {custPhoto ? (
                          <img src={custPhoto} alt={transaction.customerName || 'Cliente'} className="w-full h-full object-cover" />
                        ) : (
                          iniciaisDaCliente
                        )}
                      </div>
                      <div className="flex flex-col gap-[3px] min-w-0">
                        <span className="truncate" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '22px', lineHeight: 1.1 }}>
                          {transaction.customerName || 'Cliente'}
                        </span>
                        <span className="flex items-center gap-[5px]" style={{ fontSize: '11px', fontWeight: 600, color: '#7A6E80' }}>
                          <Phone className="w-[11px] h-[11px] shrink-0" style={{ color: '#C4626F' }} strokeWidth={2.2} />
                          {transaction.customerPhone || 'Não informado'}
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Evento & horario de entrega */}
                  <section className="print-avoid-break" style={{ background: '#FFFFFF', border: '1px solid rgba(36,27,43,.07)', borderRadius: '22px', boxShadow: '0 8px 20px rgba(58,35,80,.09)', padding: '14px 16px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.12em', color: '#6E3F72' }}>EVENTO &amp; HORÁRIO DE ENTREGA</span>
                    <div className="grid grid-cols-2 gap-2 mt-[9px]">
                      {[
                        { rotulo: 'DATA', valor: transaction.eventDate ? formatDateBr(transaction.eventDate) : formatDateBr(transaction.date) },
                        { rotulo: 'HORÁRIO', valor: transaction.deliveryTime || 'A combinar' },
                      ].map((c) => (
                        <div key={c.rotulo} className="flex flex-col gap-px min-w-0" style={{ background: '#F6F2F5', borderRadius: '14px', padding: '8px 12px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.1em', color: '#7A6E80' }}>{c.rotulo}</span>
                          <span className="truncate" style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-.02em' }}>{c.valor}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2" style={{ fontSize: '11px', fontWeight: 600, color: '#5B4A6B' }}>
                      <MapPin className="w-3 h-3 shrink-0" style={{ color: '#6E3F72' }} strokeWidth={2.2} />
                      {transaction.deliveryAddress || 'Retirada na confeitaria'}
                    </div>
                  </section>

                  {/* Itens solicitados */}
                  <section className="flex-1 flex flex-col gap-[7px] print-avoid-break" style={{ background: '#FFFFFF', border: '1px solid rgba(36,27,43,.07)', borderRadius: '22px', boxShadow: '0 8px 20px rgba(58,35,80,.09)', padding: '14px 16px' }}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.12em', color: '#6E3F72' }}>ITENS SOLICITADOS</span>
                      <span className="whitespace-nowrap" style={{ background: '#F3E9F3', color: '#3A2350', fontSize: '9px', fontWeight: 800, padding: '5px 10px', borderRadius: '999px' }}>
                        Qtd total: {transaction.quantity}
                      </span>
                    </div>
                    {itensDaFolha.map((item, idx) => {
                      // Icone e cor por tipo de linha, como no design: produto
                      // (roxo), adicional (rosa) e taxa de entrega (bege).
                      const visual = item.entrega
                        ? { Icone: Truck, fundo: '#F0E2C8', cor: '#5B4A2E' }
                        : item.adicional
                          ? { Icone: Flower2, fundo: '#FCEFF2', cor: '#C4626F' }
                          : { Icone: Cake, fundo: '#3A2350', cor: '#F5B9C6' };
                      return (
                        <div key={`item-${idx}-${item.nome}`} className="flex items-center gap-2.5" style={{ border: '1px solid #EDE6EF', borderRadius: '16px', padding: '8px 10px' }}>
                          <div className="w-[30px] h-[30px] shrink-0 flex items-center justify-center" style={{ borderRadius: '10px', background: visual.fundo }}>
                            <visual.Icone className="w-[15px] h-[15px]" style={{ color: visual.cor }} strokeWidth={2} />
                          </div>
                          <span className="flex-1 min-w-0 leading-tight" style={{ fontSize: '13px', fontWeight: 700 }}>
                            {item.adicional && <span style={{ fontWeight: 600, color: '#7A6E80' }}>Adicional · </span>}
                            {item.quantidade > 1 && `${item.quantidade}× `}{item.nome}
                          </span>
                          {item.valorTotal !== null && (
                            <span className="shrink-0 tabular-nums" style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-.02em' }}>
                              {formatCurrency(item.valorTotal)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {transaction.observations && (
                      <div className="mt-auto flex items-start gap-[7px]" style={{ background: '#FBF6EC', color: '#5B4A2E', borderRadius: '14px', padding: '9px 12px', fontSize: '11px', fontWeight: 600, lineHeight: 1.45 }}>
                        <Pencil className="w-3 h-3 shrink-0 mt-0.5" strokeWidth={2.2} />
                        <span><b style={{ fontWeight: 800 }}>Observações:</b> "{transaction.observations}"</span>
                      </div>
                    )}
                  </section>
                </div>

                {/* Foto de referencia: preenche a coluna da direita na altura
                    dos cards (object-cover, como no design). Fica fora das
                    classes `inspiration-image*`, que forcam altura automatica
                    na captura; `rounded-photo-container` mantem o recorte
                    arredondado. Na tela estreita vira um retrato 3:4 centrado. */}
                {inspirationImage ? (
                  <div className="flex flex-col gap-2 min-w-0">
                    <section
                      className="relative overflow-hidden rounded-photo-container aspect-[3/4] w-[70%] mx-auto @min-[600px]:aspect-auto @min-[600px]:w-full @min-[600px]:flex-1"
                      style={{ minHeight: '200px', borderRadius: '26px', border: '3px solid #FFFFFF', boxShadow: '0 0 0 1.5px #F5B9C6, 0 14px 30px rgba(58,35,80,.16)' }}
                    >
                      <img src={inspirationImage} alt="Foto de referência do bolo" className="absolute inset-0 w-full h-full object-cover" />
                      <span className="absolute" style={{ top: '12px', left: '12px', background: 'rgba(255,255,255,.92)', color: '#3A2350', fontSize: '9px', fontWeight: 800, letterSpacing: '.12em', padding: '6px 11px', borderRadius: '999px', boxShadow: '0 4px 10px rgba(58,35,80,.12)' }}>
                        FOTO DE REFERÊNCIA
                      </span>
                    </section>
                    <div className="flex items-center justify-center gap-1.5 no-print">
                      <label className="px-2.5 py-1 rounded-xl bg-[#F5B9C6] hover:bg-[#E8A0B0] text-[#3A2350] font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm">
                        <Camera className="w-3 h-3 text-[#3A2350]" />
                        <span>Alterar Foto</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-2 py-1 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Remover Foto de Referência"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                        <span>Remover</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-print" style={{ background: '#FFFFFF', borderRadius: '22px', border: '2px dashed #F5B9C6' }}>
                    <label className="flex flex-col items-center justify-center py-5 px-4 cursor-pointer text-center gap-1.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#FCEFF2', color: '#6E3F72' }}>
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs" style={{ color: '#3A2350' }}>+ Adicionar Foto de Referência do Cliente</span>
                      <span className="text-[10px] max-w-sm" style={{ color: '#7A6E80' }}>
                        Clique aqui para enviar a foto do modelo/bolo enviada pela cliente.
                      </span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                )}
              </div>

              {/* Pagamento (versao clara do design) */}
              <section
                className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-3 print-avoid-break"
                style={{ minHeight: '112px', padding: '16px 30px', borderRadius: '22px', background: '#FDF6F8', border: '1px solid rgba(196,98,111,.16)', boxShadow: '0 8px 20px rgba(58,35,80,.09)' }}
              >
                <span aria-hidden="true" className="absolute top-1/2 -translate-y-1/2 rounded-full" style={{ left: '-11px', width: '22px', height: '22px', background: '#F6F2F5', border: '1px solid rgba(196,98,111,.16)' }} />
                <span aria-hidden="true" className="absolute top-1/2 -translate-y-1/2 rounded-full" style={{ right: '-11px', width: '22px', height: '22px', background: '#F6F2F5', border: '1px solid rgba(196,98,111,.16)' }} />
                <div className="flex flex-col gap-[9px]">
                  <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.2em', color: '#6E3F72' }}>FORMA DE PAGAMENTO</span>
                  <span className="self-start flex items-center gap-1.5" style={{ background: '#F5B9C6', color: '#3A2350', fontSize: '10px', fontWeight: 800, letterSpacing: '.08em', padding: '6px 12px', borderRadius: '999px' }}>
                    <Zap className="w-[11px] h-[11px]" strokeWidth={2.4} />
                    {transaction.paymentMethod === 'cash' ? 'DINHEIRO / ESPÉCIE' : (transaction.paymentMethod ? transaction.paymentMethod.toUpperCase() : 'A COMBINAR')}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-[3px] ml-auto" style={{ borderLeft: '2px dashed rgba(196,98,111,.3)', paddingLeft: '28px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.2em', color: '#6E3F72' }}>VALOR TOTAL DO PEDIDO</span>
                  <span style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.05, color: '#3A2350' }}>
                    {formatCurrency(transaction.totalValue)}
                  </span>
                  {transaction.signalValue ? (
                    <span className="text-right" style={{ fontSize: '11px', fontWeight: 600, color: '#7A6E80' }}>
                      Sinal pago <b style={{ color: '#4C7358', fontWeight: 800 }}>{formatCurrency(transaction.signalValue)}</b> · A pagar na entrega <b style={{ color: '#C4626F', fontWeight: 800 }}>{formatCurrency(transaction.totalValue - transaction.signalValue)}</b>
                    </span>
                  ) : null}
                </div>
              </section>

              {/* Rodape. Nome segue o perfil (antes era fixo "Carula Cake
                  Confeitaria" para toda compradora) e some quando vazio. */}
              <footer className="flex flex-col gap-0.5 text-center print-avoid-break" style={{ marginTop: '6px', borderTop: '1px dashed rgba(36,27,43,.14)', paddingTop: '12px' }}>
                <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '18px', color: '#3A2350' }}>
                  {sellerName ? `Obrigada(o) por escolher a ${sellerName}!` : 'Obrigada(o) pela preferência!'}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#7A6E80' }}>Encomenda feita com amor e carinho</span>
              </footer>
            </div>
          ) : (
            /* ======================================================== */
            /* TAB 2: FICHA TÉCNICA DE PRODUÇÃO - COZINHA (RECIPES ONLY) */
            /* ======================================================== */
            <div className="flex flex-col gap-3 p-2 @min-[600px]:p-4" style={{ background: '#F6F2F5', fontFamily: "'Manrope', sans-serif", color: '#241B2B' }}>
              {/* Mesmo visual da Folha do Cliente (design "Pedido Carula
                  Cake"), com o conteudo da producao: sem precos, com a foto
                  para a decoracao e os insumos de cada item. */}

              {/* Cabecalho em forma de ticket */}
              <header
                className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-2 print-avoid-break"
                style={{ minHeight: '72px', padding: '12px 18px 12px 28px', borderRadius: '20px', background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)', boxShadow: '0 14px 30px rgba(58,35,80,.3)' }}
              >
                <span aria-hidden="true" className="absolute top-1/2 -translate-y-1/2 rounded-full" style={{ left: '-11px', width: '22px', height: '22px', background: '#F6F2F5' }} />
                <span aria-hidden="true" className="absolute top-1/2 -translate-y-1/2 rounded-full" style={{ right: '-11px', width: '22px', height: '22px', background: '#F6F2F5' }} />
                <div className="flex flex-col gap-0.5 min-w-0" style={{ borderLeft: '2px dashed rgba(245,185,198,.5)', paddingLeft: '14px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.24em', color: 'rgba(247,220,225,.8)' }}>PRODUÇÃO{sellerName ? ` · ${sellerName.toUpperCase()}` : ''}</span>
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '32px', lineHeight: 1, color: '#FFFFFF' }}>Ficha da Cozinha</span>
                </div>
                <span className="flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,.14)', color: '#FFFFFF', fontSize: '11px', fontWeight: 700, padding: '7px 11px', borderRadius: '11px' }}>
                  <ChefHat className="w-3 h-3 shrink-0" style={{ color: '#F5B9C6' }} strokeWidth={2.2} />
                  Uso interno
                </span>
              </header>

              {/* Com foto: cliente/entrega e observacoes a esquerda, foto a
                  direita. Mesma regra de colunas da Folha do Cliente. */}
              <div className={inspirationImage ? 'grid grid-cols-1 @min-[600px]:grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
                <div className="flex flex-col gap-3 min-w-0">
                  {/* Cliente */}
                  <section className="print-avoid-break" style={{ background: '#FFFFFF', borderRadius: '22px', boxShadow: '0 8px 20px rgba(58,35,80,.09)', padding: '14px 18px' }}>
                    <div className="flex items-center gap-[7px]" style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.12em', color: '#6E3F72' }}>
                      <User className="w-[13px] h-[13px]" strokeWidth={2.2} />
                      CLIENTE
                    </div>
                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center rounded-photo-container" style={{ background: '#F3E9F3', fontFamily: "'Instrument Serif', serif", fontSize: '20px', color: '#6E3F72' }}>
                        {custPhoto ? (
                          <img src={custPhoto} alt={transaction.customerName || 'Cliente'} className="w-full h-full object-cover" />
                        ) : (
                          iniciaisDaCliente
                        )}
                      </div>
                      <div className="flex flex-col gap-[3px] min-w-0">
                        <span className="truncate" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '22px', lineHeight: 1.1 }}>
                          {transaction.customerName || 'Cliente'}
                        </span>
                        {transaction.customerPhone && (
                          <span className="flex items-center gap-[5px]" style={{ fontSize: '11px', fontWeight: 600, color: '#7A6E80' }}>
                            <Phone className="w-[11px] h-[11px] shrink-0" style={{ color: '#C4626F' }} strokeWidth={2.2} />
                            {transaction.customerPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Entrega */}
                  <section className="print-avoid-break" style={{ background: '#FFFFFF', border: '1px solid rgba(36,27,43,.07)', borderRadius: '22px', boxShadow: '0 8px 20px rgba(58,35,80,.09)', padding: '14px 16px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.12em', color: '#6E3F72' }}>PRONTO PARA ENTREGA</span>
                    <div className="grid grid-cols-2 gap-2 mt-[9px]">
                      {[
                        { rotulo: 'DATA', valor: transaction.eventDate ? formatDateBr(transaction.eventDate) : formatDateBr(transaction.date) },
                        { rotulo: 'HORÁRIO', valor: transaction.deliveryTime || 'A definir' },
                      ].map((c) => (
                        <div key={c.rotulo} className="flex flex-col gap-px min-w-0" style={{ background: '#F6F2F5', borderRadius: '14px', padding: '8px 12px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.1em', color: '#7A6E80' }}>{c.rotulo}</span>
                          <span className="truncate" style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-.02em' }}>{c.valor}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2" style={{ fontSize: '11px', fontWeight: 600, color: '#5B4A6B' }}>
                      <MapPin className="w-3 h-3 shrink-0" style={{ color: '#6E3F72' }} strokeWidth={2.2} />
                      {transaction.deliveryAddress || 'Retirada na confeitaria'}
                    </div>
                  </section>

                  {/* Observacoes: na cozinha elas importam tanto quanto a
                      receita, entao ganham card proprio */}
                  <section className="flex-1 flex items-start gap-2 print-avoid-break" style={{ background: '#FBF6EC', color: '#5B4A2E', borderRadius: '22px', padding: '14px 16px', fontSize: '12px', fontWeight: 600, lineHeight: 1.5 }}>
                    <Pencil className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2.2} />
                    <span>
                      <b style={{ fontWeight: 800, display: 'block', fontSize: '9px', letterSpacing: '.12em', marginBottom: '3px' }}>OBSERVAÇÕES DA CLIENTE</b>
                      {transaction.observations ? `"${transaction.observations}"` : 'Nenhuma observação especial.'}
                    </span>
                  </section>
                </div>

                {/* Foto para a decoracao: mesma montagem da Folha do Cliente */}
                {inspirationImage ? (
                  <div className="flex flex-col gap-2 min-w-0">
                    <section
                      className="relative overflow-hidden rounded-photo-container aspect-[3/4] w-[70%] mx-auto @min-[600px]:aspect-auto @min-[600px]:w-full @min-[600px]:flex-1"
                      style={{ minHeight: '200px', borderRadius: '26px', border: '3px solid #FFFFFF', boxShadow: '0 0 0 1.5px #F5B9C6, 0 14px 30px rgba(58,35,80,.16)' }}
                    >
                      <img src={inspirationImage} alt="Foto de referência para a decoração" className="absolute inset-0 w-full h-full object-cover" />
                      <span className="absolute" style={{ top: '12px', left: '12px', background: 'rgba(255,255,255,.92)', color: '#3A2350', fontSize: '9px', fontWeight: 800, letterSpacing: '.12em', padding: '6px 11px', borderRadius: '999px', boxShadow: '0 4px 10px rgba(58,35,80,.12)' }}>
                        REFERÊNCIA DA DECORAÇÃO
                      </span>
                    </section>
                    <div className="flex items-center justify-center gap-1.5 no-print">
                      <label className="px-2.5 py-1 rounded-xl bg-[#F5B9C6] hover:bg-[#E8A0B0] text-[#3A2350] font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm">
                        <Camera className="w-3 h-3 text-[#3A2350]" />
                        <span>Alterar Foto</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-2 py-1 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Remover Foto de Referência"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                        <span>Remover</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-print" style={{ background: '#FFFFFF', borderRadius: '22px', border: '2px dashed #F5B9C6' }}>
                    <label className="flex flex-col items-center justify-center py-5 px-4 cursor-pointer text-center gap-1.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#FCEFF2', color: '#6E3F72' }}>
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs" style={{ color: '#3A2350' }}>+ Adicionar Foto de Referência para Cozinha</span>
                      <span className="text-[10px] max-w-sm" style={{ color: '#7A6E80' }}>
                        Clique aqui para enviar a foto do modelo/bolo para a equipe de produção e decoração.
                      </span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                )}
              </div>

              {/* Insumos de cada item, com a largura toda (a lista pode ser
                  longa). Cada item abre/fecha na tela; no PDF sai como estiver. */}
              <section className="flex flex-col gap-2.5" style={{ background: '#FFFFFF', border: '1px solid rgba(36,27,43,.07)', borderRadius: '22px', boxShadow: '0 8px 20px rgba(58,35,80,.09)', padding: '14px 16px' }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-[7px]" style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.12em', color: '#6E3F72' }}>
                    <Layers className="w-[13px] h-[13px]" strokeWidth={2.2} />
                    INSUMOS DA PRODUÇÃO
                  </span>
                  <span className="whitespace-nowrap" style={{ background: '#F3E9F3', color: '#3A2350', fontSize: '9px', fontWeight: 800, padding: '5px 10px', borderRadius: '999px' }}>
                    {recipeItems.length} {recipeItems.length === 1 ? 'item de receita' : 'itens de receita'}
                  </span>
                </div>
                <span className="no-print" style={{ fontSize: '10px', fontWeight: 600, color: '#7A6E80' }}>
                  Toque no item para abrir ou fechar os ingredientes.
                </span>

                {recipeItems.length === 0 ? (
                  <div className="text-center" style={{ background: '#F6F2F5', borderRadius: '14px', padding: '14px', fontSize: '12px', fontWeight: 600, color: '#7A6E80' }}>
                    Nenhum item de receita cadastrado neste pedido.
                  </div>
                ) : (
                  recipeItems.map((itemStr, idx) => {
                    const ficha = getRecipeDetailsForItem(itemStr);
                    const isOpen = expandedItems[idx] !== false; // aberto por padrao

                    return (
                      <div key={`recipe-${idx}-${itemStr}`} className="print-avoid-break" style={{ border: '1px solid #EDE6EF', borderRadius: '16px', overflow: 'hidden' }}>
                        <button
                          type="button"
                          onClick={() => toggleAccordion(idx)}
                          className="w-full flex items-center gap-2.5 text-left cursor-pointer"
                          style={{ padding: '8px 10px', background: '#FFFFFF' }}
                        >
                          <div className="w-[30px] h-[30px] shrink-0 flex items-center justify-center" style={{ borderRadius: '10px', background: '#3A2350' }}>
                            <Cake className="w-[15px] h-[15px]" style={{ color: '#F5B9C6' }} strokeWidth={2} />
                          </div>
                          <span className="flex-1 min-w-0 leading-tight" style={{ fontSize: '13px', fontWeight: 700 }}>{itemStr}</span>
                          {ficha && (
                            <span className="shrink-0 whitespace-nowrap" style={{ background: '#FCEFF2', color: '#3A2350', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px' }}>
                              Rende {formatRendimentoParaExibir(ficha)}
                            </span>
                          )}
                          <span className="no-print shrink-0" style={{ color: '#7A6E80' }}>
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                        </button>

                        {isOpen && (
                          <div style={{ padding: '4px 10px 10px', background: '#FFFFFF' }}>
                            {ficha && ficha.ingredients.length > 0 ? (
                              <div className="grid grid-cols-1 @min-[600px]:grid-cols-2 gap-1.5">
                                {ficha.ingredients.map((ing) => (
                                  <div key={ing.id} className="flex items-center justify-between gap-2" style={{ background: '#F6F2F5', borderRadius: '12px', padding: '7px 10px' }}>
                                    <span className="min-w-0 truncate" style={{ fontSize: '12px', fontWeight: 700 }}>{ing.name}</span>
                                    <span className="shrink-0 tabular-nums" style={{ background: '#E7F2EA', color: '#3A2350', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '8px' }}>
                                      {ing.quantity} {ing.unit}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ background: '#F6F2F5', borderRadius: '12px', padding: '9px 12px', fontSize: '11px', fontWeight: 600, fontStyle: 'italic', color: '#7A6E80' }}>
                                Sem ficha técnica cadastrada para "{itemStr}". Monte os insumos da receita padrão.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </section>
            </div>
          )}
          </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
