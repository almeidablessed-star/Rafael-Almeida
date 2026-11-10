import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { normalizeName } from '../utils/fichaMatcher';
import type { CustomSelectOption } from './CustomSelect';

/**
 * Caixa "Selecione o produto" do novo pedido, em que da para DIGITAR.
 *
 * Com dezenas de fichas, rolar a lista inteira para achar o bolo era lento
 * (pedido do Rafael, 09/11/2026). Um toque abre a lista toda, como antes;
 * digitar filtra pelo nome, sem ligar para acento ("prest" acha "Prestigio").
 *
 * E um componente PROPRIO, e nao uma opcao do CustomSelect: aquele tem mais
 * nove usos (unidades, categorias...) que nao podem mudar de comportamento.
 * O visual da lista e o mesmo dele.
 *
 * ── REGRAS QUE NAO PODEM QUEBRAR ───────────────────────────────────────────
 *
 * - **O que foi digitado nao vira produto sozinho.** O pedido casa o item com
 *   a ficha pelo nome exato. Digitar "prest" e sair da caixa NAO pode gravar
 *   "prest": ou se escolhe da lista, ou a caixa volta ao que estava.
 * - **Enter nao envia o pedido.** A caixa fica dentro do <form> do pedido, e o
 *   Enter de um <input> envia o formulario. Aqui o Enter escolhe a opcao
 *   destacada e para por ai.
 * - **Nome que nao existe nas fichas** vira a opcao "Outro / Personalizado"
 *   ja com o nome preenchido (decisao do Rafael, 09/11/2026).
 */

