import React, { useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

interface VerifyOtpStandalonePageProps {
  /** De onde a pessoa veio. So muda os textos e o marcador que fica ligado. */
  modo?: 'primeiro-acesso' | 'esqueci-senha' | 'parceiro';
  onBackClick?: () => void;
}

export const VerifyOtpStandalonePage: React.FC<VerifyOtpStandalonePageProps> = ({ onBackClick, modo = 'primeiro-acesso' }) => {
  const { beginAuthTransition, endAuthTransition } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);


  // Reenvio. A funcao responde sempre a mesma coisa — e-mail existindo ou nao,
  // limite estourado ou nao — entao a tela nao tem como dizer mais do que
  // "pedimos um novo". Confirmar o envio aqui entregaria quem e cliente.
  const [reenviando, setReenviando] = useState(false);
  const [avisoReenvio, setAvisoReenvio] = useState<string | null>(null);

  // Campo de e-mail vazio ao pedir codigo. Antes o botao "Nao recebi o codigo"
  // simplesmente nao fazia nada, e o "Enviar codigo" ficava apagado sem dizer
  // por que. So depende do campo vazio, nunca da resposta do servidor: nao
  // revela quem e cliente.
  const [faltaEmail, setFaltaEmail] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const avisarFaltaEmail = () => {
    setAvisoReenvio(null);
    setFaltaEmail(true);
    // Centraliza o campo antes de focar: com o teclado aberto, o campo e o
    // aviso logo abaixo dele ficam na parte visivel da tela.
    emailRef.current?.scrollIntoView({ block: 'center' });
    emailRef.current?.focus({ preventScroll: true });
  };

  /**
   * Duas etapas, SO no "esqueci minha senha".
   *
   * Quem cai aqui por esse caminho nao tem codigo nenhum — e a tela pedia
   * e-mail e codigo de uma vez, com um unico botao "Verificar Codigo". O unico
   * jeito de receber um codigo era clicar em "Nao recebi o codigo", um link
   * cujo nome pressupoe um envio que nunca houve. Quem lesse aquilo com o
   * campo em branco entendia que nao era para ele, e ficava parado.
   *
   * Primeiro acesso e area do parceiro continuam em UMA etapa: ali a pessoa
   * chega com o codigo ja no e-mail, e separar so adicionaria um clique.
   */
  const duasEtapas = modo === 'esqueci-senha';
  const [etapa, setEtapa] = useState<'email' | 'codigo'>(duasEtapas ? 'email' : 'codigo');

  const naoRecebi = async () => {
    // trim(): so espacos tambem conta como vazio (a funcao recebia "" e a tela
    // dizia "enviamos" sem nada ter sido enviado).
    const emailLimpo = email.trim();
    if (!emailLimpo) {
      avisarFaltaEmail();
      return;
    }
    setReenviando(true);
    setAvisoReenvio(null);
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLimpo }),
      });
    } catch {
      // Silencio de proposito: mesmo uma falha de rede nao deve virar sinal.
    } finally {
      setAvisoReenvio('Se houver uma conta com esse e-mail, enviamos um novo código. Use sempre o mais recente.');
      setReenviando(false);
    }
  };

  /**
   * Etapa 1: pede o codigo e AVANCA SEMPRE, inclusive se o e-mail nao existir.
   *
   * A funcao `resend-otp` responde a mesma coisa em todos os casos, de
   * proposito, para nao revelar quem e cliente. Se a tela parasse aqui quando o
   * e-mail nao existe, ela entregaria exatamente o que a funcao esconde.
   */
  const enviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      avisarFaltaEmail();
      return;
    }
    setError(null);
    await naoRecebi();
    setEtapa('codigo');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !otp || otp.length !== 6) {
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
        body: JSON.stringify({ email: email.trim(), code: otp }),
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

      // Quem veio por "Esqueci minha senha" ja tem senha, entao nao tem o
      // marcador de senha temporaria para segurar a tela. Este fica no lugar
      // dele e sobrevive a recarregar e ao voltar.
      // Parceiro nao define senha: ele so precisa da sessao para o painel ler
      // os proprios numeros. Por isso nenhum marcador e ligado aqui.
      if (modo === 'esqueci-senha') {
        await supabase.auth.updateUser({ data: { redefinir_senha: true } });
      }

      setSuccess(true);

      // Redirect to password reset page after 1.5 seconds
      setTimeout(() => {
        window.location.href = modo === 'parceiro' ? '/parceiro' : '/?type=recovery';
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
            {modo === 'esqueci-senha'
              ? 'Trocar a Senha'
              : modo === 'parceiro'
                ? 'Área do Parceiro'
                : 'Verifique Seu Email'}
          </h1>
          <p style={{
            color: '#666',
            fontSize: '14px',
          }}>
            {modo === 'esqueci-senha'
              ? (etapa === 'email'
                  ? 'Digite seu e-mail para receber um código de 6 dígitos'
                  : 'Digite o código que enviamos. Em seguida você define a senha nova.')
              : modo === 'parceiro'
                ? 'Digite seu e-mail de parceiro para receber um código de entrada'
                : 'Digite seu e-mail e o código de 6 dígitos que enviamos'}
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
        <form
          onSubmit={duasEtapas && etapa === 'email' ? enviarCodigo : handleVerifyOtp}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {/* Na etapa do codigo, o e-mail ja escolhido vira texto — continua a
              vista (e o que o codigo foi enviado) sem convidar a reeditar. */}
          {duasEtapas && etapa === 'codigo' && (
            <div style={{
              background: '#F6F2F5',
              border: '1px solid #E6E1DB',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}>
              <span style={{ fontSize: '13px', color: '#241B2B', wordBreak: 'break-all' }}>
                {email}
              </span>
              <button
                type="button"
                onClick={() => { setEtapa('email'); setOtp(''); setAvisoReenvio(null); setError(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6E3F72',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  flexShrink: 0,
                }}
              >
                trocar
              </button>
            </div>
          )}

          {/* Email Input */}
          <div style={{ display: duasEtapas && etapa === 'codigo' ? 'none' : 'block' }}>
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
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFaltaEmail(false);
              }}
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
            {/* Logo abaixo do campo, e nao do botao: o cursor vai para o
                e-mail e, no celular, o teclado sobe e cobre a parte de baixo
                da tela. Colado ao campo, o aviso fica a vista junto com ele. */}
            {faltaEmail && (
              <p role="alert" style={{ marginTop: '8px', fontSize: '12px', color: '#C85A54', fontWeight: 600, lineHeight: 1.5 }}>
                Digite seu e-mail aqui para receber um novo código.
              </p>
            )}
          </div>

          {/* OTP Input */}
          <div style={{ display: duasEtapas && etapa === 'email' ? 'none' : 'block' }}>
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
          {(() => {
            const enviando = duasEtapas && etapa === 'email';
            // "Enviar codigo" fica clicavel com o campo vazio: o clique mostra
            // o aviso em vez de o botao ficar apagado sem explicacao.
            const bloqueado = enviando
              ? reenviando
              : (isLoading || !email.trim() || otp.length !== 6);
            return (
              <button
                type="submit"
                disabled={bloqueado}
                style={{
                  background: 'linear-gradient(140deg, #6E3F72, #A85E86)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: bloqueado ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                  opacity: bloqueado ? 0.7 : 1,
                  marginTop: '8px',
                }}
              >
                {enviando
                  ? (reenviando ? 'Enviando...' : 'Enviar código')
                  : (isLoading ? 'Verificando...' : 'Verificar Código')}
              </button>
            );
          })()}
        </form>

        {/* Reenvio. Fica fora do <form> para nao disparar o submit.
            Na etapa do e-mail some: ali o envio JA e o botao principal, e
            oferecer "nao recebi" antes do primeiro envio era a confusao que
            esta separacao veio desfazer. */}
        <div style={{
          marginTop: '14px',
          textAlign: 'center',
          display: duasEtapas && etapa === 'email' ? 'none' : 'block',
        }}>
          <button
            type="button"
            onClick={naoRecebi}
            disabled={reenviando}
            style={{
              background: 'none',
              border: 'none',
              color: '#6E3F72',
              fontSize: '13px',
              fontWeight: 700,
              cursor: reenviando ? 'default' : 'pointer',
              opacity: reenviando ? 0.6 : 1,
              textDecoration: 'underline',
            }}
          >
            {reenviando ? 'Enviando...' : 'Não recebi o código'}
          </button>
          {avisoReenvio && (
            <p style={{ marginTop: '8px', fontSize: '12px', color: '#7A6E80', lineHeight: 1.5 }}>
              {avisoReenvio}
            </p>
          )}
        </div>

        {/* Info */}
        <p style={{
          fontSize: '12px',
          color: '#999',
          textAlign: 'center',
          marginTop: '20px',
        }}>
          O código expira em 30 minutos
        </p>
      </div>
    </div>
  );
};
