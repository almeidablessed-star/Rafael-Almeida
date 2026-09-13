import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { formatCurrency as baseFormat } from '../utils/formatters';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

export type Currency = 'BRL' | 'USD' | 'EUR';

const SIMBOLO_POR_MOEDA: Record<Currency, string> = {
  BRL: 'R$',
  USD: '$',
  EUR: '€',
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  symbol: string;
  formatCurrency: (value: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

/**
 * Fonte de verdade da moeda e `usuarias.moeda`, no banco. O `localStorage` e
 * so um cache de leitura instantanea — evita a tela nascer em BRL por uma
 * fracao de segundo enquanto o perfil ainda carrega — mas nunca decide nada
 * sozinho: assim que `userProfile.moeda` chega (login, reload, troca de
 * conta), ele substitui o que estava em `localStorage`, mesmo que sejam
 * diferentes. Ver docs/pendencia-moeda-nao-persiste-perfil.md (resolvida).
 */
export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [currency, setCurrencyState] = useState<Currency>('BRL');

  // Guarda a ultima moeda que ESTE contexto ja aplicou (por acao da usuaria ou
  // por ter vindo do banco), pra distinguir "o banco confirmou o que eu acabei
  // de mandar" (ignorar, ja aplicado) de "o banco trouxe um valor novo, de
  // outra origem" (aplicar). Sem isso, o efeito que sincroniza com
  // `userProfile.moeda` reentraria em loop com o proprio `setCurrency`.
  const ultimaMoedaAplicadaRef = useRef<Currency | null>(null);

  // Fallback instantaneo, so na montagem — antes do perfil carregar do banco.
  useEffect(() => {
    const stored = localStorage.getItem('carula_currency');
    if (stored === 'USD' || stored === 'BRL' || stored === 'EUR') {
      setCurrencyState(stored);
    }
  }, []);

  // Banco venceu: assim que `userProfile.moeda` chega (ou muda), ele
  // substitui o valor atual, inclusive o que veio do localStorage.
  useEffect(() => {
    const moedaDoBanco = userProfile?.moeda;
    if (!moedaDoBanco) return;
    if (ultimaMoedaAplicadaRef.current === moedaDoBanco) return;

    ultimaMoedaAplicadaRef.current = moedaDoBanco;
    setCurrencyState(moedaDoBanco);
    localStorage.setItem('carula_currency', moedaDoBanco);
  }, [userProfile?.moeda]);

  const setCurrency = (newCurrency: Currency) => {
    ultimaMoedaAplicadaRef.current = newCurrency;
    setCurrencyState(newCurrency);
    localStorage.setItem('carula_currency', newCurrency);

    if (!user) return;

    (async () => {
      const { error } = await supabase.from('usuarias').update({ moeda: newCurrency }).eq('id', user.id);
      if (error) {
        console.error('Erro ao salvar moeda no perfil:', error);
        return;
      }
      await refreshUserProfile();
    })();
  };

  const symbol = SIMBOLO_POR_MOEDA[currency];

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
