import React, { useEffect, useLayoutEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TabType } from '../../types';

interface PassoTour {
  tab: TabType;
  texto: string;
  /** So o passo Produtos usa: pede pro ProdutosModule abrir direto no filtro Compras (ver `abaInicial` em ProdutosModule.tsx), em vez do default "Todos os Produtos". */
  abaProdutos?: 'compras';
}

const PASSOS: PassoTour[] = [
  {
    tab: 'produtos',
    texto: 'Já comprou algo pra usar nos seus bolos? Lance aqui — o produto e o estoque são criados automaticamente.',
    abaProdutos: 'compras',
  },
  { tab: 'fichas', texto: 'Aqui você monta a receita de cada produto, usando os itens que cadastrou.' },
  { tab: 'pedidos', texto: 'Aqui você lança as vendas, usando as fichas que criou.' },
  { tab: 'dashboard', texto: 'Aqui você acompanha sua meta da semana e sua saúde financeira.' },
];

interface Retangulo {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TourPrimeirosPassosProps {
  /** Navega a aba real do app para o passo atual, para a pessoa ver a tela de verdade atras do balao. */
  onNavigateToTab: (tab: TabType) => void;
  /** Chamado junto com a navegacao quando o passo atual pede um filtro especifico dentro de Produtos (ver `abaProdutos` em PassoTour). */
  onSolicitarAbaProdutos?: (aba: 'compras') => void;
  /** Chamado ao concluir o ultimo passo OU ao pular a qualquer momento. Deve marcar como visto e fechar o tour. */
  onFinish: () => void;
}

/**
 * Tour guiado de 4 passos apontando para os icones do rodape, na ordem
 * pedagogica Produtos -> Fichas -> Pedidos -> Inicio (que NAO e a ordem
 * visual do rodape). O passo Produtos aponta pro mesmo icone de sempre, mas
 * pede pro ProdutosModule abrir ja no filtro Compras — lancar uma compra cria
 * o produto, com estoque e financeiro corretos, numa acao so, em vez de
 * ensinar o cadastro direto (que so cria uma referencia de custo, sem
 * estoque nem compra real). Sem lib externa: o "spotlight" e so um box-shadow
 * gigante no recorte do icone, e o balao usa os mesmos tokens de cor/fonte
 * do resto do app.
 */
export const TourPrimeirosPassos: React.FC<TourPrimeirosPassosProps> = ({ onNavigateToTab, onSolicitarAbaProdutos, onFinish }) => {
  const [passoAtual, setPassoAtual] = useState(0);
  const [rect, setRect] = useState<Retangulo | null>(null);

  const passo = PASSOS[passoAtual];
  const ultimoPasso = passoAtual === PASSOS.length - 1;

  useEffect(() => {
    onNavigateToTab(passo.tab);
    if (passo.abaProdutos) onSolicitarAbaProdutos?.(passo.abaProdutos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passoAtual]);

  useLayoutEffect(() => {
    const medir = () => {
      const alvo = document.querySelector(`[data-tour-id="${passo.tab}"]`);
      if (!alvo) return;
      const r = alvo.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    // Um frame de folga para o navegador aplicar o novo activeTab (cor/negrito
    // do icone) antes de medir — a posicao do botao em si nao muda, so o estilo.
    const raf = requestAnimationFrame(medir);
    window.addEventListener('resize', medir);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', medir);
    };
  }, [passoAtual]);

  if (!rect) return null;

  const centroX = rect.left + rect.width / 2;
  const larguraBalao = 300;
  const margem = 16;
  const balaoLeft = Math.min(
    Math.max(centroX - larguraBalao / 2, margem),
    window.innerWidth - larguraBalao - margem
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }}>
      {/* Bloqueia cliques no resto da tela; a navegacao e so pelos botoes do tour. */}
      <div style={{ position: 'absolute', inset: 0 }} />

      <AnimatePresence mode="wait">
        <motion.div
          key={`spot-${passoAtual}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            borderRadius: 16,
            boxShadow: '0 0 0 9999px rgba(26, 12, 36, 0.62)',
            pointerEvents: 'none',
          }}
        />
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={`card-${passoAtual}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            left: balaoLeft,
            bottom: 110,
            width: larguraBalao,
            maxWidth: `calc(100vw - ${margem * 2}px)`,
            background: '#FFFFFF',
            borderRadius: 18,
            padding: '16px 18px',
            boxShadow: '0 12px 28px rgba(58, 35, 80, 0.35)',
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#A096A6', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Passo {passoAtual + 1} de {PASSOS.length}
            </span>
            <button
              onClick={onFinish}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px 6px',
                fontSize: 12,
                fontWeight: 700,
                color: '#C4626F',
                cursor: 'pointer',
              }}
            >
              Pular
            </button>
          </div>

          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#3A2350', lineHeight: 1.45 }}>
            {passo.texto}
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <button
              onClick={() => (ultimoPasso ? onFinish() : setPassoAtual((p) => p + 1))}
              style={{
                background: '#3A2350',
                color: '#F5B9C6',
                border: 'none',
                borderRadius: 12,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {ultimoPasso ? 'Concluir' : 'Próximo'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
