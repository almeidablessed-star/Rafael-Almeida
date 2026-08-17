import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Transaction } from '../types';
import { formatCurrency, formatDateBr } from '../utils/formatters';
import { getStoredUserProfile } from '../utils/userProfile';
import { getStoredFichas } from './FichasTecnicasModule';
import { getStoredCustomers } from './CustomersModule';
import { updateTransaction } from '../utils/storage';
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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [inspirationImage, setInspirationImage] = useState<string>(transaction.inspirationImage || '');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma foto de até 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setInspirationImage(result);
        if ('id' in transaction && transaction.id) {
          updateTransaction({
            ...transaction,
            inspirationImage: result,
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setInspirationImage('');
    if ('id' in transaction && transaction.id) {
      updateTransaction({
        ...transaction,
        inspirationImage: '',
      });
    }
  };
  
  // Kitchen sheet expandable items accordion state (all open by default)
  const [expandedItems, setExpandedItems] = useState<{ [key: number]: boolean }>({
    0: true,
    1: true,
    2: true,
    3: true,
  });

  const sellerProfile = getStoredUserProfile();
  const storedFichas = getStoredFichas();
  const storedCustomers = getStoredCustomers();

  const matchedCustomer = storedCustomers.find(
    (c) =>
      (transaction.customerName && c.name.toLowerCase() === transaction.customerName.toLowerCase()) ||
      (transaction.customerPhone && c.phone === transaction.customerPhone)
  );
  const custPhoto = transaction.customerPhotoUrl || matchedCustomer?.photoUrl;

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

    try {
      console.log('🎯 Starting PDF generation with html-to-image...');
      setIsGeneratingPdf(true);

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        // Use html-to-image which has better CSS support than html2canvas
        const imgData = await toPng(docElem, {
          cacheBust: true,
          pixelRatio: 2,
        });

        console.log('✅ Image generated');

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        // Create image from data and get dimensions
        const img = new Image();
        img.onload = () => {
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = img.width;
          const imgHeight = img.height;

          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          const scaledWidth = imgWidth * ratio;
          const scaledHeight = imgHeight * ratio;
          const x = (pdfWidth - scaledWidth) / 2;

          pdf.addImage(imgData, 'PNG', x, 5, scaledWidth, scaledHeight);

          const isCozinha = activeTab === 'cozinha';
          const clientName = (transaction.customerName || 'Cliente').replace(/\s+/g, '_');
          const timestamp = new Date().getTime();
          const filename = isCozinha
            ? `Ficha_Cozinha_${clientName}_${timestamp}.pdf`
            : `Folha_Cliente_${clientName}_${timestamp}.pdf`;

          pdf.save(filename);
          console.log('✅ PDF saved:', filename);
        };
        img.src = imgData;

      } catch (err) {
        console.error('Error in html-to-image conversion:', err);
        throw err;
      }

    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Download card image as PNG using html2canvas
  const handleDownloadImage = async () => {
    const docElem = document.getElementById('quote-pdf-document');
    if (!docElem) {
      console.error('Image document element not found');
      alert('Elemento de documento não encontrado.');
      return;
    }

    try {
      setIsGeneratingImage(true);

      // Ensure content is visible
      const originalDisplay = docElem.style.display;
      docElem.style.display = 'block';

      const canvas = await html2canvas(docElem, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#FFFDF8',
        windowHeight: docElem.scrollHeight,
        windowWidth: docElem.scrollWidth,
        proxy: undefined,
      });

      // Restore original display
      docElem.style.display = originalDisplay;

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas is empty');
        alert('Não foi possível gerar a imagem. Tente novamente!');
        return;
      }

      const dataUrl = canvas.toDataURL('image/png', 0.98);
      if (!dataUrl || dataUrl.length < 100) {
        console.error('DataURL is empty or too small');
        alert('Erro ao converter imagem. Tente novamente!');
        return;
      }

      const link = document.createElement('a');
      link.download = `Pedido_${(transaction.customerName || 'Cliente').replace(/\s+/g, '_')}_CarulaCake.png`;
      link.href = dataUrl;
      document.body.appendChild(link);

      // Usar setTimeout para garantir que o link foi adicionado
      setTimeout(() => {
        link.click();
        setTimeout(() => document.body.removeChild(link), 100);
      }, 10);
    } catch (err) {
      console.error('Error generating image:', err);
      alert('Não foi possível gerar a imagem automaticamente. Você também pode tirar um print da tela!');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopyText = () => {
    const text = `
✨ *PEDIDO DE ENCOMENDA - ${sellerProfile.name.toUpperCase()}* 🎂
────────────────────────
👤 *Confeitaria:* ${sellerProfile.name}
📞 *Contato:* ${sellerProfile.phone} | ✉️ ${sellerProfile.email}
📍 *Endereço:* ${sellerProfile.address}
${sellerProfile.instagram ? `📷 *Instagram:* ${sellerProfile.instagram}` : ''}
────────────────────────
👤 *Cliente:* ${transaction.customerName || 'Cliente'}
📞 *Telefone:* ${transaction.customerPhone || 'Não informado'}
📅 *Data do Evento:* ${transaction.eventDate ? formatDateBr(transaction.eventDate) : formatDateBr(transaction.date)}
⏰ *Horário:* ${transaction.deliveryTime || 'A combinar'}
📍 *Endereço/Entrega:* ${transaction.deliveryAddress || 'Retirada na Confeitaria'}

🎂 *ITENS DO PEDIDO:*
${transaction.description}

${transaction.observations ? `📝 *Observações:* ${transaction.observations}` : ''}

💰 *VALOR TOTAL:* ${formatCurrency(transaction.totalValue)}
💳 *Pagamento:* ${transaction.paymentMethod === 'cash' ? '💵 Cash (Dinheiro)' : '⚡ Zelle'}

💖 _Obrigada por escolher a ${sellerProfile.name}! Feito com amor._ ✨
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Helper to find technical recipe details for kitchen sheet
  const getRecipeDetailsForItem = (lineItem: string) => {
    const matchedFicha = storedFichas.find((f) =>
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

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-neutral-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0" role="dialog" aria-modal="true">
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

      <div className="bg-white rounded-xl max-w-2xl w-full shadow-highlight overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:rounded-none border-2 border-pink-200 relative" aria-label="Orçamento PDF">

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
          className="p-2 sm:p-3 overflow-y-auto space-y-3 bg-[#F6F2F5] text-[#241B2B] print:p-2 print:bg-white"
        >
          {activeTab === 'cliente' ? (
            /* ======================================================== */
            /* TAB 1: FOLHA DO CLIENTE (GROOVY COMPACT 1-PAGE LAYOUT)   */
            /* ======================================================== */
            <div className="space-y-3.5">
              {/* Header Banner - Groovy Brand Identity */}
              <div className="bg-gradient-to-r from-[#3A2350] to-[#A85E86] rounded-lg p-3.5 text-white shadow-card border border-white/20 print:border-neutral-300 print:bg-white print:text-neutral-900 print-avoid-break">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white border-2 border-[var(--color-pastry-light-pink)] shadow-card flex items-center justify-center overflow-hidden shrink-0">
                      {sellerProfile.photoUrl ? (
                        <img
                          src={sellerProfile.photoUrl}
                          alt={sellerProfile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-[var(--color-pastry-chocolate)]" />
                      )}
                    </div>
                    <div>
                      <h2 className="font-bold text-lg sm:text-xl tracking-tight leading-tight text-[var(--color-pastry-chocolate)]">
                        {sellerProfile.name || 'Carula Cake Confeitaria'}
                      </h2>
                      <p className="text-[11px] text-[var(--color-pastry-chocolate)]/80 font-bold flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-[#E8A0B0] text-[var(--color-pastry-light-pink)] shrink-0" />
                        <span>Confeitaria Artesanal & Bolos de Festa</span>
                      </p>
                    </div>
                  </div>

                  {/* Seller Contact Info */}
                  <div className="text-[10px] font-bold text-[var(--color-pastry-chocolate)] text-right space-y-0.5 print:text-neutral-800 shrink-0">
                    {sellerProfile.phone && <div>📞 {sellerProfile.phone}</div>}
                    {sellerProfile.instagram && <div>📷 {sellerProfile.instagram}</div>}
                    {sellerProfile.address && <div>📍 {sellerProfile.address}</div>}
                  </div>
                </div>
              </div>

              {/* Title & Document Code */}
              <div className="flex items-center justify-between border-b-2 border-[var(--color-pastry-light-pink)]/60 pb-1.5 print-avoid-break">
                <div>
                  <span className="label-sm tracking-widest text-[var(--color-pastry-chocolate)]/80 block">
                    ✦ FOLHA OFICIAL DE PEDIDO ✦
                  </span>
                  <h3 className="font-bold text-base text-[var(--color-pastry-chocolate)] leading-tight">
                    Pedido #{transaction.date?.replace(/-/g, '') || '01'}
                  </h3>
                </div>
                <span className="bg-[var(--color-pastry-pink)]/70 text-[var(--color-pastry-chocolate)] border border-[var(--color-pastry-light-pink)] px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  Emissão: {transaction.date ? formatDateBr(transaction.date) : formatDateBr(new Date().toISOString().split('T')[0])}
                </span>
              </div>

              {/* Grid 1: Client & Event Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 print-avoid-break">
                {/* Customer Box */}
                <div className="bg-white p-3 rounded-[16px] border border-[#E6E1DB] shadow-sm space-y-1.5">
                  <h4 className="text-[9px] font-black uppercase tracking-wider text-[#241B2B] flex items-center gap-1 border-b border-[#E6E1DB] pb-0.5" style={{ fontFamily: "'Manrope', sans-serif", letterSpacing: '.06em' }}>
                    👤 Dados da Cliente Especial
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

                  <div className="w-full rounded-lg overflow-hidden border border-[var(--color-pastry-light-pink)]/50 bg-[var(--color-pastry-cream)]/40 flex items-center justify-center p-2">
                    <img
                      src={inspirationImage}
                      alt="Foto de Referência do Cliente"
                      className="w-full h-auto object-contain rounded-xl shadow-card"
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

                <div className="text-right">
                  <span className="text-[9px] font-black uppercase text-white/80 block" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    VALOR TOTAL DO PEDIDO:
                  </span>
                  <span className="font-black text-white" style={{ fontSize: '24px', fontFamily: "'Manrope', sans-serif" }}>
                    {formatCurrency(transaction.totalValue)}
                  </span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center pt-1 border-t border-[var(--color-pastry-light-pink)]/60 print-avoid-break">
                <p className="text-[11px] font-bold text-[var(--color-pastry-chocolate)] flex items-center justify-center gap-1">
                  Obrigado por escolher a Carula Cake Confeitaria! 💕
                </p>
                <p className="text-[9px] text-[var(--color-pastry-chocolate)]/70 font-medium">
                  Encomenda feita com amor e carinho • Contato: {sellerProfile.phone || '(781) 420-6892'}
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

                  <div className="w-full rounded-xl overflow-hidden border border-[var(--color-pastry-light-pink)]/50 bg-[var(--color-pastry-cream)]/30 flex items-center justify-center p-2">
                    <img
                      src={inspirationImage}
                      alt="Foto de Referência para Cozinha"
                      className="w-full h-auto object-contain rounded-lg"
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
    </div>,
    document.body
  );
};
