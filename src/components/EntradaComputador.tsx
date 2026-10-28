import React from 'react';
import { LogoCarulaApp } from './LogoCarulaApp';

/**
 * Moldura das telas de entrada (login, codigo) na versao computador: painel
 * roxo com a marca a esquerda e o formulario num cartao branco a direita.
 * So e usada quando `useTelaDeComputador()` liga; o celular nunca a ve.
 *
 * A classe `.entrada-computador` solta o #root da coluna de celular (ver
 * index.css), do mesmo jeito que `.layout-computador` faz no app logado.
 * Desenho aprovado pelo Rafael em 28/10/2026.
 */
export const EntradaComputador: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="entrada-computador"
    style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
      background: '#F6F2F5',
      color: '#241B2B',
      fontFamily: "'Manrope', sans-serif",
    }}
  >
    <section
      style={{
        background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)',
        color: '#FFFFFF',
        padding: '48px 64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Logo grande, com a largura de "Sua confeitaria," (que comeca na
          mesma margem), a pedido do Rafael. */}
      <div>
        <LogoCarulaApp fundo="roxo" tamanho={89} />
      </div>

      <div>
        <h2 className="font-serif-display" style={{ fontSize: '66px', lineHeight: 1.02, fontWeight: 400, maxWidth: '520px' }}>
          Sua confeitaria, <i style={{ color: '#F5B9C6' }}>organizada</i>.
        </h2>
        <p style={{ marginTop: '18px', fontSize: '17px', lineHeight: 1.55, color: '#E6D8E8', maxWidth: '440px' }}>
          Pedidos, fichas técnicas, estoque e clientes num lugar só — no celular e no computador.
        </p>
      </div>

      <p style={{ fontSize: '13px', color: '#CBB6CF' }}>app.carulaconfeitaria.com.br</p>
    </section>

    <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 8px 20px rgba(58,35,80,.08)',
          padding: '44px 40px',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </section>
  </div>
);
