import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Janela de aviso e de pergunta do app, no lugar das caixinhas do navegador
 * (`alert` / `confirm`). Mesmo molde das perguntas que ja existiam ("O total vai
 * mudar", "O campo do sinal esta vazio", "Apagar todos os lancamentos?").
 *
 * Funciona de qualquer lugar, sem provider: cada chamada monta a janela num
 * <div> proprio no fim do <body> e desmonta ao responder.
 *
 *   avisar('Escolha o produto de cada item.', { titulo: 'Falta escolher o produto' });
 *   if (!(await perguntar('Excluir esta ficha?', { confirmar: 'Excluir', perigo: true }))) return;
 *
 * Diferenca para a caixinha: o `alert`/`confirm` paravam o codigo ate a
 * resposta; aqui a resposta chega por promessa. Quem precisa da resposta usa
 * `await`. Aviso sem pergunta pode ser chamado sem esperar.
 */

type Opcoes = {
  titulo?: string;
  /** Texto do botao de confirmar (so em `perguntar`). */
  confirmar?: string;
  /** Texto do botao de cancelar (so em `perguntar`). */
  cancelar?: string;
  /** Acao que apaga ou nao tem volta: botao rosado e foco no Cancelar. */
  perigo?: boolean;
};

const Janela: React.FC<{
  mensagem: string;
  opcoes: Opcoes;
  pergunta: boolean;
  responder: (sim: boolean) => void;
}> = ({ mensagem, opcoes, pergunta, responder }) => {
  // Esc fecha como "nao" (no aviso, so fecha).
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') responder(false);
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [responder]);

  const botaoPrincipal: React.CSSProperties = {
    background: opcoes.perigo ? '#C4626F' : 'linear-gradient(135deg, #6E3F72 0%, #3A2350 100%)',
    minHeight: '44px',
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100001] animate-fadeIn"
      onClick={() => responder(false)}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={opcoes.titulo ? 'aviso-app-titulo' : undefined}
      aria-describedby="aviso-app-mensagem"
    >
      <div
        className="bg-white rounded-[24px] p-6 space-y-4 w-[90%] max-w-sm"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        {opcoes.titulo && (
          <h3 id="aviso-app-titulo" className="font-serif-display text-lg" style={{ color: '#241B2B' }}>
            {opcoes.titulo}
          </h3>
        )}
        <p id="aviso-app-mensagem" style={{ color: '#7A6E80', fontSize: '14px', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
          {mensagem}
        </p>
        <div className="flex gap-2 pt-4">
          {pergunta && (
            <button
              type="button"
              autoFocus={opcoes.perigo}
              onClick={() => responder(false)}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: '#F6F2F5', color: '#241B2B', minHeight: '44px' }}
            >
              {opcoes.cancelar || 'Cancelar'}
            </button>
          )}
          <button
            type="button"
            autoFocus={!opcoes.perigo}
            onClick={() => responder(true)}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
            style={botaoPrincipal}
          >
            {pergunta ? opcoes.confirmar || 'Confirmar' : 'Entendi'}
          </button>
        </div>
      </div>
    </div>
  );
};

const abrir = (mensagem: string, opcoes: Opcoes, pergunta: boolean) =>
  new Promise<boolean>((resolve) => {
    const lugar = document.createElement('div');
    document.body.appendChild(lugar);
    const raiz = createRoot(lugar);
    let respondido = false;
    const responder = (sim: boolean) => {
      if (respondido) return;
      respondido = true;
      raiz.unmount();
      lugar.remove();
      resolve(sim);
    };
    raiz.render(<Janela mensagem={mensagem} opcoes={opcoes} pergunta={pergunta} responder={responder} />);
  });

/** Aviso com um botao so ("Entendi"). Resolve quando a pessoa fecha. */
export const avisar = (mensagem: string, opcoes: Opcoes = {}) => abrir(mensagem, opcoes, false).then(() => undefined);

/** Pergunta com Cancelar e Confirmar. Resolve `true` so no Confirmar. */
export const perguntar = (mensagem: string, opcoes: Opcoes = {}) => abrir(mensagem, opcoes, true);
