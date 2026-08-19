import { useState, useCallback } from 'react';
import { Transaction } from '../types';

export const useUndo = () => {
  const [undoData, setUndoData] = useState<Transaction | null>(null);

  const saveForUndo = useCallback((transaction: Transaction) => {
    setUndoData(transaction);
    // Auto-clear after 10 seconds (user won't undo after this)
    setTimeout(() => setUndoData(null), 10000);
  }, []);

  const getUndoData = useCallback(() => {
    const data = undoData;
    setUndoData(null); // Clear after retrieval
    return data;
  }, [undoData]);

  return { saveForUndo, getUndoData, hasUndo: undoData !== null };
};
