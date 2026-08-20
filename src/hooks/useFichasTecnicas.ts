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
  tamanhos: TamanhoOpcao[];
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

    return {
      id: String(data.id),
      name: data.nome_produto,
      category: normalizedCategory as any,
      imageUrl: data.foto_url,
      tamanhos: data.tamanhos || [],
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
    tamanhos: ficha.tamanhos || [],
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
