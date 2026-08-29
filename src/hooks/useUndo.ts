import { useState, useCallback } from 'react';
import { Transaction } from '../types';

export interface UndoData {
  type: 'transaction' | 'customer' | 'ficha';
  data: any;
}

export const useUndo = () => {
  const [undoStack, setUndoStack] = useState<UndoData | null>(null);

  const saveForUndo = useCallback((data: UndoData) => {
    setUndoStack(data);
    // Auto-clear after 10 seconds (user won't undo after this)
    setTimeout(() => setUndoStack(null), 10000);
  }, []);

  const getUndoData = useCallback(() => {
    const data = undoStack;
    setUndoStack(null); // Clear after retrieval
    return data;
  }, [undoStack]);

  return { saveForUndo, getUndoData, hasUndo: undoStack !== null };
};
