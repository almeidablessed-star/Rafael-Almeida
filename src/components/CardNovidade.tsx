import React, { useState } from 'react';
import { Sparkles, X, ChevronDown } from 'lucide-react';
import { marcarComoVista, proximaNovidade, type Novidade } from '../utils/novidades';

/**
 * Card de novidade no Inicio. Mostra a novidade mais recente ainda nao vista
 * (ver utils/novidades.ts) e some no "Entendi" ou no X. Nao e uma janela que
 * trava a tela: quem abriu o app para lancar um pedido rapido passa direto.
 */
export const CardNovidade: React.FC<{ pc?: boolean }> = ({ pc }) => {
  const [novidade, setNovidade] = useState<Novidade | null>(() => proximaNovidade());
  const [aberto, setAberto] = useState(false);

  if (!novidade) return null;

  const fechar = () => {
    marcarComoVista(novidade.id);
    setAberto(false);
    // Se houver outra ainda nao vista, ela aparece no lugar.
    setNovidade(proximaNovidade());
  };

  return (
    <section
      aria-labelledby="novidade-titulo"
      className="w-full"
      style={{
        background: '#FFFFFF',
        border: '1px solid #F0D3DC',
        borderRadius: '18px',
        padding: pc ? '18px 20px' : '14px 16px',
        boxShadow: '0 6px 18px rgba(58,35,80,0.07)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          aria-hidden="true"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: '#FBE7EC',
            color: '#A3456A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Sparkles style={{ width: '19px', height: '19px' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#A3456A',
              margin: 0,
            }}
          >
            Novidade no app
          </p>
          <h3
            id="novidade-titulo"
            style={{ fontSize: pc ? '16px' : '15px', fontWeight: 800, color: '#241B2B', margin: '2px 0 0', lineHeight: 1.3 }}
          >
            {novidade.titulo}
          </h3>
          <p style={{ fontSize: pc ? '14px' : '13px', color: '#5E5366', margin: '4px 0 0', lineHeight: 1.45 }}>
            {novidade.resumo}
          </p>
        </div>

        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar novidade"
          style={{
            width: '32px',
            height: '32px',
            marginTop: '-4px',
            marginRight: '-6px',
            borderRadius: '10px',
            border: 'none',
            background: 'transparent',
            color: '#7A6E80',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <X style={{ width: '17px', height: '17px' }} />
        </button>
      </div>

      {aberto && novidade.comoUsar && (
        <ol
          style={{
            margin: '12px 0 0',
            padding: '12px 14px 12px 32px',
            // O reset do Tailwind tira os numeros da lista; aqui eles guiam a leitura.
            listStyle: 'decimal',
            background: '#FAF6F9',
            borderRadius: '12px',
            fontSize: pc ? '14px' : '13px',
            color: '#3A2350',
            lineHeight: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {novidade.comoUsar.map((passo) => (
            <li key={passo}>{passo}</li>
          ))}
        </ol>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {novidade.comoUsar && (
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              minHeight: '40px',
              padding: '0 14px',
              borderRadius: '11px',
              border: '1px solid rgba(58,35,80,0.16)',
              background: '#FFFFFF',
              color: '#3A2350',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {aberto ? 'Esconder' : 'Ver como funciona'}
            <ChevronDown
              aria-hidden="true"
              style={{ width: '15px', height: '15px', transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}
            />
          </button>
        )}
        <button
          type="button"
          onClick={fechar}
          style={{
            minHeight: '40px',
            padding: '0 18px',
            borderRadius: '11px',
            border: 'none',
            background: '#3A2350',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Entendi
        </button>
      </div>
    </section>
  );
};
