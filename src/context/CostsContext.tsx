import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { AdministrativeCosts } from '../types';

interface CostsContextType {
  administrativeCosts: AdministrativeCosts | null;
  isLoading: boolean;
  error: string | null;
  saveCosts: (costs: AdministrativeCosts) => Promise<void>;
  fetchCosts: () => Promise<void>;
}

const CostsContext = createContext<CostsContextType | undefined>(undefined);

export const CostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [administrativeCosts, setAdministrativeCosts] = useState<AdministrativeCosts | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCosts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('administrative_costs')
        .select('*')
        .eq('usuaria_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        setAdministrativeCosts({
          id: data.id,
          agua: data.agua || 0,
          aluguel: data.aluguel || 0,
          energia: data.energia || 0,
          gas: data.gas || 0,
          gasolina: data.gasolina || 0,
          internet: data.internet || 0,
          limpeza: data.limpeza || 0,
          horaTrabalho: data.hora_trabalho || 0,
          total: data.total || 0,
        });
      } else {
        setAdministrativeCosts({
          agua: 0,
          aluguel: 0,
          energia: 0,
          gas: 0,
          gasolina: 0,
          internet: 0,
          limpeza: 0,
          horaTrabalho: 0,
          total: 0,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar custos');
      console.error('Error fetching costs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCosts = async (costs: AdministrativeCosts) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      const { error: saveError } = await supabase
        .from('administrative_costs')
        .upsert({
          usuaria_id: user.id,
          agua: costs.agua,
          aluguel: costs.aluguel,
          energia: costs.energia,
          gas: costs.gas,
          gasolina: costs.gasolina,
          internet: costs.internet,
          limpeza: costs.limpeza,
          hora_trabalho: costs.horaTrabalho,
        });

      if (saveError) throw saveError;

      const newTotal = costs.agua + costs.aluguel + costs.energia + costs.gas + costs.gasolina + costs.internet + costs.limpeza + costs.horaTrabalho;
      setAdministrativeCosts({ ...costs, total: newTotal });
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar custos');
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchCosts();
    } else {
      setAdministrativeCosts(null);
    }
  }, [user]);

  return (
    <CostsContext.Provider value={{
      administrativeCosts,
      isLoading,
      error,
      saveCosts,
      fetchCosts,
    }}>
      {children}
    </CostsContext.Provider>
  );
};

export const useCosts = () => {
  const context = useContext(CostsContext);
  if (!context) {
    throw new Error('useCosts deve ser usado dentro de CostsProvider');
  }
  return context;
};
