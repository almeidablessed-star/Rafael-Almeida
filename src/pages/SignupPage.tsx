import React, { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CarulaLogo } from '../components/CarulaLogo';

interface SignupPageProps {
  onLoginClick: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onLoginClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar e-mail
    if (!email.trim()) {
      setError('E-mail é obrigatório');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um e-mail válido');
      return;
    }

    // Validar senhas
    if (!password.trim()) {
      setError('Senha é obrigatória');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      await signup(email, password);
      setError('Verifique seu e-mail para confirmar o cadastro');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
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

        <h1 className="text-3xl font-bold text-center mb-2">Criar Conta</h1>
        <p className="text-center text-gray-600 mb-8">Junte-se à Carula</p>

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
              required
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
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Confirmar Senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6E3F72] bg-white"
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <div className={`p-3 rounded-lg border ${
              error.includes('Verifique')
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm ${
                error.includes('Verifique')
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {error}
              </p>
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
            {isLoading ? 'Criando...' : 'Criar Conta'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600 mb-4">
            Já tem conta?
          </p>
          <button
            onClick={onLoginClick}
            className="w-full py-3 rounded-xl font-semibold border-2 border-[#6E3F72] text-[#6E3F72] hover:bg-[#6E3F72] hover:text-white transition-all"
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
};
