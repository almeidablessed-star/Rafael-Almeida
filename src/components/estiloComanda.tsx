import React from 'react';

/**
 * Pecas visuais dos formularios em estilo "comanda" (design "Pedido Carula
 * Cake", feito no Claude Design): cards brancos com sombra em camadas,
 * rotulos em caixa alta, nome em letra serifada sobre linha tracejada,
 * campos numericos em caixa rebaixada com a unidade como chip escuro, e o
 * picote entre as partes de um card.
 *
 * Usadas pelos formularios de Produto e de Ficha Tecnica. Cores literais:
 * as variaveis --color-* nao existem em runtime.
 */

export const CARD_COMANDA: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: '24px',
  padding: '12px 16px 14px',
  boxShadow: '0 1px 1px rgba(58,35,80,.04), 0 6px 12px -4px rgba(58,35,80,.08), 0 20px 34px -14px rgba(58,35,80,.22)',
};

export const ROTULO_COMANDA: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 800,
  letterSpacing: '.14em',
  color: '#7A6E80',
};

/** Campo de texto "a tinta": serifada sobre a linha tracejada do label. */
export const CAMPO_TINTA: React.CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: '22px',
  color: '#241B2B',
  padding: '1px 0 5px',
};

/** Caixa rebaixada que envolve um numero e o chip da unidade. */
export const CAIXA_NUMERO: React.CSSProperties = {
  height: '42px',
  boxSizing: 'border-box',
  padding: '4px 4px 4px 14px',
  borderRadius: '15px',
  background: '#F6F2F5',
  boxShadow: 'inset 0 1px 3px rgba(58,35,80,.08)',
};

export const NUMERO: React.CSSProperties = {
  fontSize: '17px',
  fontWeight: 800,
  color: '#241B2B',
};

/** Tamanho do chip de unidade (CustomSelect com `chip`). */
export const CHIP_UNIDADE: React.CSSProperties = {
  height: '34px',
  minWidth: '52px',
  flexShrink: 0,
};

/** Etiqueta rosa de valor em dinheiro (preco pago, custo do insumo). */
export const ETIQUETA_VALOR: React.CSSProperties = {
  position: 'relative',
  height: '42px',
  boxSizing: 'border-box',
  borderRadius: '6px 15px 15px 6px',
  background: '#FCEFF2',
  border: '1px solid rgba(196,98,111,.2)',
};

/** O furinho da etiqueta, a esquerda. */
export const FuroEtiqueta: React.FC = () => (
  <span
    aria-hidden="true"
    style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', width: '7px', height: '7px', borderRadius: '50%', background: '#FFFFFF', boxShadow: 'inset 0 1px 2px rgba(196,98,111,.4)' }}
  />
);

/**
 * Linha picotada entre duas partes de um card, com as meias-luas nas bordas.
 * O card precisa de `position: relative; overflow: hidden` para as luas
 * ficarem recortadas.
 */
export const Picote: React.FC<{ fundo?: string }> = ({ fundo = '#F6F2F5' }) => (
  <div aria-hidden="true" style={{ position: 'relative', height: 0, borderTop: '1.5px dashed rgba(36,27,43,.12)', margin: '0 14px' }}>
    <div style={{ position: 'absolute', left: '-23px', top: '-9px', width: '16px', height: '16px', borderRadius: '50%', background: fundo }} />
    <div style={{ position: 'absolute', right: '-23px', top: '-9px', width: '16px', height: '16px', borderRadius: '50%', background: fundo }} />
  </div>
);
