import { useState, useRef, useCallback, useEffect } from 'react';

interface UseDelayedDeleteOptions<T> {
  /** Chamado 10s (ou `delayMs`) depois de `requestDelete`, se ninguem cancelar antes. */
  deleteFn: (item: T) => Promise<void>;
  delayMs?: number;
}

/**
 * Generaliza o padrao de exclusao com "Desfazer" real, criado originalmente
 * em FichasTecnicasModule.tsx: a exclusao aparece pra usuaria na hora (via
 * `pending`, pra ela tirar o item da lista visivel), mas o DELETE de verdade
 * so vai pro banco depois de `delayMs`. `cancelDelete` cancela o timeout sem
 * nunca ter tocado o banco — ao contrario de um "desfazer" que recria o
 * registro (com id novo), aqui o registro nunca deixou de existir enquanto
 * pendente, entao vinculos por id (ex: ficha tecnica -> produtoId) nunca
 * quebram se a usuaria desfizer a tempo.
 */
export function useDelayedDelete<T extends { id: string | number }>({
  deleteFn,
  delayMs = 10000,
}: UseDelayedDeleteOptions<T>) {
  const [pending, setPending] = useState<T | null>(null);
  const pendingRef = useRef<{ item: T; timeoutId: ReturnType<typeof setTimeout> } | null>(null);

  const finalize = useCallback(async () => {
    const current = pendingRef.current;
    if (!current) return;
    pendingRef.current = null;
    try {
      await deleteFn(current.item);
    } finally {
      setPending(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteFn]);

  const requestDelete = useCallback(
    (item: T) => {
      const timeoutId = setTimeout(() => {
        finalize();
      }, delayMs);
      pendingRef.current = { item, timeoutId };
      setPending(item);
    },
    [delayMs, finalize]
  );

  const cancelDelete = useCallback(() => {
    const current = pendingRef.current;
    if (!current) return;
    clearTimeout(current.timeoutId);
    pendingRef.current = null;
    setPending(null);
  }, []);

  // Se a tela for desmontada (troca de aba) com uma exclusao pendente,
  // finaliza o delete real na hora em vez de deixar o timer morrer junto —
  // senao o item ficaria fora da lista pra sempre sem nunca ter sido
  // excluido de verdade do banco.
  useEffect(() => {
    return () => {
      const current = pendingRef.current;
      if (current) {
        clearTimeout(current.timeoutId);
        pendingRef.current = null;
        deleteFn(current.item).catch((err) => {
          console.error('Erro ao finalizar exclusão pendente ao desmontar:', err);
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { pending, requestDelete, cancelDelete };
}
