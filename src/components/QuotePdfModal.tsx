import React, { useEffect, useState } from 'react';
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
import {
  Printer,
  X,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Calendar,
  Sparkles,
  Heart,
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
} from 'lucide-react';

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
  const { updateTransacao } = useTransacoes();

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

    const result = await compressImageFile(file);
    if (result) {
      setInspirationImage(result);
      await persistirImagem(result);
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

  useEffect(() => {
    if (custPhoto || !transaction.customerName) return;
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
  }, [custPhoto, transaction.customerName, transaction.customerPhone, customers, fetchCustomerPhoto]);

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

    /** Devolve a folha ao estado normal. Roda no sucesso e no erro. */
    const restaurarEstilos = () => {
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
      // Temporarily remove overflow-hidden from image containers to allow html-to-image to capture them
      const overflowElements = docElem.querySelectorAll('[class*="overflow-hidden"]');
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

        // Force container to show all content
        containerElement.style.setProperty('max-height', 'none', 'important');
        containerElement.style.setProperty('height', 'auto', 'important');
        containerElement.style.setProperty('overflow', 'visible', 'important');
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
        const capturaFolha = {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: '#FFFFFF',
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
💳 *Pagamento:* ${transaction.paymentMethod === 'cash' ? '💵 Cash (Dinheiro)' : '⚡ Zelle'}

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

      <div className="bg-white rounded-xl max-w-2xl w-full shadow-highlight overflow-hidden flex flex-col print:shadow-none print:rounded-none border-2 border-pink-200 relative" aria-label="Orçamento PDF">

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
          className="p-1 sm:p-1.5 overflow-y-auto space-y-1 sm:space-y-2 bg-[#F6F2F5] text-[#241B2B] print:p-1 print:bg-white"
        >
          {activeTab === 'cliente' ? (
            /* ======================================================== */
            /* TAB 1: FOLHA DO CLIENTE (GROOVY COMPACT 1-PAGE LAYOUT)   */
            /* ======================================================== */
            <div className="space-y-1 sm:space-y-2">
              {/* Header Banner - Groovy Brand Identity */}
              <div className="bg-gradient-to-r from-[#3A2350] to-[#A85E86] rounded-lg p-3.5 text-white shadow-card border border-white/20 print:border-neutral-300 print:bg-white print:text-neutral-900 print-avoid-break">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white border-2 border-[var(--color-pastry-light-pink)] shadow-card flex items-center justify-center overflow-hidden shrink-0">
                      {sellerPhotoUrl ? (
                        <img
                          src={sellerPhotoUrl}
                          alt={sellerName || 'Foto da confeitaria'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-[var(--color-pastry-chocolate)]" />
                      )}
                    </div>
                    <div>
                      {/* Sem fallback de nome: perfil incompleto sai em branco.
                          Um orcamento com o nome de outra confeitaria e pior
                          do que um orcamento sem nome. */}
                      <h2 className="font-bold text-lg sm:text-xl tracking-tight leading-tight text-[var(--color-pastry-chocolate)]">
                        {sellerName}
                      </h2>
                      <p className="text-[11px] text-[var(--color-pastry-chocolate)]/80 font-bold flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-[#E8A0B0] text-[var(--color-pastry-light-pink)] shrink-0" />
                        <span>Confeitaria Artesanal & Bolos de Festa</span>
                      </p>
                    </div>
                  </div>

                  {/* Seller Contact Info */}
                  <div className="text-[10px] font-bold text-[var(--color-pastry-chocolate)] text-right space-y-0.5 print:text-neutral-800 shrink-0">
                    {sellerPhone && <div>📞 {sellerPhone}</div>}
                    {sellerInstagram && <div>📷 {sellerInstagram}</div>}
                    {sellerAddress && <div>📍 {sellerAddress}</div>}
                  </div>
                </div>
              </div>

              {/* Grid 1: Client & Event Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 print-avoid-break">
                {/* Customer Box */}
                <div className="bg-white p-3 rounded-[16px] border border-[#E6E1DB] shadow-sm space-y-1.5">
                  <h4 className="text-[9px] font-black uppercase tracking-wider text-[#241B2B] flex items-center gap-1 border-b border-[#E6E1DB] pb-0.5" style={{ fontFamily: "'Manrope', sans-serif", letterSpacing: '.06em' }}>
                    👤 Dados da(o) Cliente Especial
                  </h4>
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-full border-2 border-[var(--color-pastry-light-pink)] overflow-hidden bg-[var(--color-pastry-pink)]/30 flex items-center justify-center shrink-0 shadow-card">
                      {custPhoto ? (
                        <img
                          src={custPhoto}
                          alt={transaction.customerName || 'Cliente'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-[var(--color-pastry-chocolate)]/60" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[var(--color-pastry-chocolate)] leading-tight truncate">
                        {transaction.customerName || 'Cliente'}
                      </p>
                      <p className="text-[11px] font-bold text-[var(--color-pastry-chocolate)]/80 flex items-center gap-1 mt-0.5">
                        📞 {transaction.customerPhone || 'Não informado'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Event & Delivery Box */}
                <div className="bg-white p-3 rounded-[16px] border border-[#E6E1DB] shadow-sm space-y-1">
                  <h4 className="text-[9px] font-black uppercase tracking-wider text-[#241B2B] flex items-center gap-1 border-b border-[#E6E1DB] pb-0.5" style={{ fontFamily: "'Manrope', sans-serif", letterSpacing: '.06em' }}>
                    📅 Evento & Horário de Entrega
                  </h4>
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--color-pastry-chocolate)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[var(--color-pastry-chocolate)]/70" /> Data:{' '}
                      <strong className="text-[var(--color-pastry-chocolate)] font-bold">
                        {transaction.eventDate ? formatDateBr(transaction.eventDate) : formatDateBr(transaction.date)}
                      </strong>
                    </span>
                    {transaction.deliveryTime && (
                      <span className="flex items-center gap-1 bg-[var(--color-pastry-yellow)] text-[var(--color-pastry-chocolate)] px-2 py-0.5 rounded-md font-bold text-[10px]">
                        <Clock className="w-3 h-3 text-[var(--color-pastry-chocolate)]" /> {transaction.deliveryTime}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-[var(--color-pastry-chocolate)]/80 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[var(--color-pastry-chocolate)]/70 shrink-0" />{' '}
                    <span>Endereço: {transaction.deliveryAddress || 'Retirada na Confeitaria'}</span>
                  </p>
                </div>
              </div>

              {/* Items Table & Summary */}
              <div className="bg-white p-3.5 rounded-[16px] border border-[#E6E1DB] shadow-sm space-y-2 print-avoid-break">
                <div className="flex items-center justify-between border-b border-[#E6E1DB] pb-1">
                  <h4 className="text-[9px] font-black uppercase tracking-wider text-[#241B2B] flex items-center gap-1" style={{ fontFamily: "'Manrope', sans-serif", letterSpacing: '.06em' }}>
                    <ShoppingBag className="w-3 h-3 text-[#241B2B]" />
                    Itens Solicitados
                  </h4>
                  <span className="bg-[var(--color-pastry-pink)]/60 text-[var(--color-pastry-chocolate)] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--color-pastry-light-pink)]/60">
                    Qtd Total: {transaction.quantity}
                  </span>
                </div>

                <div className="space-y-1">
                  {itemLines.map((line, idx) => (
                    <div key={`item-${idx}-${line}`} className="flex items-center gap-2 text-xs font-bold text-[var(--color-pastry-chocolate)] bg-[var(--color-pastry-cream)]/60 p-2 rounded-xl border border-[var(--color-text-muted)]">
                      <span className="bg-[var(--color-pastry-chocolate)] text-[var(--color-pastry-pink)] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="leading-tight">{line}</span>
                    </div>
                  ))}
                </div>

                {transaction.observations && (
                  <div className="p-2 bg-[var(--color-pastry-yellow)]/60 rounded-xl border border-[var(--color-pastry-light-pink)]/40 text-[11px] font-bold text-[var(--color-pastry-chocolate)]">
                    <strong>📝 Observações:</strong> "{transaction.observations}"
                  </div>
                )}
              </div>

              {/* INSPIRATION PHOTO - DISPLAYED IN FULL 100% UNCROPPED VISIBILITY */}
              {inspirationImage ? (
                <div className="bg-white p-3 rounded-[16px] border-2 border-[#F5B9C6] shadow-sm space-y-2 print-avoid-break">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#241B2B] flex items-center gap-1" style={{ fontFamily: "'Manrope', sans-serif", letterSpacing: '.06em' }}>
                      <Camera className="w-3 h-3 text-[#241B2B]" /> Foto de Referência do Cliente
                    </span>
                    <div className="flex items-center gap-1.5 no-print">
                      <label className="px-2.5 py-1 rounded-xl bg-[#F5B9C6] hover:bg-[#E8A0B0] text-[#3A2350] font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
                        <Camera className="w-3 h-3 text-[#3A2350]" />
                        <span>Alterar Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
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

                  <div className="w-full rounded-lg overflow-hidden border border-[var(--color-pastry-light-pink)]/50 bg-[var(--color-pastry-cream)]/40 flex items-center justify-center p-1 print:overflow-visible inspiration-image-container">
                    <img
                      src={inspirationImage}
                      alt="Foto de Referência do Cliente"
                      className="w-full h-auto max-h-[150px] sm:max-h-none object-contain rounded-xl shadow-card inspiration-image"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white p-3.5 rounded-lg border-2 border-dashed border-[var(--color-pastry-light-pink)] shadow-card no-print hover:bg-[var(--color-pastry-pink)]/10 transition-colors">
                  <label className="flex flex-col items-center justify-center py-3 cursor-pointer text-center space-y-1.5">
                    <div className="w-9 h-9 rounded-full bg-[var(--color-pastry-pink)]/60 text-[var(--color-pastry-chocolate)] flex items-center justify-center shadow-card">
                      <Upload className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-bold text-xs text-[var(--color-pastry-chocolate)]">
                      + Adicionar Foto de Referência do Cliente
                    </span>
                    <span className="text-[10px] text-[var(--color-pastry-chocolate)]/70 max-w-sm">
                      Clique aqui para enviar a foto do modelo/bolo enviada pela cliente (ficará visível inteira na folha).
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Total & Payment Badge */}
              <div className="bg-gradient-to-r from-[#3A2350] to-[#A85E86] p-3.5 rounded-[16px] border-2 border-white/20 flex items-center justify-between gap-3 print-avoid-break">
                <div>
                  <span className="text-[9px] font-black uppercase text-white/80 block" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    Forma de Pagamento:
                  </span>
                  <span className="inline-block bg-[#F5B9C6] text-[#3A2350] font-black text-[11px] px-3 py-0.5 rounded-full uppercase shadow-sm">
                    ⚡ {transaction.paymentMethod === 'cash' ? 'DINHEIRO / ESPÉCIE' : (transaction.paymentMethod ? transaction.paymentMethod.toUpperCase() : 'A COMBINAR')}
                  </span>
                </div>

                <div className="text-right space-y-2">
                  <div>
                    <span className="text-[9px] font-black uppercase text-white/80 block" style={{ fontFamily: "'Manrope', sans-serif" }}>
                      VALOR TOTAL DO PEDIDO:
                    </span>
                    <span className="font-black text-white" style={{ fontSize: '24px', fontFamily: "'Manrope', sans-serif" }}>
                      {formatCurrency(transaction.totalValue)}
                    </span>
                  </div>

                  {transaction.signalValue && (
                    <div className="border-t border-white/30 pt-1 mt-1">
                      <div className="flex items-center justify-end gap-2 mb-1">
                        <span className="text-[9px] font-bold uppercase text-white/80" style={{ fontFamily: "'Manrope', sans-serif" }}>
                          ✅ Sinal Pago:
                        </span>
                        <span className="font-bold text-emerald-200" style={{ fontSize: '14px', fontFamily: "'Manrope', sans-serif" }}>
                          {formatCurrency(transaction.signalValue)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[9px] font-bold uppercase text-white/80" style={{ fontFamily: "'Manrope', sans-serif" }}>
                          📋 A Pagar na Entrega:
                        </span>
                        <span className="font-bold text-orange-200" style={{ fontSize: '14px', fontFamily: "'Manrope', sans-serif" }}>
                          {formatCurrency(transaction.totalValue - transaction.signalValue)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center pt-1 border-t border-[var(--color-pastry-light-pink)]/60 print-avoid-break">
                {/* Nome e telefone vinham fixos aqui ("Carula Cake
                    Confeitaria", "(781) 420-6892"), aparecendo no orcamento de
                    toda compradora. Agora seguem o perfil, e somem quando ele
                    esta vazio. */}
                <p className="text-[11px] font-bold text-[var(--color-pastry-chocolate)] flex items-center justify-center gap-1">
                  {sellerName ? `Obrigada(o) por escolher a ${sellerName}! 💕` : 'Obrigada(o) pela preferência! 💕'}
                </p>
                <p className="text-[9px] text-[var(--color-pastry-chocolate)]/70 font-medium">
                  Encomenda feita com amor e carinho{sellerPhone ? ` • Contato: ${sellerPhone}` : ''}
                </p>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* TAB 2: FICHA TÉCNICA DE PRODUÇÃO - COZINHA (RECIPES ONLY) */
            /* ======================================================== */
            <div className="space-y-3.5">
              {/* Internal Banner Header */}
              <div className="bg-gradient-to-r from-[#3A2350] to-[#A85E86] rounded-lg p-4 text-white shadow-sm border border-white/20 print-avoid-break">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ChefHat className="w-6 h-6 text-[#A9D8B8]" />
                    <div>
                      <h2 className="font-bold text-lg text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                        FICHA TÉCNICA DE PRODUÇÃO - COZINHA
                      </h2>
                      <p className="text-[11px] text-white/70 font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>
                        Somente Insumos e Ingredientes da Receita
                      </p>
                    </div>
                  </div>
                  <span className="bg-[#A9D8B8] text-[#3A2350] font-bold text-xs px-2.5 py-1 rounded-full uppercase" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    Uso Interno
                  </span>
                </div>
              </div>

              {/* Quick Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 print-avoid-break">
                <div className="bg-white p-3 rounded-[16px] border border-[#E6E1DB] shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#241B2B] block" style={{ fontFamily: "'Manrope', sans-serif" }}>Cliente</span>
                  <p className="font-bold text-xs text-[#241B2B]">{transaction.customerName || 'Cliente'}</p>
                  <p className="text-[10px] text-[#7A6E80]">{transaction.customerPhone}</p>
                </div>

                <div className="bg-white p-3 rounded-[16px] border border-[#E6E1DB] shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#241B2B] block" style={{ fontFamily: "'Manrope', sans-serif" }}>Horário de Entrega</span>
                  <p className="font-bold text-xs text-[#241B2B] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#241B2B]" />
                    {transaction.deliveryTime || 'Horário a definir'} ({transaction.eventDate ? formatDateBr(transaction.eventDate) : formatDateBr(transaction.date)})
                  </p>
                  <p className="text-[10px] text-[#7A6E80] truncate">{transaction.deliveryAddress || 'Retirada'}</p>
                </div>

                <div className="bg-white p-3 rounded-[16px] border border-[#E6E1DB] shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#241B2B] block" style={{ fontFamily: "'Manrope', sans-serif" }}>Observações do Cliente</span>
                  <p className="font-semibold text-xs text-[#241B2B] italic">{transaction.observations || 'Nenhuma observação especial'}</p>
                </div>
              </div>

              {/* Inspiration Image for Decorators - WITH UPLOAD/CHANGE/REMOVE IN KITCHEN TAB */}
              {inspirationImage ? (
                <div className="bg-white p-3 rounded-[16px] border-2 border-[#F5B9C6] space-y-2 print-avoid-break shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[9px] font-black uppercase tracking-wider text-[#241B2B] flex items-center gap-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
                      <Camera className="w-3 h-3 text-[#241B2B]" /> Foto de Referência para Decoração na Cozinha
                    </h4>
                    <div className="flex items-center gap-1.5 no-print">
                      <label className="px-2.5 py-1 rounded-xl bg-[#F5B9C6] hover:bg-[#E8A0B0] text-[#3A2350] font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
                        <Camera className="w-3 h-3 text-[#3A2350]" />
                        <span>Alterar Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
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

                  <div className="w-full rounded-xl overflow-hidden border border-[var(--color-pastry-light-pink)]/50 bg-[var(--color-pastry-cream)]/30 flex items-center justify-center p-1 print:overflow-visible inspiration-image-container">
                    <img
                      src={inspirationImage}
                      alt="Foto de Referência para Cozinha"
                      className="w-full h-auto max-h-[150px] sm:max-h-none object-contain rounded-lg inspiration-image"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white p-3.5 rounded-[16px] border-2 border-dashed border-[#F5B9C6] shadow-sm no-print hover:bg-[#F5B9C6]/10 transition-colors">
                  <label className="flex flex-col items-center justify-center py-3 cursor-pointer text-center space-y-1.5">
                    <div className="w-9 h-9 rounded-full bg-[#F5B9C6]/60 text-[#3A2350] flex items-center justify-center shadow-sm">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-[#241B2B]" style={{ fontFamily: "'Manrope', sans-serif" }}>
                      + Adicionar Foto de Referência para Cozinha
                    </span>
                    <span className="text-[10px] text-[#7A6E80] max-w-sm">
                      Clique aqui para enviar a foto do modelo/bolo para a equipe de produção e decoração.
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Breakdown of Recipe Items with Clickable Expandable Accordion */}
              <div className="space-y-3 print-avoid-break">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[#241B2B] uppercase tracking-wider flex items-center gap-1.5" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    <Layers className="w-4 h-4 text-[#241B2B]" />
                    Insumos da Produção ({recipeItems.length} {recipeItems.length === 1 ? 'item de receita' : 'itens de receita'})
                  </h4>
                  <span className="text-[10px] text-[#7A6E80] font-bold">
                    Clique no item para abrir/fechar ingredientes
                  </span>
                </div>

                {recipeItems.length === 0 ? (
                  <div className="bg-white p-4 rounded-[16px] border border-[#E6E1DB] text-center text-xs text-[#7A6E80] font-medium shadow-sm">
                    Nenhum item de receita cadastrado nesta ordem.
                  </div>
                ) : (
                  recipeItems.map((itemStr, idx) => {
                    const ficha = getRecipeDetailsForItem(itemStr);
                    const isOpen = expandedItems[idx] !== false; // Open by default

                    return (
                      <div
                        key={`recipe-${idx}-${itemStr}`}
                        className="bg-white rounded-[16px] border-2 border-[#E6E1DB] shadow-sm overflow-hidden transition-all"
                      >
                        {/* CLICKABLE ITEM HEADER */}
                        <button
                          type="button"
                          onClick={() => toggleAccordion(idx)}
                          className="w-full p-3 bg-[#F6F2F5] hover:bg-[#E8D5E8] flex items-center justify-between text-left border-b border-[#E6E1DB] transition-colors cursor-pointer"
                        >
                          <span className="font-bold text-xs text-[#241B2B] flex items-center gap-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
                            <span className="w-5 h-5 rounded-full bg-[#3A2350] text-[#F5B9C6] text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span>{itemStr}</span>
                          </span>

                          <div className="flex items-center gap-2 shrink-0">
                            {ficha && (
                              <span className="text-[10px] font-bold bg-[#F5B9C6] text-[#3A2350] px-2 py-0.5 rounded-full border border-[#E8A0B0]/60" style={{ fontFamily: "'Manrope', sans-serif" }}>
                                Rendimento: {ficha.yieldInfo}
                              </span>
                            )}
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-[#7A6E80]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[#7A6E80]" />
                            )}
                          </div>
                        </button>

                        {/* EXPANDABLE INGREDIENTS BODY */}
                        {isOpen && (
                          <div className="p-3.5 space-y-2 bg-white animate-fadeIn">
                            {ficha && ficha.ingredients.length > 0 ? (
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-black uppercase tracking-wider text-[#7A6E80] block" style={{ fontFamily: "'Manrope', sans-serif" }}>
                                  Insumos e Quantidades (Ex: 300g Farinha, 300g Açúcar):
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                  {ficha.ingredients.map((ing) => (
                                    <div
                                      key={ing.id}
                                      className="bg-[#F6F2F5] p-2 rounded-xl border border-[#E6E1DB] flex items-center justify-between"
                                    >
                                      <span className="font-bold text-[#241B2B]">🥣 {ing.name}</span>
                                      <strong className="font-bold text-[#3A2350] bg-[#A9D8B8] px-2 py-0.5 rounded-lg text-[11px]">
                                        {ing.quantity} {ing.unit}
                                      </strong>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] text-[#7A6E80] font-medium italic p-2 bg-[#F6F2F5] rounded-xl border border-[#E6E1DB]">
                                bolo/doce artesanal. Monte os insumos base da receita padrão para {itemStr}.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};
