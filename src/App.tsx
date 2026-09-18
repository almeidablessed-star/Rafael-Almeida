// v2.1 - Fresh rebuild with latest redesign - force Vercel deployment
import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import {
  Transaction,
  TabType,
  TimePeriod,
  TransactionType,
  FichaTecnica,
} from './types';
import { filterTransactionsByPeriod, calculateSummary } from './utils/financialEngine';
import { getTodayIso, formatDateBr } from './utils/formatters';
import { useDelayedDelete } from './hooks/useDelayedDelete';
import { useFichasTecnicas } from './context/FichasTecnicasContext';
import { useProdutos } from './context/ProdutosContext';
import { useTransacoes } from './context/TransacoesContext';
import { TransacoesProvider } from './context/TransacoesContext';
import { ProblemaBaixa } from './utils/stockConsumption';

import {
  Home,
  ShoppingBag,
  BookOpen,
  Users,
  Boxes,
  Wallet,
  Smartphone,
  Download,
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { PeriodSelector } from './components/PeriodSelector';
import { Dashboard } from './components/Dashboard';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyOtpPage } from './pages/VerifyOtpPage';
import { OrdersModule } from './components/OrdersModule';
import { SalesModule } from './components/SalesModule';
import { RestockModule } from './components/RestockModule';
import { CostsModule } from './components/CostsModule';
import { HistoryModule } from './components/HistoryModule';
import { WeeklyClosingModule } from './components/WeeklyClosingModule';
import { ProdutosModule } from './components/ProdutosModule';
import { FichasTecnicasModule } from './components/FichasTecnicasModule';
import { CustomersModule } from './components/CustomersModule';
import { TransactionFormModal } from './components/TransactionFormModal';
import { GenericDeleteConfirmModal } from './components/GenericDeleteConfirmModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { GlossaryModal } from './components/GlossaryModal';
import { BackupModal } from './components/BackupModal';
import { ProfileModal } from './components/ProfileModal';
import { LoginModal } from './components/LoginModal';
import { CurrencyProvider, useCurrency } from './context/CurrencyContext';
import { CustomersProvider } from './context/CustomersContext';
import { FichasTecnicasProvider } from './context/FichasTecnicasContext';
import { CostsProvider, useCosts } from './context/CostsContext';
import { ProdutosProvider } from './context/ProdutosContext';
import { FinancialOnboardingGate } from './components/onboarding/FinancialOnboardingGate';
import { TourPrimeirosPassos } from './components/onboarding/TourPrimeirosPassos';

const TOUR_PRIMEIROS_PASSOS_HABILITADO = true;

