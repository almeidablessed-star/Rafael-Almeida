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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAFAF7]/95 backdrop-blur-md border-t border-[#E6E1DB]/40 shadow-md pb-safe">
      <div className="max-w-lg mx-auto flex items-center justify-around px-1 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-lg transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'text-[#C9A878] bg-[#3E3430]/5 font-bold shadow-xs'
                  : 'text-[#5C5550] hover:text-[#0D0B08]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current" />
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
