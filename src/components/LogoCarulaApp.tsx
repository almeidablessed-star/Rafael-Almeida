import React from 'react';

/**
 * Logo do Carula App: "carula" em Manrope 800 com a etiqueta rose "APP"
 * inclinada, como uma etiqueta de preco/comanda. Marca aprovada no Claude
 * Design (ver docs/design/marca-carula-app/README.md e o MarcaFinal.dc.html).
 *
 * Feito em HTML/CSS, e nao num SVG com <text>, para usar a Manrope que o app
 * ja carrega e escalar por `tamanho` (o corpo da palavra, em px): as medidas da
 * etiqueta sao proporcionais a ele, iguais as do design em 74px.
 */
type FundoLogo = 'claro' | 'escuro' | 'roxo';

const CORES: Record<FundoLogo, { palavra: string; furo: string; sombra: string }> = {
  claro: { palavra: '#3A2350', furo: '#FFFFFF', sombra: 'rgba(196,98,111,.25)' },
  escuro: { palavra: '#FFFFFF', furo: '#141014', sombra: 'none' },
  roxo: { palavra: '#FFFFFF', furo: '#6E3F72', sombra: 'rgba(36,27,43,.25)' },
};

export const LogoCarulaApp: React.FC<{ fundo?: FundoLogo; tamanho?: number; className?: string }> = ({
  fundo = 'claro',
  tamanho = 74,
  className,
}) => {
  const c = CORES[fundo];
  // Proporcoes do design, que usa palavra de 74px e etiqueta de 18px.
  const k = tamanho / 74;
  return (
    <span
      className={className}
      role="img"
      aria-label="Carula App"
      style={{ display: 'inline-flex', alignItems: 'flex-start', fontFamily: "'Manrope', sans-serif" }}
    >
      <span aria-hidden="true" style={{ fontSize: `${tamanho}px`, fontWeight: 800, letterSpacing: '-.055em', lineHeight: 1, color: c.palavra }}>
        carula
      </span>
      <span
        aria-hidden="true"
        style={{
          position: 'relative',
          marginLeft: `${6 * k}px`,
          transform: 'rotate(-8deg)',
          display: 'inline-flex',
          alignItems: 'center',
          background: '#F5B9C6',
          borderRadius: `${5 * k}px ${10 * k}px ${10 * k}px ${5 * k}px`,
          padding: `${6 * k}px ${11 * k}px ${6 * k}px ${19 * k}px`,
          boxShadow: c.sombra === 'none' ? undefined : `0 ${8 * k}px ${14 * k}px ${c.sombra}`,
        }}
      >
        <span style={{ position: 'absolute', left: `${7 * k}px`, top: '50%', transform: 'translateY(-50%)', width: `${6 * k}px`, height: `${6 * k}px`, borderRadius: '50%', background: c.furo }} />
        <span style={{ borderLeft: `${Math.max(1, 1.5 * k)}px dashed rgba(58,35,80,.35)`, paddingLeft: `${7 * k}px`, fontSize: `${18 * k}px`, fontWeight: 800, letterSpacing: '.14em', lineHeight: 1, color: '#3A2350' }}>
          APP
        </span>
      </span>
    </span>
  );
};
