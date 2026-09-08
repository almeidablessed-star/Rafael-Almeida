import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { StockItem, FichaTecnica } from '../types';
import { planejarBaixa, ProblemaBaixa } from '../utils/stockConsumption';

/**
 * Fonte unica do estoque, compartilhada por todas as telas.
 *
 * Antes isto era o hook `hooks/useEstoque.ts`, com estado LOCAL — o mesmo
 * defeito que ja foi corrigido para clientes e fichas, e que aqui tinha TRES
 * copias vivas ao mesmo tempo: `EstoqueModule` (a aba Estoque),
 * `FichasTecnicasModule` (que puxa o custo do insumo) e
 * `BalancesAndExpensesModule` (a aba Compras, que grava a entrada).
 *
 * Cada uma buscava do banco no seu proprio `useEffect([user])` — e `user` so
 * muda no login. Na pratica: registrar uma compra na aba Compras atualizava a
 * copia DAQUELA tela; a aba Estoque continuava mostrando a quantidade velha, e
 * a ficha tecnica continuava calculando o custo do insumo pelo preco antigo.
 * So um F5 alinhava as tres.
 *
 * Com um provider unico, quem grava e quem consulta compartilham o mesmo array.
 * Ver [[CustomersContext]] e [[FichasTecnicasContext]], que resolvem o mesmo
 * problema para clientes e fichas.
 */

/** Formato da tabela `estoque` no Supabase. */
interface SupabaseEstoque {
  id: number;
  usuaria_id: string;
  item: string;
  quantidade_atual: number;
  unidade_medida: string;
  nivel_minimo: number;
  nivel_minimo_unidade: string;
  preco_unitario: number;
  quantidade_referencia: number;
  created_at: string;
}

/** Uma linha da tabela `estoque_movimentos`, no formato do app. */
export interface MovimentoEstoque {
  id: string;
  estoqueId: string | null;
  itemNome: string;
  tipo: 'consumo' | 'devolucao' | 'entrada';
  quantidade: number;
  unidade: string;
  transacaoId?: string;
  descricao: string;
  createdAt: number;
}

/**
 * O que aconteceu numa baixa de pedido.
 *
 * `problemas` nao e erro: e a lista de insumos que a ficha pede e o estoque nao
 * conseguiu atender (nao cadastrado, ou unidade incompativel). O pedido foi
 * registrado; estes insumos apenas nao baixaram. Quem chama precisa MOSTRAR
 * isso — engolir era o que fazia o estoque derreter em silencio.
 */
export interface ResultadoBaixa {
  baixados: { itemNome: string; quantidade: number; unidade: string }[];
  problemas: ProblemaBaixa[];
}

interface EstoqueContextType {
  estoque: StockItem[];
  movimentos: MovimentoEstoque[];
  isLoading: boolean;
  error: string | null;
  fetchEstoque: () => Promise<void>;
  /** Exposto para [[ProdutosContext]]: devolverPedido grava movimentos aqui tambem no ramo legado (estoque_id). */
  fetchMovimentos: () => Promise<void>;
  addEstoque: (data: Omit<StockItem, 'id'>) => Promise<StockItem>;
  updateEstoque: (id: string, data: Omit<StockItem, 'id'>) => Promise<StockItem>;
  deleteEstoque: (id: string) => Promise<void>;
  consumirParaPedido: (
    items: { ficha: FichaTecnica; quantity: number; tamanhoId?: string }[],
    transacaoId: string
  ) => Promise<ResultadoBaixa>;
  devolverPedido: (transacaoId: string) => Promise<void>;
  registrarEntrada: (params: {
    estoqueId: string;
    itemNome: string;
    quantidade: number;
    unidade: string;
    descricao: string;
    transacaoId?: string;
  }) => Promise<void>;
}

const EstoqueContext = createContext<EstoqueContextType | undefined>(undefined);

const mapSupabaseToStockItem = (data: SupabaseEstoque): StockItem => ({
  id: String(data.id),
  name: data.item,
  quantity: data.quantidade_atual,
  unit: data.unidade_medida as any,
  minThreshold: data.nivel_minimo,
  minThresholdUnit: (data.nivel_minimo_unidade || 'g') as any,
  costPerUnit: data.preco_unitario || 0,
  // Migration fez backfill com a propria quantidade atual, mas um `|| 0`
  // aqui evitaria dividir por zero se algum registro escapar disso.
  fullQuantity: data.quantidade_referencia ?? data.quantidade_atual,
});

