// v2.0 - Updated with PDF image rendering fixes and visual redesign
import React, { useState, useEffect } from 'react';
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
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { PeriodSelector } from './components/PeriodSelector';
import { Dashboard } from './components/Dashboard';
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

export default function App() {
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
    deleteTransaction(id);
    setTransactions(getStoredTransactions());
    setDeletingTransaction(null);
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

  return (
    <CurrencyProvider>
      <div className="min-h-screen text-[var(--color-ink)] flex flex-col lg:flex-row font-sans lg:rounded-none" style={{
        overflow: 'hidden',
      }}>


      {/* Desktop Sidebar — 236px, degradê roxo (referência 13a) */}
      <aside
        className="hidden lg:flex flex-col w-[236px] fixed left-0 top-0 bottom-0 z-50 text-white"
        style={{
          background: 'var(--sidebar-gradient)',
          padding: '26px 18px',
        }}
      >
        {/* Avatar + Marca */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => setIsPwaModalOpen(true)}
            className="flex-shrink-0 w-10 h-10 rounded-full transition-transform duration-250 hover:scale-105"
            style={{
              background: 'linear-gradient(140deg, var(--color-rose-200), var(--color-rose-600))',
              padding: '2px',
            }}
            title="Perfil"
          >
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <span className="font-marca text-lg text-[var(--color-brand-700)]">C</span>
            </div>
          </button>
          <div>
            <div className="font-marca text-[26px] text-white" style={{ lineHeight: 1 }}>Carula</div>
            <div className="text-[8px] font-bold uppercase tracking-[0.44em] text-white/70 mt-0.5">Confeitaria</div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-1">
          {[
            { id: 'dashboard', label: 'Início', icon: Home },
            { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
            { id: 'fichas', label: 'Fichas', icon: BookOpen },
            { id: 'clientes', label: 'Clientes', icon: Users },
            { id: 'estoque', label: 'Estoque', icon: Boxes },
            { id: 'saldos', label: 'Saldos', icon: Wallet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`sidebar-item w-full flex items-center gap-[11px] font-semibold text-[12.5px] cursor-pointer ${
                  isActive ? 'text-[var(--color-brand-900)]' : 'text-[#C7B6CE]'
                }`}
                style={{
                  padding: '11px 13px',
                  borderRadius: '14px',
                  background: isActive ? 'var(--active-nav-gradient)' : 'transparent',
                }}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.9} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Rodapé sidebar */}
        <div className="pt-4 space-y-2 border-t border-white/10">
          <button
            onClick={() => setIsPwaModalOpen(true)}
            className="sidebar-item w-full flex items-center gap-2 text-[9.5px] font-extrabold uppercase tracking-wide cursor-pointer text-[var(--color-rose-200)]"
            style={{
              padding: '8px 11px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <Smartphone className="w-[13px] h-[13px]" strokeWidth={2} />
            Versão Mobile
          </button>
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="sidebar-item w-full flex items-center gap-2 text-[9.5px] font-bold cursor-pointer text-white/75"
            style={{
              padding: '8px 11px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.08)',
            }}
          >
            <Download className="w-[13px] h-[13px]" strokeWidth={2} />
            Baixar dados
          </button>
        </div>
      </aside>

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col lg:ml-[236px]">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <Header
            onOpenPwaModal={() => setIsPwaModalOpen(true)}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
          />
        </div>

        {/* Main Screen Container */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-0 lg:px-4 pb-20 lg:pb-8 bottom-nav-safe" style={{
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
      </div>

      {/* Fixed Bottom Navigation Bar - Mobile Only */}
      <div className="lg:hidden">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

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
      />

      </div>
    </CurrencyProvider>
  );
}
