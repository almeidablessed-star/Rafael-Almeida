import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { TabType, TransactionType } from '../../types';

interface PrimeirosPassosChecklistProps {
  produtoCadastrado: boolean;
  fichaCriada: boolean;
  pedidoLancado: boolean;
  onNavigateToTab: (tab: TabType) => void;
  /** Abre Produtos ja no filtro Compras — mesmo caminho ensinado no tour guiado (ver `abaInicial` em ProdutosModule.tsx). */
  onNavigateToProdutosCompras: () => void;
  onOpenAddModal: (type: TransactionType) => void;
}

/**
 * Card do Dashboard que lista os 3 passos reais que faltam pra usuaria comecar
 * a usar o app de verdade (compra -> ficha -> pedido). Complementa o tour
 * guiado ([[TourPrimeirosPassos]]): o tour aponta pros icones uma vez, este
 * card fica de pe ate a acao de verdade acontecer. Some sozinho quando os 3
 * estiverem completos — quem decide SE ele aparece (gate por
 * tourPrimeirosPassosVistoEm e primeirosPassosCompletosEm) e o componente pai.
 *
 * O item 1 ensina "registrar uma compra", nao "cadastrar um produto": lancar
 * uma compra ja cria o produto automaticamente (com estoque e financeiro
 * corretos), entao a condicao de conclusao continua sendo `produtoCadastrado`
 * (produtos.length > 0) — so mudou o texto e o destino do botao "Ir".
 */
export const PrimeirosPassosChecklist: React.FC<PrimeirosPassosChecklistProps> = ({
  produtoCadastrado,
  fichaCriada,
  pedidoLancado,
  onNavigateToTab,
  onNavigateToProdutosCompras,
  onOpenAddModal,
}) => {
  const itens = [
    { label: 'Registre sua primeira compra', completo: produtoCadastrado, onIr: onNavigateToProdutosCompras },
    { label: 'Crie sua primeira ficha técnica', completo: fichaCriada, onIr: () => onNavigateToTab('fichas') },
    { label: 'Lance seu primeiro pedido', completo: pedidoLancado, onIr: () => onOpenAddModal('venda') },
  ];

  if (itens.every((item) => item.completo)) return null;

  const feitos = itens.filter((item) => item.completo).length;
  const percentualConcluido = Math.round((feitos / itens.length) * 100);

  return (
    <div
      className="w-full rounded-[22px] overflow-hidden"
      style={{ background: 'white', boxShadow: '0 8px 20px rgba(58,35,80,0.08)' }}
    >
      <div style={{ height: '4px', background: 'linear-gradient(90deg, #3A2350, #6E3F72 55%, #A85E86)' }} />

      <div className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif-display text-[19px]" style={{ color: '#241B2B' }}>
            Primeiros passos
          </h3>
          <span
            className="text-[11px] font-bold uppercase flex-shrink-0"
            style={{ color: '#A85E86', letterSpacing: '0.1em', fontVariantNumeric: 'tabular-nums' }}
          >
            {feitos}/{itens.length} feitos
          </span>
        </div>
        <p className="text-[11px]" style={{ color: '#7A6E80', marginTop: '2px', marginBottom: '14px' }}>
          Conclua estes 3 passos para começar a usar o Carula de verdade.
        </p>
        <div className="rounded-full overflow-hidden" style={{ height: '6px', background: '#F1EBF2' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${percentualConcluido}%`, background: '#A85E86' }}
          />
        </div>
      </div>

      <div className="px-4 pb-4 flex flex-col">
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
                className="flex items-center gap-1.5 text-[12.5px] font-bold flex-shrink-0"
                style={{
                  color: '#3A2350',
                  background: '#F3E9F3',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '7px 8px 7px 14px',
                  cursor: 'pointer',
                }}
              >
                Ir
                <span
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(58,35,80,0.18)' }}
                >
                  <ArrowRight className="w-3.5 h-3.5" style={{ color: '#3A2350' }} strokeWidth={2.4} />
                </span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
