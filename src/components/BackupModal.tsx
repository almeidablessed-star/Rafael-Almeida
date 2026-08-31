import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Transaction } from '../types';
import { X, Download, Upload, Trash2, Database, ShieldCheck } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  transactions: Transaction[];
  onClose: () => void;
  // Assincronos desde que as transacoes passaram a viver no Supabase: o aviso
  // de sucesso precisa esperar a gravacao, nao adiantar-se a ela.
  onRestoreTransactions: (txs: Transaction[]) => Promise<void>;
  onClearAll: () => Promise<void>;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  transactions,
  onClose,
  onRestoreTransactions,
  onClearAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const exportJsonBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `carulaconfeitaria_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed)) {
          alert('Arquivo inválido. O arquivo de backup deve ser no formato JSON do Carula Confeitaria.');
          return;
        }

        // `await` antes do aviso: a restauracao grava no banco e pode falhar.
        // Sem esperar, a confeiteira lia "restaurado com sucesso" enquanto a
        // gravacao ainda estava em curso — ou tinha acabado de dar erro.
        await onRestoreTransactions(parsed);
        alert('Backup restaurado com sucesso! Os dados foram atualizados.');
        onClose();
      } catch (err: any) {
        alert(`Erro ao restaurar o backup: ${err?.message || 'arquivo JSON inválido.'}`);
      }
    };
    reader.readAsText(file);
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-900/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-xl shadow-highlight overflow-hidden p-6 space-y-4 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-semantic-info-100 text-semantic-info-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-brand font-bold text-base text-neutral-900">
                Gerenciar Dados e Backup
              </h3>
              <p className="text-xs text-neutral-500">
                Seus dados ficam 100% seguros salvos no seu celular
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-slate-200 text-neutral-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security badge note */}
        <div className="bg-semantic-success-50 border border-semantic-success-200 rounded-lg p-3 flex items-center gap-2.5 text-xs text-semantic-success-800 font-medium">
          {/* Este texto dizia "nada sai do seu dispositivo, tudo e salvo
              localmente no navegador". Era verdade enquanto os lancamentos
              viviam no localStorage; deixou de ser quando passaram para o
              Supabase. Promessa de privacidade desatualizada e pior do que
              nenhuma — a confeiteira decide o que registrar com base nela. */}
          <ShieldCheck className="w-5 h-5 text-semantic-success-600 shrink-0" />
          <span>
            Seus lançamentos ficam guardados na sua conta, protegidos por senha, e
            aparecem em todos os aparelhos onde você entrar. Só você tem acesso.
          </span>
        </div>

        {/* Actions List */}
        <div className="space-y-2 pt-1">
          {/* Download Backup */}
          <button
            onClick={exportJsonBackup}
            className="w-full p-3.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg flex items-center justify-between text-left transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-pink-500" />
              <div>
                <span className="block font-bold text-xs text-neutral-800">
                  Fazer Cópia de Segurança (Download Backup)
                </span>
                <span className="text-[11px] text-neutral-500">
                  Salva um arquivo .json com todos os seus lançamentos
                </span>
              </div>
            </div>
          </button>

          {/* Import Backup */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-3.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg flex items-center justify-between text-left transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-semantic-info-500" />
              <div>
                <span className="block font-bold text-xs text-neutral-800">
                  Restaurar Backup de Arquivo
                </span>
                <span className="text-[11px] text-neutral-500">
                  Carregar lançamentos a partir de um arquivo de backup
                </span>
              </div>
            </div>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          {/* Clear All Data */}
          <button
            onClick={async () => {
              if (!confirm('ATENÇÃO: Certeza que deseja apagar TODOS os lançamentos e começar do zero? Esta ação é irreversível e vale para todos os seus aparelhos.')) {
                return;
              }
              await onClearAll();
              onClose();
            }}
            className="w-full p-3 bg-semantic-error-50 hover:bg-rose-100 border border-semantic-error-200 rounded-lg flex items-center justify-between text-left transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-semantic-error-600" />
              <div>
                <span className="block font-bold text-xs text-semantic-error-800">
                  Zerar Todos os Dados (Começar do Zero)
                </span>
                <span className="text-[11px] text-semantic-error-600 font-normal">
                  Limpa todas as vendas, compras e lançamentos
                </span>
              </div>
            </div>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
