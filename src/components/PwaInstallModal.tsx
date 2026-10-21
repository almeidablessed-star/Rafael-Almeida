import React from 'react';
import { createPortal } from 'react-dom';
import { X, Share, PlusSquare, Smartphone, CheckCircle, MoreHorizontal, MoreVertical } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PASSOS: { aparelho: string; passos: { titulo: string; detalhe: string; icone: React.ReactNode }[] }[] = [
  {
    aparelho: 'iPhone (Safari)',
    passos: [
      { titulo: 'Toque nos três pontinhos', detalhe: 'Na barra do Safari, embaixo da tela.', icone: <MoreHorizontal className="w-4 h-4 text-neutral-700" /> },
      { titulo: 'Toque em "Compartilhar"', detalhe: 'É o quadradinho com a setinha para cima.', icone: <Share className="w-4 h-4 text-blue-500" /> },
      { titulo: 'Toque em "Ver mais" e escolha "Adicionar à Tela de Início"', detalhe: '"Ver mais" é a setinha para baixo; o item tem o quadrado com "+".', icone: <PlusSquare className="w-4 h-4 text-neutral-700" /> },
      { titulo: 'Toque em "Adicionar"', detalhe: 'Pronto! O ícone do Carula App aparece junto com os seus aplicativos.', icone: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
    ],
  },
  {
    aparelho: 'Android (Chrome)',
    passos: [
      { titulo: 'Toque nos três pontinhos', detalhe: 'No canto de cima do Chrome.', icone: <MoreVertical className="w-4 h-4 text-neutral-700" /> },
      { titulo: 'Escolha "Adicionar à tela inicial" ou "Instalar app"', detalhe: 'O nome muda conforme o celular; os dois fazem a mesma coisa.', icone: <PlusSquare className="w-4 h-4 text-neutral-700" /> },
      { titulo: 'Confirme em "Adicionar" ou "Instalar"', detalhe: 'Pronto! O ícone do Carula App aparece na tela inicial.', icone: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
    ],
  },
];

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

        {/* Passo a passo nos dois celulares. O caminho do iPhone e o do iOS
            atual: o Compartilhar mora dentro do menu "•••" do Safari, e o
            "Adicionar à Tela de Início" so aparece depois de "Ver mais". */}
        <div className="space-y-3 py-1">
          <p className="text-xs text-neutral-600 font-medium">
            Não precisa baixar nada da loja. Siga os passos do seu celular para ter o Carula App como um aplicativo de tela cheia:
          </p>

          {PASSOS.map((grupo) => (
            <div key={grupo.aparelho} className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
                {grupo.aparelho}
              </span>
              {grupo.passos.map((passo, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200/80">
                  <div className="w-7 h-7 rounded-full bg-pink-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-neutral-800 block flex items-center gap-1">
                      {passo.titulo}
                      {passo.icone}
                    </span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{passo.detalhe}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
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

