import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { VerifyOtpStandalonePage } from './VerifyOtpStandalonePage';

interface Numeros {
  total: number;
  ativas: number;
  pausadas: number;
}

/**
 * Painel do parceiro: tres numeros e mais nada.
 *
 * Sem lista linha por linha, sem nome, sem e-mail, sem data. Com volume baixo
 * uma lista anonima ainda identifica — quem indicou uma pessoa so sabe
 * exatamente quem e. Os totais nao tem esse problema.
 *
 * A entrada e a MESMA do app: codigo por e-mail. O que muda e para onde a tela
 * volta depois de acertar o codigo. A conta do Auth de cada parceiro e
 * cadastrada a mao.
 *
 * Quem nao for parceiro ve "acesso negado" seco, sem dizer o motivo: contar que
 * a conta existe mas nao e parceira ja e informacao a mais.
 */
export const PainelParceiroPage: React.FC = () => {
  const { user, isLoading, logout } = useAuth();
  // Mesmo botao e mesmo caminho de saida das outras telas: `logout` do
  // contexto, com queda para encerrar a sessao local se ele falhar.
  const sair = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Falha ao sair:', err);
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      window.location.reload();
    }
  };

  const [numeros, setNumeros] = useState<Numeros | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [negado, setNegado] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setCarregando(false);
      return;
    }

    let valido = true;
    (async () => {
      // A funcao devolve NENHUMA linha para quem nao e parceiro — e por isso
      // que o navegador nunca precisa ler `parceiros`, `usuarias` nem
      // `assinatura_eventos`, que seguem fechadas.
      const { data, error } = await supabase.rpc('painel_do_parceiro');
      if (!valido) return;

      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        setNegado(true);
      } else {
        const linha = Array.isArray(data) ? data[0] : data;
        setNumeros({
          total: Number(linha.total) || 0,
          ativas: Number(linha.ativas) || 0,
          pausadas: Number(linha.pausadas) || 0,
        });
      }
      setCarregando(false);
    })();

    return () => {
      valido = false;
    };
  }, [user, isLoading]);

  if (isLoading || carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F2F5' }}>
        <div className="w-10 h-10 rounded-full border-4 border-[#E6E1DB] border-t-[#6E3F72] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <VerifyOtpStandalonePage
        modo="parceiro"
        onBackClick={() => {
          window.location.href = '/';
        }}
      />
    );
  }

  if (negado || !numeros) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: '#F6F2F5' }}>
        <div
          className="w-full max-w-md text-center"
          style={{ background: '#FFFFFF', borderRadius: '24px', padding: '32px 24px' }}
        >
          <h1
            style={{ fontFamily: "'Instrument Serif', serif", fontSize: '26px', color: '#241B2B', margin: '0 0 8px' }}
          >
            Acesso negado
          </h1>
          <p className="text-sm" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>
            Esta área é só para parceiros.
          </p>
        </div>
      </div>
    );
  }

  const cartao = (rotulo: string, valor: number) => (
    <div
      key={rotulo}
      className="flex-1"
      style={{ background: '#FFFFFF', borderRadius: '20px', padding: '18px 16px', textAlign: 'center' }}
    >
      <div
        style={{ fontSize: '30px', fontWeight: 800, color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}
      >
        {valor}
      </div>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 800,
          color: '#7A6E80',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontFamily: "'Manrope', sans-serif",
          marginTop: '4px',
        }}
      >
        {rotulo}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#F6F2F5' }}>
      <div
        className="px-5"
        style={{
          background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
          paddingTop: 'calc(24px + env(safe-area-inset-top, 0px) + var(--topo-ios27, 0px))',
          paddingBottom: '44px',
        }}
      >
        <span
          className="text-white"
          style={{ fontFamily: "'Instrument Serif', serif", fontSize: '28px', lineHeight: 1.1 }}
        >
          Suas indicações
        </span>
      </div>

      <div className="px-5" style={{ marginTop: '-24px' }}>
        <div className="flex gap-3">
          {cartao('Total', numeros.total)}
          {cartao('Ativas', numeros.ativas)}
          {cartao('Pausadas', numeros.pausadas)}
        </div>

        <p
          className="text-center mt-5 text-[12px]"
          style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}
        >
          "Ativas" conta quem está com a assinatura em dia. A comissão é paga
          pela Hotmart — confira os valores por lá.
        </p>

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
