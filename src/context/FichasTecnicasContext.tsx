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
    horasTrabalho?: number;
    valorHora?: number;
    ingredients?: IngredientUsage[];
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
  restoreFicha: (ficha: FichaTecnica) => Promise<void>;
}

const FichasTecnicasContext = createContext<FichasTecnicasContextType | undefined>(undefined);

const mapSupabaseToFicha = (data: SupabaseFichaTecnica): FichaTecnica => {
  // Normalize category: bolo -> bolos, doce -> doces
  let normalizedCategory = data.categoria;
  if (normalizedCategory === 'bolo') normalizedCategory = 'bolos';
  if (normalizedCategory === 'doce') normalizedCategory = 'doces';

  // Ficha sem tamanho nenhum abre com UM, nao com tres.
  //
  // Os tres vazios vinham de quando o formulario tambem nascia com tres. Cada
  // confeiteira tem uma realidade — umas vendem um tamanho so — e dois campos
  // extras em branco sugeriam que era preciso preencher os tres. Quem precisa
  // de mais usa o "+ Adicionar" no formulario, um de cada vez.
  let tamanhos = data.tamanhos || [];
  if (tamanhos.length === 0) {
    tamanhos = [
      { id: 'ts-1', descricao: '1', preco: 0, maoDeObraCost: 0, custoCost: 0, investimentoCost: 0 },
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
    // Horas e tarifa: sao o que a confeiteira PREENCHE, e `maoDeObraCost` e o
    // resultado. Sem grava-las, reabrir a ficha mostrava o valor calculado mas
    // os campos de origem em branco — a conta perdia a memoria de si mesma.
    horasTrabalho: t.horasTrabalho ?? null,
    valorHora: t.valorHora ?? null,
    // Insumos DESTE tamanho. Sem grava-los aqui, a lista por tamanho existiria
    // so na tela e a baixa de estoque continuaria usando a da ficha — o mesmo
    // descarte silencioso que acabou de acontecer com horas e tarifa.
    ingredients: t.ingredients ?? [],
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

      // Sem fallback para localStorage, de proposito.
      //
      // Havia aqui uma queda para `carula_fichas_tecnicas` quando o Supabase
      // vinha vazio ou dava erro. O efeito era pior do que o problema: fichas
      // de uma fase antiga voltavam a aparecer na tela com ids que NAO existem
      // no banco, entao editar ou apagar qualquer uma delas falhava no
      // `parseInt(id)`. E uma lista vazia por falha de rede virava "voce nao
      // tem fichas", que e uma afirmacao falsa.
      //
      // Vazio agora significa vazio; erro agora aparece como erro.
      setFichas((data || []).map(mapSupabaseToFicha));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar fichas técnicas');
      console.error('Error fetching fichas:', err);
      setFichas([]);
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

  const restoreFicha = async (ficha: FichaTecnica) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const { data, error: insertError } = await supabase
        .from('fichas_tecnicas')
        .insert([
          {
            id: parseInt(ficha.id),
            usuaria_id: user.id,
            nome_produto: ficha.name,
            categoria: ficha.category,
            foto_url: ficha.imageUrl || null,
            tamanhos: ficha.tamanhos,
            insumos: ficha.ingredients,
            mao_de_obra: ficha.maoDeObraCost,
            custo: ficha.custoCost,
            reposicao: ficha.reposicaoCost,
            investimento: ficha.investimentoCost,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      const restored = mapSupabaseToFicha(data);
      setFichas((prev) => [restored, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Erro ao restaurar ficha técnica');
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
      value={{ fichas, isLoading, error, fetchFichas, fetchFichaPhoto, addFicha, updateFicha, deleteFicha, restoreFicha }}
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
