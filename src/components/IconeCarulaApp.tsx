import React from 'react';

/**
 * Icone do Carula App: o "C" em anel com a etiqueta pendurada na abertura,
 * dentro do quadrado arredondado com o degrade roxo — o mesmo desenho de
 * docs/design/marca-carula-app/svg/icone-app-roxo.svg (e do icone do PWA).
 * So formas, sem <text>, entao nao depende de fonte carregada.
 */
export const IconeCarulaApp: React.FC<{ tamanho?: number; className?: string }> = ({ tamanho = 72, className }) => {
  // useId: duas copias na mesma tela nao podem dividir o id do degrade.
  const grad = `carula-icone-${React.useId().replace(/:/g, '')}`;
  return (
    <svg
      className={className}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 512 512"
      role="img"
      aria-label="Carula App"
      style={{ display: 'block', filter: 'drop-shadow(0 10px 22px rgba(58,35,80,.25))' }}
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(10 .5 .5)">
          <stop offset="0" stopColor="#3A2350" />
          <stop offset=".6" stopColor="#6E3F72" />
          <stop offset="1" stopColor="#A85E86" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill={`url(#${grad})`} />
      <g transform="translate(76 76) scale(3)">
        <path d="M85.7 29.4 A40 40 0 1 0 85.7 90.6" fill="none" stroke="#FFFFFF" strokeWidth="22" strokeLinecap="round" />
        <g transform="rotate(-22 96 60)">
          <rect x="83" y="52" width="27" height="16" rx="4.5" fill="#F5B9C6" />
          <circle cx="88.5" cy="60" r="2.6" fill="#3A2350" />
          <path d="M93 55.5v9" stroke="#3A2350" strokeWidth="1.4" strokeDasharray="2 2" opacity=".45" />
        </g>
      </g>
    </svg>
  );
};
