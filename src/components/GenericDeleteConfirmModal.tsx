import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface GenericDeleteConfirmModalProps {
  isOpen: boolean;
  itemType: 'transaction' | 'customer' | 'ficha';
  itemName?: string;
  itemDetails?: { label: string; value: string }[];
  onClose: () => void;
  onConfirmDelete: () => void;
}

export const GenericDeleteConfirmModal: React.FC<GenericDeleteConfirmModalProps> = ({
  isOpen,
  itemType,
  itemName,
  itemDetails = [],
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen) return null;

  const typeLabels = {
    transaction: 'Lançamento',
    customer: 'Cliente',
    ficha: 'Ficha Técnica',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4 animate-fadeIn" role="dialog" aria-modal="true">
      <div
        className="w-full max-w-sm bg-white overflow-hidden animate-scaleUp"
        style={{ borderRadius: '24px', boxShadow: '0 8px 20px rgba(58,35,80,0.09)', border: '1px solid rgba(58,35,80,0.08)' }}
        aria-labelledby="deleteTitle"
      >
        <div className="flex flex-col items-center gap-3.5" style={{ padding: '28px 24px 8px' }}>
          <span
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: '52px', height: '52px', borderRadius: '16px', background: '#FDEFF2' }}
          >
            <AlertTriangle className="w-[26px] h-[26px]" style={{ color: '#C4626F' }} />
          </span>

          <div className="flex flex-col items-center gap-1">
            <h3
              id="deleteTitle"
              className="text-center"
              style={{ margin: 0, fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, fontSize: '27px', lineHeight: 1.15, color: '#3A2350' }}
            >
              Excluir {typeLabels[itemType]}?
            </h3>

            {itemName && (
              <span className="truncate max-w-full" style={{ fontSize: '14px', fontWeight: 600, color: '#A85E86', fontFamily: "'Manrope', sans-serif" }}>
                {itemName}
              </span>
            )}
          </div>
        </div>

        {itemDetails.length > 0 && (
          <div className="overflow-hidden" style={{ margin: '18px 20px 0', borderRadius: '14px', background: '#FAF7FA', border: '1px solid rgba(58,35,80,0.08)' }}>
            {itemDetails.map((detail, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5"
                style={{ padding: '13px 16px', borderBottom: '1px solid rgba(58,35,80,0.08)' }}
              >
                <span className="text-[16px] flex-shrink-0" aria-hidden="true">{detail.label}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>
                  {detail.value}
                </span>
              </div>
            ))}
            <p style={{ margin: 0, padding: '12px 16px 14px', fontSize: '12.5px', lineHeight: 1.55, color: '#6E3F72', fontFamily: "'Manrope', sans-serif" }}>
              Esta ação é irreversível depois de 10 segundos — use <strong style={{ color: '#3A2350' }}>Desfazer</strong> se deletar por engano.
            </p>
          </div>
        )}

        <div className="grid" style={{ padding: '18px 20px 22px', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.25fr)', gap: '12px' }}>
          <button
            onClick={onClose}
            className="bg-white border border-[#E6E1DB] text-neutral-700 font-bold text-xs shadow-card transition-all active:scale-95"
            style={{ borderRadius: '10px', padding: '12px 16px' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirmDelete();
              onClose();
            }}
            className="text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
            style={{ borderRadius: '10px', padding: '12px 16px', background: '#C4626F', boxShadow: '0 8px 20px rgba(196,98,111,0.28)' }}
          >
            <Trash2 className="w-4 h-4" />
            Sim, excluir
          </button>
        </div>
      </div>
    </div>
  );
};
