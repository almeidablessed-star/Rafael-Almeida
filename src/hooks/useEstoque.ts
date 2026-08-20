import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { StockItem } from '../types';

interface SupabaseEstoque {
  id: number;
  usuaria_id: string;
  item: string;
  quantidade_atual: number;
  unidade_medida: string;
  nivel_minimo: number;
  created_at: string;
}

export const useEstoque = () => {
  const { user } = useAuth();
  const [estoque, setEstoque] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchEstoque();
  }, [user]);

  const mapSupabaseToStockItem = (data: SupabaseEstoque): StockItem => ({
    id: String(data.id),
    name: data.item,
    quantity: data.quantidade_atual,
    unit: data.unidade_medida as any,
    minThreshold: data.nivel_minimo,
    costPerUnit: 0, // Supabase não tem esse campo, usar 0 por padrão
  });

  const mapStockItemToSupabase = (item: Omit<StockItem, 'id'>) => ({
    item: item.name,
    quantidade_atual: item.quantity,
    unidade_medida: item.unit,
    nivel_minimo: item.minThreshold,
  });

  const fetchEstoque = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('estoque')
        .select('*')
        .eq('usuaria_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped = data?.map(mapSupabaseToStockItem) || [];
      setEstoque(mapped);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar estoque');
      console.error('Error fetching estoque:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addEstoque = async (itemData: Omit<StockItem, 'id'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const supabaseData = mapStockItemToSupabase(itemData);

      const { data, error: insertError } = await supabase
        .from('estoque')
        .insert([
          {
            usuaria_id: user.id,
            ...supabaseData,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      const newItem = mapSupabaseToStockItem(data);
      setEstoque([newItem, ...estoque]);
      return newItem;
    } catch (err: any) {
      const message = err.message || 'Erro ao adicionar item de estoque';
      setError(message);
      throw err;
    }
  };

  const updateEstoque = async (id: string, itemData: Omit<StockItem, 'id'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const supabaseData = mapStockItemToSupabase(itemData);

      const { data, error: updateError } = await supabase
        .from('estoque')
        .update(supabaseData)
        .eq('id', parseInt(id))
        .eq('usuaria_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updatedItem = mapSupabaseToStockItem(data);
      setEstoque(estoque.map(i => i.id === id ? updatedItem : i));
      return updatedItem;
    } catch (err: any) {
      const message = err.message || 'Erro ao atualizar item de estoque';
      setError(message);
      throw err;
    }
  };

  const deleteEstoque = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('estoque')
        .delete()
        .eq('id', parseInt(id))
        .eq('usuaria_id', user.id);

      if (deleteError) throw deleteError;

      setEstoque(estoque.filter(i => i.id !== id));
    } catch (err: any) {
      const message = err.message || 'Erro ao deletar item de estoque';
      setError(message);
      throw err;
    }
  };

  return {
    estoque,
    isLoading,
    error,
    fetchEstoque,
    addEstoque,
    updateEstoque,
    deleteEstoque,
  };
};
