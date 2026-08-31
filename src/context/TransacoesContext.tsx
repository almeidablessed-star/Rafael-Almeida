import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Transaction, FichaOrderItem } from '../types';

/**
 * Fonte unica das transacoes: pedidos, compras, custos, mao de obra e
 * investimentos.
 *
 * Antes isto vivia no `localStorage`, na chave
 * `carulaconfeitaria_transacoes_v3`, manipulada por `utils/storage.ts` de forma
 * sincrona. Metade do app (Fichas, Estoque, Clientes) ja falava com o Supabase
 * enquanto a outra metade (Inicio, Pedidos, Compras, Custos, Semana, Historico)
 * lia de um armazenamento preso ao navegador.
 *
 * O que isso custava na pratica:
 *   - Trocar de celular ou limpar dados do site apagava o historico financeiro
 *     inteiro, sem aviso e sem recuperacao.
 *   - A mesma conta em dois aparelhos tinha DOIS conjuntos de pedidos que nunca
 *     se encontravam.
 *
 * Ver [[EstoqueContext]], [[FichasTecnicasContext]] e [[CustomersContext]], que
 * seguem o mesmo desenho.
 */

/** Formato da tabela `transacoes` no Supabase. */
interface SupabaseTransacao {
  id: number;
  usuaria_id: string;
  tipo: string;
  descricao: string;
  data: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  valor_sinal: number | null;
  status_pagamento: string | null;
  forma_pagamento: string | null;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  cliente_foto_url: string | null;
  data_evento: string | null;
  horario_entrega: string | null;
  endereco_entrega: string | null;
  observacoes: string | null;
  imagem_inspiracao: string | null;
  notas: string | null;
  fornecedor: string | null;
  periodo_mao_de_obra: string | null;
  categoria: string | null;
  breakdown: any;
  ficha_itens: any;
  insumos_consumidos: any;
  created_at: string;
}

/**
 * Campo de data vazio vira NULL.
 *
 * A coluna e do tipo `date`: string vazia nao e uma data e o Postgres recusa a
 * linha inteira. No app o vazio significa "nao informado", que e exatamente o
 * que NULL quer dizer.
 */
const dataOuNulo = (valor?: string) => (valor && valor.trim() ? valor : null);

/** Texto vazio tambem vira NULL, para nao guardar '' e undefined como coisas diferentes. */
const textoOuNulo = (valor?: string) => (valor && valor.trim() ? valor : null);

const mapSupabaseToTransaction = (d: SupabaseTransacao): Transaction => {
  const fichaItems: FichaOrderItem[] = Array.isArray(d.ficha_itens) ? d.ficha_itens : [];

  return {
    id: String(d.id),
    type: d.tipo as Transaction['type'],
    description: d.descricao,
    date: d.data,
    quantity: Number(d.quantidade) || 0,
    unitValue: Number(d.valor_unitario) || 0,
    totalValue: Number(d.valor_total) || 0,
    signalValue: d.valor_sinal === null ? undefined : Number(d.valor_sinal),
    paymentStatus: (d.status_pagamento || undefined) as Transaction['paymentStatus'],
    paymentMethod: (d.forma_pagamento || undefined) as Transaction['paymentMethod'],
    customerName: d.cliente_nome || undefined,
    customerPhone: d.cliente_telefone || undefined,
    customerPhotoUrl: d.cliente_foto_url || undefined,
    eventDate: d.data_evento || undefined,
    deliveryTime: d.horario_entrega || undefined,
    deliveryAddress: d.endereco_entrega || undefined,
    observations: d.observacoes || undefined,
    inspirationImage: d.imagem_inspiracao || undefined,
    notes: d.notas || undefined,
    supplier: d.fornecedor || undefined,
    laborPeriod: (d.periodo_mao_de_obra || undefined) as Transaction['laborPeriod'],
    category: (d.categoria || undefined) as Transaction['category'],
    breakdown: d.breakdown || undefined,
    fichaItems,
    // Campo legado, derivado e nao armazenado: manter uma coluna separada
    // criaria duas fontes para o mesmo vinculo, que podem divergir.
    fichaId: fichaItems[0]?.fichaId,
    consumedIngredients: Array.isArray(d.insumos_consumidos) ? d.insumos_consumidos : [],
    createdAt: new Date(d.created_at).getTime(),
  };
};

/**
 * Sentido inverso do mapeamento acima.
 *
 * Os dois ficam lado a lado de proposito: um campo renomeado so de um lado e o
 * defeito classico deste app — tela grava com um nome, outra le com outro, e o
 * dado some sem erro nenhum.
 */
