import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Transaction } from '../types';
import { X, Download, Upload, Trash2, Database, ShieldCheck } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  /**
   * Busca os lancamentos COM as fotos, so na hora de exportar.
   *
   * Antes o modal exportava a lista que ja estava em memoria, mas ela nao
   * carrega mais `cliente_foto_url` nem `imagem_inspiracao`
   * (ver `COLUNAS_SEM_FOTO`). Exportar direto dela geraria
   * um arquivo sem fotos — e como a restauracao apaga tudo e regrava a partir
   * do arquivo, restaurar esse backup apagaria as fotos de forma irreversivel.
   */
  onExportTransactions: () => Promise<Transaction[]>;
  onClose: () => void;
  // Assincronos desde que as transacoes passaram a viver no Supabase: o aviso
  // de sucesso precisa esperar a gravacao, nao adiantar-se a ela.
  onRestoreTransactions: (txs: Transaction[]) => Promise<void>;
  onClearAll: () => Promise<void>;
  /** Quantos lancamentos a conta tem agora — aparece na confirmacao. */
  totalAtual: number;
}

const TIPOS_VALIDOS = ['venda', 'reposicao', 'maodeobra', 'custo', 'investimento'];

const vazio = (v: unknown) => v === undefined || v === null || v === '';

/** "aaaa-mm-dd" que existe no calendario (recusa 2026-02-31). */
const ehData = (v: unknown): v is string => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

const ehNumero = (v: unknown) =>
  (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '')) && Number.isFinite(Number(v));

/** O primeiro problema do item, em portugues, ou null se ele pode ser gravado. */
const problemaDoItem = (item: any): string | null => {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) return 'não é um lançamento';
  if (!TIPOS_VALIDOS.includes(item.type)) return 'tipo de lançamento desconhecido';
  if (typeof item.description !== 'string') return 'falta a descrição';
  if (!ehData(item.date)) return 'falta a data ou ela é inválida';
  if (!vazio(item.eventDate) && !ehData(item.eventDate)) return 'data do evento inválida';
  for (const campo of ['quantity', 'unitValue', 'totalValue', 'signalValue']) {
    if (!vazio(item[campo]) && !ehNumero(item[campo])) return 'valor que não é número';
  }
  if (!vazio(item.paymentStatus) && !['pago', 'pendente'].includes(item.paymentStatus)) {
    return 'status de pagamento desconhecido';
  }
  if (!vazio(item.fichaItems) && !Array.isArray(item.fichaItems)) return 'itens do pedido em formato errado';
  if (!vazio(item.consumedIngredients) && !Array.isArray(item.consumedIngredients)) {
    return 'insumos em formato errado';
  }
  if (!vazio(item.produtoId) && !(ehNumero(item.produtoId) && Number.isInteger(Number(item.produtoId)))) {
    return 'produto em formato errado';
  }
  if (!vazio(item.createdAt) && Number.isNaN(new Date(item.createdAt).getTime())) {
    return 'data de lançamento inválida';
  }
  return null;
};

// Um tipo so, e nao uniao discriminada: sem `strict` o tsc deste projeto nao
// estreita `ok` e acusaria `erro`/`itens` como inexistentes.
export type ResultadoValidacaoBackup = { ok: boolean; itens?: Transaction[]; erro?: string };

/**
 * Confere o arquivo INTEIRO antes de qualquer coisa ser apagada.
 *
 * As regras espelham o que o banco recusa (`tipo`, `descricao` e `data`
 * obrigatorios, `status_pagamento` so pago/pendente, colunas de data e de
 * numero) e o que o app espera ler de volta (listas nos itens e insumos). Um
 * item ruim recusa o arquivo todo: restaurar pela metade seria pior.
 */
