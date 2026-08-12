import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
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

  // Download PDF document directly using jsPDF + html2canvas
  const handleDownloadPdf = async () => {
    const docElem = document.getElementById('quote-pdf-document');
    if (!docElem) return;

    try {
      setIsGeneratingPdf(true);
      const canvas = await html2canvas(docElem, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const renderWidth = imgWidth * ratio;
      const renderHeight = imgHeight * ratio;

      const x = (pdfWidth - renderWidth) / 2;
      const y = 5;

      pdf.addImage(imgData, 'JPEG', x, y, renderWidth, renderHeight);

      const isCozinha = activeTab === 'cozinha';
      const clientName = (transaction.customerName || 'Cliente').replace(/\s+/g, '_');
      const filename = isCozinha
        ? `Ficha_Cozinha_${clientName}_CarulaCake.pdf`
        : `Folha_Cliente_${clientName}_CarulaCake.pdf`;

      // Method 1: Try pdf.save(filename)
      try {
        pdf.save(filename);
      } catch (saveErr) {
        // Method 2: Blob URL trigger anchor
        const pdfBlob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Fallback: trigger standard browser print dialog
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Download card image as PNG using html2canvas
  const handleDownloadImage = async () => {
    const docElem = document.getElementById('quote-pdf-document');
    if (!docElem) return;

    try {
      setIsGeneratingImage(true);
      const canvas = await html2canvas(docElem, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFDF8',
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Pedido_${(transaction.customerName || 'Cliente').replace(/\s+/g, '_')}_CarulaCake.png`;
      link.href = dataUrl;
      link.click();
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
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
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

      <div className="bg-white rounded-xl max-w-2xl w-full shadow-lg overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:rounded-none border-2 border-pink-300 relative" aria-label="Orçamento PDF">
        
        {/* STICKY TOP CONTROL BAR - ALWAYS VISIBLE & CLEAR ON ALL DEVICES */}
        <div className="p-2.5 sm:p-3 bg-[var(--color-pastry-chocolate)] text-[var(--color-pastry-cream)] flex items-center justify-between gap-2 no-print shrink-0 sticky top-0 z-50 border-b border-[var(--color-pastry-chocolate)]/20">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('cliente')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'cliente'
                  ? 'bg-[var(--color-pastry-pink)] text-[var(--color-pastry-chocolate)] shadow-xs font-extrabold'
                  : 'text-[var(--color-pastry-cream)]/80 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-pastry-chocolate)]" /> Folha do Cliente
            </button>
            <button
              onClick={() => setActiveTab('cozinha')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'cozinha'
                  ? 'bg-[var(--color-pastry-yellow)] text-[var(--color-pastry-chocolate)] shadow-xs font-extrabold'
                  : 'text-[var(--color-pastry-cream)]/80 hover:text-white'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5 text-[var(--color-pastry-chocolate)]" /> Cozinha
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Direct PDF Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[var(--color-pastry-pink)] hover:bg-[var(--color-pastry-pink-hover)] text-[var(--color-pastry-chocolate)] text-[11px] sm:text-xs font-black flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Baixar arquivo PDF no seu celular ou computador"
            >
              <FileText className="w-3.5 h-3.5 text-[var(--color-pastry-chocolate)]" />
              <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Baixar PDF'}</span>
            </button>

            {/* Download Image Button */}
            <button
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="px-2.5 py-1.5 rounded-xl bg-semantic-success-800 hover:bg-semantic-success-900 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Baixar imagem PNG para enviar pelo WhatsApp"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isGeneratingImage ? 'Gerando...' : 'Baixar Imagem'}</span>
            </button>

            {/* Print/PDF Button */}
            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-[var(--color-pastry-cream)] text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="Imprimir ou Salvar pelo Navegador"
            >
              <Printer className="w-3.5 h-3.5 text-[var(--color-pastry-pink)]" />
              <span className="hidden md:inline">Imprimir</span>
            </button>

            {/* COPY TEXT */}
            <button
              onClick={handleCopyText}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-[var(--color-pastry-pink)] cursor-pointer"
              title="Copiar texto do pedido"
            >
              {copied ? <Check className="w-4 h-4 text-semantic-success-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* BIG CLEAR PROMINENT CLOSE BUTTON */}
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-xl bg-semantic-error-700 hover:bg-semantic-error-800 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all shrink-0 ml-1 cursor-pointer"
              title="Fechar Janela"
            >
              <X className="w-4 h-4 stroke-[3]" />
              <span>FECHAR</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div
          id="quote-pdf-document"
          className="p-4 sm:p-6 overflow-y-auto space-y-4 bg-[var(--color-pastry-cream)] text-[var(--color-pastry-chocolate)] print:p-2 print:bg-white"
        >
          {activeTab === 'cliente' ? (
            /* ======================================================== */
            /* TAB 1: FOLHA DO CLIENTE (GROOVY COMPACT 1-PAGE LAYOUT)   */
            /* ======================================================== */
            <div className="space-y-3.5">
              {/* Header Banner - Groovy Brand Identity */}
              <div className="bg-[var(--color-pastry-yellow)] rounded-lg p-3.5 text-[var(--color-pastry-chocolate)] shadow-xs border border-[var(--color-pastry-light-pink)]/60 print:border-neutral-300 print:bg-none print:text-neutral-900 print-avoid-break">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white border-2 border-[var(--color-pastry-light-pink)] shadow-xs flex items-center justify-center overflow-hidden shrink-0">
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
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-pastry-chocolate)]/80 block">
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
                <div className="bg-white p-3 rounded-lg border border-[var(--color-text-muted)] shadow-xs space-y-1.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-pastry-chocolate)] flex items-center gap-1 border-b border-[var(--color-text-muted)] pb-0.5">
                    👤 Dados da Cliente Especial
                  </h4>
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-full border-2 border-[var(--color-pastry-light-pink)] overflow-hidden bg-[var(--color-pastry-pink)]/30 flex items-center justify-center shrink-0 shadow-xs">
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
                <div className="bg-white p-3 rounded-lg border border-[var(--color-text-muted)] shadow-xs space-y-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-pastry-chocolate)] flex items-center gap-1 border-b border-[var(--color-text-muted)] pb-0.5">
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
              <div className="bg-white p-3.5 rounded-lg border border-[var(--color-text-muted)] shadow-xs space-y-2 print-avoid-break">
                <div className="flex items-center justify-between border-b border-[var(--color-text-muted)] pb-1">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-pastry-chocolate)] flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-[var(--color-pastry-chocolate)]" />
                    Itens Solicitados
                  </h4>
                  <span className="bg-[var(--color-pastry-pink)]/60 text-[var(--color-pastry-chocolate)] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--color-pastry-light-pink)]/60">
                    Qtd Total: {transaction.quantity}
                  </span>
                </div>

                <div className="space-y-1">
                  {itemLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-bold text-[var(--color-pastry-chocolate)] bg-[var(--color-pastry-cream)]/60 p-2 rounded-xl border border-[var(--color-text-muted)]">
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
                <div className="bg-white p-3 rounded-lg border-2 border-[var(--color-pastry-light-pink)] shadow-xs space-y-2 print-avoid-break">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-pastry-chocolate)] flex items-center gap-1">
                      <Camera className="w-4 h-4 text-[var(--color-pastry-chocolate)]" /> Foto de Referência do Cliente
                    </span>
                    <div className="flex items-center gap-1.5 no-print">
                      <label className="px-2.5 py-1 rounded-xl bg-[var(--color-pastry-pink)] hover:bg-[var(--color-pastry-pink-hover)] text-[var(--color-pastry-chocolate)] font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-xs">
                        <Camera className="w-3 h-3 text-[var(--color-pastry-chocolate)]" />
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
                        className="px-2 py-1 rounded-xl bg-semantic-error-100 hover:bg-semantic-error-200 text-semantic-error-800 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Remover Foto de Referência"
                      >
                        <Trash2 className="w-3 h-3 text-semantic-error-600" />
                        <span>Remover</span>
                      </button>
                    </div>
                  </div>

                  <div className="w-full rounded-lg overflow-hidden border border-[var(--color-pastry-light-pink)]/50 bg-[var(--color-pastry-cream)]/40 flex items-center justify-center p-2">
                    <img
                      src={inspirationImage}
                      alt="Foto de Referência do Cliente"
                      className="w-full h-auto max-h-[480px] object-contain rounded-xl shadow-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white p-3.5 rounded-lg border-2 border-dashed border-[var(--color-pastry-light-pink)] shadow-xs no-print hover:bg-[var(--color-pastry-pink)]/10 transition-colors">
                  <label className="flex flex-col items-center justify-center py-3 cursor-pointer text-center space-y-1.5">
                    <div className="w-9 h-9 rounded-full bg-[var(--color-pastry-pink)]/60 text-[var(--color-pastry-chocolate)] flex items-center justify-center shadow-xs">
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
              <div className="bg-[var(--color-pastry-yellow)] p-3.5 rounded-lg border-2 border-[var(--color-pastry-light-pink)] flex items-center justify-between gap-3 print-avoid-break">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[var(--color-pastry-chocolate)]/80 block">
                    Forma de Pagamento:
                  </span>
                  <span className="inline-block bg-[var(--color-pastry-chocolate)] text-[var(--color-pastry-pink)] font-bold text-[11px] px-3 py-0.5 rounded-full uppercase shadow-xs">
                    ⚡ {transaction.paymentMethod === 'cash' ? 'DINHEIRO / ESPÉCIE' : (transaction.paymentMethod ? transaction.paymentMethod.toUpperCase() : 'A COMBINAR')}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-[var(--color-pastry-chocolate)]/80 block">
                    VALOR TOTAL DO PEDIDO:
                  </span>
                  <span className="font-numbers font-black text-2xl text-[var(--color-pastry-chocolate)]">
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
              <div className="bg-[var(--color-pastry-chocolate)] rounded-lg p-4 text-[var(--color-pastry-cream)] shadow-xs border border-[var(--color-pastry-chocolate)] print-avoid-break">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ChefHat className="w-6 h-6 text-[var(--color-pastry-yellow)]" />
                    <div>
                      <h2 className="font-bold text-lg text-white">
                        FICHA TÉCNICA DE PRODUÇÃO - COZINHA
                      </h2>
                      <p className="text-[11px] text-[var(--color-pastry-cream)]/80 font-medium">
                        Somente Insumos e Ingredientes da Receita
                      </p>
                    </div>
                  </div>
                  <span className="bg-[var(--color-pastry-yellow)] text-[var(--color-pastry-chocolate)] font-bold text-xs px-2.5 py-1 rounded-full uppercase">
                    Uso Interno
                  </span>
                </div>
              </div>

              {/* Quick Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 print-avoid-break">
                <div className="bg-white p-3 rounded-lg border border-[var(--color-text-muted)] shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-[var(--color-pastry-chocolate)]/70 block">Cliente</span>
                  <p className="font-bold text-xs text-[var(--color-pastry-chocolate)]">{transaction.customerName || 'Cliente'}</p>
                  <p className="text-[10px] text-[var(--color-pastry-chocolate)]/70">{transaction.customerPhone}</p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-[var(--color-text-muted)] shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-[var(--color-pastry-chocolate)]/70 block">Horário de Entrega</span>
                  <p className="font-bold text-xs text-[var(--color-pastry-chocolate)] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[var(--color-pastry-chocolate)]" />
                    {transaction.deliveryTime || 'Horário a definir'} ({transaction.eventDate ? formatDateBr(transaction.eventDate) : formatDateBr(transaction.date)})
                  </p>
                  <p className="text-[10px] text-[var(--color-pastry-chocolate)]/70 truncate">{transaction.deliveryAddress || 'Retirada'}</p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-[var(--color-text-muted)] shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-[var(--color-pastry-chocolate)]/70 block">Observações do Cliente</span>
                  <p className="font-semibold text-xs text-[var(--color-pastry-chocolate)] italic">{transaction.observations || 'Nenhuma observação especial'}</p>
                </div>
              </div>

              {/* Inspiration Image for Decorators - WITH UPLOAD/CHANGE/REMOVE IN KITCHEN TAB */}
              {inspirationImage ? (
                <div className="bg-white p-3 rounded-lg border-2 border-[var(--color-pastry-light-pink)] space-y-2 print-avoid-break shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs text-[var(--color-pastry-chocolate)] flex items-center gap-1">
                      <Camera className="w-4 h-4 text-[var(--color-pastry-chocolate)]" /> Foto de Referência para Decoração na Cozinha
                    </h4>
                    <div className="flex items-center gap-1.5 no-print">
                      <label className="px-2.5 py-1 rounded-xl bg-[var(--color-pastry-pink)] hover:bg-[var(--color-pastry-pink-hover)] text-[var(--color-pastry-chocolate)] font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-xs">
                        <Camera className="w-3 h-3 text-[var(--color-pastry-chocolate)]" />
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
                        className="px-2 py-1 rounded-xl bg-semantic-error-100 hover:bg-semantic-error-200 text-semantic-error-800 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Remover Foto de Referência"
                      >
                        <Trash2 className="w-3 h-3 text-semantic-error-600" />
                        <span>Remover</span>
                      </button>
                    </div>
                  </div>

                  <div className="w-full rounded-xl overflow-hidden border border-[var(--color-pastry-light-pink)]/50 bg-[var(--color-pastry-cream)]/30 flex items-center justify-center p-2">
                    <img
                      src={inspirationImage}
                      alt="Foto de Referência para Cozinha"
                      className="w-full h-auto max-h-[420px] object-contain rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white p-3.5 rounded-lg border-2 border-dashed border-[var(--color-pastry-light-pink)] shadow-xs no-print hover:bg-[var(--color-pastry-pink)]/10 transition-colors">
                  <label className="flex flex-col items-center justify-center py-3 cursor-pointer text-center space-y-1.5">
                    <div className="w-9 h-9 rounded-full bg-[var(--color-pastry-pink)]/60 text-[var(--color-pastry-chocolate)] flex items-center justify-center shadow-xs">
                      <Upload className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-bold text-xs text-[var(--color-pastry-chocolate)]">
                      + Adicionar Foto de Referência para Cozinha
                    </span>
                    <span className="text-[10px] text-[var(--color-pastry-chocolate)]/70 max-w-sm">
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
                  <h4 className="font-bold text-xs text-[var(--color-pastry-chocolate)] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[var(--color-pastry-chocolate)]" />
                    Insumos da Produção ({recipeItems.length} {recipeItems.length === 1 ? 'item de receita' : 'itens de receita'})
                  </h4>
                  <span className="text-[10px] text-[var(--color-pastry-chocolate)]/70 font-bold">
                    Clique no item para abrir/fechar ingredientes
                  </span>
                </div>

                {recipeItems.length === 0 ? (
                  <div className="bg-white p-4 rounded-lg border border-[var(--color-text-muted)] text-center text-xs text-[var(--color-pastry-chocolate)]/70 font-medium">
                    Nenhum item de receita cadastrado nesta ordem.
                  </div>
                ) : (
                  recipeItems.map((itemStr, idx) => {
                    const ficha = getRecipeDetailsForItem(itemStr);
                    const isOpen = expandedItems[idx] !== false; // Open by default

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-lg border-2 border-[var(--color-text-muted)] shadow-xs overflow-hidden transition-all"
                      >
                        {/* CLICKABLE ITEM HEADER */}
                        <button
                          type="button"
                          onClick={() => toggleAccordion(idx)}
                          className="w-full p-3 bg-[var(--color-pastry-cream)] hover:bg-[var(--color-pastry-yellow)]/50 flex items-center justify-between text-left border-b border-[var(--color-text-muted)] transition-colors cursor-pointer"
                        >
                          <span className="font-bold text-xs text-[var(--color-pastry-chocolate)] flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[var(--color-pastry-chocolate)] text-[var(--color-pastry-pink)] text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span>{itemStr}</span>
                          </span>

                          <div className="flex items-center gap-2 shrink-0">
                            {ficha && (
                              <span className="text-[10px] font-bold bg-[var(--color-pastry-pink)] text-[var(--color-pastry-chocolate)] px-2 py-0.5 rounded-full border border-[var(--color-pastry-light-pink)]/60">
                                Rendimento: {ficha.yieldInfo}
                              </span>
                            )}
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-[var(--color-pastry-chocolate)]/60" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[var(--color-pastry-chocolate)]/60" />
                            )}
                          </div>
                        </button>

                        {/* EXPANDABLE INGREDIENTS BODY */}
                        {isOpen && (
                          <div className="p-3.5 space-y-2 bg-white animate-fadeIn">
                            {ficha && ficha.ingredients.length > 0 ? (
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold uppercase text-[var(--color-pastry-chocolate)]/70 block">
                                  Insumos e Quantidades (Ex: 300g Farinha, 300g Açúcar):
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                  {ficha.ingredients.map((ing) => (
                                    <div
                                      key={ing.id}
                                      className="bg-[var(--color-pastry-cream)] p-2 rounded-xl border border-[var(--color-text-muted)] flex items-center justify-between"
                                    >
                                      <span className="font-bold text-[var(--color-pastry-chocolate)]">🥣 {ing.name}</span>
                                      <strong className="font-bold text-[var(--color-pastry-chocolate)] bg-[var(--color-pastry-yellow)] px-2 py-0.5 rounded-lg text-[11px]">
                                        {ing.quantity} {ing.unit}
                                      </strong>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] text-[var(--color-pastry-chocolate)]/70 font-medium italic p-2 bg-[var(--color-pastry-cream)] rounded-xl border border-[var(--color-text-muted)]">
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