const mapTransactionToSupabase = (tx: Omit<Transaction, 'id' | 'createdAt'>) => ({
  tipo: tx.type,
  descricao: tx.description,
  data: tx.date,
  quantidade: Number(tx.quantity) || 0,
  valor_unitario: Number(tx.unitValue) || 0,
  valor_total: Number(tx.totalValue) || 0,
  valor_sinal: tx.signalValue === undefined || tx.signalValue === null ? null : Number(tx.signalValue),
  status_pagamento: tx.paymentStatus || null,
  forma_pagamento: tx.paymentMethod || null,
  cliente_nome: textoOuNulo(tx.customerName),
  cliente_telefone: textoOuNulo(tx.customerPhone),
  cliente_foto_url: tx.customerPhotoUrl || null,
  data_evento: dataOuNulo(tx.eventDate),
  horario_entrega: textoOuNulo(tx.deliveryTime),
  endereco_entrega: textoOuNulo(tx.deliveryAddress),
  observacoes: textoOuNulo(tx.observations),
  imagem_inspiracao: tx.inspirationImage || null,
  notas: textoOuNulo(tx.notes),
  fornecedor: textoOuNulo(tx.supplier),
  periodo_mao_de_obra: tx.laborPeriod || null,
  categoria: tx.category || null,
  breakdown: tx.breakdown ?? null,
  ficha_itens: tx.fichaItems || [],
  insumos_consumidos: tx.consumedIngredients || [],
});

interface TransacoesContextType {
  transacoes: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransacoes: () => Promise<void>;
  addTransacao: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>;
  updateTransacao: (id: string, data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>;
  deleteTransacao: (id: string) => Promise<void>;
  substituirTudo: (transacoes: Transaction[]) => Promise<void>;
  limparTudo: () => Promise<void>;
}

const TransacoesContext = createContext<TransacoesContextType | undefined>(undefined);

export const TransacoesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [transacoes, setTransacoes] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTransacoes([]);
      return;
    }
    fetchTransacoes();
  }, [user]);

  const fetchTransacoes = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('transacoes')
        .select('*')
        .eq('usuaria_id', user.id)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setTransacoes((data || []).map(mapSupabaseToTransaction));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar lançamentos');
      console.error('Error fetching transacoes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addTransacao = async (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const { data, error: insertError } = await supabase
        .from('transacoes')
        .insert([{ usuaria_id: user.id, ...mapTransactionToSupabase(txData) }])
        .select()
        .single();

      if (insertError) throw insertError;

      const nova = mapSupabaseToTransaction(data);
      setTransacoes((prev) => [nova, ...prev]);
      return nova;
    } catch (err: any) {
      setError(err.message || 'Erro ao gravar lançamento');
      throw err;
    }
  };

  const updateTransacao = async (id: string, txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const { data, error: updateError } = await supabase
        .from('transacoes')
        .update(mapTransactionToSupabase(txData))
        .eq('id', parseInt(id))
        .eq('usuaria_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const atualizada = mapSupabaseToTransaction(data);
      setTransacoes((prev) => prev.map((t) => (t.id === id ? atualizada : t)));
      return atualizada;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar lançamento');
      throw err;
    }
  };

  const deleteTransacao = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', parseInt(id))
        .eq('usuaria_id', user.id);

      if (deleteError) throw deleteError;

      setTransacoes((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir lançamento');
      throw err;
    }
  };

  /** Restauracao de backup: apaga o que existe e grava o arquivo inteiro. */
  const substituirTudo = async (novas: Transaction[]) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const { error: delError } = await supabase
        .from('transacoes')
        .delete()
        .eq('usuaria_id', user.id);
      if (delError) throw delError;

      if (novas.length > 0) {
        const linhas = novas.map((tx) => ({
          usuaria_id: user.id,
          ...mapTransactionToSupabase(tx),
        }));
        const { error: insError } = await supabase.from('transacoes').insert(linhas);
        if (insError) throw insError;
      }

      await fetchTransacoes();
    } catch (err: any) {
      setError(err.message || 'Erro ao restaurar backup');
      throw err;
    }
  };

  const limparTudo = async () => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const { error: delError } = await supabase
        .from('transacoes')
        .delete()
        .eq('usuaria_id', user.id);
      if (delError) throw delError;
      setTransacoes([]);
    } catch (err: any) {
      setError(err.message || 'Erro ao limpar lançamentos');
      throw err;
    }
  };

  return (
    <TransacoesContext.Provider
      value={{
        transacoes,
        isLoading,
        error,
        fetchTransacoes,
        addTransacao,
        updateTransacao,
        deleteTransacao,
        substituirTudo,
        limparTudo,
      }}
    >
      {children}
    </TransacoesContext.Provider>
  );
};

export const useTransacoes = () => {
  const context = useContext(TransacoesContext);
  if (!context) {
    throw new Error('useTransacoes precisa estar dentro de <TransacoesProvider>');
  }
  return context;
};
