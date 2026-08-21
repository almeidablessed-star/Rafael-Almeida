// v2.1 - Fresh rebuild with latest redesign - force Vercel deployment
import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import {
  Transaction,
  TabType,
  TimePeriod,
  TransactionType,
} from './types';
import {
  getStoredTransactions,
  addTransaction,
  addSaleWithFicha,
  updateTransaction,
  deleteTransaction,
  resetToSampleData,
  clearAllTransactions,
  saveTransactions,
  filterTransactionsByPeriod,
  calculateSummary,
} from './utils/storage';
import { getTodayIso } from './utils/formatters';
import { getStoredFichas } from './components/FichasTecnicasModule';
import { useUndo } from './hooks/useUndo';

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
import { LaborModule } from './components/LaborModule';
import { CostsModule } from './components/CostsModule';
import { HistoryModule } from './components/HistoryModule';
import { CatalogModule } from './components/CatalogModule';
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

function AppContent() {
  const { isResetPasswordRequired, isOtpVerificationRequired } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Period filter state
  const [period, setPeriod] = useState<TimePeriod>('mes'); // Default to 'Este Mês'
  const [customStartDate, setCustomStartDate] = useState<string>(getTodayIso());
  const [customEndDate, setCustomEndDate] = useState<string>(getTodayIso());

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formInitialType, setFormInitialType] = useState<TransactionType>('venda');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(() => {
    return localStorage.getItem('carula_logged_in') === 'true';
  });

  // Undo state
  const { saveForUndo, getUndoData, hasUndo } = useUndo();
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Load transactions on mount
  useEffect(() => {
    const data = getStoredTransactions();
    setTransactions(data);
  }, []);

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
    setFormInitialType(type);
    setEditingTransaction(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setFormInitialType(tx.type);
    setIsFormModalOpen(true);
  };

  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    editingId?: string
  ) => {
    if (editingId) {
      const existing = transactions.find((t) => t.id === editingId);
      if (existing) {
        const updated: Transaction = {
          ...existing,
          ...txData,
        };
        updateTransaction(updated);
        setTransactions(getStoredTransactions());
      }
    } else {
      // If fichaId is present, use addSaleWithFicha for automatic stock deduction
      if (txData.fichaId && txData.type === 'venda') {
        const fichas = getStoredFichas();
        const ficha = fichas.find((f) => f.id === txData.fichaId);
        if (ficha) {
          // Remove fichaId from txData as addSaleWithFicha expects it separately
          const { fichaId, ...txDataWithoutFicha } = txData;
          addSaleWithFicha(txDataWithoutFicha, ficha);
        } else {
          // Fallback if ficha not found
          addTransaction(txData);
        }
      } else {
        addTransaction(txData);
      }
      setTransactions(getStoredTransactions());
    }
  };

  const handleRequestDelete = (tx: Transaction) => {
    setDeletingTransaction(tx);
  };

  const handleTogglePaymentStatus = (tx: Transaction) => {
    const newStatus = tx.paymentStatus === 'pendente' ? 'pago' : 'pendente';
    const updated: Transaction = {
      ...tx,
      paymentStatus: newStatus,
    };
    updateTransaction(updated);
    setTransactions(getStoredTransactions());
  };

  const handleConfirmDelete = (id: string) => {
    // Save for undo before deleting
    const toDelete = transactions.find(t => t.id === id);
    if (toDelete) {
      saveForUndo(toDelete);
      setShowUndoToast(true);
      // Auto-hide toast after 10 seconds
      setTimeout(() => setShowUndoToast(false), 10000);
    }

    deleteTransaction(id);
    setTransactions(getStoredTransactions());
    setDeletingTransaction(null);
  };

  const handleUndo = () => {
    const undoTx = getUndoData();
    if (undoTx) {
      addTransaction(undoTx);
      setTransactions(getStoredTransactions());
      setShowUndoToast(false);
    }
  };

  const handleRestoreTransactions = (txs: Transaction[]) => {
    saveTransactions(txs);
    setTransactions(txs);
  };

  const handleResetSampleData = () => {
    const samples = resetToSampleData();
    setTransactions(samples);
  };

  const handleClearAll = () => {
    const cleared = clearAllTransactions();
    setTransactions(cleared);
  };

  const handleLogout = () => {
    localStorage.setItem('carula_logged_in', 'false');
    localStorage.removeItem('carula_current_user');
    localStorage.removeItem('user_email');
    setIsUserLoggedIn(false);
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
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleRequestDelete}
            onTogglePaymentStatus={handleTogglePaymentStatus}
            onOpenPwaModal={() => setIsPwaModalOpen(true)}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
            onOpenProfileModal={() => {
              if (isUserLoggedIn) {
                setIsProfileModalOpen(true);
              } else {
                setIsLoginModalOpen(true);
              }
            }}
          />
        )}

        {activeTab === 'pedidos' && (
          <OrdersModule
            transactions={filteredTransactions}
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

        {activeTab === 'saldos' && (
          <BalancesAndExpensesModule
            transactions={transactions}
            onAddTransaction={(txData) => {
              addTransaction(txData);
              setTransactions(getStoredTransactions());
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
            onAddTransaction={(txData) => {
              addTransaction(txData);
              setTransactions(getStoredTransactions());
            }}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'clientes' && (
          <CustomersModule />
        )}

        {activeTab === 'catalogo' && (
          <CatalogModule
            onAddTransaction={(txData) => {
              addTransaction(txData);
              setTransactions(getStoredTransactions());
            }}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
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

        {activeTab === 'maodeobra' && (
          <LaborModule
            transactions={filteredTransactions}
            onOpenAddModal={() => handleOpenAddModal('maodeobra')}
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
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveTransaction}
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
        onResetSampleData={handleResetSampleData}
        onClearAll={handleClearAll}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(email) => {
          setIsUserLoggedIn(true);
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
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}
