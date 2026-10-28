import React, { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { IconeCarulaApp } from '../components/IconeCarulaApp';
import { LogoCarulaApp } from '../components/LogoCarulaApp';
import { HOTMART_URL } from '../config/hotmart';
import { EntradaComputador } from '../components/EntradaComputador';
import { useTelaDeComputador } from '../hooks/useTelaDeComputador';

interface LoginPageProps {
  /** Mesma tela de codigo do "Ja comprou?", so que anunciada como troca de senha. */
  onForgotPasswordClick: () => void;
  onVerifyOtpClick: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onVerifyOtpClick, onForgotPasswordClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const pc = useTelaDeComputador();

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

  // Computador: moldura de duas colunas, com a marca no painel roxo. O celular
  // continua no retorno de baixo, sem nenhuma mudanca.
  if (pc) {
    const campo: React.CSSProperties = { height: '48px', borderColor: '#E6DDE8', fontSize: '15px' };
    return (
      <EntradaComputador>
        <h1 className="font-serif-display" style={{ fontSize: '44px', lineHeight: 1, fontWeight: 400 }}>Bem-vinda(o)</h1>
        <p style={{ color: '#7A6E80', margin: '8px 0 28px', fontSize: '15px' }}>Acesse sua confeitaria</p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5" style={{ color: '#9A8FA0' }} />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6E3F72] bg-white"
              style={campo}
              disabled={isLoading}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5" style={{ color: '#9A8FA0' }} />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6E3F72] bg-white"
              style={campo}
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
            className="w-full rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:opacity-90"
            style={{
              height: '48px',
              background: isLoading ? '#C0C0C0' : 'linear-gradient(135deg, #6E3F72 0%, #3A2350 100%)',
            }}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div style={{ textAlign: 'right', marginTop: '12px' }}>
          <button type="button" onClick={onForgotPasswordClick} className="text-[#6E3F72] underline" style={{ fontSize: '13px' }}>
            Esqueci minha senha
          </button>
        </div>

        <div style={{ borderTop: '1px solid #EEE6EF', margin: '26px 0 20px' }} />

        <div className="flex items-center justify-between gap-4" style={{ fontSize: '14px', color: '#7A6E80' }}>
          Já comprou?
          <button
            type="button"
            onClick={onVerifyOtpClick}
            className="rounded-xl font-bold border-2 border-[#6E3F72] text-[#6E3F72] hover:bg-[#6E3F72] hover:text-white transition-all"
            style={{ height: '44px', padding: '0 18px' }}
          >
            Verificar Código
          </button>
        </div>

        {HOTMART_URL && (
          <div className="flex items-center justify-between gap-4" style={{ fontSize: '14px', color: '#7A6E80', marginTop: '12px' }}>
            Ainda não tem acesso?
            <a
              href={HOTMART_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl font-bold flex items-center transition-all hover:brightness-95"
              // Cor no style: a regra solta `a { color: #E82C1B }` do index.css
              // vence a classe do Tailwind e pintava o texto de vermelho.
              style={{ height: '44px', padding: '0 18px', background: '#F3E9F3', color: '#6E3F72' }}
            >
              Quero comprar
            </a>
          </div>
        )}
      </EntradaComputador>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-gradient-to-b from-[#F5F5F5] to-white">
      <div className="w-full max-w-md">
        <div className="mb-12 flex justify-center">
          <div className="flex flex-col items-center gap-4">
            <IconeCarulaApp tamanho={76} />
            <LogoCarulaApp fundo="claro" tamanho={40} />
          </div>
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
          {/* "Criar conta" saiu daqui.
              O app passou a ser vendido por assinatura: quem entra, entra
              porque comprou, e a conta nasce pela notificacao da Hotmart. Um
              botao de cadastro aberto deixava qualquer pessoa criar conta e —
              enquanto o padrao da coluna era 'ativo' — ganhar acesso sem pagar.
              A SignupPage continua no repositorio, sem rota, para dar meia-volta
              facil se a decisao mudar. */}
          <div>
            <p className="text-center text-gray-600 mb-4">
              Já comprou?
            </p>
            <button
              onClick={onVerifyOtpClick}
              className="w-full py-3 rounded-xl font-semibold border-2 border-[#6E3F72] text-[#6E3F72] hover:bg-[#6E3F72] hover:text-white transition-all"
            >
              Verificar Código
            </button>
          </div>

          {/* Esqueceu a senha: mesma porta do codigo por e-mail, com outro nome.
              Quem acerta o codigo cai na tela de definir senha, agora tambem
              para quem ja tinha uma. */}
          <div>
            <button
              type="button"
              onClick={onForgotPasswordClick}
              className="w-full text-center text-sm text-[#6E3F72] underline"
            >
              Esqueci minha senha
            </button>
          </div>

          {/* So aparece quando houver link de verdade — ver src/config/hotmart.ts. */}
          {HOTMART_URL && (
            <div>
              <p className="text-center text-gray-600 mb-4 text-sm">
                Ainda não tem acesso?
              </p>
              <a
                href={HOTMART_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl font-semibold bg-gray-100 text-[#6E3F72] hover:bg-gray-200 transition-all text-sm flex items-center justify-center"
              >
                Quero comprar
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