export const validarBackup = (dado: unknown): ResultadoValidacaoBackup => {
  if (!Array.isArray(dado)) {
    return { ok: false, erro: 'Arquivo inválido. O arquivo de backup deve ser no formato JSON do Carula App.' };
  }
  if (dado.length === 0) {
    return { ok: false, erro: 'Este backup está vazio (nenhum lançamento). Nada foi alterado.' };
  }
  const problemas: string[] = [];
  dado.forEach((item, i) => {
    const p = problemaDoItem(item);
    if (p) problemas.push(`item ${i + 1}: ${p}`);
  });
  if (problemas.length > 0) {
    const exemplos = problemas.slice(0, 3).join('\n');
    return {
      ok: false,
      erro:
        `Este arquivo tem ${problemas.length} lançamento(s) com problema e não pode ser restaurado. ` +
        `Nada foi alterado.\n\n${exemplos}${problemas.length > 3 ? '\n...' : ''}`,
    };
  }
  return { ok: true, itens: dado as Transaction[] };
};

const dataBr = (iso: string) => iso.split('-').reverse().join('/');

/** Acima disto a restauracao pode nao passar de uma vez (medido em 23/10/2026:
 * 22 MB passou; 35 MB foi barrado no gateway; 52 MB estourou o tempo do banco). */
const LIMITE_AVISO_BYTES = 20 * 1024 * 1024;

/**
 * Falha sem resposta do servidor (rede caiu, gateway recusou sem cabecalho).
 *
 * Nesse caso o app NAO sabe se o banco chegou a gravar: a conexao pode ter
 * caido depois do commit. Erro que o banco devolveu traz `code` (ex.: 57014
 * tempo esgotado, P0001 recusa da funcao) e prova que nada foi gravado. Os
 * textos sao os de cada navegador: Chrome "Failed to fetch", Safari "Load
 * failed", Firefox "NetworkError when attempting to fetch resource".
 */
