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

const IconCompras = (props: { stroke: string; strokeWidth: number }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" {...props} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h2.4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 7H6.2"/>
    <circle cx="9.5" cy="21" r="1.3" fill={props.stroke} stroke="none"/>
    <circle cx="18" cy="21" r="1.3" fill={props.stroke} stroke="none"/>
  </svg>
);

const IconCustos = (props: { stroke: string; strokeWidth: number }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" {...props} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22"/>
    <path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
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
    { id: 'compras' as TabType, label: 'Compras', icon: IconCompras },
    { id: 'custos' as TabType, label: 'Custos', icon: IconCustos },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white shadow-nav-bottom pb-safe"
      style={{
        borderTop: '1px solid var(--color-border-nav)',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '10px 4px',
          width: '100%',
          overflowX: 'auto',
          overscrollBehavior: 'contain',
          maxWidth: '100%',
        }}
      >
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
                gap: '4px',
                padding: '8px 4px',
                borderRadius: '14px',
                background: isActive ? '#3A2350' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.25s ease',
                boxShadow: isActive ? '0 8px 18px rgba(58, 35, 80, 0.3)' : 'none',
                flex: '1 1 0%',
                minWidth: 0,
                whiteSpace: 'nowrap',
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
                style={{ transition: 'stroke 0.25s ease', width: '18px', height: '18px' }}
              />
              <span
                style={{
                  fontSize: '8px',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#F5B9C6' : '#A096A6',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
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
