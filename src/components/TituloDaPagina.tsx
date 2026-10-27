import React from 'react';

/**
 * Titulo de pagina da versao computador: Instrument Serif 42px, alinhado a
 * esquerda. No computador ele substitui a faixa roxa com o titulo centralizado
 * que as abas tem no celular (docs/design/desktop-redesign/README.md,
 * "Estrutura comum").
 */
export const TituloDaPagina: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h1
    className="font-serif-display"
    style={{ margin: 0, fontSize: '42px', fontWeight: 400, lineHeight: 1, color: '#241B2B' }}
  >
    {children}
  </h1>
);
