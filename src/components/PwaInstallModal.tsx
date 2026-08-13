import React from 'react';
import { createPortal } from 'react-dom';
import { X, Share, PlusSquare, Smartphone, CheckCircle } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-900/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-white rounded-xl shadow-highlight overflow-hidden p-6 space-y-4 my-auto" aria-labelledby="pwaModalTitle">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-semantic-coral)]/10 text-[var(--color-semantic-coral)] flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 id="pwaModalTitle" className="font-brand font-bold text-base text-neutral-900">
                Usar como App no Celular
              </h3>
              <p className="text-xs text-neutral-500">
                Salvar na Tela Inicial do seu iPhone / Android
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step-by-step instructions for iPhone Safari */}
        <div className="space-y-3 py-1">
          <p className="text-xs text-neutral-600 font-medium">
            Siga os 3 passos simples abaixo no Safari do seu iPhone para ter o Carula Confeitaria como um aplicativo de tela cheia:
          </p>

          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200/80">
            <div className="w-7 h-7 rounded-full bg-pink-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <span className="font-bold text-xs text-neutral-800 block flex items-center gap-1">
                Toque no botão Compartilhar
                <Share className="w-4 h-4 text-blue-500" />
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                No menu do seu navegador (na parte inferior da tela do Safari).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200/80">
            <div className="w-7 h-7 rounded-full bg-pink-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <span className="font-bold text-xs text-neutral-800 block flex items-center gap-1">
                Selecione "Adicionar à Tela de Início"
                <PlusSquare className="w-4 h-4 text-neutral-700" />
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Role o menu para baixo até encontrar o ícone do quadrado com um mais "+".
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200/80">
            <div className="w-7 h-7 rounded-full bg-pink-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <span className="font-bold text-xs text-neutral-800 block flex items-center gap-1">
                Toque em "Adicionar"
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Pronto! O ícone do app aparecerá na tela do seu iPhone como um aplicativo nativo.
              </p>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-[var(--color-semantic-coral)] hover:bg-[var(--color-semantic-coral-hover)] text-white font-brand font-bold text-sm rounded-lg shadow-sm active:scale-98 transition-all"
        >
          Entendi!
        </button>

      </div>
    </div>,
    document.body
  );
};

