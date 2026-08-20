import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { SetupProfilePage } from '../pages/SetupProfilePage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, userProfile, isLoading, isSetupRequired } = useAuth();
  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('login');

  if (isLoading) {
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
    return authMode === 'login' ? (
      <LoginPage onSignupClick={() => setAuthMode('signup')} />
    ) : (
      <SignupPage onLoginClick={() => setAuthMode('login')} />
    );
  }

  if (isSetupRequired || !userProfile) {
    return <SetupProfilePage />;
  }

  return <>{children}</>;
};
