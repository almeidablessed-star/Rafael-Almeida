import { useState, useRef, useCallback, useEffect } from 'react';

interface UseDelayedDeleteOptions<T> {
  /** Chamado 10s (ou `delayMs`) depois de `requestDelete`, se ninguem cancelar antes. */
  deleteFn: (item: T) => Promise<void>;
  delayMs?: number;
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
export function useDelayedDelete<T extends { id: string | number }>({
  deleteFn,
  delayMs = 10000,
}: UseDelayedDeleteOptions<T>) {
  const [pendingItems, setPendingItems] = useState<T[]>([]);
  const pendingRef = useRef<Map<string | number, { item: T; timeoutId: ReturnType<typeof setTimeout> }>>(new Map());

  const removeFromState = (id: string | number) => {
    setPendingItems((prev) => prev.filter((item) => item.id !== id));
  };

  const finalize = useCallback(
    async (id: string | number) => {
      const current = pendingRef.current.get(id);
      if (!current) return;
      pendingRef.current.delete(id);
      try {
        await deleteFn(current.item);
      } finally {
        removeFromState(id);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteFn]
  );

  const requestDelete = useCallback(
    (item: T) => {
      const timeoutId = setTimeout(() => {
        finalize(item.id);
      }, delayMs);
      pendingRef.current.set(item.id, { item, timeoutId });
      setPendingItems((prev) => [...prev, item]);
    },
    [delayMs, finalize]
  );

  const cancelDelete = useCallback((id: string | number) => {
    const current = pendingRef.current.get(id);
    if (!current) return;
    clearTimeout(current.timeoutId);
    pendingRef.current.delete(id);
    removeFromState(id);
  }, []);

  // Se a tela for desmontada (troca de aba) com exclusoes pendentes, finaliza
  // o delete real de cada uma na hora em vez de deixar os timers morrerem
  // junto — senao os itens ficariam fora da lista pra sempre sem nunca terem
  // sido excluidos de verdade do banco.
  useEffect(() => {
    return () => {
      pendingRef.current.forEach((current) => {
        clearTimeout(current.timeoutId);
        deleteFn(current.item).catch((err) => {
          console.error('Erro ao finalizar exclusão pendente ao desmontar:', err);
        });
      });
      pendingRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { pendingItems, requestDelete, cancelDelete };
}
