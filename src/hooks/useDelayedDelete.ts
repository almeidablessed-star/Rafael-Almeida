import { useState, useRef, useCallback, useEffect } from 'react';

interface UseDelayedDeleteOptions<T> {
  /** Chamado 10s (ou `delayMs`) depois de `requestDelete`, se ninguem cancelar antes. */
  deleteFn: (item: T) => Promise<void>;
  delayMs?: number;
  /**
   * Guarda os pendentes neste aparelho. Quem fecha ou recarrega o app nos 10s
   * nao passa pela desmontagem abaixo: sem isto o item voltava como se a exclusao
   * nunca tivesse existido. Ao abrir de novo, a contagem e o Desfazer recomecam.
   */
  chaveLocal?: string;
}

/**
 * Generaliza o padrao de exclusao com "Desfazer" real, criado originalmente
 * em FichasTecnicasModule.tsx: a exclusao aparece pra usuaria na hora (via
 * `pendingItems`, pra ela tirar o item da lista visivel), mas o DELETE de
 * verdade so vai pro banco depois de `delayMs`. `cancelDelete(id)` cancela o
 * timeout sem nunca ter tocado o banco — ao contrario de um "desfazer" que
 * recria o registro (com id novo), aqui o registro nunca deixou de existir
 * enquanto pendente, entao vinculos por id (ex: ficha tecnica -> produtoId)
 * nunca quebram se a usuaria desfizer a tempo.
 *
 * Guarda os pendentes num Map por id, nao um unico item — excluir B antes do
 * timer de A completar nao pode apagar o rastro de A. A versao anterior
 * guardava so "o" pendente (`T | null`): a segunda chamada de
 * `requestDelete` sobrescrevia o ponteiro do timer de A sem cancela-lo, e
 * quando o timer de A disparava ele lia o ponteiro ja trocado pra B —
 * deletando B cedo demais e nunca de fato deletando A (que so tinha sumido
 * da tela, nao do banco). Cada item agora tem seu proprio timer e sua propria
 * entrada, entao dois (ou mais) podem estar pendentes ao mesmo tempo sem um
 * atropelar o outro.
 */
// Chaves cuja tela esta aberta agora e cuida das proprias exclusoes.
const chavesEmUso = new Set<string>();

/**
 * Exclusao guardada por uma tela que nao foi aberta depois de recarregar: sem
 * isto ela so terminava quando a pessoa voltasse aquela aba. Espera o mesmo
 * tempo do Desfazer e, se a tela continuar fechada, exclui.
 */
export function finalizarExclusoesGuardadas<T>(chaveLocal: string, deleteFn: (item: T) => Promise<void>, delayMs = 10000) {
  const t = setTimeout(async () => {
    if (chavesEmUso.has(chaveLocal)) return;
    let itens: T[] = [];
    try {
      itens = JSON.parse(localStorage.getItem(chaveLocal) || '[]');
      localStorage.removeItem(chaveLocal);
    } catch {
      return;
    }
    for (const item of itens) {
      await deleteFn(item).catch((err) => console.error('Erro ao finalizar exclusão guardada:', err));
    }
  }, delayMs);
  return () => clearTimeout(t);
}

export function useDelayedDelete<T extends { id: string | number }>({
  deleteFn,
  delayMs = 10000,
  chaveLocal,
}: UseDelayedDeleteOptions<T>) {
  const [pendingItems, setPendingItems] = useState<T[]>([]);
  const pendingRef = useRef<Map<string | number, { item: T; timeoutId: ReturnType<typeof setTimeout> }>>(new Map());

  // Sempre a versao atual: o timer pode ter nascido antes de os dados carregarem.
  const deleteFnRef = useRef(deleteFn);
  deleteFnRef.current = deleteFn;

  const guardarPendentes = () => {
    if (!chaveLocal) return;
    try {
      const itens = [...pendingRef.current.values()].map((p) => p.item);
      if (itens.length > 0) localStorage.setItem(chaveLocal, JSON.stringify(itens));
      else localStorage.removeItem(chaveLocal);
    } catch {
      // Sem localStorage, a exclusao segue valendo enquanto o app estiver aberto.
    }
  };

  const removeFromState = (id: string | number) => {
    setPendingItems((prev) => prev.filter((item) => item.id !== id));
  };

  const finalize = useCallback(
    async (id: string | number) => {
      const current = pendingRef.current.get(id);
      if (!current) return;
      pendingRef.current.delete(id);
      guardarPendentes();
      try {
        await deleteFnRef.current(current.item);
      } finally {
        removeFromState(id);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chaveLocal]
  );

  const requestDelete = useCallback(
    (item: T) => {
      const timeoutId = setTimeout(() => {
        finalize(item.id);
      }, delayMs);
      pendingRef.current.set(item.id, { item, timeoutId });
      guardarPendentes();
      setPendingItems((prev) => [...prev, item]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delayMs, finalize]
  );

  const cancelDelete = useCallback((id: string | number) => {
    const current = pendingRef.current.get(id);
    if (!current) return;
    clearTimeout(current.timeoutId);
    pendingRef.current.delete(id);
    guardarPendentes();
    removeFromState(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveLocal]);

  // O timer zero cai fora na montagem dupla do StrictMode, que senao excluiria
  // tudo na hora pela desmontagem logo abaixo.
  useEffect(() => {
    if (!chaveLocal) return;
    chavesEmUso.add(chaveLocal);
    return () => {
      chavesEmUso.delete(chaveLocal);
    };
  }, [chaveLocal]);

  useEffect(() => {
    if (!chaveLocal) return;
    const t = setTimeout(() => {
      try {
        const itens: T[] = JSON.parse(localStorage.getItem(chaveLocal) || '[]');
        itens.filter((item) => !pendingRef.current.has(item.id)).forEach(requestDelete);
      } catch {
        // Conteudo ilegivel: nao ha o que retomar.
      }
    }, 0);
    return () => clearTimeout(t);
  }, [chaveLocal, requestDelete]);

  // Se a tela for desmontada (troca de aba) com exclusoes pendentes, finaliza
  // o delete real de cada uma na hora em vez de deixar os timers morrerem
  // junto — senao os itens ficariam fora da lista pra sempre sem nunca terem
  // sido excluidos de verdade do banco.
  useEffect(() => {
    return () => {
      // Sem pendentes aqui, nao apaga o que ainda vai ser retomado.
      if (pendingRef.current.size === 0) return;
      pendingRef.current.forEach((current) => {
        clearTimeout(current.timeoutId);
        deleteFnRef.current(current.item).catch((err) => {
          console.error('Erro ao finalizar exclusão pendente ao desmontar:', err);
        });
      });
      pendingRef.current.clear();
      guardarPendentes();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { pendingItems, requestDelete, cancelDelete };
}
