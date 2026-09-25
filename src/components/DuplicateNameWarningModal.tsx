import React from 'react';
import { AlertTriangle, ArrowRight, Plus } from 'lucide-react';

interface DuplicateNameWarningModalProps {
  isOpen: boolean;
  itemType: 'produto' | 'ficha';
  nome: string;
  onUsarExistente: () => void;
  onCriarMesmoAssim: () => void;
  onClose: () => void;
}

/**
 * Mesmo padrao visual do GenericDeleteConfirmModal (cartao branco arredondado,
 * icone colorido no topo, titulo em Instrument Serif), mas para um aviso — nao
 * uma exclusao. Por isso icone/cor de atencao (ambar, mesmo tom usado no alerta
 * de estoque medio) em vez do vermelho de perigo, e duas acoes positivas em vez
 * de cancelar/confirmar.
 */
export const DuplicateNameWarningModal: React.FC<DuplicateNameWarningModalProps> = ({
  isOpen,
  itemType,
  nome,
  onUsarExistente,
  onCriarMesmoAssim,
  onClose,
}) => {
  if (!isOpen) return null;

  const typeLabels = {
    produto: { nome: 'produto', artigo: 'um' },
    ficha: { nome: 'ficha técnica', artigo: 'uma' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4 animate-fadeIn" role="dialog" aria-modal="true">
      <div
        className="w-full max-w-sm bg-white overflow-hidden animate-scaleUp"
        style={{ borderRadius: '24px', boxShadow: '0 8px 20px rgba(58,35,80,0.09)', border: '1px solid rgba(58,35,80,0.08)' }}
        aria-labelledby="duplicateTitle"
      >
        <div className="flex flex-col items-center gap-3.5" style={{ padding: '28px 24px 8px' }}>
          <span
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: '52px', height: '52px', borderRadius: '16px', background: '#FFF3E0' }}
          >
            <AlertTriangle className="w-[26px] h-[26px]" style={{ color: '#F5A623' }} />
          </span>

          <div className="flex flex-col items-center gap-1">
            <h3
              id="duplicateTitle"
              className="text-center"
              style={{ margin: 0, fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, fontSize: '23px', lineHeight: 1.2, color: '#3A2350' }}
            >
              Já existe {typeLabels[itemType].artigo} {typeLabels[itemType].nome} com esse nome
            </h3>

            <span className="truncate max-w-full" style={{ fontSize: '14px', fontWeight: 600, color: '#A85E86', fontFamily: "'Manrope', sans-serif" }}>
              "{nome}"
            </span>
          </div>

          <p style={{ margin: 0, textAlign: 'center', fontSize: '12.5px', lineHeight: 1.55, color: '#6E3F72', fontFamily: "'Manrope', sans-serif" }}>
            Quer usar o que já está cadastrado, ou criar um novo mesmo assim?
          </p>
        </div>

        <div className="flex flex-col" style={{ padding: '18px 20px 22px', gap: '10px' }}>
          <button
            onClick={onUsarExistente}
            className="text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
            style={{ borderRadius: '10px', padding: '12px 16px', background: '#6E3F72', boxShadow: '0 8px 20px rgba(110,63,114,0.28)' }}
          >
            <ArrowRight className="w-4 h-4" />
            Usar o existente
          </button>
          <button
            onClick={onCriarMesmoAssim}
            className="bg-white border border-[#E6E1DB] text-neutral-700 font-bold text-xs shadow-card transition-all active:scale-95 flex items-center justify-center gap-1.5"
            style={{ borderRadius: '10px', padding: '12px 16px' }}
          >
            <Plus className="w-4 h-4" />
            Criar mesmo assim
          </button>
          <button
            onClick={onClose}
            className="text-neutral-400 font-bold text-[11px] transition-all active:scale-95"
            style={{ padding: '4px', background: 'transparent', border: 'none' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
