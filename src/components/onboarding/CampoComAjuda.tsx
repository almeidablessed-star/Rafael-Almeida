import React, { useState } from 'react';

/**
 * Microcopy fixo + icone de ajuda com exemplo numerico real (spec Parte 4,
 * itens 2 e 3). O painel de ajuda usa os MESMOS tokens do card leve ja usado
 * no app (fundo #F6F2F5, borda #E6E1DB, sombra suave) — nao existe um
 * componente de tooltip/popover reaproveitavel no projeto, entao esta e a
 * unica peca nova desta etapa, e ela usa tokens existentes, nao inventados.
 */
export const CampoComAjuda: React.FC<{
  microcopy: string;
  exemploDinamico?: string;
  /** 'card': bloco unico (fundo lilas + icone lado a lado), usado no card de
   * despesa individual de Minha Empresa. 'inline' (padrao) mantem o layout
   * antigo — texto solto com o "?" flutuando, usado em todo o resto do app
   * (onboarding incluso) para nao alterar nada fora do escopo pedido.
   * 'computador': cabecalho de secao da versao computador — `titulo` e o texto
   * empilhados a esquerda e o "?" (alvo de 44px) a direita, como no desenho
   * de docs/design/desktop-redesign. */
  variant?: 'inline' | 'card' | 'computador';
  /** So na variante 'computador': o titulo da secao, mostrado acima do texto. */
  titulo?: React.ReactNode;
  /** O que o leitor de tela anuncia ao focar o botao "?". O padrao e generico
   * de proposito: o painel que abre nem sempre e um exemplo numerico — em
   * varios usos (estoque de hoje, cofrinhos do Inicio) e so uma explicacao, e
   * o rotulo antigo, fixo em "Ver exemplo com os numeros da sua conta",
   * prometia a quem nao enxerga a tela um numero que nunca vinha. Passe o
   * texto especifico so onde o painel mostra mesmo valores da conta. */
  ariaLabelAjuda?: string;
}> = ({ microcopy, exemploDinamico, variant = 'inline', ariaLabelAjuda = 'Ver explicação', titulo }) => {
  const [aberto, setAberto] = useState(false);

  if (variant === 'computador') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: "'Manrope', sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            {titulo}
            <p style={{ margin: 0, fontSize: '13px', color: '#7A6E80' }}>{microcopy}</p>
          </div>
          {exemploDinamico && (
            <button
              type="button"
              onClick={() => setAberto((v) => !v)}
              aria-label={ariaLabelAjuda}
              aria-expanded={aberto}
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                border: 0,
                borderRadius: '50%',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#3A2350',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 800,
                }}
              >
                ?
              </span>
            </button>
          )}
        </div>
        {aberto && exemploDinamico && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid #E6E1DB',
              background: '#FFFFFF',
              fontSize: '13px',
              lineHeight: 1.5,
              color: '#5A4E46',
              boxShadow: '0 8px 20px rgba(58,35,80,0.09)',
            }}
          >
            {exemploDinamico}
          </div>
        )}
      </div>
    );
  }

  const botaoAjuda = (
    <button
      type="button"
      onClick={() => setAberto((v) => !v)}
      aria-label={ariaLabelAjuda}
      className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-transform active:scale-90"
      style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)' }}
    >
      ?
    </button>
  );

  if (variant === 'card') {
    return (
      <div className="mt-1.5">
        <div className="flex items-start gap-2.5 rounded-xl bg-[#F3E9F3]" style={{ padding: '12px 14px' }}>
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-label={ariaLabelAjuda}
            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white transition-transform active:scale-90"
            style={{ background: '#3A2350' }}
          >
            ?
          </button>
          <p className="text-[13px] flex-1" style={{ color: '#6E3F72', lineHeight: 1.5, fontFamily: "'Manrope', sans-serif" }}>
            {microcopy}
          </p>
        </div>
        {aberto && exemploDinamico && (
          <div
            className="mt-1.5 p-2.5 rounded-xl border border-[#E6E1DB] bg-white text-[11px]"
            style={{ color: '#5A4E46', fontFamily: "'Manrope', sans-serif", boxShadow: '0 8px 20px rgba(58,35,80,0.09)' }}
          >
            {exemploDinamico}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-1.5">
      <div className="flex items-start gap-1.5">
        <p className="text-[11px] flex-1" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>
          {microcopy}
        </p>
        {exemploDinamico && botaoAjuda}
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
