import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { SetupProfilePage } from '../pages/SetupProfilePage';
import { VerifyOtpStandalonePage } from '../pages/VerifyOtpStandalonePage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { AssinaturaInativaPage } from '../pages/AssinaturaInativaPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, userProfile, isLoading, isSetupRequired, isResetPasswordRequired, isOtpVerificationRequired, isValidatingProfile } = useAuth();
  const [authMode, setAuthMode] = React.useState<'login' | 'signup' | 'verify-otp'>('login');

  if (isLoading || isValidatingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F5F5F5] to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#6E3F72] animate-spin" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authMode === 'verify-otp') {
      return <VerifyOtpStandalonePage onBackClick={() => setAuthMode('login')} />;
    }

    return authMode === 'login' ? (
      <LoginPage onSignupClick={() => setAuthMode('signup')} onVerifyOtpClick={() => setAuthMode('verify-otp')} />
    ) : (
      <SignupPage onLoginClick={() => setAuthMode('login')} />
    );
  }

  // A verificacao de codigo continua indo pelos children: ela e tratada dentro
  // do AppContent e nao disputa com o portao de onboarding, porque so acontece
  // em conta que ja passou por aqui antes.
  if (isOtpVerificationRequired) {
    return <>{children}</>;
  }

  // DEFINIR SENHA — e esta a correcao central.
  //
  // Antes, este ramo devolvia os children, e a ResetPasswordPage morava dentro
  // do AppContent. So que os children comecam pelo FinancialOnboardingGate: ele
  // montava primeiro, via o onboarding incompleto e mostrava o passo 1 de 9. O
  // AppContent nunca era alcancado, entao a tela de senha nunca aparecia — e,
  // junto com ela, o ramo do perfil logo abaixo era pulado tambem. Quem comprava
  // caia direto num onboarding que a RLS recusava gravar.
  //
  // Renderizando a pagina AQUI, ela fica acima do portao de onboarding.
  //
  // E a marca nao pode ser so a URL: `?type=recovery` se perde ao recarregar ou
  // ao apertar voltar, e a conta ficava presa para sempre com a senha aleatoria
  // que ninguem conhece. O marcador `senha_temporaria` vive no usuario do Auth e
  // sobrevive aos dois. Ele e editavel pela propria pessoa, o que aqui nao e
  // problema: ele decide se uma tela aparece, nunca da acesso a nada.
  const senhaTemporaria = user.user_metadata?.senha_temporaria === true;
  if (isResetPasswordRequired || senhaTemporaria) {
    return <ResetPasswordPage />;
  }

  // Acesso pausado. Vem ANTES dos portoes de setup e de onboarding: com a RLS
  // da Etapa 4 ligada, uma conta inativa le `administrative_costs` vazio, o app
  // conclui que ela nunca fez o onboarding financeiro e a prende num fluxo de 9
  // passos que tambem nao grava. Esta tela precisa aparecer antes disso.
  //
  // A comparacao e com 'inativo', e NAO "diferente de ativo", de proposito: se o
  // campo vier ausente — perfil carregado por um caminho antigo, coluna que
  // ainda nao existe no ambiente — o app segue funcionando como hoje. O erro
  // caro aqui e barrar quem esta em dia, nao deixar passar quem cancelou.
  if (userProfile?.acesso_status === 'inativo') {
    return <AssinaturaInativaPage />;
  }

  // Perfil INCOMPLETO, e nao so perfil ausente. Com o webhook criando a linha na
  // compra, existir linha deixou de significar perfil preenchido: ela nasce so
  // com o nome do comprador, e `nome_confeitaria` e a moeda ficam para esta
  // tela. Sem o segundo teste, quem comprasse pularia o cadastro.
  if (isSetupRequired || !userProfile || !userProfile.nome_confeitaria) {
    return <SetupProfilePage />;
  }

  return <>{children}</>;
};
