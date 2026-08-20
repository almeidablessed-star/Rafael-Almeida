import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { FichaTecnica, TamanhoOpcao, IngredientUsage } from '../types';

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

export const useFichasTecnicas = () => {
  const { user } = useAuth();
  const [fichas, setFichas] = useState<FichaTecnica[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchFichas();
  }, [user]);

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
    mao_de_obra: ficha.maoDeObraCost,
    custo: ficha.custoCost,
    reposicao: ficha.investimentoCost,
    investimento: ficha.investimentoCost,
  });

  const fetchFichas = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('fichas_tecnicas')
        .select('*')
        .eq('usuaria_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      console.log('✓ TOTAL DE FICHAS RETORNADAS DO SUPABASE:', data?.length || 0, 'fichas:', data);

      const mapped = data?.map(mapSupabaseToFicha) || [];
      setFichas(mapped);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar fichas técnicas');
      console.error('Error fetching fichas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addFicha = async (fichaData: Omit<FichaTecnica, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const supabaseData = mapFichaToSupabase(fichaData);

      const { data, error: insertError } = await supabase
        .from('fichas_tecnicas')
        .insert([
          {
            usuaria_id: user.id,
            ...supabaseData,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      const newFicha = mapSupabaseToFicha(data);
      setFichas([newFicha, ...fichas]);
      return newFicha;
    } catch (err: any) {
      const message = err.message || 'Erro ao adicionar ficha técnica';
      setError(message);
      throw err;
    }
  };

  const updateFicha = async (id: string, fichaData: Omit<FichaTecnica, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const supabaseData = mapFichaToSupabase(fichaData);

      const { data, error: updateError } = await supabase
        .from('fichas_tecnicas')
        .update(supabaseData)
        .eq('id', parseInt(id))
        .eq('usuaria_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updatedFicha = mapSupabaseToFicha(data);
      setFichas(fichas.map(f => f.id === id ? updatedFicha : f));
      return updatedFicha;
    } catch (err: any) {
      const message = err.message || 'Erro ao atualizar ficha técnica';
      setError(message);
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

      setFichas(fichas.filter(f => f.id !== id));
    } catch (err: any) {
      const message = err.message || 'Erro ao deletar ficha técnica';
      setError(message);
      throw err;
    }
  };

  return {
    fichas,
    isLoading,
    error,
    fetchFichas,
    addFicha,
    updateFicha,
    deleteFicha,
  };
};