const mapStockItemToSupabase = (item: Omit<StockItem, 'id'>) => ({
  item: item.name,
  quantidade_atual: item.quantity,
  unidade_medida: item.unit,
  nivel_minimo: item.minThreshold,
  nivel_minimo_unidade: item.minThresholdUnit,
  preco_unitario: item.costPerUnit || 0,
});

export const EstoqueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [estoque, setEstoque] = useState<StockItem[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoEstoque[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      // Logout limpa a lista: sem isto, o estoque da conta anterior
      // continuaria em memoria para quem entrasse depois.
      setEstoque([]);
      setMovimentos([]);
      return;
    }
    fetchEstoque();
    fetchMovimentos();
  }, [user]);

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

      setEstoque(data?.map(mapSupabaseToStockItem) || []);
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
      const { data, error: insertError } = await supabase
        .from('estoque')
        .insert([{
          usuaria_id: user.id,
          ...mapStockItemToSupabase(itemData),
          // Cadastro novo: a quantidade inicial e o primeiro "cheio".
          quantidade_referencia: itemData.quantity,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      const newItem = mapSupabaseToStockItem(data);
      // Atualizacao funcional: agora que Estoque, Fichas e Compras dividem esta
      // lista, duas telas podem gravar em sequencia — a forma `[novo, ...estoque]`
      // usaria uma copia possivelmente velha e perderia a gravacao do meio.
      setEstoque((prev) => [newItem, ...prev]);
      return newItem;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar item de estoque');
      throw err;
    }
  };

  const updateEstoque = async (id: string, itemData: Omit<StockItem, 'id'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      // So aumento reseta o baseline de "cheio" — compra e edicao manual pra
      // cima contam igual (decisao do usuario: nao vale a pena diferenciar).
      // Diminuir (correcao de contagem, por ex) so desce o atual e mantem a
      // referencia antiga. Consumo e devolucao de pedido nem passam por aqui
      // — usam update direto em EstoqueContext, entao nunca resetam isto.
      const itemAtual = estoque.find((i) => i.id === id);
      const novaReferencia =
        itemAtual && itemData.quantity > itemAtual.quantity
          ? itemData.quantity
          : itemAtual?.fullQuantity;

      const { data, error: updateError } = await supabase
        .from('estoque')
        .update({
          ...mapStockItemToSupabase(itemData),
          ...(novaReferencia !== undefined ? { quantidade_referencia: novaReferencia } : {}),
        })
        .eq('id', parseInt(id))
        .eq('usuaria_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updatedItem = mapSupabaseToStockItem(data);
      setEstoque((prev) => prev.map((i) => (i.id === id ? updatedItem : i)));
      return updatedItem;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar item de estoque');
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

      setEstoque((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar item de estoque');
      throw err;
    }
  };

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

  /**
   * Baixa os insumos de um pedido.
   *
   * SUPERSEDIDA por `consumirParaPedido` em [[ProdutosContext]]: App.tsx
   * chama a versao de la agora, que debita do catalogo Produtos em vez desta
   * tabela estoque. Mantida aqui (nao apagada) so pela mesma cautela
   * incremental do resto da migracao — nada foi removido ate o catalogo novo
   * estar validado em uso real.
   *
   * Aplica uma linha por vez e, se qualquer uma falhar, DESFAZ as anteriores
   * antes de propagar o erro. Meia baixa aplicada e pior do que baixa nenhuma:
   * o estoque fica errado e nada na tela denuncia.
   *
   * Nao ha transacao do Postgres aqui de proposito — cada conta tem uma unica
   * confeiteira, entao corrida concorrente e improvavel, e manter o casamento
   * de nomes em TypeScript deixa essa regra legivel para quem mantem o app.
   */
  /**
   * Numero curto do pedido para a descricao do movimento.
   *
   * Era um `slice(-6)` cru, herdado dos ids do localStorage
   * ("tx-1788124352483-sfpu5"), que trazia junto o hifen e produzia
   * "Pedido #-sfpu5". Agora os ids sao numericos e o proprio id ja e curto.
   */
  const numeroCurto = (transacaoId: string) => transacaoId.replace(/^tx-/, '').slice(-6);

  const consumirParaPedido = async (
    items: { ficha: FichaTecnica; quantity: number; tamanhoId?: string }[],
    transacaoId: string
  ): Promise<ResultadoBaixa> => {
    if (!user) throw new Error('User not authenticated');

    const plano = planejarBaixa(items, estoque);
    if (plano.baixas.length === 0) {
      return { baixados: [], problemas: plano.problemas };
    }

    const nomePorFicha = new Map(items.map((i) => [i.ficha.id, i.ficha.name]));
    const aplicadas: { estoqueId: string; quantidadeOriginal: number; movimentoId: string }[] = [];

    try {
      for (const b of plano.baixas) {
        const { error: errUpdate } = await supabase
          .from('estoque')
          .update({ quantidade_atual: b.quantidadeFinal })
          .eq('id', parseInt(b.estoqueId))
          .eq('usuaria_id', user.id);
        if (errUpdate) throw errUpdate;

        const rotulo = b.fichaIds.map((id) => nomePorFicha.get(id) || 'produto').join(' + ');
        const { data: mov, error: errMov } = await supabase
          .from('estoque_movimentos')
          .insert({
            usuaria_id: user.id,
            estoque_id: parseInt(b.estoqueId),
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
          estoqueId: b.estoqueId,
          quantidadeOriginal: b.quantidadeFinal + b.quantidade,
          movimentoId: String(mov.id),
        });
      }
    } catch (err: any) {
      // Estorno na ordem inversa. Se ate o estorno falhar nao ha o que fazer
      // daqui — registramos e deixamos o erro original subir, que e o que a
      // tela precisa mostrar.
      for (const a of [...aplicadas].reverse()) {
        try {
          await supabase
            .from('estoque')
            .update({ quantidade_atual: a.quantidadeOriginal })
            .eq('id', parseInt(a.estoqueId))
            .eq('usuaria_id', user.id);
          await supabase.from('estoque_movimentos').delete().eq('id', parseInt(a.movimentoId));
        } catch (errEstorno) {
          console.error('[ESTOQUE] Falha ao estornar baixa parcial:', errEstorno);
        }
      }
      setError(err.message || 'Erro ao baixar estoque do pedido');
      throw err;
    }

    await fetchEstoque();
    await fetchMovimentos();

    return {
      baixados: plano.baixas.map((b) => ({
        itemNome: b.itemNome,
        quantidade: b.quantidade,
        unidade: b.unidade,
      })),
      problemas: plano.problemas,
    };
  };

  /**
   * Devolve ao estoque tudo o que um pedido consumiu.
   *
   * SUPERSEDIDA por `devolverPedido` em [[ProdutosContext]] (que trata tanto
   * movimentos novos, contra Produtos, quanto estes antigos, contra esta
   * tabela). Mantida aqui pela mesma razao da funcao acima.
   *
   * Le os movimentos DO BANCO pelo `transacao_id` em vez de confiar no
   * `consumedIngredients` gravado junto da transacao. A versao antiga fazia o
   * contrario e casava por id de insumo da ficha, que nem sempre era o id do
   * item de estoque debitado — quando divergiam, o `if (stock)` falhava sem
   * erro e a devolucao simplesmente nao acontecia.
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
      if (!m.estoque_id) continue; // insumo apagado do estoque: nao ha onde devolver

      const atual = estoque.find((e) => e.id === String(m.estoque_id));
      if (!atual) continue;

      await supabase
        .from('estoque')
        .update({ quantidade_atual: atual.quantity + Number(m.quantidade) })
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

    await fetchEstoque();
    await fetchMovimentos();
  };

  /** Entrada por compra. A quantidade em si ja foi somada por quem chamou. */
  const registrarEntrada = async (params: {
    estoqueId: string;
    itemNome: string;
    quantidade: number;
    unidade: string;
    descricao: string;
    transacaoId?: string;
  }) => {
    if (!user) return;
    const { error: err } = await supabase.from('estoque_movimentos').insert({
      usuaria_id: user.id,
      estoque_id: parseInt(params.estoqueId),
      item_nome: params.itemNome,
      tipo: 'entrada',
      quantidade: params.quantidade,
      unidade: params.unidade,
      transacao_id: params.transacaoId || null,
      descricao: params.descricao,
    });
    if (err) {
      // A compra em si ja foi gravada; perder o rastro nao pode desfazer isso.
      console.error('[ESTOQUE] Falha ao registrar movimento de entrada:', err);
      return;
    }
    await fetchMovimentos();
  };

  return (
    <EstoqueContext.Provider
      value={{
        estoque,
        movimentos,
        isLoading,
        error,
        fetchEstoque,
        fetchMovimentos,
        addEstoque,
        updateEstoque,
        deleteEstoque,
        consumirParaPedido,
        devolverPedido,
        registrarEntrada,
      }}
    >
      {children}
    </EstoqueContext.Provider>
  );
};

export const useEstoque = () => {
  const context = useContext(EstoqueContext);
  if (!context) {
    throw new Error('useEstoque precisa estar dentro de <EstoqueProvider>');
  }
  return context;
};
