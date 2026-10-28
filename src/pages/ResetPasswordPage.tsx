import React, { useState } from 'react';
import { EntradaComputador } from '../components/EntradaComputador';
import { useTelaDeComputador } from '../hooks/useTelaDeComputador';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Uma — e so uma — retentativa na troca de senha, quando o fetch nao recebeu
 * resposta nenhuma.
 *
 * Por que aqui e nao no wrapper de `lib/supabase.ts`: aquele retry cobre so
 * GET, de proposito. Repetir uma ESCRITA tem risco de duplicar o efeito se a
 * falha acontecer depois de o servidor processar e so a resposta se perder —
 * e lancar o mesmo pedido duas vezes e justamente o estrago que a regra evita.
 *
 * Trocar senha nao tem esse risco: definir a mesma senha duas vezes da no
 * mesmo que definir uma vez. A operacao e idempotente, entao ela — e so ela —
 * pode sair da regra geral. NAO generalizar isto para outras escritas.
 *
 * O caso que motivou: uma conexao ociosa por alguns minutos e derrubada entre
 * o navegador e o Supabase, e a primeira chamada depois disso falha sem
 * `Response` — "Load failed" no Safari, "Failed to fetch" no Chrome. A mesma
 * chamada funciona na tentativa seguinte, com conexao nova. Ver
 * docs/pendencia-load-failed-ao-trocar-senha.md e
 * docs/investigacao-cors-transacoes-movimentos.md.
 *
 * So repete falha de REDE. Senha fraca, sessao expirada, 422 — qualquer erro
 * que o servidor respondeu — passa direto, sem segunda tentativa: repetir nao
 * mudaria a resposta e so faria a pessoa esperar mais.
 */
const RETRY_TROCA_SENHA_MS = 400;

/** A falha de rede chega de duas formas conforme a versao do supabase-js:
 *  lancada como `TypeError`, ou devolvida como erro com `status` 0 /
 *  `AuthRetryableFetchError`. As duas contam como "nao houve resposta". */
const semRespostaDoServidor = (erro: any): boolean => {
  if (erro instanceof TypeError) return true;
  if (!erro) return false;
  return erro.name === 'AuthRetryableFetchError' || erro.status === 0;
};

async function trocarSenhaComUmaRetentativa(
  atributos: Parameters<typeof supabase.auth.updateUser>[0]
) {
  try {
    const resultado = await supabase.auth.updateUser(atributos);
    if (!semRespostaDoServidor(resultado.error)) return resultado;
  } catch (err) {
    if (!semRespostaDoServidor(err)) throw err;
  }

  await new Promise((resolve) => setTimeout(resolve, RETRY_TROCA_SENHA_MS));
  // 2a e ULTIMA tentativa. Se falhar de novo, o erro sobe como sempre subiu.
  return supabase.auth.updateUser(atributos);
}

export const ResetPasswordPage: React.FC = () => {
  const { logout, beginAuthTransition, endAuthTransition } = useAuth();
  // Computador: mesma moldura do login (painel roxo + cartao). O celular segue
  // no layout de sempre, sem mudanca.
  const pc = useTelaDeComputador();

  // Mesmo botao e mesmo caminho de saida da tela de pausa: `logout` do
  // contexto, com queda para encerrar a sessao local se ele falhar.
  const sair = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Falha ao sair:', err);
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      window.location.reload();
    }
  };
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validatePassword = (): string | null => {
    if (!password || !confirmPassword) {
      return 'Preencha os dois campos';
    }
    if (password.length < 8) {
      return 'A senha deve ter no mínimo 8 caracteres';
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

      // `senha_temporaria: false` junto com a senha, na MESMA chamada: e esse
      // marcador que faz o ProtectedRoute mostrar esta tela. Apagar depois, numa
      // segunda chamada, deixaria uma janela em que a senha ja mudou mas a
      // pessoa continua presa aqui se a segunda falhar.
      const { error: updateError } = await trocarSenhaComUmaRetentativa({
        password: password,
        // Os DOIS marcadores saem juntos: quem chegou aqui definiu a senha, nao
        // importa por qual porta entrou. Desligar so um deixaria a tela presa.
        data: { senha_temporaria: false, redefinir_senha: false },
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
    const sucesso = (
      <>
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
      </>
    );
    if (pc) {
      return (
        <EntradaComputador>
          <div style={{ textAlign: 'center' }}>{sucesso}</div>
        </EntradaComputador>
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
      }}>
        <div style={{
          background: 'white',
          borderRadius: '26px',
          padding: '40px',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}>
          {sucesso}
        </div>
      </div>
    );
  }

  const formulario = (
    <>
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
        A senha deve ter no mínimo 8 caracteres
      </p>

      <button
        type="button"
        onClick={sair}
        className="w-full py-3 rounded-2xl text-sm font-bold transition-colors"
        style={{ border: '1px solid rgba(58,35,80,0.16)', color: '#3A2350', background: '#FFFFFF' }}
      >
        Sair
      </button>
    </>
  );

  if (pc) {
    return <EntradaComputador>{formulario}</EntradaComputador>;
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
        {formulario}
      </div>
    </div>
  );
};
