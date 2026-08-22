import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { SetupProfilePage } from '../pages/SetupProfilePage';
import { VerifyOtpStandalonePage } from '../pages/VerifyOtpStandalonePage';

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

  // If user needs to reset password or verify OTP, show AppContent which will handle those flows
  if (isResetPasswordRequired || isOtpVerificationRequired) {
    return <>{children}</>;
  }

  if (isSetupRequired || !userProfile) {
    return <SetupProfilePage />;
  }

  return <>{children}</>;
};
