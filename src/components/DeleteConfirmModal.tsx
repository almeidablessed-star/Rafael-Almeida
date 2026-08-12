import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency, formatDateBr } from '../utils/formatters';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4 animate-fadeIn" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden border border-semantic-error-400/40 animate-scaleUp" aria-labelledby="deleteTitle">
        <div className="p-5 text-center">
          <div className="w-12 h-12 rounded-lg bg-semantic-error-400/40 text-semantic-error-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 id="deleteTitle" className="font-brand font-bold text-base text-neutral-900 mb-1">
            Excluir Lançamento?
          </h3>

          <p className="text-xs text-neutral-900/70 mb-4 leading-relaxed">
            Tem certeza que deseja excluir o lançamento{' '}
            <strong className="text-neutral-900">"{transaction.description}"</strong> no valor de{' '}
            <strong className="text-semantic-error-600">{formatCurrency(transaction.totalValue)}</strong>?
          </p>

          <div className="bg-semantic-error-100/10 p-3 rounded-lg mb-4 text-left border border-semantic-error-300/30 text-[11px] text-neutral-900/70 space-y-1">
            <div>• <strong>Data:</strong> {formatDateBr(transaction.date)}</div>
            {transaction.quantity > 1 && <div>• <strong>Quantidade:</strong> {transaction.quantity}x</div>}
            <div className="text-semantic-error-600 font-medium pt-0.5">• Os valores serão removidos dos cálculos do dashboard imediatamente.</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onClose}
              className="py-2.5 px-4 bg-semantic-success-600 hover:bg-semantic-success-600/80 text-neutral-900 font-bold text-xs rounded-xl transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirmDelete(transaction.id);
                onClose();
              }}
              className="py-2.5 px-4 bg-pastry-pink hover:bg-pastry-pink/90 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Sim, Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
