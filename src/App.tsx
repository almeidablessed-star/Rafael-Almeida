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
import { filterTransactionsByPeriod, calculateSummary } from './utils/storage';
import { getTodayIso } from './utils/formatters';
import { useUndo } from './hooks/useUndo';
import { useFichasTecnicas } from './context/FichasTecnicasContext';
import { useEstoque } from './context/EstoqueContext';
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
import { BalancesAndExpensesModule } from './components/BalancesAndExpensesModule';
import { EstoqueModule } from './components/EstoqueModule';
import { FichasTecnicasModule } from './components/FichasTecnicasModule';
import { CustomersModule } from './components/CustomersModule';
import { TransactionFormModal } from './components/TransactionFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { BackupModal } from './components/BackupModal';
import { ProfileModal } from './components/ProfileModal';
import { LoginModal } from './components/LoginModal';
import { CurrencyProvider } from './context/CurrencyContext';
import { CustomersProvider } from './context/CustomersContext';
import { FichasTecnicasProvider } from './context/FichasTecnicasContext';
import { CostsProvider } from './context/CostsContext';
import { EstoqueProvider } from './context/EstoqueContext';

function AppContent() {
  const { isResetPasswordRequired, isOtpVerificationRequired, user, userProfile, logout } = useAuth();
  const { fichas } = useFichasTecnicas();
  const { consumirParaPedido, devolverPedido } = useEstoque();
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
    if (saved === 'saldos') {
      localStorage.setItem('carula_activeTab', 'compras');
      return 'compras';
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

  // Undo state
  const { saveForUndo, getUndoData, hasUndo } = useUndo();
  const [showUndoToast, setShowUndoToast] = useState(false);

  // As transacoes chegam do TransacoesProvider, que busca ao logar. Nao ha mais
  // carga na montagem nem estado local: o provider e a fonte.

  // Persist active tab to localStorage
  useEffect(() => {
    localStorage.setItem('carula_activeTab', activeTab);
  }, [activeTab]);

  // Filtered transactions & financial metrics
  const filteredTransactions = filterTransactionsByPeriod(
    transactions,
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
        ? `• ${p.insumo} — não está cadastrado na aba Estoque`
        : `• ${p.insumo} — a ficha usa "${p.unidadeFicha}" e o estoque usa "${p.unidadeEstoque}"`
    );
    alert(
      `⚠️ O pedido foi salvo, mas estes insumos NÃO baixaram do estoque:\n\n` +
        `${linhas.join('\n')}\n\n` +
        `Ajuste na aba Estoque para a baixa funcionar nos próximos pedidos.`
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
              `${err?.message || err}\n\nConfira as quantidades na aba Estoque.`
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
          `Nenhum insumo foi debitado. Confira a aba Estoque.`
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

  const handleConfirmDelete = async (id: string) => {
    // Save for undo before deleting
    const toDelete = transactions.find(t => t.id === id);
    if (toDelete) {
      saveForUndo(toDelete);
      setShowUndoToast(true);
      // Auto-hide toast after 10 seconds
      setTimeout(() => setShowUndoToast(false), 10000);
    }

    setDeletingTransaction(null);

    // A DEVOLUCAO VEM ANTES DA EXCLUSAO, e a ordem importa.
    //
    // `estoque_movimentos.transacao_id` e chave estrangeira com ON DELETE SET
    // NULL. Apagar a transacao primeiro zera esse vinculo, e o estorno — que
    // procura os movimentos justamente por ele — nao acharia mais nada para
    // devolver. Os insumos ficariam baixados para sempre, em silencio.
    if (toDelete?.type === 'venda') {
      try {
        await devolverPedido(id);
      } catch (err: any) {
        alert(
          `⚠️ Os insumos não voltaram ao estoque:\n\n${err?.message || err}\n\n` +
            `O pedido NÃO foi excluído, para o estorno poder ser refeito. ` +
            `Confira a aba Estoque e tente de novo.`
        );
        return;
      }
    }

    try {
      await deleteTransacao(id);
    } catch (err: any) {
      alert(`⚠️ Não foi possível excluir o pedido:\n\n${err?.message || err}`);
    }
  };

  const handleUndo = async () => {
    const undoTx = getUndoData();
    if (!undoTx) return;

    // Recriada com id novo; a baixa e refeita sob esse id para o rastro no
    // estoque continuar apontando para o pedido que existe de fato.
    let recriada: Transaction;
    try {
      recriada = await addTransacao(undoTx);
    } catch (err: any) {
      alert(`⚠️ Não foi possível restaurar o pedido:\n\n${err?.message || err}`);
      return;
    }

    setShowUndoToast(false);

    if (recriada.type === 'venda') {
      try {
        const itens = resolverItensDoPedido(recriada.fichaItems);
        if (itens.length > 0) {
          await consumirParaPedido(itens, recriada.id);
        }
      } catch (err: any) {
        alert(`⚠️ Pedido restaurado, mas a baixa de estoque falhou:\n\n${err?.message || err}`);
      }
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
    <CurrencyProvider>
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
            allTransactions={transactions}
            onOpenAddModal={handleOpenAddModal}
            onOpenAddModalWithDate={(date) => {
              setPrefilledDate(date);
              handleOpenAddModal('venda');
            }}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleRequestDelete}
            onTogglePaymentStatus={handleTogglePaymentStatus}
            onOpenPwaModal={() => setIsPwaModalOpen(true)}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
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
            transactions={transactions}
            onOpenAddModal={(type) => handleOpenAddModal(type || 'venda')}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleRequestDelete}
            onTogglePaymentStatus={handleTogglePaymentStatus}
          />
        )}

        {activeTab === 'semana' && (
          <WeeklyClosingModule
            transactions={transactions}
            onOpenAddModal={() => handleOpenAddModal('venda')}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleRequestDelete}
            onTogglePaymentStatus={handleTogglePaymentStatus}
          />
        )}

        {activeTab === 'compras' && (
          <BalancesAndExpensesModule
            transactions={transactions}
            onAddTransaction={async (txData) => {
              try {
                await addTransacao(txData);
              } catch (err: any) {
                alert(`⚠️ Não foi possível gravar o lançamento:\n\n${err?.message || err}`);
              }
            }}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleRequestDelete}
          />
        )}

        {activeTab === 'estoque' && (
          <EstoqueModule />
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

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingTransaction}
        transaction={deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* iPhone / Mobile PWA Installation Guide Modal */}
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
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
      />

      {/* Undo Toast */}
      {showUndoToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 rounded-2xl p-4 z-40 flex items-center gap-3 shadow-lg" style={{ background: 'linear-gradient(135deg, #6E3F72 0%, #3A2350 100%)', animation: 'fadeIn 0.3s ease-out', fontFamily: "'Manrope', sans-serif" }}>
          <span className="text-sm font-bold text-white">✓ Pedido deletado</span>
          <button
            onClick={handleUndo}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 hover:shadow-md"
            style={{ background: '#F5B9C6', color: '#3A2350', fontFamily: "'Manrope', sans-serif" }}
          >
            ↩️ Desfazer
          </button>
        </div>
      )}

      </div>
    </CurrencyProvider>
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
        <CustomersProvider>
          <FichasTecnicasProvider>
            <CostsProvider>
              <EstoqueProvider>
                <TransacoesProvider>
                  <AppContent />
                </TransacoesProvider>
              </EstoqueProvider>
            </CostsProvider>
          </FichasTecnicasProvider>
        </CustomersProvider>
      </ProtectedRoute>
    </AuthProvider>
  );
}
