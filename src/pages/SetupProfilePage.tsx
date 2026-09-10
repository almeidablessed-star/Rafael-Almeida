import React, { useEffect, useState } from 'react';
import { User, Store, DollarSign, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CarulaLogo } from '../components/CarulaLogo';

export const SetupProfilePage: React.FC = () => {
  const { setupProfile, user } = useAuth();

  const [nome, setNome] = useState('');
  // Ja preenchido com o que foi digitado na tela de cadastro, que viaja no
  // metadata do auth. Continua editavel: quem chegou aqui por outro caminho
  // (conta antiga, recuperacao) encontra o campo vazio, como antes.
  const [nomeConfeitaria, setNomeConfeitaria] = useState(
    () => (user?.user_metadata?.nome_confeitaria as string | undefined) || ''
  );
  const [moeda, setMoeda] = useState<'BRL' | 'USD'>('BRL');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // O `user` chega de forma assincrona: o valor inicial acima roda antes de a
  // sessao carregar e pegaria vazio. Aqui preenche assim que ele chega, mas so
  // enquanto o campo estiver intocado — digitar tem precedencia sobre o
  // metadata, senao a correcao de quem se arrependeu do nome seria desfeita.
  useEffect(() => {
    const doMetadata = user?.user_metadata?.nome_confeitaria as string | undefined;
    if (!doMetadata) return;
    setNomeConfeitaria((atual) => (atual.trim() ? atual : doMetadata));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nome.trim() || !nomeConfeitaria.trim()) {
      setError('Preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      await setupProfile(nome, nomeConfeitaria, moeda);
    } catch (err: any) {
      setError(err.message || 'Erro ao configurar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDE7DC]">
      {/* Cabecalho gradiente — mesmo padrao do topo do onboarding financeiro
          e do Dashboard, em vez do cinza generico que esta tela usava
          sozinha (unica pagina fora do padrao visual validado do app). */}
      <div
        className="text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
          padding: '20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top, 0px))',
          paddingBottom: '28px',
          boxShadow: '0 30px 70px rgba(58,35,80,0.26)',
          borderRadius: '0px 0px 32px 32px',
        }}
      >
        <div className="flex justify-center mb-3">
          <CarulaLogo />
        </div>
        <div className="font-serif-display text-[26px] text-white text-center leading-[1.2]">
          Bem-vinda(o)! 🎉
        </div>
        <p className="text-center text-[12px] text-white/75 mt-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Vamos completar seu perfil
        </p>
      </div>

      {/* Card de conteudo — mesmo card claro do onboarding */}
      <div className="max-w-sm mx-auto px-4 -mt-4 relative z-10 pb-10">
        <div
          className="bg-[#F6F2F5] rounded-2xl p-5"
          style={{ boxShadow: '0 8px 20px rgba(58,35,80,0.09)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-5 h-5" style={{ color: '#9A8FA0' }} />
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#E6E1DB] rounded-xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#6E3F72]"
                disabled={isLoading}
                required
              />
            </div>

            <div className="relative">
              <Store className="absolute left-4 top-3.5 w-5 h-5" style={{ color: '#9A8FA0' }} />
              <input
                type="text"
                placeholder="Nome da sua confeitaria"
                value={nomeConfeitaria}
                onChange={(e) => setNomeConfeitaria(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#E6E1DB] rounded-xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#6E3F72]"
                disabled={isLoading}
                required
              />
            </div>

            <div className="relative">
              <DollarSign className="absolute left-4 top-3.5 w-5 h-5" style={{ color: '#9A8FA0' }} />
              <select
                value={moeda}
                onChange={(e) => setMoeda(e.target.value as 'BRL' | 'USD')}
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#E6E1DB] rounded-xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#6E3F72] cursor-pointer"
                disabled={isLoading}
              >
                <option value="BRL">Real Brasileiro (R$)</option>
                <option value="USD">Dólar Americano ($)</option>
              </select>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#FDF4F5] border border-[rgba(196,98,111,.35)]">
                <p className="text-[12px] text-[#C4626F]" style={{ fontFamily: "'Manrope', sans-serif" }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl text-white text-sm font-bold active:scale-98 transition-all flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
              style={{
                background: isLoading ? '#C0C0C0' : 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)',
              }}
            >
              {isLoading ? 'Configurando...' : 'Começar'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-[11px] mt-5" style={{ color: '#9A8FA0', fontFamily: "'Manrope', sans-serif" }}>
            Você pode alterar essas informações no seu perfil depois
          </p>
        </div>
      </div>
    </div>
  );
};
