import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { FichaTecnica, IngredientUsage } from '../types';

/**
 * Fonte unica das fichas tecnicas, compartilhada por todas as telas.
 *
 * Antes isto era o hook `hooks/useFichasTecnicas.ts`, com estado LOCAL — a
 * mesma estrutura que o `useCustomers` tinha, e o mesmo defeito latente: cada
 * componente que chamava o hook criava uma copia independente, e o useEffect de
 * busca dependia so de [user], que e definido no login e nunca muda. Cada tela
 * buscava do banco uma unica vez, no carregamento da pagina.
 *
 * Aqui os dois lados do problema ja existiam: o `FichasTecnicasModule` grava e
 * o `TransactionFormModal` le. Cadastrar uma ficha nova na aba Fichas nao a
 * fazia aparecer no formulario de pedido ate um F5 — e como o formulario casa
 * produto com ficha por nome para dar baixa no estoque, uma ficha invisivel
 * significa pedido lancado sem baixa nenhuma, silenciosamente.
 *
 * Com um provider unico, quem cadastra e quem consulta compartilham o mesmo
 * array. Ver [[CustomersContext]], que resolve o mesmo problema para clientes.
 */

/** Formato da tabela `fichas_tecnicas` no Supabase. */
interface SupabaseFichaTecnica {
  id: number;
  usuaria_id: string;
  nome_produto: string;
  categoria: string;
  foto_url?: string;
  tamanhos: Array<{
    id: string;
    descricao: string;
    preco: number;
    quantidade?: number;
    maoDeObraCost?: number;
    custoCost?: number;
    investimentoCost?: number;
  }>;
  insumos: IngredientUsage[];
  mao_de_obra: number;
  custo: number;
  reposicao: number;
  investimento: number;
  created_at: string;
}

interface FichasTecnicasContextType {
  fichas: FichaTecnica[];
  isLoading: boolean;
  error: string | null;
  fetchFichas: () => Promise<void>;
  fetchFichaPhoto: (fichaId: string) => Promise<string | null>;
  addFicha: (data: Omit<FichaTecnica, 'id' | 'createdAt'>) => Promise<FichaTecnica>;
  updateFicha: (id: string, data: Omit<FichaTecnica, 'id' | 'createdAt'>) => Promise<FichaTecnica>;
  deleteFicha: (id: string) => Promise<void>;
}

const FichasTecnicasContext = createContext<FichasTecnicasContextType | undefined>(undefined);

const mapSupabaseToFicha = (data: SupabaseFichaTecnica): FichaTecnica => {
  // Normalize category: bolo -> bolos, doce -> doces
  let normalizedCategory = data.categoria;
  if (normalizedCategory === 'bolo') normalizedCategory = 'bolos';
  if (normalizedCategory === 'doce') normalizedCategory = 'doces';

  // Garantir que toda ficha tenha os 5 tamanhos padrão (fallback para fichas antigas)
  let tamanhos = data.tamanhos || [];
  if (tamanhos.length === 0) {
    tamanhos = [
      { id: 'ts-10', descricao: '10 fatias', preco: 0, maoDeObraCost: 0, custoCost: 0, investimentoCost: 0 },
      { id: 'ts-15', descricao: '15 fatias', preco: 0, maoDeObraCost: 0, custoCost: 0, investimentoCost: 0 },
      { id: 'ts-20', descricao: '20 fatias', preco: 0, maoDeObraCost: 0, custoCost: 0, investimentoCost: 0 },
      { id: 'ts-25', descricao: '25 fatias', preco: 0, maoDeObraCost: 0, custoCost: 0, investimentoCost: 0 },
      { id: 'ts-30', descricao: '30 fatias', preco: 0, maoDeObraCost: 0, custoCost: 0, investimentoCost: 0 },
    ];
  }

  return {
    id: String(data.id),
    name: data.nome_produto,
    category: normalizedCategory as any,
    imageUrl: data.foto_url,
    tamanhos: tamanhos,
    ingredients: data.insumos || [],
    reposicaoCost: data.reposicao,
    maoDeObraCost: data.mao_de_obra,
    custoCost: data.custo,
    investimentoCost: data.investimento,
    createdAt: new Date(data.created_at).getTime(),
  };
};

