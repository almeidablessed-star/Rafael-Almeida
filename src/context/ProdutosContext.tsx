import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Produto, FichaTecnica, StockItem } from '../types';
import { planejarBaixa, ResultadoBaixa } from '../utils/stockConsumption';
import { normalizeName } from '../utils/fichaMatcher';
import { referenciaDoCheio } from '../utils/referenciaDoEstoque';

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
  /**
   * `fichasQueNaoVoltam`: NOMES de ficha cujo consumo deve FICAR baixado.
   *
   * Serve a um caso so, o da edicao: quando a ficha de um item foi apagada do
   * catalogo, a edicao devolve o consumo dela e nao tem como reconsumir —
   * o insumo voltaria ao estoque e nunca mais sairia, com o bolo ainda a
   * produzir. Nesses itens a devolucao e PULADA. Vazio (o padrao) devolve
   * tudo, que e o certo no cancelamento e na exclusao.
   *
   * NOME, e nao id, por um motivo medido em producao: `estoque_movimentos.
   * ficha_id` e chave estrangeira com ON DELETE SET NULL, entao apagar a
   * ficha ZERA o vinculo nos movimentos ja gravados — justamente no caso que
   * esta funcao precisa reconhecer. Conferido no banco: movimento de ficha
   * viva tinha `ficha_id` preenchido; o da ficha apagada depois estava nulo.
   * O nome sobrevive porque fica escrito na `descricao` do proprio movimento.
   */
  devolverPedido: (transacaoId: string, fichasQueNaoVoltam?: string[]) => Promise<void>;
  /** O pedido ainda tem baixa de estoque registrada? Ver a definicao. */
  pedidoTemRastroDeEstoque: (transacaoId: string) => Promise<boolean>;
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

  /**
   * Saldo dos produtos LIDO DO BANCO na hora, sem passar pelo estado.
   *
   * Existe por causa de um defeito concreto: ao editar um pedido, o app devolve
   * ao estoque o que a versao anterior consumiu e em seguida consome pela versao
   * nova. A estrategia esta certa, mas as duas funcoes liam o saldo do array
   * `produtos` do componente — um retrato tirado antes da devolucao. A
   * devolucao gravava o saldo certo no banco e o consumo logo depois calculava
   * em cima do valor velho preso na memoria, sobrescrevendo-a.
   *
   * Media assim, com um item de 100 g e estoque de 1000 g: lancar o pedido
   * levava a 900 (certo), mas reabrir e salvar sem mexer em nada levava a 800,
   * e mudar para 3 unidades levava a 500 em vez de 700. Cada edicao comia mais
   * um pedido inteiro de insumo, em silencio.
   *
   * O estado continua sendo a fonte da TELA; para escrever saldo, a fonte e o
   * banco.
   */
  const buscarProdutosFrescos = async (): Promise<Produto[]> => {
    if (!user) return [];
    const { data, error: errBusca } = await supabase
      .from('produtos')
      .select('*')
      .eq('usuaria_id', user.id);
    if (errBusca) throw errBusca;
    return (data || []).map(mapSupabaseToProduto);
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
      // baseline "cheio" do arco de percentual — comparando na mesma unidade,
      // porque a compra pode trocar g por kg (ver referenciaDoCheio).
      const atual = produtos.find((p) => p.id === id);
      const novaReferencia = referenciaDoCheio(atual, produtoData);

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

    // Saldo do banco, nao do estado: ver `buscarProdutosFrescos`.
    const produtosAtuais = await buscarProdutosFrescos();
    const produtosComoStockItems: StockItem[] = produtosAtuais.map((p) => ({
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
   * O pedido ainda tem baixa de estoque registrada no historico?
   *
   * Desde 26/10/2026 uma tarefa do banco apaga o historico com mais de 3
   * meses (pg_cron, migration 20261026140000). Pedido mais velho que isso pode
   * nao ter mais o rastro de quanto baixou — e sem rastro a devolucao nao
   * devolve nada. Quem edita ou exclui um pedido antigo pergunta isto antes,
   * para nao reconsumir (o estoque cairia duas vezes pelo mesmo pedido) e para
   * avisar a confeiteira.
   */
  const pedidoTemRastroDeEstoque = async (transacaoId: string): Promise<boolean> => {
    if (!user) return false;
    const { count, error: erro } = await supabase
      .from('estoque_movimentos')
      .select('id', { count: 'exact', head: true })
      .eq('usuaria_id', user.id)
      .eq('transacao_id', transacaoId)
      .eq('tipo', 'consumo');
    // Na duvida (erro de rede), segue o caminho normal de sempre.
    if (erro) return true;
    return (count || 0) > 0;
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
   * O ramo `estoque_id` NAO le nem escreve mais a tabela `estoque` (passo
   * preparatorio para a migration final que vai dropa-la — ver
   * docs/limpeza-estoque-legado.md, passo 6): atualizar aquele saldo nao tem
   * efeito visivel nenhum desde que EstoqueModule.tsx foi removido, e
   * continuar consultando a tabela so criaria uma dependencia de codigo que
   * quebraria (em silencio, sem lancar erro — so deixando de gravar a
   * devolucao) no dia em que ela deixasse de existir. So grava a linha de
   * devolucao no historico, para a tela continuar mostrando o par
   * consumo/devolucao corretamente.
   */
  const devolverPedido = async (transacaoId: string, fichasQueNaoVoltam: string[] = []) => {
    if (!user) throw new Error('User not authenticated');

    // Consumos E devolucoes, porque o que interessa e o SALDO LIQUIDO que este
    // pedido ainda tem preso no estoque.
    //
    // Buscar so os consumos devolvia tudo de novo a cada edicao: nada marca um
    // consumo como ja devolvido, entao a segunda edicao encontrava o consumo
    // original mais o da primeira edicao e devolvia os dois. Medido com um item
    // de 100 g: o estoque subia para 1100 antes do novo consumo e o pedido
    // terminava com 800 no lugar de 700 — sobrando insumo que nunca existiu.
    const { data: movs, error: errBusca } = await supabase
      .from('estoque_movimentos')
      .select('*')
      .eq('usuaria_id', user.id)
      .eq('transacao_id', transacaoId)
      .in('tipo', ['consumo', 'devolucao']);
    if (errBusca) throw errBusca;
    if (!movs || movs.length === 0) return;

    // Itens cuja ficha sumiu do catalogo ficam de fora da conta inteira — nem
    // o consumo nem a devolucao deles entram. Devolver o que nao sera
    // reconsumido era o que inflava o estoque na edicao.
    //
    // A identificacao e pelo NOME escrito na descricao do movimento
    // ("Consumo: Bolo Teste (Pedido #138)"), nao por `ficha_id` — ver a nota
    // na assinatura: a chave estrangeira e zerada quando a ficha e apagada.
    //
    // Movimento que atende MAIS DE UMA ficha ("Consumo: Bolo A + Bolo B") so
    // e pulado se TODAS tiverem sido apagadas. Com uma viva e outra apagada,
    // ele volta normalmente: pular o movimento inteiro faria a parte da ficha
    // viva ser consumida de novo sem ter sido devolvida, e o saldo cairia mais
    // a cada edicao — erro pior do que o que estamos evitando.
    const nomesQueNaoVoltam = fichasQueNaoVoltam.map(normalizeName).filter(Boolean);

    const fichasDaDescricao = (descricao: string | null): string[] => {
      const achado = /^[^:]+:\s*(.*?)\s*\(Pedido #/.exec(descricao || '');
      if (!achado) return [];
      return achado[1].split(' + ').map((n) => n.trim()).filter(Boolean);
    };

    const movimentosConsiderados =
      nomesQueNaoVoltam.length === 0
        ? movs
        : movs.filter((m: any) => {
            const nomes = fichasDaDescricao(m.descricao);
            // Sem nome reconhecivel na descricao nao da para atribuir: segue o
            // caminho normal, como sempre foi.
            if (nomes.length === 0) return true;
            return !nomes.every((n) => nomesQueNaoVoltam.includes(normalizeName(n)));
          });
    if (movimentosConsiderados.length === 0) return;

    // Consumo soma, devolucao subtrai. Sobra o que falta devolver.
    const pendentePorChave = new Map<string, { mov: any; quantidade: number }>();
    for (const m of movimentosConsiderados) {
      const chave = m.produto_id ? `p${m.produto_id}` : `e${m.estoque_id}:${m.item_nome}`;
      const sinal = m.tipo === 'consumo' ? 1 : -1;
      const anterior = pendentePorChave.get(chave);
      pendentePorChave.set(chave, {
        mov: anterior?.mov || m,
        quantidade: (anterior?.quantidade || 0) + sinal * Number(m.quantidade),
      });
    }

    const aDevolver = [...pendentePorChave.values()]
      .filter((x) => x.quantidade > 0)
      .map((x) => ({ ...x.mov, quantidade: x.quantidade }));
    if (aDevolver.length === 0) return;

    // Saldo do banco, nao do estado: ver `buscarProdutosFrescos`. Aqui importa
    // tambem entre uma volta e outra do laco — dois movimentos do mesmo produto
    // liam o mesmo saldo antigo e a segunda devolucao apagava a primeira.
    const saldos = new Map((await buscarProdutosFrescos()).map((p) => [p.id, p.quantidadeAtual || 0]));

    // ORDEM DAS DUAS ESCRITAS, e por que o movimento vem primeiro.
    //
    // Nenhuma das duas era conferida antes: o resultado era descartado, e com
    // ele o erro. Reproduzido em laboratorio com o codigo real: o UPDATE do
    // saldo falhando deixava a linha "devolucao" gravada assim mesmo — o
    // historico dizia que os 300 g voltaram e o saldo seguia em 700. Pior, a
    // conta do pendente e `consumo - devolucao`: com a devolucao mentirosa
    // gravada, o pendente zera e NENHUMA tentativa seguinte conserta. O
    // insumo fica baixado para sempre.
    //
    // Gravar o movimento primeiro NAO resolve isso sozinho — invertida e sem
    // conferencia, a falha no saldo produz exatamente aquele estado. O que
    // fecha o caso e a dupla: movimento primeiro E desfazer o movimento se o
    // saldo nao for gravado. Assim o pior caso volta a ser "nada aconteceu",
    // com o pendente intacto e a proxima tentativa funcionando.
    //
    // Mesmo padrao do `consumirParaPedido` logo acima: confere cada escrita,
    // desfaz o que ja aplicou e DEIXA O ERRO SUBIR — quem chama (App.tsx, no
    // cancelamento e na edicao) ja mostra o aviso e, na exclusao, segura o
    // pedido para o estorno poder ser refeito.
    for (const m of aDevolver) {
      if (m.produto_id) {
        if (!saldos.has(m.produto_id)) continue; // produto apagado do catalogo: nao ha onde devolver
        const novoSaldo = (saldos.get(m.produto_id) || 0) + Number(m.quantidade);

        const { data: movGravado, error: errMov } = await supabase
          .from('estoque_movimentos')
          .insert({
            usuaria_id: user.id,
            produto_id: m.produto_id,
            item_nome: m.item_nome,
            tipo: 'devolucao',
            quantidade: m.quantidade,
            unidade: m.unidade,
            transacao_id: transacaoId,
            descricao: `Devolução: ${m.item_nome} (Pedido #${numeroCurto(transacaoId)} cancelado)`,
          })
          .select('id')
          .single();
        if (errMov) throw errMov;

        // `.select('id')` nao e enfeite: sem ele, um UPDATE que nao encontra a
        // linha (id ou usuaria_id que nao casam) volta como SUCESSO com zero
        // linhas alteradas, e conferir so o erro nao pegaria.
        const { data: atualizados, error: errSaldo } = await supabase
          .from('produtos')
          .update({ quantidade_atual: novoSaldo })
          .eq('id', m.produto_id)
          .eq('usuaria_id', user.id)
          .select('id');

        if (errSaldo || !atualizados || atualizados.length === 0) {
          // Desfaz o movimento recem-gravado: deixa-lo seria gravar a mentira.
          const { error: errDesfazer } = await supabase
            .from('estoque_movimentos')
            .delete()
            .eq('id', movGravado.id);
          if (errDesfazer) {
            // Nao da para esconder: a linha ficou dizendo que voltou. Fica o
            // rastro para quem for conferir o estoque depois.
            console.error(
              `[PRODUTOS] Devolucao de "${m.item_nome}" gravou o movimento ${movGravado.id} mas nao atualizou o saldo, e o movimento nao pode ser desfeito. O saldo deste produto esta menor do que deveria.`,
              errDesfazer
            );
          }
          throw errSaldo || new Error(`O saldo de "${m.item_nome}" não pôde ser atualizado.`);
        }

        saldos.set(m.produto_id, novoSaldo);
      } else if (m.estoque_id) {
        // Ramo legado: so historico, nao ha saldo para atualizar.
        const { error: errMovLegado } = await supabase.from('estoque_movimentos').insert({
          usuaria_id: user.id,
          item_nome: m.item_nome,
          tipo: 'devolucao',
          quantidade: m.quantidade,
          unidade: m.unidade,
          transacao_id: transacaoId,
          descricao: `Devolução: ${m.item_nome} (Pedido #${numeroCurto(transacaoId)} cancelado)`,
        });
        if (errMovLegado) throw errMovLegado;
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
        pedidoTemRastroDeEstoque,
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
