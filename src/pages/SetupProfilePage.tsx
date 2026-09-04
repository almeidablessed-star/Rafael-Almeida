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
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-gradient-to-b from-[#F5F5F5] to-white">
      <div className="w-full max-w-md">
        <div className="mb-12 flex justify-center">
          <CarulaLogo />
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">Bem-vinda(o)! 🎉</h1>
        <p className="text-center text-gray-600 mb-8">Vamos completar seu perfil</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] bg-white"
              disabled={isLoading}
              required
            />
          </div>

          <div className="relative">
            <Store className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Nome da sua confeitaria"
              value={nomeConfeitaria}
              onChange={(e) => setNomeConfeitaria(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] bg-white"
              disabled={isLoading}
              required
            />
          </div>

          <div className="relative">
            <DollarSign className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <select
              value={moeda}
              onChange={(e) => setMoeda(e.target.value as 'BRL' | 'USD')}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] bg-white cursor-pointer"
              disabled={isLoading}
            >
              <option value="BRL">Real Brasileiro (R$)</option>
              <option value="USD">Dólar Americano ($)</option>
            </select>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{
              background: isLoading ? '#C0C0C0' : 'linear-gradient(135deg, #6E3F72 0%, #3A2350 100%)',
            }}
          >
            {isLoading ? 'Configurando...' : 'Começar'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-8">
          Você pode alterar essas informações no seu perfil depois
        </p>
      </div>
    </div>
  );
};
