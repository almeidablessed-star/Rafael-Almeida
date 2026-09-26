import React, { useEffect, useRef, useState } from 'react';

/**
 * Dropdown no visual do app, substituindo o `<select>` nativo.
 *
 * O nativo herda o estilo do sistema — fundo azul de selecao, fonte do SO,
 * seta do navegador — e destoava do resto do app em todas as telas. Este
 * componente extrai o padrao que ja existia inline no seletor de moeda do
 * ProfileModal e o torna reutilizavel.
 *
 * ── O QUE PRECISOU SER RESOLVIDO ALEM DE COPIAR O VISUAL ───────────────────
 *
 * Trocar um `<select>` por `<div>`s custa coisas que o nativo dava de graca, e
 * ignorar isso seria trocar um problema visual por um de usabilidade:
 *
 * - **Toque no celular.** O nativo abre o seletor do sistema, com alvos
 *   grandes. Aqui cada opcao tem `minHeight: 44px`, o minimo recomendado para
 *   alvo de toque — e por isso a lista NAO usa o padding apertado do original
 *   do ProfileModal.
 * - **Lista longa.** O original tinha 3 opcoes fixas e crescia livre. Com
 *   listas maiores (produtos, categorias) isso vazaria da tela: daqui em
 *   diante ha `maxHeight` com scroll.
 * - **Teclado.** O nativo navega com setas, Enter, Esc e Home/End. Sem isso o
 *   campo fica inalcancavel para quem nao usa mouse.
 * - **Largura.** O original era fixo em 160px. Aqui e fluido, porque os
 *   campos de destino tem larguras muito diferentes.
 * - **Leitores de tela.** `role="listbox"`/`option` + `aria-selected` fazem o
 *   componente ser anunciado como lista de escolha, nao como um monte de divs.
 */

export interface CustomSelectOption {
  value: string;
  label: string;
  /** Desabilita uma opcao especifica sem tira-la da lista. */
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  /** Texto quando `value` nao casa com nenhuma opcao (ex.: nada escolhido). */
  placeholder?: string;
  disabled?: boolean;
  /** `title` do botao, para tooltip no desktop. */
  title?: string;
  /** Estilos extras do BOTAO fechado — largura, margem, etc. */
  style?: React.CSSProperties;
  /** Texto pequeno em vez do padrao de 14px (campos densos, como unidade). */
  compacto?: boolean;
  ariaLabel?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecione…',
  disabled = false,
  title,
  style,
  compacto = false,
  ariaLabel,
}) => {
  const [aberto, setAberto] = useState(false);
  const [indiceFoco, setIndiceFoco] = useState<number>(-1);
  const caixaRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  const selecionada = options.find((o) => o.value === value);
  const rotulo = selecionada?.label ?? placeholder;
  const semEscolha = !selecionada;

  /** Fecha ao clicar fora — mesmo padrao do seletor de moeda original. */
  useEffect(() => {
    if (!aberto) return;
    const aoClicarFora = (e: MouseEvent) => {
      if (caixaRef.current && !caixaRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, [aberto]);

  /**
   * Ao abrir, o foco comeca na opcao ja escolhida — e nao no topo da lista,
   * que obrigaria a percorrer tudo de novo a cada abertura.
   */
  useEffect(() => {
    if (aberto) setIndiceFoco(options.findIndex((o) => o.value === value));
  }, [aberto, value, options]);

  /** Mantem a opcao focada visivel quando a lista tem scroll. */
  useEffect(() => {
    if (!aberto || indiceFoco < 0) return;
    const item = listaRef.current?.children[indiceFoco] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [aberto, indiceFoco]);

  const escolher = (opt: CustomSelectOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setAberto(false);
  };

  const proximoHabilitado = (de: number, passo: number): number => {
    let i = de;
    for (let n = 0; n < options.length; n++) {
      i = (i + passo + options.length) % options.length;
      if (!options[i].disabled) return i;
    }
    return de;
  };

  const aoTeclar = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!aberto) {
      // Enter/Espaco/setas abrem, igual ao nativo.
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        setAberto(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setAberto(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setIndiceFoco((i) => proximoHabilitado(i < 0 ? -1 : i, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setIndiceFoco((i) => proximoHabilitado(i < 0 ? 0 : i, -1));
        break;
      case 'Home':
        e.preventDefault();
        setIndiceFoco(proximoHabilitado(-1, 1));
        break;
      case 'End':
        e.preventDefault();
        setIndiceFoco(proximoHabilitado(0, -1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (indiceFoco >= 0 && options[indiceFoco]) escolher(options[indiceFoco]);
        break;
      case 'Tab':
        // Tab sai do campo: fecha sem escolher, como o nativo.
        setAberto(false);
        break;
    }
  };

  const tamanhoFonte = compacto ? '13px' : '14px';

  return (
    <div className="relative" ref={caixaRef} style={{ fontFamily: "'Manrope', sans-serif", ...style }}>
      <button
        type="button"
        onClick={() => !disabled && setAberto((v) => !v)}
        onKeyDown={aoTeclar}
        disabled={disabled}
        title={title}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={ariaLabel}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          background: '#FFFFFF',
          border: '1px solid rgba(58,35,80,0.14)',
          borderRadius: '12px',
          padding: compacto ? '9px 11px' : '10px 13px',
          fontSize: tamanhoFonte,
          fontWeight: 600,
          // Placeholder em cinza; valor escolhido na cor do texto normal.
          color: semEscolha ? '#A096A6' : '#241B2B',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          textAlign: 'left',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {rotulo}
        </span>
        <span style={{ fontSize: '10px', color: '#7A6E80', flexShrink: 0 }}>▼</span>
      </button>

      {aberto && !disabled && (
        <div
          ref={listaRef}
          role="listbox"
          aria-label={ariaLabel}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 50,
            background: '#FFFFFF',
            border: '1px solid #E6E1DB',
            borderRadius: '12px',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            boxShadow: '0 20px 36px rgba(58,35,80,0.18)',
            // Lista longa rola dentro de si em vez de vazar pela tela.
            maxHeight: '280px',
            overflowY: 'auto',
          }}
        >
          {options.map((opt, i) => {
            const escolhida = opt.value === value;
            const focada = i === indiceFoco;
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={escolhida}
                aria-disabled={opt.disabled}
                onClick={() => escolher(opt)}
                onMouseEnter={() => !opt.disabled && setIndiceFoco(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  // 44px e o minimo de alvo de toque; o `<select>` nativo dava
                  // isso de graca pelo seletor do sistema.
                  minHeight: '44px',
                  padding: '10px 11px',
                  borderRadius: '8px',
                  cursor: opt.disabled ? 'not-allowed' : 'pointer',
                  background: escolhida ? '#3A2350' : focada ? '#F3E9F3' : 'transparent',
                  color: escolhida ? '#FFFFFF' : '#241B2B',
                  fontSize: tamanhoFonte,
                  fontWeight: escolhida ? 700 : 500,
                  opacity: opt.disabled ? 0.45 : 1,
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.label}</span>
                {escolhida && <span style={{ fontSize: '12px', color: '#F5B9C6', flexShrink: 0 }}>✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
