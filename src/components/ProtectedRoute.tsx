import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { SetupProfilePage } from '../pages/SetupProfilePage';
import { VerifyOtpStandalonePage } from '../pages/VerifyOtpStandalonePage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { AssinaturaInativaPage } from '../pages/AssinaturaInativaPage';
import { TelaCarregando } from './TelaCarregando';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, userProfile, isLoading, isSetupRequired, isResetPasswordRequired, isOtpVerificationRequired, isValidatingProfile } = useAuth();
  // Sem 'signup': o cadastro aberto saiu do app. Quem entra, entra porque
  // comprou, e a conta nasce pela notificacao da Hotmart. A SignupPage continua
  // no repositorio, sem rota, para dar meia-volta facil se a decisao mudar.
  const [authMode, setAuthMode] = React.useState<'login' | 'verify-otp' | 'esqueci-senha'>('login');

  if (isLoading || isValidatingProfile) {
    return <TelaCarregando />;
  }

  if (!user) {
    if (authMode === 'verify-otp' || authMode === 'esqueci-senha') {
      return (
        <VerifyOtpStandalonePage
          onBackClick={() => setAuthMode('login')}
          modo={authMode === 'esqueci-senha' ? 'esqueci-senha' : 'primeiro-acesso'}
        />
      );
    }

    return (
      <LoginPage
        onVerifyOtpClick={() => setAuthMode('verify-otp')}
        onForgotPasswordClick={() => setAuthMode('esqueci-senha')}
      />
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
  // Mesma ideia do marcador acima, para quem ESQUECEU a senha: ligado quando a
  // pessoa acerta o codigo vindo de "Esqueci minha senha" e desligado ao gravar
  // a senha nova. Sem ele, recarregar ou voltar jogaria a pessoa para dentro do
  // app, logada e com a senha antiga ainda valendo.
  const redefinirSenha = user.user_metadata?.redefinir_senha === true;
  if (isResetPasswordRequired || senhaTemporaria || redefinirSenha) {
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
  // Mesma regra do banco, em `tem_acesso_ativo()`: pausado quando o status e
  // 'inativo' OU quando o prazo ja venceu. Sem o segundo teste, quem cancelou
  // veria o app funcionando enquanto o banco recusava gravar tudo.
  //
  // `acesso_ate` nulo NUNCA tranca ninguem — e o caso da esmagadora maioria das
  // contas, e um engano aqui prenderia quem esta em dia do lado de fora.
  const prazoVencido = Boolean(
    userProfile?.acesso_ate && new Date(userProfile.acesso_ate).getTime() <= Date.now()
  );
  if (userProfile?.acesso_status === 'inativo' || prazoVencido) {
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
