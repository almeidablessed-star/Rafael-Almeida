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
              className={`flex flex-col items-center justify-center flex-1 px-1 transition-all duration-250 active:scale-95 ${
                isActive
                  ? 'text-[var(--color-rose-200)] bg-[var(--color-brand-900)] rounded-[16px] py-1 font-bold -translate-y-1'
                  : 'text-[#A096A6] hover:text-[var(--color-brand-900)] hover:-translate-y-1'
              }`}
            >
              <Icon className="w-5 h-5 transition-transform" />
              <span className="text-[9px] mt-0.5 font-black uppercase tracking-wide mt-1">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