const ehFalhaSemResposta = (err: any) =>
  !err?.code && /failed to fetch|load failed|networkerror/i.test(String(err?.message || err));

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onExportTransactions,
  onClose,
  onRestoreTransactions,
  onClearAll,
  totalAtual,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  // Arquivo ja conferido, esperando a confeiteira confirmar a troca.
  const [restauracaoPendente, setRestauracaoPendente] = useState<Transaction[] | null>(null);
  const [tamanhoArquivo, setTamanhoArquivo] = useState(0);
  const [isRestoring, setIsRestoring] = useState(false);

  if (!isOpen) return null;

  const exportJsonBackup = async () => {
    setIsExporting(true);
    let paraExportar: Transaction[];
    try {
      paraExportar = await onExportTransactions();
    } catch (err: any) {
      // Melhor nao gerar arquivo nenhum do que gerar um backup incompleto: a
      // restauracao regrava a partir dele e o que faltar sera perdido.
      alert(`Erro ao preparar o backup: ${err?.message || err}\n\nNenhum arquivo foi gerado.`);
      return;
    } finally {
      setIsExporting(false);
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(paraExportar, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `carula-app_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Zera o campo: sem isso, escolher o MESMO arquivo de novo (depois de
    // cancelar, ou de corrigir algo) nao dispara onChange e nada acontece.
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.target?.result as string);
      } catch {
        alert('Arquivo inválido: não é um backup JSON do Carula App. Nada foi alterado.');
        return;
      }
      // Nada e apagado aqui: o arquivo so e conferido. A troca so acontece
      // depois da confirmacao, em `confirmarRestauracao`.
      const resultado = validarBackup(parsed);
      if (!resultado.ok || !resultado.itens) {
        alert(resultado.erro);
        return;
      }
      setTamanhoArquivo(file.size);
      setRestauracaoPendente(resultado.itens);
    };
    reader.readAsText(file);
  };

  const confirmarRestauracao = async () => {
    if (!restauracaoPendente) return;
    setIsRestoring(true);
    try {
      // `await` antes do aviso: a restauracao grava no banco e pode falhar.
      await onRestoreTransactions(restauracaoPendente);
      alert(`Backup restaurado com sucesso! ${restauracaoPendente.length} lançamento(s) carregado(s).`);
      setRestauracaoPendente(null);
      onClose();
    } catch (err: any) {
      if (ehFalhaSemResposta(err)) {
        // Sem resposta nao da para afirmar que nada mudou.
        alert('Não foi possível confirmar a restauração. Confira seus lançamentos antes de tentar de novo.');
      } else {
        // O banco respondeu com erro, e a troca e uma transacao so: nada foi
        // apagado.
        alert(`Não foi possível restaurar o backup. Seus lançamentos continuam como estavam.\n\n${err?.message || err}`);
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const datasDoArquivo = (restauracaoPendente || []).map((t) => t.date).sort();

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
                Seus lançamentos ficam guardados na sua conta
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              // O modal fica montado fechado; sem isto a confirmacao pendente
              // reapareceria na proxima vez que ele abrisse.
              setRestauracaoPendente(null);
              onClose();
            }}
            disabled={isRestoring}
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

        {/* Confirmacao da restauracao: aparece no lugar da lista de acoes
            depois que o arquivo passou na conferencia. Cores com escalas reais
            do Tailwind (amber/rose) — as `semantic-*-N` nao existem. */}
        {restauracaoPendente && (
          <div className="space-y-3 pt-1">
            <h4 className="font-bold text-sm text-neutral-900">Substituir seus lançamentos?</h4>
            <p className="text-xs text-neutral-700 leading-relaxed">
              Você tem <strong>{totalAtual}</strong> lançamento(s) agora. O arquivo tem{' '}
              <strong>{restauracaoPendente.length}</strong>
              {datasDoArquivo.length > 0 && (
                <> (de {dataBr(datasDoArquivo[0])} a {dataBr(datasDoArquivo[datasDoArquivo.length - 1])})</>
              )}
              . Os atuais serão apagados e trocados pelos do arquivo.
            </p>
            {tamanhoArquivo > LIMITE_AVISO_BYTES && (
              <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3 leading-relaxed">
                Este backup é grande e pode não restaurar de uma vez. Se falhar, nada será apagado.
              </p>
            )}
            <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3 leading-relaxed">
              Os pedidos restaurados perdem o vínculo com o estoque: se você cancelar um deles
              depois, os insumos não voltam sozinhos para o estoque.
            </p>
            <button
              onClick={exportJsonBackup}
              disabled={isExporting || isRestoring}
              className="w-full p-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg flex items-center gap-3 text-left transition-all active:scale-98 disabled:opacity-60"
            >
              <Download className="w-5 h-5 text-pink-500 shrink-0" />
              <span className="font-bold text-xs text-neutral-800">
                {isExporting ? 'Preparando cópia...' : 'Antes, baixar uma cópia do que tenho agora'}
              </span>
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setRestauracaoPendente(null)}
                disabled={isRestoring}
                className="flex-1 p-3 bg-white border border-[#E6E1DB] rounded-lg font-bold text-xs text-neutral-700 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRestauracao}
                disabled={isRestoring || isExporting}
                className="flex-1 p-3 bg-rose-600 hover:bg-rose-700 rounded-lg font-bold text-xs text-white disabled:opacity-60 disabled:cursor-wait"
              >
                {isRestoring ? 'Restaurando...' : 'Substituir pelo arquivo'}
              </button>
            </div>
          </div>
        )}

        {/* Actions List */}
        <div className={restauracaoPendente ? 'hidden' : 'space-y-2 pt-1'}>
          {/* Download Backup */}
          <button
            onClick={exportJsonBackup}
            disabled={isExporting}
            className="w-full p-3.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg flex items-center justify-between text-left transition-all active:scale-98 disabled:opacity-60 disabled:cursor-wait"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-pink-500" />
              <div>
                <span className="block font-bold text-xs text-neutral-800">
                  {isExporting
                    ? 'Preparando cópia de segurança...'
                    : 'Fazer Cópia de Segurança (Download Backup)'}
                </span>
                <span className="text-[11px] text-neutral-500">
                  {isExporting
                    ? 'Buscando as fotos dos pedidos — pode levar alguns segundos'
                    : 'Salva um arquivo .json com todos os seus lançamentos (clientes, fichas e produtos não entram)'}
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
