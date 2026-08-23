import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const { logout, beginAuthTransition, endAuthTransition } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validatePassword = (): string | null => {
    if (!password || !confirmPassword) {
      return 'Preencha os dois campos';
    }
    if (password.length < 6) {
      return 'A senha deve ter no mínimo 6 caracteres';
    }
    if (password !== confirmPassword) {
      return 'As senhas não conferem';
    }
    return null;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // updateUser emits USER_UPDATED, which the auth listener would otherwise
      // read as a completed login - clearing the recovery flag and unmounting
      // this page before it can confirm anything. Hold it off until the
      // logout and redirect below.
      beginAuthTransition();

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        endAuthTransition();
        setError(updateError.message);
        return;
      }

      setSuccess(true);

      // Fazer logout e redirecionar para login após 2 segundos
      setTimeout(async () => {
        try {
          await logout();
        } catch (err) {
          console.error('Error logging out:', err);
        }
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      endAuthTransition();
      setError(err.message || 'Erro ao atualizar senha');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(140deg, #6E3F72, #A85E86)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '26px',
          padding: '40px',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}>
          <CheckCircle style={{
            width: '64px',
            height: '64px',
            color: '#10b981',
            margin: '0 auto 20px',
          }} />
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#241B2B',
            marginBottom: '16px',
          }}>
            Senha Atualizada!
          </h1>
          <p style={{
            color: '#666',
            marginBottom: '20px',
          }}>
            Sua senha foi definida com sucesso. Você será redirecionado para fazer login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(140deg, #6E3F72, #A85E86)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Manrope', sans-serif",
    }}>
      <div style={{
        background: 'white',
        borderRadius: '26px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <Lock style={{
            width: '48px',
            height: '48px',
            color: '#6E3F72',
            margin: '0 auto 16px',
          }} />
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#241B2B',
            marginBottom: '8px',
          }}>
            Defina Sua Senha
          </h1>
          <p style={{
            color: '#666',
            fontSize: '14px',
          }}>
            Crie uma senha segura para acessar o Carula
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}>
            <AlertCircle style={{
              width: '20px',
              height: '20px',
              color: '#dc2626',
              flexShrink: 0,
              marginTop: '2px',
            }} />
            <p style={{
              color: '#dc2626',
              fontSize: '14px',
              margin: 0,
            }}>
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Password Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#241B2B',
              marginBottom: '8px',
            }}>
              Nova Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: "'Manrope', sans-serif",
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#6E3F72'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Confirm Password Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#241B2B',
              marginBottom: '8px',
            }}>
              Confirme a Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme sua senha"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: "'Manrope', sans-serif",
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#6E3F72'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              background: 'linear-gradient(140deg, #6E3F72, #A85E86)',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
              opacity: isLoading ? 0.7 : 1,
              marginTop: '8px',
            }}
          >
            {isLoading ? 'Atualizando...' : 'Definir Senha'}
          </button>
        </form>

        {/* Info */}
        <p style={{
          fontSize: '12px',
          color: '#999',
          textAlign: 'center',
          marginTop: '20px',
        }}>
          A senha deve ter no mínimo 6 caracteres
        </p>
      </div>
    </div>
  );
};
