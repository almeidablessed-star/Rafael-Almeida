import React, { useState } from 'react';

/**
 * Microcopy fixo + icone de ajuda com exemplo numerico real (spec Parte 4,
 * itens 2 e 3). O painel de ajuda usa os MESMOS tokens do card leve ja usado
 * no app (fundo #F6F2F5, borda #E6E1DB, sombra suave) — nao existe um
 * componente de tooltip/popover reaproveitavel no projeto, entao esta e a
 * unica peca nova desta etapa, e ela usa tokens existentes, nao inventados.
 */
export const CampoComAjuda: React.FC<{ microcopy: string; exemploDinamico?: string }> = ({
  microcopy,
  exemploDinamico,
}) => {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="mt-1.5">
      <div className="flex items-start gap-1.5">
        <p className="text-[11px] flex-1" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>
          {microcopy}
        </p>
        {exemploDinamico && (
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-label="Ver exemplo com os números da sua conta"
            className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-transform active:scale-90"
            style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)' }}
          >
            ?
          </button>
        )}
      </div>
      {aberto && exemploDinamico && (
        <div
          className="mt-1.5 p-2.5 rounded-xl border border-[#E6E1DB] bg-[#F6F2F5] text-[11px]"
          style={{ color: '#5A4E46', fontFamily: "'Manrope', sans-serif", boxShadow: '0 8px 20px rgba(58,35,80,0.09)' }}
        >
          {exemploDinamico}
        </div>
      )}
    </div>
  );
};
