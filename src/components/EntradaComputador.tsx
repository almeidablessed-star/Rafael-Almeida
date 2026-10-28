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
 *
 * `frase`/`texto` trocam a mensagem do painel (a Area do Parceiro fala com o
 * parceiro, nao com a confeitaria). Sem eles, vale a frase da confeitaria.
 */
export const EntradaComputador: React.FC<{
  children: React.ReactNode;
  frase?: React.ReactNode;
  texto?: string;
}> = ({ children, frase, texto }) => (
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
        // Sem margem em cima: o logo se centraliza entre a borda do topo e a
        // frase, e uma margem ali o empurraria para baixo.
        padding: '0 64px 48px',
        // Tres faixas: a do meio (a frase) fica no centro, e as de cima e de
        // baixo dividem o resto por igual.
        display: 'grid',
        gridTemplateRows: '1fr auto 1fr',
      }}
    >
      {/* Logo grande, com a largura de "Sua confeitaria,", no meio do espaco
          entre o topo e a frase e centralizado na largura do painel, a pedido
          do Rafael. */}
      <div style={{ alignSelf: 'center', justifySelf: 'center' }}>
        <LogoCarulaApp fundo="roxo" tamanho={89} />
      </div>

      <div>
        <h2 className="font-serif-display" style={{ fontSize: '66px', lineHeight: 1.02, fontWeight: 400, maxWidth: '520px' }}>
          {frase ?? <>Sua confeitaria, <i style={{ color: '#F5B9C6' }}>organizada</i>.</>}
        </h2>
        <p style={{ marginTop: '18px', fontSize: '17px', lineHeight: 1.55, color: '#E6D8E8', maxWidth: '440px' }}>
          {texto ?? 'Pedidos, fichas técnicas, estoque e clientes num lugar só — no celular e no computador.'}
        </p>
      </div>

      <p style={{ alignSelf: 'end', fontSize: '13px', color: '#CBB6CF' }}>app.carulaconfeitaria.com.br</p>
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

/** Mensagem do painel na Area do Parceiro (codigo de entrada, acesso negado e painel). */
export const MENSAGEM_PARCEIRO = {
  frase: (
    <>
      Suas indicações, <i style={{ color: '#F5B9C6' }}>na palma da mão</i>.
    </>
  ),
  texto: 'Acompanhe quantas pessoas você indicou e quantas estão com a assinatura em dia.',
};
