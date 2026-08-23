import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

interface VerifyOtpStandalonePageProps {
  onBackClick?: () => void;
}

export const VerifyOtpStandalonePage: React.FC<VerifyOtpStandalonePageProps> = ({ onBackClick }) => {
  const { beginAuthTransition, endAuthTransition } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !otp || otp.length !== 6) {
      setError('Digite seu e-mail e o código de 6 dígitos');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call Edge Function to verify OTP and get session
      const response = await fetch('https://inqyobsjuztztvafpzxn.supabase.co/functions/v1/swift-responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Código inválido ou expirado');
        return;
      }

      // Set session with returned tokens. The session lands here but the user
      // still has to set a password, so hold the auth listener off until the
      // redirect below - otherwise the post-login screens take over and unmount
      // this page while it is showing its confirmation.
      if (data.accessToken) {
        beginAuthTransition();
        await supabase.auth.setSession({
          access_token: data.accessToken,
          refresh_token: data.refreshToken || '',
        });
      }

      setSuccess(true);

      // Redirect to password reset page after 1.5 seconds
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
        position: 'relative',
      }}>
        {/* Back Button */}
        {onBackClick && (
          <button
            onClick={onBackClick}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#6E3F72',
              fontSize: '14px',
              fontFamily: "'Manrope', sans-serif",
              fontWeight: '600',
            }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Voltar
          </button>
        )}

        {/* Header */}
        <div style={{ marginBottom: '30px', textAlign: 'center', marginTop: '30px' }}>
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
            Digite seu e-mail e o código de 6 dígitos que enviamos
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
          {/* Email Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#241B2B',
              marginBottom: '8px',
            }}>
              Seu E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
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
            disabled={isLoading || !email || otp.length !== 6}
            style={{
              background: 'linear-gradient(140deg, #6E3F72, #A85E86)',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (isLoading || !email || otp.length !== 6) ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
              opacity: (isLoading || !email || otp.length !== 6) ? 0.7 : 1,
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
