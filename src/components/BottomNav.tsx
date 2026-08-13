import React from 'react';
import { TabType } from '../types';
import {
  Home,
  ShoppingBag,
  BookOpen,
  Users,
  Boxes,
  Wallet,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Início',
      icon: Home,
    },
    {
      id: 'pedidos' as TabType,
      label: 'Pedidos',
      icon: ShoppingBag,
    },
    {
      id: 'fichas' as TabType,
      label: 'Fichas',
      icon: BookOpen,
    },
    {
      id: 'clientes' as TabType,
      label: 'Clientes',
      icon: Users,
    },
    {
      id: 'estoque' as TabType,
      label: 'Estoque',
      icon: Boxes,
    },
    {
      id: 'saldos' as TabType,
      label: 'Saldos',
      icon: Wallet,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-black/8 shadow-nav-bottom pb-safe">
      <div className="max-w-lg mx-auto flex items-center justify-around px-1" style={{ padding: '12px 8px 22px' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center flex-1 px-2 py-1 rounded-[14px] transition-all duration-250 ${
                isActive
                  ? 'bg-gradient-to-r from-[var(--color-rose-200)] to-[var(--color-rose-600)] text-[var(--color-brand-900)] -translate-y-1 font-black'
                  : 'text-[var(--color-ink-soft)]'
              }`}
            >
              <Icon className="w-5 h-5 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-[0.14em] mt-0.5">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
