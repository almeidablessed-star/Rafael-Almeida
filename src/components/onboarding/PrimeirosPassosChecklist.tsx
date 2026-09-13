import React from 'react';
import { Check } from 'lucide-react';
import { TabType, TransactionType } from '../../types';

interface PrimeirosPassosChecklistProps {
  produtoCadastrado: boolean;
  fichaCriada: boolean;
  pedidoLancado: boolean;
  onNavigateToTab: (tab: TabType) => void;
  onOpenAddModal: (type: TransactionType) => void;
}

/**
 * Card do Dashboard que lista os 3 passos reais que faltam pra usuaria comecar
 * a usar o app de verdade (produto -> ficha -> pedido). Complementa o tour
 * guiado ([[TourPrimeirosPassos]]): o tour aponta pros icones uma vez, este
 * card fica de pe ate a acao de verdade acontecer. Some sozinho quando os 3
 * estiverem completos — quem decide SE ele aparece (gate por
 * tourPrimeirosPassosVistoEm e primeirosPassosCompletosEm) e o componente pai.
 */
export const PrimeirosPassosChecklist: React.FC<PrimeirosPassosChecklistProps> = ({
  produtoCadastrado,
  fichaCriada,
  pedidoLancado,
  onNavigateToTab,
  onOpenAddModal,
}) => {
  const itens = [
    { label: 'Cadastre seu primeiro produto', completo: produtoCadastrado, onIr: () => onNavigateToTab('produtos') },
    { label: 'Crie sua primeira ficha técnica', completo: fichaCriada, onIr: () => onNavigateToTab('fichas') },
    { label: 'Lance seu primeiro pedido', completo: pedidoLancado, onIr: () => onOpenAddModal('venda') },
  ];

  if (itens.every((item) => item.completo)) return null;

  return (
    <div
      className="w-full rounded-[22px] p-4"
      style={{ background: 'white', boxShadow: '0 8px 20px rgba(58,35,80,0.08)' }}
    >
      <h3 className="font-serif-display text-[19px]" style={{ color: '#241B2B' }}>
        Primeiros passos
      </h3>
      <p className="text-[11px]" style={{ color: '#7A6E80', marginTop: '2px', marginBottom: '6px' }}>
        Conclua estes 3 passos para começar a usar o Carula de verdade.
      </p>

      <div className="divide-y" style={{ borderColor: '#F1EBF2' }}>
        {itens.map((item) => (
          <div key={item.label} className="flex items-center gap-3 py-3">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: item.completo ? '#EEF8F1' : '#F1EBF2',
                border: item.completo ? 'none' : '1px solid #D9CCDB',
              }}
            >
              {item.completo && <Check className="w-4 h-4" style={{ color: '#2E7D51' }} strokeWidth={3} />}
            </div>

            <span
              className="flex-1 text-[13px] font-bold"
              style={{
                color: item.completo ? '#9A8FA0' : '#241B2B',
                textDecoration: item.completo ? 'line-through' : 'none',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              {item.label}
            </span>

            {!item.completo && (
              <button
                onClick={item.onIr}
                className="text-[12px] font-bold flex-shrink-0"
                style={{ color: '#5A3F7F', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Ir →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
