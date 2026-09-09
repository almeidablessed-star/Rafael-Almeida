import React from 'react';
import { createPortal } from 'react-dom';
import { X, HelpCircle } from 'lucide-react';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Glossario centralizado dos termos financeiros do app (Fase 4, item 2 do
 * spec original). O texto abaixo e o MESMO microcopy que ja existe espalhado
 * pelo onboarding financeiro (EmpresaOnboardingFlow.tsx), com o minimo de
 * ajuste gramatical so onde o original citava "essa despesa"/"aqui" como
 * referencia a um campo especifico do formulario — sem isso a frase nao se
 * sustenta fora daquele contexto. O conteudo em si nunca diverge do original.
 *
 * Ponto de acesso unico: um lugar de consulta pra quem ja passou pelo
 * onboarding e esqueceu o que um termo quer dizer, sem precisar refazer o
 * fluxo guiado so pra reler a explicacao.
 */
const TERMOS: { termo: string; explicacao: string }[] = [
  {
    termo: 'Mão de obra',
    explicacao: 'É quanto você quer receber pelo seu trabalho — nunca o lucro da empresa. São coisas diferentes.',
  },
  {
    termo: 'CMV (Custo da Mercadoria Vendida)',
    explicacao: 'Quanto do preço do bolo vai embora só com ingredientes e embalagem. Quanto menor, mais sobra pra você.',
  },
  {
    termo: 'Rateio',
    explicacao: 'Se uma despesa também é usada na sua vida pessoal, o rateio é a fatia que vale só pra confeitaria — o resto fica de fora da conta do negócio.',
  },
  {
    termo: 'Investimento',
    explicacao: 'Uma reserva pra comprar equipamento, fazer curso, crescer o negócio — sem tirar do seu bolso.',
  },
  {
    termo: 'Lucro',
    explicacao: 'O que sobra pra empresa, além do que você já recebe pelo seu trabalho.',
  },
  {
    termo: 'Faturamento necessário',
    explicacao: 'Quanto você precisa vender no total pra cobrir tudo — seu trabalho, os custos fixos e o lucro da empresa.',
  },
  {
    termo: 'Despesas fixas',
    explicacao: 'Aluguel, luz, internet... custos fixos, independente de quanto você vende. O que já está no custo do produto (embalagem, insumos) não entra aqui de novo.',
  },
];

export const GlossaryModal: React.FC<GlossaryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-900/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-highlight overflow-hidden p-6 space-y-4 my-auto"
        aria-labelledby="glossaryModalTitle"
      >
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#F6F2F5', color: '#5A3F7F' }}
            >
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="glossaryModalTitle" className="font-brand font-bold text-base text-neutral-900">
                Glossário
              </h3>
              <p className="text-xs text-neutral-500">
                O que cada termo financeiro significa
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

        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {TERMOS.map(({ termo, explicacao }) => (
            <div
              key={termo}
              className="p-3 rounded-xl border"
              style={{ background: '#F6F2F5', borderColor: '#E6E1DB' }}
            >
              <p
                className="text-[13px] font-bold"
                style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}
              >
                {termo}
              </p>
              <p
                className="text-[12px] mt-1"
                style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", lineHeight: 1.5 }}
              >
                {explicacao}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};
