import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';

export const VerifyOtpPage: React.FC = () => {
  const { user, beginAuthTransition, endAuthTransition } = useAuth();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setError('Digite um código de 6 dígitos');
      return;
    }

    if (!user?.email) {
      setError('Usuária(o) não encontrada(o)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Mesma rota da VerifyOtpStandalonePage: quem confere o codigo e a Edge
      // Function, com service-role.
      //
      // Antes esta tela consultava `otp_codes` direto do navegador e marcava
      // `used` ela mesma — e era so por causa disso que a tabela precisava de
      // politicas abertas para visitante. Com o codigo guardado em texto, isso
      // deixava qualquer um ler os codigos de todas as compradoras. Nenhuma tela
      // do app toca mais nessa tabela.
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/swift-responder`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, code: otp }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Código inválido ou expirado');
        return;
      }

      // A sessao chega aqui, mas a pessoa ainda precisa definir a senha: segura
      // o ouvinte de auth ate o redirecionamento, senao as telas de pos-login
      // assumem e desmontam esta pagina no meio da confirmacao.
      if (data.accessToken) {
        beginAuthTransition();
        await supabase.auth.setSession({
          access_token: data.accessToken,
          refresh_token: data.refreshToken || '',
        });
      }

      setSuccess(true);

      setTimeout(() => {
        window.location.href = '/?type=recovery';
      }, 1500);
    } catch (err: any) {
      endAuthTransition();
      setError(err.message || 'Erro ao verificar código');
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
            Código Verificado!
          </h1>
          <p style={{
            color: '#666',
            marginBottom: '20px',
          }}>
            Agora você pode definir sua nova senha...
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
            Verifique Seu Email
          </h1>
          <p style={{
            color: '#666',
            fontSize: '14px',
          }}>
            Digite o código de 6 dígitos que enviamos
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
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* OTP Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#241B2B',
              marginBottom: '8px',
            }}>
              Código de 6 Dígitos
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(value);
              }}
              placeholder="000000"
              maxLength={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '24px',
                fontWeight: '600',
                letterSpacing: '8px',
                fontFamily: "'Manrope', sans-serif",
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                textAlign: 'center',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#6E3F72'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            style={{
              background: 'linear-gradient(140deg, #6E3F72, #A85E86)',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (isLoading || otp.length !== 6) ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
              opacity: (isLoading || otp.length !== 6) ? 0.7 : 1,
              marginTop: '8px',
            }}
          >
            {isLoading ? 'Verificando...' : 'Verificar Código'}
          </button>
        </form>

        {/* Info */}
        <p style={{
          fontSize: '12px',
          color: '#999',
          textAlign: 'center',
          marginTop: '20px',
        }}>
          O código expira em 10 minutos
        </p>
      </div>
    </div>
  );
};
