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
      <div className="w-full max-w-sm bg-white rounded-xl shadow-highlight overflow-hidden border border-semantic-error-400/40 animate-scaleUp" aria-labelledby="deleteTitle">
        <div className="p-5 text-center">
          <div className="w-12 h-12 rounded-lg bg-semantic-error-400/40 text-semantic-error-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 id="deleteTitle" className="font-brand font-bold text-base text-neutral-900 mb-1">
            Excluir {transaction.type === 'venda' ? 'Pedido' : 'Lançamento'}?
          </h3>

          <div className="bg-semantic-error-50 p-4 rounded-lg mb-4 text-left border border-semantic-error-300/60 space-y-2.5">
            {transaction.type === 'venda' && transaction.customerName && (
              <div className="text-sm">
                <span className="text-neutral-600">👤 Cliente:</span>
                <strong className="text-neutral-900 ml-2">{transaction.customerName.toUpperCase()}</strong>
              </div>
            )}
            <div className="text-sm">
              <span className="text-neutral-600">💰 Valor:</span>
              <strong className="text-semantic-error-600 ml-2">{formatCurrency(transaction.totalValue)}</strong>
            </div>
            <div className="text-sm">
              <span className="text-neutral-600">📅 Data:</span>
              <strong className="text-neutral-900 ml-2">{formatDateBr(transaction.date)}</strong>
            </div>
            <div className="text-[11px] text-semantic-error-600 font-medium pt-1 border-t border-semantic-error-300/40">
              ⚠️ Esta ação é irreversível por 10 segundos — use "Desfazer" se deletar por engano.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onClose}
              className="py-2.5 px-4 bg-white border border-[#E6E1DB] text-neutral-700 font-bold text-xs rounded-xl hover:bg-neutral-50 shadow-card transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirmDelete(transaction.id);
                onClose();
              }}
              className="py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
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