interface CaixaDeProdutoProps {
  value: string;
  /** Fichas, ja em ordem. A opcao "Outro" vem a parte, em `valorOutro`. */
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  /** Valor da opcao "Outro / Personalizado". */
  valorOutro: string;
  rotuloOutro: string;
  /** Escolheu "Outro" a partir de um nome digitado que nao e ficha. */
  onUsarComoOutro: (nome: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}

interface OpcaoDaLista {
  chave: string;
  rotulo: string;
  escolher: () => void;
  escolhida: boolean;
}

export const CaixaDeProduto: React.FC<CaixaDeProdutoProps> = ({
  value,
  options,
  onChange,
  valorOutro,
  rotuloOutro,
  onUsarComoOutro,
  placeholder = 'Selecione o produto…',
  ariaLabel,
}) => {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState('');
  // Ao abrir, a caixa mostra o nome escolhido mas a lista vem INTEIRA; so
  // depois da primeira tecla ela passa a filtrar.
  const [digitou, setDigitou] = useState(false);
  const [indiceFoco, setIndiceFoco] = useState(-1);
  const caixaRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const idLista = useRef(`caixa-produto-${Math.random().toString(36).slice(2)}`).current;

  const rotuloEscolhido =
    value === valorOutro ? rotuloOutro : options.find((o) => o.value === value)?.label ?? '';

  const termo = digitou ? normalizeName(texto) : '';
  const fichasFiltradas = termo
    ? options.filter((o) => normalizeName(o.label).includes(termo))
    : options;
  const nomeDigitado = digitou ? texto.trim() : '';
  const nomeEhFicha = !!nomeDigitado && options.some((o) => normalizeName(o.label) === normalizeName(nomeDigitado));

  const fechar = () => {
    setAberto(false);
    setDigitou(false);
    setIndiceFoco(-1);
  };

  const opcoes: OpcaoDaLista[] = [
    ...fichasFiltradas.map((o) => ({
      chave: o.value,
      rotulo: o.label,
      escolhida: o.value === value,
      escolher: () => onChange(o.value),
    })),
    nomeDigitado && !nomeEhFicha
      ? {
          chave: '__outro_com_nome__',
          rotulo: `✨ Usar “${nomeDigitado}” como Outro / Personalizado`,
          escolhida: false,
          escolher: () => onUsarComoOutro(nomeDigitado),
        }
      : {
          chave: valorOutro,
          rotulo: rotuloOutro,
          escolhida: value === valorOutro,
          escolher: () => onChange(valorOutro),
        },
  ];

  const escolher = (opcao: OpcaoDaLista) => {
    opcao.escolher();
    fechar();
    // Fecha o teclado do celular: a escolha esta feita.
    campoRef.current?.blur();
  };

  // Abriu agora e ainda nao digitou nada: o nome atual fica selecionado, para
  // a primeira tecla substitui-lo em vez de grudar no fim ("Prestigiobolo").
  const acabouDeAbrir = useRef(false);

  const abrir = () => {
    if (aberto) return;
    setTexto(rotuloEscolhido);
    setDigitou(false);
    setAberto(true);
    acabouDeAbrir.current = true;
  };

  useLayoutEffect(() => {
    if (aberto) campoRef.current?.select();
  }, [aberto]);

  // Destaque: ao abrir, a opcao escolhida; ao digitar, a primeira encontrada
  // (o Enter escolhe o resultado mais provavel).
  useEffect(() => {
    if (!aberto) return;
    if (digitou) setIndiceFoco(opcoes.length > 0 ? 0 : -1);
    else setIndiceFoco(opcoes.findIndex((o) => o.escolhida));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, digitou, texto]);

  useEffect(() => {
    if (!aberto || indiceFoco < 0) return;
    const item = listaRef.current?.children[indiceFoco] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [aberto, indiceFoco]);

  // Fecha ao tocar fora (a lista vive num portal, fora da caixa).
  useEffect(() => {
    if (!aberto) return;
    const aoTocarFora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (caixaRef.current?.contains(alvo) || listaRef.current?.contains(alvo)) return;
      fechar();
    };
    document.addEventListener('mousedown', aoTocarFora);
    return () => document.removeEventListener('mousedown', aoTocarFora);
  }, [aberto]);

  /**
   * Posicao da lista na tela. Ela abre SEMPRE para baixo, colada no campo:
   * aberta para cima, no iPhone, ela cobria o proprio campo enquanto se
   * digitava (relato do Rafael, 10/11/2026). Quando o teclado deixa pouco
   * espaco embaixo, quem se mexe e o formulario: ele rola ate o campo ficar
   * perto do topo, e a lista ganha o espaco entre o campo e o teclado.
   *
   * O espaco livre vem do `visualViewport`, e nao do `innerHeight`: no iPhone
   * so o primeiro encolhe quando o teclado abre.
   */
  const [posicao, setPosicao] = useState<React.CSSProperties | null>(null);
  useLayoutEffect(() => {
    if (!aberto) {
      setPosicao(null);
      return;
    }
    const margem = 8;
    const alturaDesejada = Math.min(280, opcoes.length * 46 + 12);
    const areaVisivel = () => {
      const vv = window.visualViewport;
      return {
        topo: vv ? vv.offsetTop : 0,
        fundo: vv ? vv.offsetTop + vv.height : window.innerHeight,
      };
    };
    const rolarParaCaber = () => {
      const caixa = caixaRef.current;
      if (!caixa) return;
      const r = caixa.getBoundingClientRect();
      const { topo, fundo } = areaVisivel();
      const falta = alturaDesejada - (fundo - r.bottom - margem);
      if (falta <= 0) return;
      // A area que rola em volta do campo (o corpo do formulario do pedido).
      let pai = caixa.parentElement;
      while (pai && !(pai.scrollHeight > pai.clientHeight && /(auto|scroll)/.test(getComputedStyle(pai).overflowY))) {
        pai = pai.parentElement;
      }
      // Nao sobe o campo para baixo do cabecalho fixo do formulario.
      const alvo = Math.max(pai ? pai.getBoundingClientRect().top : 0, topo) + 12;
      const passo = Math.min(r.top - alvo, falta);
      if (passo > 0) (pai ?? document.scrollingElement)?.scrollBy({ top: passo });
    };
    const calcular = () => {
      const caixa = caixaRef.current;
      if (!caixa) return;
      const r = caixa.getBoundingClientRect();
      const { fundo } = areaVisivel();
      const espacoAbaixo = fundo - r.bottom - margem;
      setPosicao({
        top: r.bottom + 6,
        left: r.left,
        width: r.width,
        maxHeight: Math.max(120, Math.min(280, espacoAbaixo - 6)),
      });
    };
    // O teclado abre animado: ao terminar, o visualViewport muda de tamanho,
    // e so entao da para saber quanto espaco sobrou.
    const aoMudarArea = () => {
      rolarParaCaber();
      calcular();
    };
    aoMudarArea();
    const vv = window.visualViewport;
    window.addEventListener('scroll', calcular, true);
    window.addEventListener('resize', aoMudarArea);
    vv?.addEventListener('resize', aoMudarArea);
    vv?.addEventListener('scroll', calcular);
    return () => {
      window.removeEventListener('scroll', calcular, true);
      window.removeEventListener('resize', aoMudarArea);
      vv?.removeEventListener('resize', aoMudarArea);
      vv?.removeEventListener('scroll', calcular);
    };
  }, [aberto, opcoes.length]);

  const aoTeclar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Nunca deixa o Enter chegar ao <form> do pedido.
      e.preventDefault();
      if (!aberto) {
        abrir();
        return;
      }
      if (indiceFoco >= 0 && opcoes[indiceFoco]) escolher(opcoes[indiceFoco]);
      return;
    }
    if (!aberto) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        abrir();
      }
      return;
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        fechar();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setIndiceFoco((i) => Math.min(opcoes.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setIndiceFoco((i) => Math.max(0, i - 1));
        break;
      case 'Tab':
        fechar();
        break;
    }
  };

  return (
    <div className="relative" ref={caixaRef} style={{ fontFamily: "'Manrope', sans-serif" }}>
      <input
        ref={campoRef}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={aberto}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={aberto && indiceFoco >= 0 ? `${idLista}-${indiceFoco}` : undefined}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        placeholder={placeholder}
        value={aberto ? texto : rotuloEscolhido}
        onFocus={abrir}
        onClick={() => {
          abrir();
          // O mouseup do proprio toque desfaz a selecao feita ao focar; o
          // clique vem depois dele, entao seleciona de novo aqui.
          if (acabouDeAbrir.current) campoRef.current?.select();
        }}
        onChange={(e) => {
          acabouDeAbrir.current = false;
          setTexto(e.target.value);
          setDigitou(true);
          if (!aberto) setAberto(true);
        }}
        onKeyDown={aoTeclar}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: '#FFFFFF',
          border: `1px solid ${aberto ? '#A85E86' : 'rgba(58,35,80,0.14)'}`,
          borderRadius: '12px',
          padding: '10px 36px 10px 13px',
          fontSize: '14px',
          fontWeight: 600,
          fontFamily: 'inherit',
          color: '#241B2B',
          outline: 'none',
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={aberto ? 'Fechar lista de produtos' : 'Abrir lista de produtos'}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          if (aberto) {
            fechar();
            campoRef.current?.blur();
          } else {
            campoRef.current?.focus();
            abrir();
          }
        }}
        className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
        style={{ right: '4px', width: '32px', height: '32px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '10px', color: '#7A6E80' }}
      >
        {aberto ? '▲' : '▼'}
      </button>

      {aberto && posicao && createPortal(
        <div
          ref={listaRef}
          id={idLista}
          role="listbox"
          aria-label={ariaLabel}
          style={{
            position: 'fixed',
            ...posicao,
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
            overflowY: 'auto',
          }}
        >
          {opcoes.map((opcao, i) => {
            const focada = i === indiceFoco;
            return (
              <div
                key={opcao.chave}
                id={`${idLista}-${i}`}
                role="option"
                aria-selected={opcao.escolhida}
                // mousedown sem efeito padrao: o campo nao perde o foco antes
                // do clique contar.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => escolher(opcao)}
                onMouseEnter={() => setIndiceFoco(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  minHeight: '44px',
                  padding: '10px 11px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: opcao.escolhida ? '#3A2350' : focada ? '#F3E9F3' : 'transparent',
                  color: opcao.escolhida ? '#FFFFFF' : '#241B2B',
                  fontSize: '14px',
                  fontWeight: opcao.escolhida ? 700 : 500,
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{opcao.rotulo}</span>
                {opcao.escolhida && <span style={{ fontSize: '12px', color: '#F5B9C6', flexShrink: 0 }}>✓</span>}
              </div>
            );
          })}
          {termo && fichasFiltradas.length === 0 && (
            <div style={{ padding: '6px 11px 4px', fontSize: '12px', color: '#7A6E80' }}>
              Nenhuma ficha com esse nome.
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};
