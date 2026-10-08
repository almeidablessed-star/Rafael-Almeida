import React from 'react';
import { useAuth } from '../context/AuthContext';
import { HOTMART_URL } from '../config/hotmart';
import { supabase } from '../lib/supabase';


/**
 * Tela unica de quem esta com o acesso pausado.
 *
 * Nao promete prazo de retencao dos dados de proposito: nenhum prazo foi
 * decidido, e prometer "guardamos por X dias" cria uma obrigacao que ninguem
 * conferiu se o backup cumpre.
 */
export const AssinaturaInativaPage: React.FC = () => {
  const { logout } = useAuth();

  // `logout`, e nao `signOut`: e esse o nome que o contexto expoe. A versao
  // anterior destruturava `signOut`, que vinha undefined, e o botao ficava sem
  // handler nenhum — clicar nao chamava absolutamente nada, e esta e a UNICA
  // saida de quem esta pausado. O typecheck nao pegou porque `@types/react`
  // nao esta instalado neste projeto: `useAuth()` e `any` para o compilador, e
  // destruturar um campo inexistente passa batido.
  //
  // O catch existe porque `logout` relanca o erro. Sem ele, uma falha de rede
  // viraria rejeicao nao tratada e o botao pareceria quebrado de novo; com ele,
  // o pior caso ainda derruba a sessao local e recarrega, devolvendo a pessoa
  // para a tela de login em vez de deixa-la presa aqui.
  const sair = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Falha ao sair:', err);
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      window.location.reload();
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5"
      style={{ background: '#F6F2F5', fontFamily: "'Manrope', sans-serif" }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl p-7 flex flex-col gap-4 text-center"
        style={{ boxShadow: '0 10px 30px rgba(58,35,80,.12)' }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center self-center text-[26px]"
          style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)', boxShadow: '0 8px 18px rgba(58,35,80,.28)' }}
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
          onClick={sair}
          className="w-full py-3 rounded-2xl text-sm font-bold transition-colors"
          style={{ border: '1px solid rgba(58,35,80,0.16)', color: '#3A2350', background: '#FFFFFF' }}
        >
          Sair
        </button>
      </div>
    </div>
  );
};
