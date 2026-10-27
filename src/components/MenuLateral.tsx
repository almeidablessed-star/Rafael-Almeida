import React from 'react';
import { TabType } from '../types';
import { ABAS_DO_MENU } from './BottomNav';
import { LogoCarulaApp } from './LogoCarulaApp';

/**
 * Menu lateral da versao computador (docs/design/desktop-redesign/README.md,
 * "Estrutura comum"). Faz no computador o papel do BottomNav: mesmas abas,
 * mesmos icones, mesma ordem — so muda a disposicao. O botao "Lancar Pedido"
 * abre o mesmo modal de novo pedido do resto do app.
 *
 * Fica fixo na altura da janela, entao continua a vista enquanto a pagina rola.
 * As cores de hover e foco ficam em index.css (`.menu-lateral-item`).
 */
interface MenuLateralProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLancarPedido: () => void;
}

export const MenuLateral: React.FC<MenuLateralProps> = ({ activeTab, onTabChange, onLancarPedido }) => (
  <aside
    className="menu-lateral"
    style={{
      position: 'fixed',
      top: 0,
      bottom: 0,
      left: 0,
      width: 'var(--menu-lateral, 248px)',
      boxSizing: 'border-box',
      overflowY: 'auto',
      background: '#FFFFFF',
      boxShadow: '1px 0 0 rgba(58,35,80,0.06)',
      padding: '30px 18px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
      fontFamily: "'Manrope', system-ui, sans-serif",
      zIndex: 40,
    }}
  >
    <span style={{ display: 'inline-flex', padding: '0 8px' }}>
      <LogoCarulaApp fundo="claro" tamanho={40} />
    </span>

    <button
      type="button"
      onClick={onLancarPedido}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        minHeight: '58px',
        padding: '0 10px 0 20px',
        border: 0,
        borderRadius: '18px',
        background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)',
        boxShadow: '0 10px 22px rgba(58,35,80,0.3)',
        color: '#FFFFFF',
        fontFamily: "'Instrument Serif', serif",
        fontSize: '23px',
        lineHeight: 1,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      Lançar Pedido
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          background: '#F5B9C6',
          color: '#3A2350',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
    </button>

    <nav aria-label="Menu principal" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {ABAS_DO_MENU.map((aba) => {
        const Icone = aba.icon;
        const ativa = activeTab === aba.id;
        return (
          <button
            key={aba.id}
            type="button"
            className="menu-lateral-item"
            data-tour-id={aba.id}
            onClick={() => onTabChange(aba.id)}
            aria-current={ativa ? 'page' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minHeight: '46px',
              padding: '0 14px',
              border: 0,
              borderRadius: '14px',
              background: ativa ? '#3A2350' : undefined,
              boxShadow: ativa ? '0 8px 18px rgba(58,35,80,0.3)' : 'none',
              color: ativa ? '#F5B9C6' : '#6A5F70',
              fontFamily: 'inherit',
              fontSize: '12px',
              fontWeight: ativa ? 800 : 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <Icone stroke={ativa ? '#F5B9C6' : '#8E8496'} strokeWidth={1.9} />
            {aba.label}
          </button>
        );
      })}
    </nav>
  </aside>
);