function AppContent() {
  const { isResetPasswordRequired, isOtpVerificationRequired, user, userProfile, logout } = useAuth();
  const { formatCurrency } = useCurrency();
  const { fichas } = useFichasTecnicas();
  const { administrativeCosts, marcarTourVisto } = useCosts();
  const { consumirParaPedido, devolverPedido } = useProdutos();
  const {
    transacoes: transactions,
    addTransacao,
    updateTransacao,
    deleteTransacao,
    substituirTudo,
    limparTudo,
  } = useTransacoes();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem('carula_activeTab') as TabType | null;
    // Abas "Saldos" (renomeada para "Compras") e depois "Compras" e "Estoque"
    // sairam do rodape (substituidas pelos filtros dentro de Produtos): quem
    // tinha alguma delas salva como ultima aberta cairia numa tela em branco,
    // ja que nenhum branch de activeTab casa mais com esses valores.
    if (saved === 'saldos' || saved === 'compras' || saved === 'estoque') {
      localStorage.setItem('carula_activeTab', 'produtos');
      return 'produtos';
    }
    return saved || 'dashboard';
  });

  // Period filter state
  const [period, setPeriod] = useState<TimePeriod>('mes'); // Default to 'Este Mês'
  const [customStartDate, setCustomStartDate] = useState<string>(getTodayIso());
  const [customEndDate, setCustomEndDate] = useState<string>(getTodayIso());

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formInitialType, setFormInitialType] = useState<TransactionType>('venda');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null);
  const [prefilledLaborPeriod, setPrefilledLaborPeriod] = useState<any>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isGlossaryModalOpen, setIsGlossaryModalOpen] = useState(false);
  const [tourAtivo, setTourAtivo] = useState(false);
  const [tabAntesDoTour, setTabAntesDoTour] = useState<TabType | null>(null);
  // Pedido de uma via pro ProdutosModule abrir ja no filtro Compras (tour
  // guiado ou checklist de primeiros passos) — ver `abaInicial` em
  // ProdutosModule.tsx. So e limpo quando a tela de Produtos efetivamente
  // consome o pedido (`onAbaInicialConsumida`) — nunca por outro passo do
  // tour nem ao fechar o tour, senao a intencao do Passo 1 se perde antes de
  // a pessoa chegar em Produtos pelo checklist.
  const [produtosAbaSolicitada, setProdutosAbaSolicitada] = useState<'compras' | undefined>(undefined);

  // Exclusao de transacao (pedido/compra/despesa) com delay real de 10s —
  // ver useDelayedDelete. "Desfazer" cancela o timeout sem nunca ter tocado
  // o banco, entao nao precisa recriar a transacao nem reconsumir estoque:
  // se for venda, so devolve o estoque quando o delete de fato acontecer.
  const {
    pending: pendingDeleteTransacao,
    requestDelete: requestDeleteTransacao,
    cancelDelete: cancelDeleteTransacao,
  } = useDelayedDelete<Transaction>({
    deleteFn: async (tx) => {
      // A DEVOLUCAO VEM ANTES DA EXCLUSAO, e a ordem importa.
      //
      // `estoque_movimentos.transacao_id` e chave estrangeira com ON DELETE
      // SET NULL. Apagar a transacao primeiro zera esse vinculo, e o
      // estorno — que procura os movimentos justamente por ele — nao
      // acharia mais nada para devolver. Os insumos ficariam baixados para
      // sempre, em silencio.
      if (tx.type === 'venda') {
        try {
          await devolverPedido(tx.id);
        } catch (err: any) {
          alert(
            `⚠️ Os insumos não voltaram ao estoque:\n\n${err?.message || err}\n\n` +
              `O pedido NÃO foi excluído, para o estorno poder ser refeito. ` +
              `Confira a aba Produtos e tente de novo.`
          );
          return;
        }
      }

      try {
        await deleteTransacao(tx.id);
      } catch (err: any) {
        alert(`⚠️ Não foi possível excluir o pedido:\n\n${err?.message || err}`);
      }
    },
  });

  // As transacoes chegam do TransacoesProvider, que busca ao logar. Nao ha mais
  // carga na montagem nem estado local: o provider e a fonte.

  // Persist active tab to localStorage
  useEffect(() => {
    localStorage.setItem('carula_activeTab', activeTab);
  }, [activeTab]);

  // Fecha o modal de transacao ao trocar de aba: ele e um overlay fixed
  // inset-0 z-[99999] renderizado via portal, sem nenhuma ligacao com
  // activeTab — sem isto, trocar de aba com o modal aberto so muda o
  // conteudo por baixo, que continua invisivel atras do overlay (parece que
  // o app travou; so remontar o App do zero, saindo e voltando, "resolvia").
  useEffect(() => {
    setIsFormModalOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Dispara o tour de primeiros passos uma unica vez, na primeira entrada no
  // app depois do onboarding financeiro (AppContent so monta com o onboarding
  // ja concluido, ver FinancialOnboardingGate em App()). Nunca mais aparece
  // sozinho depois de visto ou pulado (tourPrimeirosPassosVistoEm != null).
  useEffect(() => {
    if (!TOUR_PRIMEIROS_PASSOS_HABILITADO) return;
    if (tourAtivo) return;
    if (!administrativeCosts || administrativeCosts.tourPrimeirosPassosVistoEm) return;

    setTabAntesDoTour(activeTab);
    setTourAtivo(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [administrativeCosts?.tourPrimeirosPassosVistoEm]);

  const handleIniciarTourManualmente = () => {
    setIsProfileModalOpen(false);
    setTabAntesDoTour(activeTab);
    setTourAtivo(true);
  };

  const handleFinalizarTour = () => {
    setTourAtivo(false);
    if (tabAntesDoTour) {
      setActiveTab(tabAntesDoTour);
      setTabAntesDoTour(null);
    }
    // Nao mexer em produtosAbaSolicitada aqui: ele so deve ser limpo quando a
    // pessoa efetivamente chegar em Produtos e a tela consumir o pedido (ver
    // onAbaInicialConsumida). Um reset aqui apagava a intencao "abrir em
    // Compras" guardada no Passo 1 antes dela ser usada — por exemplo quando
    // a pessoa termina o tour (que acaba no Passo 4/Inicio) e so depois vai
    // pra Produtos pelo checklist.
    marcarTourVisto().catch((err) => {
      console.error('Erro ao marcar tour como visto:', err);
    });
  };

  const handleSolicitarProdutosCompras = () => {
    setActiveTab('produtos');
    setProdutosAbaSolicitada('compras');
  };

  // Tira a transacao pendente de exclusao de toda tela/total na hora (mesmo
  // padrao de `fichasVisiveis`/`produtos` em FichasTecnicasModule.tsx e
  // ProdutosModule.tsx) — o DELETE real so vai pro banco 10s depois, ver
  // useDelayedDelete. Filtrado aqui na fonte, e nao em cada modulo filho,
  // para os totais (Dashboard, Custos, Compras) tambem refletirem a
  // ausencia na hora, nao so a lista visual de uma tela especifica.
  const transacoesVisiveis = pendingDeleteTransacao
    ? transactions.filter((t) => t.id !== pendingDeleteTransacao.id)
    : transactions;

  // Filtered transactions & financial metrics
  const filteredTransactions = filterTransactionsByPeriod(
    transacoesVisiveis,
    period,
    customStartDate,
    customEndDate
  );

  const summary = calculateSummary(filteredTransactions);

  // Handlers
  const handleOpenAddModal = (type: TransactionType = 'venda') => {
    // Para vendas, garantir que fichas foram carregadas antes de abrir o modal
    if (type === 'venda' && fichas.length === 0) {
      alert('⏳ As fichas técnicas ainda estão carregando. Tente novamente em alguns segundos.');
      return;
    }

    setFormInitialType(type);
    setEditingTransaction(null);
    // Pré-preencher com o período de referência do usuário para custos/mão de obra
    if ((type === 'custo' || type === 'maodeobra') && userProfile?.laborPeriod) {
      setPrefilledLaborPeriod(userProfile.laborPeriod);
    } else {
      setPrefilledLaborPeriod(null);
    }
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setFormInitialType(tx.type);
    setIsFormModalOpen(true);
  };

  const handleAddCompra = async (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      await addTransacao(txData);
    } catch (err: any) {
      alert(`⚠️ Não foi possível gravar o lançamento:\n\n${err?.message || err}`);
    }
  };

  /**
   * Converte os vinculos gravados no pedido nas fichas de verdade do catalogo.
   *
   * `tamanhoId` vai junto porque cada tamanho tem seus proprios insumos: um
   * bolo de 30 fatias nao consome o mesmo que um de 10. Sem repassar, a baixa
   * cairia na lista da ficha e debitaria a quantidade errada.
   */
  const resolverItensDoPedido = (fichaItems?: Transaction['fichaItems']) =>
    (fichaItems || [])
      .map((item) => {
        const ficha = fichas.find((f) => f.id === item.fichaId);
        if (!ficha) {
          console.warn(`[ESTOQUE] fichaId "${item.fichaId}" não está no catálogo; item não baixará estoque.`);
        }
        return ficha
          ? {
              ficha,
              quantity: item.quantity,
              tamanhoId: item.selectedTamanhoId as string | undefined,
            }
          : null;
      })
      .filter(
        (x): x is { ficha: FichaTecnica; quantity: number; tamanhoId: string | undefined } =>
          x !== null
      );

  /**
   * Insumo que a ficha pede e o estoque nao atendeu.
   *
   * Isto PRECISA aparecer na tela. A versao antiga criava um item fantasma e o
   * deixava negativo, entao a confeiteira nunca ficava sabendo que o cadastro
   * estava incompleto — o estoque so ia ficando errado.
   */
  const avisarProblemasDeBaixa = (problemas: ProblemaBaixa[]) => {
    if (problemas.length === 0) return;
    const linhas = problemas.map((p) =>
      p.motivo === 'sem-item-no-estoque'
        ? `• ${p.insumo} — não está cadastrado no catálogo de Produtos`
        : `• ${p.insumo} — a ficha usa "${p.unidadeFicha}" e o produto usa "${p.unidadeEstoque}"`
    );
    alert(
      `⚠️ O pedido foi salvo, mas estes insumos NÃO baixaram do estoque:\n\n` +
        `${linhas.join('\n')}\n\n` +
        `Ajuste na aba Produtos para a baixa funcionar nos próximos pedidos.`
    );
  };

  const handleSaveTransaction = async (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    editingId?: string
  ) => {
    if (editingId) {
      const existing = transactions.find((t) => t.id === editingId);
      if (!existing) return;

      const updated: Transaction = { ...existing, ...txData };

      try {
        await updateTransacao(editingId, updated);
      } catch (err: any) {
        alert(`⚠️ Não foi possível salvar o lançamento:\n\n${err?.message || err}`);
        return;
      }

      // Vendas reequilibram o estoque na edicao: devolve tudo o que a versao
      // antiga consumiu e consome de novo pela composicao nova. Nao calculamos
      // delta de proposito — delta so funciona quando muda apenas a quantidade,
      // e quebra quando a confeiteira troca o produto ou mistura itens.
      if (updated.type === 'venda') {
        try {
          await devolverPedido(editingId);
          const itens = resolverItensDoPedido(updated.fichaItems);
          if (itens.length > 0) {
            const resultado = await consumirParaPedido(itens, editingId);
            avisarProblemasDeBaixa(resultado.problemas);
          }
        } catch (err: any) {
          alert(
            `⚠️ O pedido foi atualizado, mas o estoque não pôde ser reajustado:\n\n` +
              `${err?.message || err}\n\nConfira as quantidades na aba Produtos.`
          );
        }
      }
      return;
    }

    // Validação defensiva: se é venda mas fichaItems chegou vazio, bloqueia
    // submit e avisa. Impede que a venda seja registrada sem dar baixa no estoque.
    if (txData.type === 'venda' && (!txData.fichaItems || txData.fichaItems.length === 0)) {
      alert('⚠️ Erro: nenhum produto foi vinculado à ficha técnica. Verifique se os produtos estão cadastrados e tente novamente.');
      return;
    }

    if (txData.type !== 'venda') {
      try {
        await addTransacao(txData);
      } catch (err: any) {
        alert(`⚠️ Não foi possível gravar o lançamento:\n\n${err?.message || err}`);
      }
      return;
    }

    // A venda e gravada ANTES da baixa, de proposito. Se a rede cair no meio,
    // preferimos uma venda registrada com aviso de estoque a uma venda perdida:
    // o estoque a confeiteira consegue corrigir, o pedido do cliente nao.
    let criada: Transaction;
    try {
      criada = await addTransacao(txData);
    } catch (err: any) {
      alert(`⚠️ Não foi possível gravar o pedido:\n\n${err?.message || err}\n\nNada foi salvo.`);
      return;
    }

    try {
      const itens = resolverItensDoPedido(criada.fichaItems);
      if (itens.length > 0) {
        const resultado = await consumirParaPedido(itens, criada.id);
        avisarProblemasDeBaixa(resultado.problemas);
      }
    } catch (err: any) {
      alert(
        `⚠️ O pedido foi salvo, mas a baixa de estoque falhou:\n\n${err?.message || err}\n\n` +
          `Nenhum insumo foi debitado. Confira a aba Produtos.`
      );
    }
  };

  const handleRequestDelete = (tx: Transaction) => {
    setDeletingTransaction(tx);
  };

  const handleTogglePaymentStatus = async (tx: Transaction) => {
    const newStatus = tx.paymentStatus === 'pendente' ? 'pago' : 'pendente';
    try {
      await updateTransacao(tx.id, { ...tx, paymentStatus: newStatus });
    } catch (err: any) {
      alert(`⚠️ Não foi possível mudar o status do pagamento:\n\n${err?.message || err}`);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingTransaction) {
      requestDeleteTransacao(deletingTransaction);
      setDeletingTransaction(null);
    }
  };

  const handleRestoreTransactions = async (txs: Transaction[]) => {
    try {
      await substituirTudo(txs);
    } catch (err: any) {
      alert(`⚠️ Não foi possível restaurar o backup:\n\n${err?.message || err}`);
    }
  };

  const handleClearAll = async () => {
    try {
      await limparTudo();
    } catch (err: any) {
      alert(`⚠️ Não foi possível limpar os lançamentos:\n\n${err?.message || err}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
    setIsProfileModalOpen(false);
  };

  if (isOtpVerificationRequired) {
    return <VerifyOtpPage />;
  }

  if (isResetPasswordRequired) {
    return <ResetPasswordPage />;
  }

  return (
      <div className="min-h-screen text-[var(--color-ink)] flex flex-col font-sans" style={{ overflow: 'hidden' }}>

        {/* Main Screen Container */}
        <main className="flex-1 max-w-full w-full mx-auto px-0 pb-20 bottom-nav-safe" style={{
          paddingTop: 'max(0px, env(safe-area-inset-top))',
          paddingLeft: 'max(0px, env(safe-area-inset-left))',
          paddingRight: 'max(0px, env(safe-area-inset-right))',
        }}>

        {/* Tab Content Router */}
        {activeTab === 'dashboard' && (
          <Dashboard
            summary={summary}
            period={period}
            recentTransactions={filteredTransactions}
            allTransactions={transacoesVisiveis}
            onOpenAddModal={handleOpenAddModal}
            onOpenAddModalWithDate={(date) => {
              setPrefilledDate(date);
              handleOpenAddModal('venda');
            }}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onNavigateToProdutosCompras={handleSolicitarProdutosCompras}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleRequestDelete}
            onTogglePaymentStatus={handleTogglePaymentStatus}
            onOpenPwaModal={() => setIsPwaModalOpen(true)}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
            onOpenGlossaryModal={() => setIsGlossaryModalOpen(true)}
            onOpenProfileModal={() => {
              if (user) {
                setIsProfileModalOpen(true);
              } else {
                setIsLoginModalOpen(true);
              }
            }}
          />
        )}

        {activeTab === 'pedidos' && (
          <OrdersModule
            transactions={transacoesVisiveis}
            onOpenAddModal={(type) => handleOpenAddModal(type || 'venda')}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleRequestDelete}
            onTogglePaymentStatus={handleTogglePaymentStatus}
          />
        )}

        {activeTab === 'semana' && (
          <WeeklyClosingModule
            transactions={transacoesVisiveis}
            onOpenAddModal={() => handleOpenAddModal('venda')}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleRequestDelete}
            onTogglePaymentStatus={handleTogglePaymentStatus}
          />
        )}

        {activeTab === 'produtos' && (
          <ProdutosModule
            transactions={transacoesVisiveis}
            onAddTransaction={handleAddCompra}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleRequestDelete}
            abaInicial={produtosAbaSolicitada}
            onAbaInicialConsumida={() => setProdutosAbaSolicitada(undefined)}
          />
        )}

        {activeTab === 'fichas' && (
          <FichasTecnicasModule
            onAddTransaction={async (txData) => {
              try {
                await addTransacao(txData);
              } catch (err: any) {
                alert(`⚠️ Não foi possível gravar o lançamento:\n\n${err?.message || err}`);
              }
            }}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'clientes' && (
          <CustomersModule />
        )}

        {activeTab === 'vendas' && (
          <SalesModule
            transactions={filteredTransactions}
            onOpenAddModal={() => handleOpenAddModal('venda')}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleRequestDelete}
            onTogglePaymentStatus={handleTogglePaymentStatus}
          />
        )}

        {activeTab === 'reposicao' && (
          <RestockModule
            transactions={filteredTransactions}
            onOpenAddModal={() => handleOpenAddModal('reposicao')}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleRequestDelete}
          />
        )}

        {activeTab === 'custos' && (
          <CostsModule
            transactions={filteredTransactions}
            onOpenAddModal={(type) => handleOpenAddModal(type || 'custo')}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleRequestDelete}
          />
        )}

        {activeTab === 'historico' && (
          <HistoryModule
            transactions={filteredTransactions}
            onOpenAddModal={() => handleOpenAddModal('venda')}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleRequestDelete}
            onTogglePaymentStatus={handleTogglePaymentStatus}
          />
        )}

        </main>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Transaction Form Modal */}
      <TransactionFormModal
        isOpen={isFormModalOpen}
        initialType={formInitialType}
        editingTransaction={editingTransaction}
        prefilledDate={prefilledDate}
        prefilledLaborPeriod={prefilledLaborPeriod}
        fichas={fichas}
        onClose={() => {
          setIsFormModalOpen(false);
          setPrefilledDate(null);
          setPrefilledLaborPeriod(null);
        }}
        onSave={(tx, editingId) => {
          handleSaveTransaction(tx, editingId);
          setPrefilledDate(null);
          setPrefilledLaborPeriod(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <GenericDeleteConfirmModal
        isOpen={!!deletingTransaction}
        itemType="transaction"
        titleOverride={deletingTransaction?.type === 'venda' ? 'Excluir Pedido?' : 'Excluir Lançamento?'}
        itemDetails={[
          ...(deletingTransaction?.type === 'venda' && deletingTransaction?.customerName
            ? [{ label: '👤', value: deletingTransaction.customerName.toUpperCase() }]
            : []),
          { label: '💰', value: formatCurrency(deletingTransaction?.totalValue || 0) },
          { label: '📅', value: deletingTransaction ? formatDateBr(deletingTransaction.date) : '' },
        ]}
        onClose={() => setDeletingTransaction(null)}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* iPhone / Mobile PWA Installation Guide Modal */}
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
      />

      {/* Glossario dos termos financeiros (Fase 4, item 2) */}
      <GlossaryModal
        isOpen={isGlossaryModalOpen}
        onClose={() => setIsGlossaryModalOpen(false)}
      />

      {/* Backup and Data Management Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        transactions={transactions}
        onClose={() => setIsBackupModalOpen(false)}
        onRestoreTransactions={handleRestoreTransactions}
        onClearAll={handleClearAll}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsLoginModalOpen(false);
          setIsProfileModalOpen(true);
        }}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onLogout={handleLogout}
        onIniciarTour={TOUR_PRIMEIROS_PASSOS_HABILITADO ? handleIniciarTourManualmente : undefined}
      />

      {/* Tour guiado de primeiros passos (Produtos -> Fichas -> Pedidos) */}
      {TOUR_PRIMEIROS_PASSOS_HABILITADO && tourAtivo && (
        <TourPrimeirosPassos
          onNavigateToTab={setActiveTab}
          onSolicitarAbaProdutos={setProdutosAbaSolicitada}
          onFinish={handleFinalizarTour}
        />
      )}

      {/* Toast de exclusao pendente: some enquanto os 10s de "Desfazer" ainda
          estao correndo (ver `pendingDeleteTransacao`). */}
      {pendingDeleteTransacao && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
          <div
            className="flex items-center gap-3.5 animate-fadeIn"
            style={{ padding: '10px 12px 10px 18px', borderRadius: '999px', background: '#3A2350', boxShadow: '0 20px 36px rgba(58,35,80,0.26)' }}
          >
            <span className="flex items-center gap-2 text-sm font-bold text-white whitespace-nowrap">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A9D8B8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {pendingDeleteTransacao.type === 'venda' ? 'Pedido deletado' : 'Lançamento deletado'}
            </span>
            <button
              type="button"
              onClick={cancelDeleteTransacao}
              className="flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
              style={{ padding: '8px 14px', borderRadius: '999px', border: 'none', background: '#F5B9C6', color: '#6E2231', cursor: 'pointer' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11" />
              </svg>
              Desfazer
            </button>
          </div>
        </div>
      )}

      </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        {/* Fontes unicas de clientes e fichas tecnicas. Ficam dentro do
            ProtectedRoute porque dependem do usuario autenticado, e envolvem
            tudo para que as telas que GRAVAM e as que LEEM compartilhem a mesma
            lista — antes cada uma tinha sua copia e o cadastro novo so aparecia
            do outro lado depois de recarregar a pagina. */}
        {/* CurrencyProvider fica aqui (e nao mais dentro de AppContent) para que
            o onboarding financeiro obrigatorio, que renderiza ANTES de AppContent
            via FinancialOnboardingGate, tambem tenha acesso a useCurrency() — uma
            unica instancia do provider, nunca duas fontes de moeda em paralelo. */}
        <CurrencyProvider>
          <CustomersProvider>
            <FichasTecnicasProvider>
              <CostsProvider>
                {/* Onboarding financeiro obrigatorio (spec "Minha Empresa", Parte
                    3): bloqueia o restante do app ate a usuaria concluir. Fica
                    aqui, e nao em ProtectedRoute, porque so o CostsProvider tem
                    o dado que decide o bloqueio (onboardingCompletoEm). */}
                <FinancialOnboardingGate>
                  <ProdutosProvider>
                    <TransacoesProvider>
                      <AppContent />
                    </TransacoesProvider>
                  </ProdutosProvider>
                </FinancialOnboardingGate>
              </CostsProvider>
            </FichasTecnicasProvider>
          </CustomersProvider>
        </CurrencyProvider>
      </ProtectedRoute>
    </AuthProvider>
  );
}
