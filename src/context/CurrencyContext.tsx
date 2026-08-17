import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { formatCurrency as baseFormat } from '../utils/formatters';

type Currency = 'BRL' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  symbol: string;
  formatCurrency: (value: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>('BRL');

  useEffect(() => {
    const stored = localStorage.getItem('carula_currency');
    if (stored === 'USD' || stored === 'BRL') {
      setCurrencyState(stored);
    }
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('carula_currency', newCurrency);
  };

  const symbol = currency === 'BRL' ? 'R$' : '$';

  const formatCurrency = useCallback((value: number) => {
    return baseFormat(value, currency);
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};
