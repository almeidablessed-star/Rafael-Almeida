import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Produto, FichaTecnica, StockItem } from '../types';
import { planejarBaixa, ResultadoBaixa } from '../utils/stockConsumption';

/**
 * Fonte unica do catalogo de Produtos, compartilhada por todas as telas.
 *
 * Mesmo padrao de [[EstoqueContext]]/[[FichasTecnicasContext]]: um provider
 * so, para que gravar numa tela (ex: Compras atualizando quantidade) reflita
 * imediatamente em qualquer outra que leia a mesma lista (ex: a vista de
 * Estoque dentro de Produtos, ou o autocomplete de insumo em Fichas).
 */

/** Uma linha da tabela `estoque_movimentos`, no formato do app. */
export interface MovimentoEstoque {
  id: string;
  estoqueId: string | null;
  produtoId: string | null;
  itemNome: string;
  tipo: 'consumo' | 'devolucao' | 'entrada';
  quantidade: number;
  unidade: string;
  transacaoId?: string;
  descricao: string;
  createdAt: number;
}

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
  movimentos: MovimentoEstoque[];
  isLoading: boolean;
  error: string | null;
  fetchProdutos: () => Promise<void>;
  /** Historico de estoque_movimentos — mesma tabela usada pelo consumo/devolucao abaixo. */
  fetchMovimentos: () => Promise<void>;
  addProduto: (data: Omit<Produto, 'id'>) => Promise<Produto>;
  updateProduto: (id: number, data: Omit<Produto, 'id'>) => Promise<Produto>;
  deleteProduto: (id: number) => Promise<void>;
  /** Custo por unidade base: precoPago / quantidadeEmbalagem. Nunca armazenado — sempre calculado aqui. */
  custoPorUnidade: (produto: Pick<Produto, 'precoPago' | 'quantidadeEmbalagem'>) => number;
  consumirParaPedido: (
    items: { ficha: FichaTecnica; quantity: number; tamanhoId?: string }[],
    transacaoId: string
  ) => Promise<ResultadoBaixa>;
  devolverPedido: (transacaoId: string) => Promise<void>;
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
  const [movimentos, setMovimentos] = useState<MovimentoEstoque[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProdutos([]);
      setMovimentos([]);
      return;
    }
    fetchProdutos();
    fetchMovimentos();
  }, [user]);

  /**
   * Historico de estoque_movimentos, movido de [[EstoqueContext]] (passo 1 da
   * limpeza do sistema Estoque legado — ver docs/limpeza-estoque-legado.md):
   * a tabela e escrita pelo consumo/devolucao NOVOS (abaixo, via produto_id)
   * e tambem guarda o rastro antigo (via estoque_id), entao o historico
   * exibido em Produtos > Estoque precisa dos dois. Sem filtro por coluna:
   * um movimento so preenche uma das duas, nunca as duas.
   */
  const fetchMovimentos = async () => {
    if (!user) return;
    const { data, error: err } = await supabase
      .from('estoque_movimentos')
      .select('*')
      .eq('usuaria_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200);

    if (err) {
      console.error('Error fetching movimentos:', err);
      return;
    }
    setMovimentos(
      (data || []).map((m: any) => ({
        id: String(m.id),
        estoqueId: m.estoque_id ? String(m.estoque_id) : null,
        produtoId: m.produto_id ? String(m.produto_id) : null,
        itemNome: m.item_nome,
        tipo: m.tipo,
        quantidade: Number(m.quantidade),
        unidade: m.unidade,
        transacaoId: m.transacao_id || undefined,
        descricao: m.descricao,
        createdAt: new Date(m.created_at).getTime(),
      }))
    );
  };

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

  /** Numero curto do pedido para a descricao do movimento. Mesma regra de [[EstoqueContext]]. */
  const numeroCurto = (transacaoId: string) => transacaoId.replace(/^tx-/, '').slice(-6);

  /**
   * Baixa os insumos de um pedido no catalogo Produtos.
   *
   * Substitui a versao antiga de [[EstoqueContext]], que so sabia debitar da
   * tabela estoque — um Produto cadastrado direto no catalogo novo (fluxo
   * guiado na Ficha, ou Compras criando um item) tem um id que nunca existiu
   * la, entao a baixa nunca encontrava o item e nao acontecia. Aqui o plano
   * roda contra Produtos, e o movimento e gravado em `estoque_movimentos.produto_id`
   * (coluna nova, ver migration 20260907_estoque_movimentos_produto_id.sql).
   *
   * Mesma logica de aplicar-uma-por-vez e desfazer tudo se uma falhar do
   * EstoqueContext original — meia baixa aplicada e pior que baixa nenhuma.
   */
  const consumirParaPedido = async (
    items: { ficha: FichaTecnica; quantity: number; tamanhoId?: string }[],
    transacaoId: string
  ): Promise<ResultadoBaixa> => {
    if (!user) throw new Error('User not authenticated');

    const produtosComoStockItems: StockItem[] = produtos.map((p) => ({
      id: String(p.id),
      name: p.nome,
      quantity: p.quantidadeAtual || 0,
      unit: p.unidadeEmbalagem,
      minThreshold: p.nivelMinimo || 0,
      minThresholdUnit: p.nivelMinimoUnidade || p.unidadeEmbalagem,
      costPerUnit: custoPorUnidade(p),
      fullQuantity: p.quantidadeReferencia || 0,
    }));

    const plano = planejarBaixa(items, produtosComoStockItems);
    if (plano.baixas.length === 0) {
      return { baixados: [], problemas: plano.problemas };
    }

    const nomePorFicha = new Map(items.map((i) => [i.ficha.id, i.ficha.name]));
    const aplicadas: { produtoId: string; quantidadeOriginal: number; movimentoId: string }[] = [];

    try {
      for (const b of plano.baixas) {
        const { error: errUpdate } = await supabase
          .from('produtos')
          .update({ quantidade_atual: b.quantidadeFinal })
          .eq('id', parseInt(b.estoqueId))
          .eq('usuaria_id', user.id);
        if (errUpdate) throw errUpdate;

        const rotulo = b.fichaIds.map((id) => nomePorFicha.get(id) || 'produto').join(' + ');
        const { data: mov, error: errMov } = await supabase
          .from('estoque_movimentos')
          .insert({
            usuaria_id: user.id,
            produto_id: parseInt(b.estoqueId),
            item_nome: b.itemNome,
            tipo: 'consumo',
            quantidade: b.quantidade,
            unidade: b.unidade,
            transacao_id: transacaoId,
            ficha_id: b.fichaIds[0] ? parseInt(b.fichaIds[0]) : null,
            descricao: `Consumo: ${rotulo} (Pedido #${numeroCurto(transacaoId)})`,
          })
          .select('id')
          .single();
        if (errMov) throw errMov;

        aplicadas.push({
          produtoId: b.estoqueId,
          quantidadeOriginal: b.quantidadeFinal + b.quantidade,
          movimentoId: String(mov.id),
        });
      }
    } catch (err: any) {
      // Estorno na ordem inversa, mesma regra do EstoqueContext original.
      for (const a of [...aplicadas].reverse()) {
        try {
          await supabase
            .from('produtos')
            .update({ quantidade_atual: a.quantidadeOriginal })
            .eq('id', parseInt(a.produtoId))
            .eq('usuaria_id', user.id);
          await supabase.from('estoque_movimentos').delete().eq('id', parseInt(a.movimentoId));
        } catch (errEstorno) {
          console.error('[PRODUTOS] Falha ao estornar baixa parcial:', errEstorno);
        }
      }
      setError(err.message || 'Erro ao baixar estoque do pedido');
      throw err;
    }

    await fetchProdutos();
    await fetchMovimentos();

    return {
      baixados: plano.baixas.map((b) => ({ itemNome: b.itemNome, quantidade: b.quantidade, unidade: b.unidade })),
      problemas: plano.problemas,
    };
  };

  /**
   * Devolve ao catalogo tudo o que um pedido consumiu.
   *
   * Le os movimentos do tipo 'consumo' pelo transacao_id e trata os DOIS
   * formatos possiveis: `produto_id` (consumo feito por esta versao, contra
   * Produtos) e `estoque_id` (consumo antigo, gravado antes desta ligacao
   * existir, contra a tabela estoque). Um pedido antigo cancelado precisa
   * continuar devolvendo corretamente — por isso o ramo legado fica aqui
   * tambem, em vez de so em EstoqueContext: um unico cancelamento devolve
   * tudo, mesmo que o pedido tenha itens dos dois mundos.
   *
   * O ramo `estoque_id` le e escreve a tabela `estoque` direto via `supabase`,
   * sem depender de [[EstoqueContext]] (passo 2 da limpeza do sistema Estoque
   * legado — ver docs/limpeza-estoque-legado.md, bloco B1): este contexto nao
   * precisa mais de `useEstoque()` para nada. Ler o saldo fresco do banco em
   * vez do array compartilhado tambem evita um saldo desatualizado se aquele
   * contexto nao tiver sido recarregado desde a ultima escrita.
   */
  const devolverPedido = async (transacaoId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { data: movs, error: errBusca } = await supabase
      .from('estoque_movimentos')
      .select('*')
      .eq('usuaria_id', user.id)
      .eq('transacao_id', transacaoId)
      .eq('tipo', 'consumo');
    if (errBusca) throw errBusca;
    if (!movs || movs.length === 0) return;

    for (const m of movs) {
      if (m.produto_id) {
        const atual = produtos.find((p) => p.id === m.produto_id);
        if (!atual) continue; // produto apagado do catalogo: nao ha onde devolver

        await supabase
          .from('produtos')
          .update({ quantidade_atual: (atual.quantidadeAtual || 0) + Number(m.quantidade) })
          .eq('id', m.produto_id)
          .eq('usuaria_id', user.id);

        await supabase.from('estoque_movimentos').insert({
          usuaria_id: user.id,
          produto_id: m.produto_id,
          item_nome: m.item_nome,
          tipo: 'devolucao',
          quantidade: m.quantidade,
          unidade: m.unidade,
          transacao_id: transacaoId,
          descricao: `Devolução: ${m.item_nome} (Pedido #${numeroCurto(transacaoId)} cancelado)`,
        });
      } else if (m.estoque_id) {
        const { data: itemAtual, error: errItem } = await supabase
          .from('estoque')
          .select('quantidade_atual')
          .eq('id', m.estoque_id)
          .eq('usuaria_id', user.id)
          .maybeSingle();
        if (errItem || !itemAtual) continue; // insumo apagado do estoque: nao ha onde devolver

        await supabase
          .from('estoque')
          .update({ quantidade_atual: Number(itemAtual.quantidade_atual) + Number(m.quantidade) })
          .eq('id', m.estoque_id)
          .eq('usuaria_id', user.id);

        await supabase.from('estoque_movimentos').insert({
          usuaria_id: user.id,
          estoque_id: m.estoque_id,
          item_nome: m.item_nome,
          tipo: 'devolucao',
          quantidade: m.quantidade,
          unidade: m.unidade,
          transacao_id: transacaoId,
          descricao: `Devolução: ${m.item_nome} (Pedido #${numeroCurto(transacaoId)} cancelado)`,
        });
      }
    }

    await fetchProdutos();
    await fetchMovimentos();
  };

  return (
    <ProdutosContext.Provider
      value={{
        produtos,
        movimentos,
        isLoading,
        error,
        fetchProdutos,
        fetchMovimentos,
        addProduto,
        updateProduto,
        deleteProduto,
        custoPorUnidade,
        consumirParaPedido,
        devolverPedido,
      }}
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
