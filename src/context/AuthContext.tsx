import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  nome: string;
  nome_confeitaria: string;
  moeda: 'USD' | 'BRL';
  foto_url?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isSetupRequired: boolean;
  isResetPasswordRequired: boolean;
  isOtpVerificationRequired: boolean;
  isValidatingProfile: boolean;
  beginAuthTransition: () => void;
  endAuthTransition: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  setupProfile: (nome: string, nome_confeitaria: string, moeda: 'USD' | 'BRL') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupRequired, setIsSetupRequired] = useState(false);
  const [isResetPasswordRequired, setIsResetPasswordRequired] = useState(false);
  const [isOtpVerificationRequired, setIsOtpVerificationRequired] = useState(false);
  const [isValidatingProfile, setIsValidatingProfile] = useState(false);

  // The OTP and password-reset screens change the session in the middle of a
  // multi-step handoff, well before the next screen is ready. Adopting those
  // intermediate sessions hands the render to the post-login screens and
  // unmounts the screen the user is still looking at. A page raises this flag
  // before it touches the session and then redirects when it is done; a ref,
  // because the auth listener closes over its initial state.
  const authTransitionRef = useRef(false);

  const beginAuthTransition = () => {
    authTransitionRef.current = true;
  };

  // Must be called if the handoff fails, otherwise the redirect never happens
  // and the listener stays deaf for the rest of the page's life.
  const endAuthTransition = () => {
    authTransitionRef.current = false;
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Detectar tipo de flow (otp_verification ou recovery)
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const flowType = params.get('type') || hashParams.get('type');

        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          if (flowType === 'otp_verification') {
            setIsOtpVerificationRequired(true);
            setIsLoading(false);
            return;
          }

          if (flowType === 'recovery') {
            setIsResetPasswordRequired(true);
            setIsLoading(false);
            return;
          }

          await fetchUserProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Mid-handoff: the page owning the flow redirects when it is ready, and
        // the session is persisted for the reload to pick up. Ignoring the event
        // keeps the current screen on until then.
        if (authTransitionRef.current) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          const params = new URLSearchParams(window.location.search);
          const flowType = params.get('type');

          if (flowType === 'otp_verification') {
            setIsOtpVerificationRequired(true);
            return;
          }

          if (flowType === 'recovery') {
            setIsResetPasswordRequired(true);
            return;
          }
        }

        if (session?.user) {
          setIsResetPasswordRequired(false);
          setIsOtpVerificationRequired(false);
          await fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          setIsSetupRequired(false);
          setIsResetPasswordRequired(false);
          setIsOtpVerificationRequired(false);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    setIsValidatingProfile(true);
    try {
      const { data, error } = await supabase
        .from('usuarias')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setIsSetupRequired(true);
          setUserProfile(null);
        } else {
          throw error;
        }
      } else {
        setUserProfile(data);
        setIsSetupRequired(false);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsValidatingProfile(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      // Validar se o e-mail já existe
      const { data: existingUsers, error: checkError } = await supabase.auth.admin?.listUsers() || { data: null, error: null };

      // Se não conseguir verificar pelo admin API, fazer verificação alternativa
      if (checkError || !existingUsers) {
        // Fallback: tentar fazer signup e deixar o Supabase retornar erro se duplicado
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          // Se for erro de e-mail já existe, mostrar mensagem clara
          if (error.message?.includes('already registered') || error.message?.includes('Email already exists')) {
            throw new Error('Este e-mail já está cadastrado. Use outro e-mail ou tente fazer login.');
          }
          throw error;
        }
      } else {
        // Verificar se o e-mail já existe na lista de usuários
        const emailExists = existingUsers.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());

        if (emailExists) {
          throw new Error('Este e-mail já está cadastrado. Use outro e-mail ou tente fazer login.');
        }

        // Se não existe, fazer signup
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (error) {
      throw error;
    }
  };

  const setupProfile = async (
    nome: string,
    nome_confeitaria: string,
    moeda: 'USD' | 'BRL'
  ) => {
    if (!user) throw new Error('No user found');

    try {
      const { error } = await supabase
        .from('usuarias')
        .insert([
          {
            id: user.id,
            nome,
            nome_confeitaria,
            moeda,
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) throw error;

      const newProfile: UserProfile = {
        id: user.id,
        nome,
        nome_confeitaria,
        moeda,
        created_at: new Date().toISOString(),
      };

      setUserProfile(newProfile);
      setIsSetupRequired(false);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setUserProfile(null);
      setSession(null);
      setIsSetupRequired(false);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        session,
        isLoading,
        isSetupRequired,
        isResetPasswordRequired,
        isOtpVerificationRequired,
        isValidatingProfile,
        beginAuthTransition,
        endAuthTransition,
        login,
        signup,
        setupProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
