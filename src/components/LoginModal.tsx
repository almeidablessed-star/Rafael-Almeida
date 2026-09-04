import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Email e senha são obrigatórios' });
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      setMessage({ type: 'success', text: 'Login realizado com sucesso!' });

      setTimeout(() => {
        onLoginSuccess(email);
      }, 1000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Email ou senha incorretos' });
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!businessName.trim()) {
      setMessage({ type: 'error', text: 'Nome da confeitaria é obrigatório' });
      return;
    }

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Email é obrigatório' });
      return;
    }

    if (!password.trim()) {
      setMessage({ type: 'error', text: 'Senha é obrigatória' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não correspondem' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Senha deve ter no mínimo 6 caracteres' });
      return;
    }

    setLoading(true);

    try {
      await signup(email, password, businessName);
      setMessage({ type: 'success', text: 'Conta criada com sucesso!' });

      setTimeout(() => {
        onLoginSuccess(email);
      }, 1000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao criar conta. Tente novamente.' });
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(58, 35, 80, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '32px 24px',
          width: '90%',
          maxWidth: '420px',
          zIndex: 1001,
          boxShadow: '0 20px 60px rgba(58, 35, 80, 0.2)',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '28px', color: '#241B2B', margin: 0 }}>
            {isSignUp ? 'Criar Conta' : 'Fazer Login'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#241B2B',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {/* Business Name - Only for Sign Up */}
          {isSignUp && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#7A6E80',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Nome da Confeitaria
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Sua Confeitaria"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #EDE6EF',
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '14px',
                  color: '#241B2B',
                  background: '#FFFFFF',
                  boxSizing: 'border-box',
                  opacity: loading ? 0.6 : 1,
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#C4626F';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#EDE6EF';
                }}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: '#7A6E80',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #EDE6EF',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '14px',
                color: '#241B2B',
                background: '#FFFFFF',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1,
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#C4626F';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#EDE6EF';
              }}
            />
          </div>

          {/* Senha */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: '#7A6E80',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #EDE6EF',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '14px',
                color: '#241B2B',
                background: '#FFFFFF',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1,
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#C4626F';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#EDE6EF';
              }}
            />
          </div>

          {/* Confirm Password - Only for Sign Up */}
          {isSignUp && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#7A6E80',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Confirmar Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #EDE6EF',
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '14px',
                  color: '#241B2B',
                  background: '#FFFFFF',
                  boxSizing: 'border-box',
                  opacity: loading ? 0.6 : 1,
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#C4626F';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#EDE6EF';
                }}
              />
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              borderRadius: '8px',
              background: message.type === 'success' ? '#D4F1D4' : '#FFE6E6',
              color: message.type === 'success' ? '#2D5E2D' : '#C41E3A',
              fontSize: '12px',
              fontWeight: 600,
              textAlign: 'center',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {message.text}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <button
            onClick={isSignUp ? handleSignUp : handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: loading ? '#A096A6' : '#3A2350',
              color: '#FFFFFF',
              border: 'none',
              fontFamily: "'Manrope', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#5A3A70';
            }}
            onMouseLeave={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#3A2350';
            }}
          >
            {loading ? 'Aguarde...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </button>
        </div>

        {/* Toggle Sign Up / Login */}
        <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '1px solid #EDE6EF' }}>
          <p style={{ margin: '0 0 12px 0', color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontSize: '12px' }}>
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
          </p>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage(null);
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setBusinessName('');
            }}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: '#C4626F',
              fontSize: '12px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Manrope', sans-serif",
              textDecoration: 'underline',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {isSignUp ? 'Faça login aqui' : 'Crie uma conta'}
          </button>
        </div>
      </div>
    </>
  );
};
