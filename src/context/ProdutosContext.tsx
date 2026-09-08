import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Produto } from '../types';

/**
 * Fonte unica do catalogo de Produtos, compartilhada por todas as telas.
 *
 * Mesmo padrao de [[EstoqueContext]]/[[FichasTecnicasContext]]: um provider
 * so, para que gravar numa tela (ex: Compras atualizando quantidade) reflita
 * imediatamente em qualquer outra que leia a mesma lista (ex: a vista de
 * Estoque dentro de Produtos, ou o autocomplete de insumo em Fichas).
 */

interface SupabaseProduto {
  id: number;
  usuaria_id: string;
  nome: string;
  categoria: string | null;
  preco_pago: number;
  quantidade_embalagem: number;
  unidade_embalagem: string;
  controla_estoque: boolean;
  quantidade_atual: number | null;
  quantidade_referencia: number | null;
  nivel_minimo: number | null;
  nivel_minimo_unidade: string | null;
  created_at: string;
}

interface ProdutosContextType {
  produtos: Produto[];
  isLoading: boolean;
  error: string | null;
  fetchProdutos: () => Promise<void>;
  addProduto: (data: Omit<Produto, 'id'>) => Promise<Produto>;
  updateProduto: (id: number, data: Omit<Produto, 'id'>) => Promise<Produto>;
  deleteProduto: (id: number) => Promise<void>;
  /** Custo por unidade base: precoPago / quantidadeEmbalagem. Nunca armazenado — sempre calculado aqui. */
  custoPorUnidade: (produto: Pick<Produto, 'precoPago' | 'quantidadeEmbalagem'>) => number;
}

const ProdutosContext = createContext<ProdutosContextType | undefined>(undefined);

const mapSupabaseToProduto = (data: SupabaseProduto): Produto => ({
  id: data.id,
  nome: data.nome,
  categoria: data.categoria,
  precoPago: Number(data.preco_pago) || 0,
  quantidadeEmbalagem: Number(data.quantidade_embalagem) || 1,
  unidadeEmbalagem: (data.unidade_embalagem || 'un') as Produto['unidadeEmbalagem'],
  controlaEstoque: data.controla_estoque,
  quantidadeAtual: data.quantidade_atual,
  quantidadeReferencia: data.quantidade_referencia,
  nivelMinimo: data.nivel_minimo,
  nivelMinimoUnidade: (data.nivel_minimo_unidade as Produto['nivelMinimoUnidade']) || null,
});

const mapProdutoToSupabase = (p: Omit<Produto, 'id'>) => ({
  nome: p.nome,
  categoria: p.categoria,
  preco_pago: p.precoPago,
  quantidade_embalagem: p.quantidadeEmbalagem,
  unidade_embalagem: p.unidadeEmbalagem,
  controla_estoque: p.controlaEstoque,
  quantidade_atual: p.controlaEstoque ? p.quantidadeAtual : null,
  nivel_minimo: p.controlaEstoque ? p.nivelMinimo : null,
  nivel_minimo_unidade: p.controlaEstoque ? p.nivelMinimoUnidade : null,
});

export const ProdutosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProdutos([]);
      return;
    }
    fetchProdutos();
  }, [user]);

  const fetchProdutos = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('produtos')
        .select('*')
        .eq('usuaria_id', user.id)
        .order('nome', { ascending: true });

      if (fetchError) throw fetchError;
      setProdutos((data || []).map(mapSupabaseToProduto));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar produtos');
      console.error('Error fetching produtos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addProduto = async (produtoData: Omit<Produto, 'id'>) => {
    if (!user) throw new Error('User not authenticated');
    try {
      setError(null);
      const payload = mapProdutoToSupabase(produtoData);
      const { data, error: insertError } = await supabase
        .from('produtos')
        .insert([{
          usuaria_id: user.id,
          ...payload,
          // Cadastro novo: a quantidade inicial e o primeiro "cheio", igual EstoqueContext.
          quantidade_referencia: produtoData.controlaEstoque ? produtoData.quantidadeAtual : null,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      const novo = mapSupabaseToProduto(data);
      setProdutos((prev) => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)));
      return novo;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar produto');
      throw err;
    }
  };

  const updateProduto = async (id: number, produtoData: Omit<Produto, 'id'>) => {
    if (!user) throw new Error('User not authenticated');
    try {
      setError(null);

      // Mesma regra do EstoqueContext: so aumento de quantidade reseta o
      // baseline "cheio" do arco de percentual.
      const atual = produtos.find((p) => p.id === id);
      const novaReferencia =
        atual && produtoData.controlaEstoque && (produtoData.quantidadeAtual ?? 0) > (atual.quantidadeAtual ?? 0)
          ? produtoData.quantidadeAtual
          : atual?.quantidadeReferencia;

      const { data, error: updateError } = await supabase
        .from('produtos')
        .update({
          ...mapProdutoToSupabase(produtoData),
          ...(produtoData.controlaEstoque ? { quantidade_referencia: novaReferencia } : {}),
        })
        .eq('id', id)
        .eq('usuaria_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const atualizado = mapSupabaseToProduto(data);
      setProdutos((prev) => prev.map((p) => (p.id === id ? atualizado : p)));
      return atualizado;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar produto');
      throw err;
    }
  };

  const deleteProduto = async (id: number) => {
    if (!user) throw new Error('User not authenticated');
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id)
        .eq('usuaria_id', user.id);

      if (deleteError) throw deleteError;
      setProdutos((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar produto');
      throw err;
    }
  };

  const custoPorUnidade = (produto: Pick<Produto, 'precoPago' | 'quantidadeEmbalagem'>): number =>
    produto.quantidadeEmbalagem > 0 ? produto.precoPago / produto.quantidadeEmbalagem : 0;

  return (
    <ProdutosContext.Provider
      value={{ produtos, isLoading, error, fetchProdutos, addProduto, updateProduto, deleteProduto, custoPorUnidade }}
    >
      {children}
    </ProdutosContext.Provider>
  );
};

export const useProdutos = () => {
  const context = useContext(ProdutosContext);
  if (!context) {
    throw new Error('useProdutos precisa estar dentro de <ProdutosProvider>');
  }
  return context;
};
