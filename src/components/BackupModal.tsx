import React, { useRef, useState } from 'react';
import { avisar } from './AvisoApp';
import { createPortal } from 'react-dom';
import { Transaction } from '../types';
import { X, Download, Upload, Trash2, Database, ShieldCheck } from 'lucide-react';
import {
  BackupCompleto,
  ehBackupCompleto,
  montarBackupCompleto,
  restaurarBackupCompleto,
  validarBackupCompleto,
} from '../utils/backupCompleto';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Assincronos desde que as transacoes passaram a viver no Supabase: o aviso
  // de sucesso precisa esperar a gravacao, nao adiantar-se a ela.
  onRestoreTransactions: (txs: Transaction[]) => Promise<void>;
  onClearAll: () => Promise<void>;
  /** Quantos lancamentos a conta tem agora — aparece na confirmacao. */
  totalAtual: number;
}

const TIPOS_VALIDOS = ['venda', 'reposicao', 'maodeobra', 'custo', 'investimento', 'lucro'];

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
  onClose,
  onRestoreTransactions,
  onClearAll,
  totalAtual,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  // Arquivo ja conferido, esperando a confeiteira confirmar a troca.
  const [restauracaoPendente, setRestauracaoPendente] = useState<Transaction[] | null>(null);
  // Backup completo (versao 2) ja conferido, esperando a confirmacao.
  const [completoPendente, setCompletoPendente] = useState<BackupCompleto | null>(null);
  const [tamanhoArquivo, setTamanhoArquivo] = useState(0);
  const [isRestoring, setIsRestoring] = useState(false);
  /**
   * Arquivo de backup ja montado, esperando o segundo toque (so no celular).
   *
   * No iPhone o download so e aceito no INSTANTE do toque. A copia leva alguns
   * segundos para ser montada (busca as fotos dos pedidos), e o download
   * disparado depois disso era bloqueado em silencio — a tela so piscava. Por
   * isso no celular sao dois toques: o primeiro prepara, o segundo ("Salvar
   * arquivo") salva na hora, abrindo a tela de compartilhar do sistema
   * (Salvar em Arquivos, WhatsApp, e-mail).
   */
  const [arquivoPronto, setArquivoPronto] = useState<File | null>(null);

  /** Pergunta do "Zerar todos os dados" aberta, no layout do app (era a
   * caixinha do navegador). `zerando` trava os botoes enquanto apaga. */
  const [confirmarZerar, setConfirmarZerar] = useState(false);
  const [zerando, setZerando] = useState(false);

  if (!isOpen) return null;

  /** Toque na tela, e nao mouse: celular ou tablet. */
  const ehCelular = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  /**
   * Download comum, pelo navegador. Blob em vez do `data:` antigo: o link
   * `data:` de varios MB (as fotos vao junto) e ignorado pelo app instalado na
   * tela inicial do iPhone e pesa na memoria de qualquer celular.
   */
  const baixarArquivo = (arquivo: File) => {
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');
    link.href = url;
    link.download = arquivo.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Da tempo do navegador comecar o download antes de liberar a memoria.
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  /** Segundo toque no celular: compartilha (ou baixa) o arquivo ja pronto. */
  const salvarArquivoPronto = async () => {
    if (!arquivoPronto) return;
    const arquivo = arquivoPronto;
    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [arquivo] })) {
      try {
        await navigator.share({ files: [arquivo], title: 'Backup Carula App' });
        setArquivoPronto(null);
      } catch (err: any) {
        // Fechar a tela de compartilhar sem escolher nada nao e erro: o
        // arquivo continua pronto para tentar de novo.
        if (err?.name !== 'AbortError') {
          baixarArquivo(arquivo);
          setArquivoPronto(null);
        }
      }
      return;
    }
    baixarArquivo(arquivo);
    setArquivoPronto(null);
  };

  const exportJsonBackup = async () => {
    setIsExporting(true);
    let paraExportar: BackupCompleto;
    try {
      paraExportar = await montarBackupCompleto();
    } catch (err: any) {
      // Melhor nao gerar arquivo nenhum do que gerar um backup incompleto: a
      // restauracao regrava a partir dele e o que faltar sera perdido.
      avisar(`Erro ao preparar o backup: ${err?.message || err}\n\nNenhum arquivo foi gerado.`, { titulo: 'Não deu para gerar o backup' });
      return;
    } finally {
      setIsExporting(false);
    }

    const arquivo = new File(
      [JSON.stringify(paraExportar, null, 2)],
      `carula-app_backup_${Date.now()}.json`,
      { type: 'application/json' }
    );
    // Computador: baixa direto, como sempre. Celular: espera o segundo toque.
    if (ehCelular()) {
      setArquivoPronto(arquivo);
    } else {
      baixarArquivo(arquivo);
    }
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
        avisar('Arquivo inválido: não é um backup JSON do Carula App. Nada foi alterado.', { titulo: 'Arquivo inválido' });
        return;
      }
      // Nada e apagado aqui: o arquivo so e conferido. A troca so acontece
      // depois da confirmacao, em `confirmarRestauracao`.
      if (ehBackupCompleto(parsed)) {
        const erro = validarBackupCompleto(parsed);
        if (erro) {
          avisar(erro, { titulo: 'Este arquivo não serve' });
          return;
        }
        setTamanhoArquivo(file.size);
        setCompletoPendente(parsed);
        return;
      }
      // Arquivo antigo (versao 1): so lancamentos, pelo caminho de sempre.
      const resultado = validarBackup(parsed);
      if (!resultado.ok || !resultado.itens) {
        avisar(resultado.erro || 'Arquivo inválido.', { titulo: 'Este arquivo não serve' });
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
      avisar(`Backup restaurado com sucesso! ${restauracaoPendente.length} lançamento(s) carregado(s).`, { titulo: 'Backup restaurado' });
      setRestauracaoPendente(null);
      onClose();
    } catch (err: any) {
      if (ehFalhaSemResposta(err)) {
        // Sem resposta nao da para afirmar que nada mudou.
        avisar('Não foi possível confirmar a restauração. Confira seus lançamentos antes de tentar de novo.', { titulo: 'Confira seus lançamentos' });
      } else {
        // O banco respondeu com erro, e a troca e uma transacao so: nada foi
        // apagado.
        avisar(`Não foi possível restaurar o backup. Seus lançamentos continuam como estavam.\n\n${err?.message || err}`, { titulo: 'Não deu para restaurar' });
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const confirmarRestauracaoCompleta = async () => {
    if (!completoPendente) return;
    setIsRestoring(true);
    try {
      const r = await restaurarBackupCompleto(completoPendente);
      // `await`: o app recarrega logo abaixo. A caixinha antiga segurava o
      // recarregamento ate o OK; a janela do app precisa da espera explicita,
      // senao a mensagem some na hora.
      await avisar(
        `Backup restaurado com sucesso!\n\n${r.fichas} ficha(s), ${r.produtos} produto(s), ` +
          `${r.clientes} cliente(s) e ${r.transacoes} lançamento(s).`,
        { titulo: 'Backup restaurado' }
      );
      // Clientes, fichas, produtos, empresa e lancamentos vivem em contextos
      // diferentes: recarregar o app busca tudo de novo de uma vez.
      window.location.reload();
    } catch (err: any) {
      if (ehFalhaSemResposta(err)) {
        avisar('Não foi possível confirmar a restauração. Confira seus dados antes de tentar de novo.', { titulo: 'Confira seus dados' });
      } else {
        // O banco respondeu com erro, e a troca e uma transacao so: nada foi
        // apagado.
        avisar(`Não foi possível restaurar o backup. Seus dados continuam como estavam.\n\n${err?.message || err}`, { titulo: 'Não deu para restaurar' });
      }
      setIsRestoring(false);
    }
  };

  const datasDoArquivo = (restauracaoPendente || []).map((t) => t.date).sort();
  const dataDoCompleto = completoPendente?.criadoEm
    ? new Date(completoPendente.criadoEm).toLocaleDateString('pt-BR')
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-900/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-xl shadow-highlight overflow-hidden p-6 space-y-4 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#F3E9F3] text-[#6E3F72] flex items-center justify-center">
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
              setCompletoPendente(null);
              setArquivoPronto(null);
              onClose();
            }}
            disabled={isRestoring}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-slate-200 text-neutral-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security badge note */}
        <div className="bg-[#F3E9F3] border border-[rgba(110,63,114,0.22)] rounded-lg p-3 flex items-center gap-2.5 text-xs text-[#3A2350] font-medium">
          {/* Este texto dizia "nada sai do seu dispositivo, tudo e salvo
              localmente no navegador". Era verdade enquanto os lancamentos
              viviam no localStorage; deixou de ser quando passaram para o
              Supabase. Promessa de privacidade desatualizada e pior do que
              nenhuma — a confeiteira decide o que registrar com base nela. */}
          <ShieldCheck className="w-5 h-5 text-[#6E3F72] shrink-0" />
          <span>
            Seus lançamentos ficam guardados na sua conta, protegidos por senha, e
            aparecem em todos os aparelhos onde você entrar. Só você tem acesso.
          </span>
        </div>

        {/* Segundo toque do backup no celular (ver `arquivoPronto`). Fica aqui
            em cima para aparecer tanto na lista de acoes quanto na confirmacao
            de restauracao ("Antes, baixar uma copia..."). */}
        {arquivoPronto && (
          <div className="rounded-lg p-3 flex flex-col gap-2.5" style={{ background: '#F3E9F3', border: '1px solid #E2CFE4' }}>
            <span className="text-xs font-bold" style={{ color: '#3A2350' }}>
              Cópia pronta ({Math.max(1, Math.round(arquivoPronto.size / 1024))} KB)
            </span>
            <button
              onClick={salvarArquivoPronto}
              className="w-full p-3 rounded-lg flex items-center justify-center gap-2 font-bold text-xs active:scale-98"
              style={{ background: '#3A2350', color: '#F5B9C6' }}
            >
              <Download className="w-4 h-4" />
              Salvar arquivo
            </button>
            <span className="text-[11px]" style={{ color: '#7A6E80' }}>
              Escolha "Salvar em Arquivos", ou envie para o seu WhatsApp ou e-mail.
              Guarde num lugar só seu: o arquivo tem os contatos das suas clientes.
            </span>
          </div>
        )}

        {/* Confirmacao da restauracao: aparece no lugar da lista de acoes
            depois que o arquivo passou na conferencia. Cores com escalas reais
            do Tailwind (amber/rose) — as `semantic-*-N` nao existem; o resto do modal
            usa as cores literais da paleta do app pelo mesmo motivo. */}
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

        {/* Confirmacao do backup completo (versao 2). */}
        {completoPendente && (
          <div className="space-y-3 pt-1">
            <h4 className="font-bold text-sm text-neutral-900">Substituir todos os seus dados?</h4>
            <p className="text-xs text-neutral-700 leading-relaxed">
              O arquivo{dataDoCompleto ? <> é de <strong>{dataDoCompleto}</strong> e</> : ''} tem:
            </p>
            <ul className="text-xs text-neutral-800 leading-relaxed bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-0.5">
              <li><strong>{completoPendente.fichas?.length || 0}</strong> ficha(s) técnica(s)</li>
              <li><strong>{completoPendente.produtos?.length || 0}</strong> produto(s) do estoque</li>
              <li><strong>{completoPendente.clientes?.length || 0}</strong> cliente(s)</li>
              <li><strong>{completoPendente.transacoes?.length || 0}</strong> lançamento(s)</li>
              <li>Minha Empresa: custos fixos, metas e dados da confeitaria</li>
            </ul>
            <p className="text-xs text-neutral-700 leading-relaxed">
              Tudo o que você tem agora será apagado e trocado pelo que está no arquivo.
            </p>
            <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3 leading-relaxed">
              <strong>As fotos não voltam:</strong> o backup não guarda fotos. Fichas, clientes e pedidos
              voltam completos, mas sem as imagens.
            </p>
            {tamanhoArquivo > LIMITE_AVISO_BYTES && (
              <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3 leading-relaxed">
                Este backup é grande e pode não restaurar de uma vez. Se falhar, nada será apagado.
              </p>
            )}
            <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3 leading-relaxed">
              O histórico de movimentos do estoque é apagado. A quantidade de cada produto volta como
              estava no dia do backup.
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
                onClick={() => setCompletoPendente(null)}
                disabled={isRestoring}
                className="flex-1 p-3 bg-white border border-[#E6E1DB] rounded-lg font-bold text-xs text-neutral-700 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRestauracaoCompleta}
                disabled={isRestoring || isExporting}
                className="flex-1 p-3 bg-rose-600 hover:bg-rose-700 rounded-lg font-bold text-xs text-white disabled:opacity-60 disabled:cursor-wait"
              >
                {isRestoring ? 'Restaurando...' : 'Substituir pelo arquivo'}
              </button>
            </div>
          </div>
        )}

        {/* Actions List */}
        <div className={restauracaoPendente || completoPendente ? 'hidden' : 'space-y-2 pt-1'}>
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
                    ? 'Juntando seus dados — pode levar alguns segundos'
                    : 'Salva um arquivo .json com fichas, produtos, clientes, Minha Empresa e lançamentos (as fotos não entram)'}
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
              <Upload className="w-5 h-5 text-[#6E3F72]" />
              <div>
                <span className="block font-bold text-xs text-neutral-800">
                  Restaurar Backup de Arquivo
                </span>
                <span className="text-[11px] text-neutral-500">
                  Trocar seus dados pelos de um arquivo de backup
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
            onClick={() => setConfirmarZerar(true)}
            className="w-full p-3 bg-[#FDF4F5] hover:bg-[#FBE9EC] border border-[#F0D9DD] rounded-lg flex items-center justify-between text-left transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-[#C4626F]" />
              <div>
                <span className="block font-bold text-xs text-[#B04E5C]">
                  Zerar Todos os Dados (Começar do Zero)
                </span>
                <span className="text-[11px] text-[#C4626F] font-normal">
                  Limpa todas as vendas, compras e lançamentos
                </span>
              </div>
            </div>
          </button>
        </div>

      </div>

      {/* Confirmacao do "Zerar todos os dados", no layout das perguntas do app
          (mesmo molde de "O total vai mudar"). O foco comeca no Cancelar e
          clicar fora tambem cancela: e a acao mais perigosa do app, apaga tudo
          e nao tem volta. */}
      {confirmarZerar && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100000] animate-fadeIn"
          onClick={() => { if (!zerando) setConfirmarZerar(false); }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="zerar-titulo"
        >
          <div
            className="bg-white rounded-[24px] p-6 space-y-4 w-[90%] max-w-sm"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            <h3 id="zerar-titulo" className="font-serif-display text-lg" style={{ color: '#241B2B' }}>
              Apagar todos os lançamentos?
            </h3>
            <p style={{ color: '#7A6E80', fontSize: '14px', lineHeight: 1.5 }}>
              Isso apaga <strong style={{ color: '#B04E5C' }}>todos os lançamentos</strong> e começa do zero.
              A ação é irreversível e vale para todos os seus aparelhos.
            </p>
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                autoFocus
                disabled={zerando}
                onClick={() => setConfirmarZerar(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: '#F6F2F5', color: '#241B2B', minHeight: '44px' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={zerando}
                onClick={async () => {
                  setZerando(true);
                  try {
                    await onClearAll();
                    setConfirmarZerar(false);
                    onClose();
                  } finally {
                    setZerando(false);
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                style={{ background: '#C4626F', minHeight: '44px' }}
              >
                {zerando ? 'Apagando...' : 'Apagar tudo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
