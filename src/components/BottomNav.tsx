import React from 'react';
import { TabType } from '../types';

// SVG Icons matching the reference design exactly
const IconInicio = (props: { stroke: string; strokeWidth: number }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" {...props} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>
  </svg>
);

const IconPedidos = (props: { stroke: string; strokeWidth: number }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" {...props} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16l-1.2 13H5.2z"/>
    <path d="M9 7a3 3 0 0 1 6 0"/>
  </svg>
);

const IconFichas = (props: { stroke: string; strokeWidth: number }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" {...props} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h9a3 3 0 0 1 3 3v13H6a2 2 0 0 1-2-2z"/>
    <path d="M20 5v15"/>
  </svg>
);

const IconClientes = (props: { stroke: string; strokeWidth: number }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" {...props} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8.5" r="3.2"/>
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0"/>
    <circle cx="17.5" cy="10" r="2.2"/>
  </svg>
);

const IconEstoque = (props: { stroke: string; strokeWidth: number }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" {...props} strokeLinejoin="round">
    <rect x="3" y="10" width="8" height="7" rx="1.2"/>
    <rect x="13" y="10" width="8" height="7" rx="1.2"/>
    <rect x="8" y="3" width="8" height="6" rx="1.2"/>
  </svg>
);

const IconSaldos = (props: { stroke: string; strokeWidth: number }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" {...props} strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="13" rx="3"/>
    <circle cx="17" cy="12.5" r="1.4" fill={props.stroke} stroke="none"/>
  </svg>
);

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Início', icon: IconInicio },
    { id: 'pedidos' as TabType, label: 'Pedidos', icon: IconPedidos },
    { id: 'fichas' as TabType, label: 'Fichas', icon: IconFichas },
    { id: 'clientes' as TabType, label: 'Clientes', icon: IconClientes },
    { id: 'estoque' as TabType, label: 'Estoque', icon: IconEstoque },
    { id: 'saldos' as TabType, label: 'Saldos', icon: IconSaldos },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white shadow-nav-bottom pb-safe"
      style={{
        borderTop: '1px solid var(--color-border-nav)',
        zIndex: 9999,
      }}
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
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 11px',
                borderRadius: '16px',
                background: isActive ? '#3A2350' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.25s ease',
                boxShadow: isActive ? '0 8px 18px rgba(58, 35, 80, 0.3)' : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Icon
                stroke={isActive ? '#F5B9C6' : '#A096A6'}
                strokeWidth={1.9}
                style={{ transition: 'stroke 0.25s ease' }}
              />
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#F5B9C6' : '#A096A6',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  transition: 'color 0.25s ease',
                }}
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
