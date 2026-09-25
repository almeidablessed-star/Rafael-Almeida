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
  cliente_foto_url?: string | null;
  data_evento: string | null;
  horario_entrega: string | null;
  endereco_entrega: string | null;
  observacoes: string | null;
  imagem_inspiracao?: string | null;
  notas: string | null;
  fornecedor: string | null;
  periodo_mao_de_obra: string | null;
  categoria: string | null;
  breakdown: any;
  ficha_itens: any;
  insumos_consumidos: any;
  produto_id: number | null;
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

/**
 * Colunas de foto sao o unico lugar onde `undefined` e `''` NAO significam a
 * mesma coisa, e a diferenca vale a foto da confeiteira:
 *
 * - `undefined` = a foto nao foi carregada nesta sessao (ela nao vem mais no
 *   select de lista). A chave e OMITIDA do update, e o Postgres deixa o valor
 *   gravado intacto.
 * - `''` ou `null` = alguem clicou em remover na tela. A chave entra valendo
 *   NULL, e a foto e apagada de verdade.
 *
 * Sem essa distincao, salvar qualquer edicao de um pedido — trocar o horario
 * de entrega, marcar como pago — regravaria o `undefined` da foto que nunca
 * chegou a ser carregada por cima da foto boa que continua no banco. E o
 * mesmo defeito que o commit e69ff3e corrigiu na foto de perfil.
 */
const fotoOuOmitida = (coluna: string, valor?: string | null) =>
  valor === undefined ? {} : { [coluna]: valor || null };

/**
 * Colunas lidas nas consultas de lista.
 *
 * `cliente_foto_url` e `imagem_inspiracao` guardam data URI em base64 e ficam
 * de fora de proposito. Com `select('*')` toda abertura do app baixava o
 * historico inteiro de pedidos com as fotos embutidas, e o custo crescia a
 * cada pedido novo — era a origem do pico de egress de 744 MB num unico dia.
 *
 * Quem precisa da foto pede por `fetchTransacaoFotos`, mesmo padrao ja
 * aplicado em clientes, fichas tecnicas e perfil.
 */
const COLUNAS_SEM_FOTO =
  'id,tipo,descricao,data,quantidade,valor_unitario,valor_total,valor_sinal,' +
  'status_pagamento,forma_pagamento,cliente_nome,cliente_telefone,data_evento,' +
  'horario_entrega,endereco_entrega,observacoes,notas,fornecedor,' +
  'periodo_mao_de_obra,categoria,breakdown,ficha_itens,insumos_consumidos,' +
  'produto_id,created_at';

/**
 * O supabase-js deduz o tipo do retorno lendo a string do `select` como
 * literal. Como a lista de colunas vive numa constante — para nao ser
 * reescrita em quatro lugares e sair de sincronia — essa deducao nao acontece
 * e o retorno chega como `GenericStringError`. A conversao explicita e so
 * sobre isso; o formato real da linha e o que `SupabaseTransacao` descreve.
 */
const comoLinhas = (data: unknown) => (data || []) as unknown as SupabaseTransacao[];
const comoLinha = (data: unknown) => data as unknown as SupabaseTransacao;

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
    produtoId: d.produto_id ?? undefined,
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
  ...fotoOuOmitida('cliente_foto_url', tx.customerPhotoUrl),
  data_evento: dataOuNulo(tx.eventDate),
  horario_entrega: textoOuNulo(tx.deliveryTime),
  endereco_entrega: textoOuNulo(tx.deliveryAddress),
  observacoes: textoOuNulo(tx.observations),
  ...fotoOuOmitida('imagem_inspiracao', tx.inspirationImage),
  notas: textoOuNulo(tx.notes),
  fornecedor: textoOuNulo(tx.supplier),
  periodo_mao_de_obra: tx.laborPeriod || null,
  categoria: tx.category || null,
  breakdown: tx.breakdown ?? null,
  ficha_itens: tx.fichaItems || [],
  insumos_consumidos: tx.consumedIngredients || [],
  produto_id: tx.produtoId ?? null,
});

interface TransacoesContextType {
  transacoes: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransacoes: () => Promise<void>;
  fetchTransacaoFotos: (
    id: string
  ) => Promise<{ customerPhotoUrl: string | null; inspirationImage: string | null }>;
  fetchTransacoesComFotos: () => Promise<Transaction[]>;
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
        .select(COLUNAS_SEM_FOTO)
        .eq('usuaria_id', user.id)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setTransacoes(comoLinhas(data).map(mapSupabaseToTransaction));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar lançamentos');
      console.error('Error fetching transacoes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Busca as duas fotos de um pedido sob demanda.
   *
   * Devolve `null` em cada campo que o banco nao tem, e `null` nos dois quando
   * a consulta falha: quem chama so preenche o que veio preenchido, entao uma
   * falha aqui deixa a tela como estava em vez de apagar o que ja aparecia.
   */
  const fetchTransacaoFotos = async (
    id: string
  ): Promise<{ customerPhotoUrl: string | null; inspirationImage: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select('cliente_foto_url,imagem_inspiracao')
        .eq('id', parseInt(id))
        .eq('usuaria_id', user?.id)
        .single();

      if (error) throw error;
      return {
        customerPhotoUrl: data?.cliente_foto_url || null,
        inspirationImage: data?.imagem_inspiracao || null,
      };
    } catch (err: any) {
      console.error('Error fetching transacao photos:', err);
      return { customerPhotoUrl: null, inspirationImage: null };
    }
  };

  /**
   * Versao completa da lista, com as fotos, para o backup em arquivo.
   *
   * O backup e restaurado com um DELETE seguido de INSERT: se o arquivo sair
   * sem as fotos, restaura-lo apaga todas elas de forma irreversivel. Aqui a
   * consulta pesada e aceitavel porque acontece uma vez, quando a confeiteira
   * pede o arquivo — nao a cada abertura do app, que era o problema.
   */
  const fetchTransacoesComFotos = async (): Promise<Transaction[]> => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('transacoes')
      .select('*')
      .eq('usuaria_id', user.id)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapSupabaseToTransaction);
  };

  const addTransacao = async (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const { data, error: insertError } = await supabase
        .from('transacoes')
        .insert([{ usuaria_id: user.id, ...mapTransactionToSupabase(txData) }])
        // Sem as colunas de foto tambem na volta: a linha acabou de ser
        // gravada com a foto que ja esta na tela, e devolve-la so faria o
        // mesmo base64 subir e descer na mesma operacao.
        .select(COLUNAS_SEM_FOTO)
        .single();

      if (insertError) throw insertError;

      const nova = mapSupabaseToTransaction(comoLinha(data));
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
        .select(COLUNAS_SEM_FOTO)
        .single();

      if (updateError) throw updateError;

      const atualizada = mapSupabaseToTransaction(comoLinha(data));
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
        fetchTransacaoFotos,
        fetchTransacoesComFotos,
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
