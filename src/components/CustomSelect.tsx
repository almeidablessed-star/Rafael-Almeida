import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  /**
   * Visual de "chip": botao roxo escuro com a letra rosa, para a unidade
   * encaixada dentro de um campo (design dos formularios de Produto e Ficha).
   * A lista abre alinhada a direita, com largura minima, porque o chip e
   * estreito.
   */
  chip?: boolean;
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
  chip = false,
  ariaLabel,
}) => {
  const [aberto, setAberto] = useState(false);
  const [indiceFoco, setIndiceFoco] = useState<number>(-1);
  const caixaRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  const selecionada = options.find((o) => o.value === value);
  const rotulo = selecionada?.label ?? placeholder;
  const semEscolha = !selecionada;

  /**
   * Posicao da lista na TELA, nao dentro do campo.
   *
   * A lista era `position: absolute` dentro do proprio campo, e qualquer
   * cartao com `overflow: hidden` em volta a cortava: no cadastro de produto,
   * no celular, a lista de unidades abria dentro do cartao do preco e so o
   * "g" e meio "kg" ficavam visiveis — as outras unidades nao dava para tocar
   * (relato do Rafael, 25/10/2026). Agora ela vai num portal no <body>, com
   * `position: fixed` calculado a partir do botao, e abre para CIMA quando nao
   * cabe embaixo.
   */
  const [posicao, setPosicao] = useState<React.CSSProperties | null>(null);

  useLayoutEffect(() => {
    if (!aberto) {
      setPosicao(null);
      return;
    }
    const calcular = () => {
      const caixa = caixaRef.current;
      if (!caixa) return;
      const r = caixa.getBoundingClientRect();
      const margem = 8;
      const alturaDesejada = Math.min(280, options.length * 46 + 12);
      const espacoAbaixo = window.innerHeight - r.bottom - margem;
      const espacoAcima = r.top - margem;
      const paraCima = espacoAbaixo < alturaDesejada && espacoAcima > espacoAbaixo;
      const maxHeight = Math.max(120, Math.min(280, (paraCima ? espacoAcima : espacoAbaixo) - 6));
      setPosicao({
        ...(paraCima ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
        // Chip: alinhada pela direita do botao, como antes. Campo normal:
        // mesma largura do campo.
        ...(chip
          ? { right: Math.max(margem, window.innerWidth - r.right), minWidth: '96px' }
          : { left: r.left, width: r.width }),
        maxHeight,
      });
    };
    calcular();
    // A tela rola por baixo (formulario em tela cheia) e o teclado do celular
    // muda a altura: a lista acompanha o botao em vez de ficar parada.
    window.addEventListener('scroll', calcular, true);
    window.addEventListener('resize', calcular);
    return () => {
      window.removeEventListener('scroll', calcular, true);
      window.removeEventListener('resize', calcular);
    };
  }, [aberto, chip, options.length]);

  /** Fecha ao clicar fora — mesmo padrao do seletor de moeda original. A
   * lista agora vive fora da caixa (portal), entao tocar nela tambem conta
   * como "dentro". */
  useEffect(() => {
    if (!aberto) return;
    const aoClicarFora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (caixaRef.current?.contains(alvo) || listaRef.current?.contains(alvo)) return;
      setAberto(false);
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
        style={chip ? {
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          background: '#3A2350',
          border: 'none',
          borderRadius: '11px',
          padding: '0 9px 0 11px',
          fontSize: '13px',
          fontWeight: 800,
          color: '#F5B9C6',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        } : {
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
        {chip ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F5B9C6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        ) : (
          <span style={{ fontSize: '10px', color: '#7A6E80', flexShrink: 0 }}>▼</span>
        )}
      </button>

      {aberto && !disabled && posicao && createPortal(
        <div
          ref={listaRef}
          role="listbox"
          aria-label={ariaLabel}
          style={{
            position: 'fixed',
            ...posicao,
            // Acima dos modais do app (z-[99999]), de onde quase todo
            // seletor e aberto — mesmo nivel do calendario (CampoData).
            zIndex: 100000,
            fontFamily: "'Manrope', sans-serif",
            background: '#FFFFFF',
            border: '1px solid #E6E1DB',
            borderRadius: '12px',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            boxShadow: '0 20px 36px rgba(58,35,80,0.18)',
            // Lista longa rola dentro de si em vez de vazar pela tela
            // (`maxHeight` vem de `posicao`, conforme o espaco disponivel).
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
        </div>,
        document.body
      )}
    </div>
  );
};