const mapFichaToSupabase = (ficha: Omit<FichaTecnica, 'id' | 'createdAt'>) => ({
  nome_produto: ficha.name,
  categoria: ficha.category,
  foto_url: ficha.imageUrl || null,
  tamanhos: (ficha.tamanhos || []).map(t => ({
    id: t.id,
    descricao: t.descricao,
    preco: t.preco,
    quantidade: t.quantidade,
    maoDeObraCost: t.maoDeObraCost ?? 0,
    custoCost: t.custoCost ?? 0,
    investimentoCost: t.investimentoCost ?? 0,
  })),
  insumos: ficha.ingredients || [],
  reposicao: ficha.reposicaoCost,
  mao_de_obra: ficha.maoDeObraCost,
  custo: ficha.custoCost,
  investimento: ficha.investimentoCost,
});

export const FichasTecnicasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [fichas, setFichas] = useState<FichaTecnica[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      // Logout limpa a lista: sem isto, as fichas da conta anterior
      // continuariam em memoria para quem entrasse depois.
      setFichas([]);
      return;
    }
    fetchFichas();
  }, [user]);

  const fetchFichas = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('fichas_tecnicas')
        .select('id,usuaria_id,nome_produto,categoria,tamanhos,insumos,mao_de_obra,custo,reposicao,investimento,created_at')
        .eq('usuaria_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Fallback para localStorage se Supabase estiver vazio
      if (data && data.length > 0) {
        setFichas(data.map(mapSupabaseToFicha));
      } else {
        // Tentar localStorage como fallback
        const storedData = localStorage.getItem('carula_fichas_tecnicas');
        if (storedData) {
          try {
            const fichasFromStorage = JSON.parse(storedData) as FichaTecnica[];
            setFichas(fichasFromStorage);
          } catch (e) {
            setFichas([]);
          }
        } else {
          setFichas([]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar fichas técnicas');
      console.error('Error fetching fichas:', err);
      // Em caso de erro, tentar localStorage como último recurso
      const storedData = localStorage.getItem('carula_fichas_tecnicas');
      if (storedData) {
        try {
          const fichasFromStorage = JSON.parse(storedData) as FichaTecnica[];
          setFichas(fichasFromStorage);
        } catch (e) {
          setFichas([]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addFicha = async (fichaData: Omit<FichaTecnica, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const { data, error: insertError } = await supabase
        .from('fichas_tecnicas')
        .insert([{ usuaria_id: user.id, ...mapFichaToSupabase(fichaData) }])
        .select()
        .single();

      if (insertError) throw insertError;

      const newFicha = mapSupabaseToFicha(data);
      // Atualizacao funcional: duas telas podem gravar em sequencia, e a forma
      // `[nova, ...fichas]` usaria uma copia possivelmente velha.
      setFichas((prev) => [newFicha, ...prev]);
      return newFicha;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar ficha técnica');
      throw err;
    }
  };

  const updateFicha = async (id: string, fichaData: Omit<FichaTecnica, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const { data, error: updateError } = await supabase
        .from('fichas_tecnicas')
        .update(mapFichaToSupabase(fichaData))
        .eq('id', parseInt(id))
        .eq('usuaria_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updated = mapSupabaseToFicha(data);
      setFichas((prev) => prev.map((f) => (f.id === id ? updated : f)));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar ficha técnica');
      throw err;
    }
  };

  const deleteFicha = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('fichas_tecnicas')
        .delete()
        .eq('id', parseInt(id))
        .eq('usuaria_id', user.id);

      if (deleteError) throw deleteError;

      setFichas((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar ficha técnica');
      throw err;
    }
  };

  const fetchFichaPhoto = async (fichaId: string): Promise<string | null> => {
    const existing = fichas.find(f => f.id === fichaId);
    if (existing?.imageUrl) return existing.imageUrl;

    try {
      const { data, error } = await supabase
        .from('fichas_tecnicas')
        .select('foto_url')
        .eq('id', parseInt(fichaId))
        .eq('usuaria_id', user?.id)
        .single();

      if (error) throw error;
      return data?.foto_url || null;
    } catch (err: any) {
      console.error('Error fetching ficha photo:', err);
      return null;
    }
  };

  return (
    <FichasTecnicasContext.Provider
      value={{ fichas, isLoading, error, fetchFichas, fetchFichaPhoto, addFicha, updateFicha, deleteFicha }}
    >
      {children}
    </FichasTecnicasContext.Provider>
  );
};

export const useFichasTecnicas = () => {
  const context = useContext(FichasTecnicasContext);
  if (!context) {
    throw new Error('useFichasTecnicas precisa estar dentro de <FichasTecnicasProvider>');
  }
  return context;
};
