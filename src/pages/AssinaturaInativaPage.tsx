import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Para onde mandar quem quer voltar a assinar.
 *
 * TODO: preencher com a URL da oferta na Hotmart. Enquanto estiver vazia o
 * botao de renovar simplesmente nao aparece — um botao que leva a lugar nenhum
 * e pior que nenhum botao, porque a pessoa clica, nada acontece e ela conclui
 * que o app esta quebrado em vez de entender que precisa renovar.
 */
const HOTMART_URL = '';

/**
 * Tela unica de quem esta com o acesso pausado.
 *
 * Nao promete prazo de retencao dos dados de proposito: nenhum prazo foi
 * decidido, e prometer "guardamos por X dias" cria uma obrigacao que ninguem
 * conferiu se o backup cumpre.
 */
export const AssinaturaInativaPage: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5"
      style={{ background: '#EDE7DC', fontFamily: "'Manrope', sans-serif" }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl p-7 flex flex-col gap-4 text-center"
        style={{ boxShadow: '0 10px 30px rgba(58,35,80,.12)' }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center self-center text-[26px]"
          style={{ background: '#F3E9F3' }}
          aria-hidden="true"
        >
          ⏸️
        </div>

        <h1 className="font-serif-display text-[24px] leading-tight m-0" style={{ color: '#241B2B' }}>
          Seu acesso está pausado
        </h1>

        <p className="text-[13px] leading-relaxed m-0" style={{ color: '#7A6E80' }}>
          Sua assinatura não está ativa no momento, então o app fica em pausa. Assim que o
          pagamento for confirmado, ele volta a abrir normalmente.
        </p>

        {HOTMART_URL && (
          <a
            href={HOTMART_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 rounded-2xl text-white text-sm font-bold flex items-center justify-center transition-all active:scale-98 hover:brightness-110"
            style={{
              background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)',
              boxShadow: '0 10px 24px rgba(58,35,80,.35)',
            }}
          >
            Renovar assinatura
          </a>
        )}

        <button
          type="button"
          onClick={signOut}
          className="w-full py-3 rounded-2xl text-sm font-bold transition-colors"
          style={{ border: '1px solid rgba(58,35,80,0.16)', color: '#3A2350', background: '#FFFFFF' }}
        >
          Sair
        </button>
      </div>
    </div>
  );
};
