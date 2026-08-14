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
    { id: 'dashboard' as TabType, label: 'Início', icon: Home },
    { id: 'pedidos' as TabType, label: 'Pedidos', icon: ShoppingBag },
    { id: 'fichas' as TabType, label: 'Fichas', icon: BookOpen },
    { id: 'clientes' as TabType, label: 'Clientes', icon: Users },
    { id: 'estoque' as TabType, label: 'Estoque', icon: Boxes },
    { id: 'saldos' as TabType, label: 'Saldos', icon: Wallet },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-nav-bottom pb-safe"
      style={{ borderTop: '1px solid var(--color-border-nav)' }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around" style={{ padding: '12px 8px 22px' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center flex-1 px-1 py-1 color-transition ${
                isActive
                  ? 'text-[var(--color-rose-200)] bg-[var(--color-brand-900)] rounded-[16px]'
                  : 'text-[#A096A6]'
              }`}
              style={{
                transition: 'transform 150ms cubic-bezier(0.23, 1, 0.32, 1), background-color 200ms ease, color 200ms ease',
                transform: isActive ? 'translateY(-4px) scale(1)' : 'translateY(0) scale(1)',
              }}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} style={{ transition: 'stroke-width 150ms ease' }} />
              <span
                className={`text-[9px] mt-1 uppercase tracking-wide ${
                  isActive ? 'font-extrabold' : 'font-semibold'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
