import React, { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CarulaLogo } from '../components/CarulaLogo';

interface LoginPageProps {
  onSignupClick: () => void;
  onVerifyOtpClick?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSignupClick, onVerifyOtpClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Tente novamente.');
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

        {/* Feminino primeiro, masculino entre parenteses: o publico do app e
            majoritariamente de confeiteiras, e a forma neutra nao pode custar
            isso a elas. Mesmo padrao em todo texto que se dirige a pessoa. */}
        <h1 className="text-3xl font-bold text-center mb-2">Bem-vinda(o)</h1>
        <p className="text-center text-gray-600 mb-8">Acesse sua confeitaria</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] bg-white"
              disabled={isLoading}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] bg-white"
              disabled={isLoading}
            />
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
            {isLoading ? 'Entrando...' : 'Entrar'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-200 space-y-3">
          <div>
            <p className="text-center text-gray-600 mb-4">
              Não tem conta?
            </p>
            <button
              onClick={onSignupClick}
              className="w-full py-3 rounded-xl font-semibold border-2 border-[#6E3F72] text-[#6E3F72] hover:bg-[#6E3F72] hover:text-white transition-all"
            >
              Criar Conta
            </button>
          </div>

          {onVerifyOtpClick && (
            <div>
              <p className="text-center text-gray-600 mb-4 text-sm">
                Já recebeu um código?
              </p>
              <button
                onClick={onVerifyOtpClick}
                className="w-full py-3 rounded-xl font-semibold bg-gray-100 text-[#6E3F72] hover:bg-gray-200 transition-all text-sm"
              >
                Verificar Código
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
