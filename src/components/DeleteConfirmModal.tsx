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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-scaleUp">
        <div className="p-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="font-brand font-bold text-base text-slate-900 mb-1">
            Excluir Lançamento?
          </h3>

          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Tem certeza que deseja excluir o lançamento{' '}
            <strong className="text-slate-900">"{transaction.description}"</strong> no valor de{' '}
            <strong className="text-rose-600">{formatCurrency(transaction.totalValue)}</strong>?
          </p>

          <div className="bg-slate-50 p-3 rounded-2xl mb-4 text-left border border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div>• <strong>Data:</strong> {formatDateBr(transaction.date)}</div>
            {transaction.quantity > 1 && <div>• <strong>Quantidade:</strong> {transaction.quantity}x</div>}
            <div className="text-rose-600 font-medium pt-0.5">• Os valores serão removidos dos cálculos do dashboard imediatamente.</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirmDelete(transaction.id);
                onClose();
              }}
              className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
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
