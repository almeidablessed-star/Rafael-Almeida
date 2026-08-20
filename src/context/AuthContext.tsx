import React, { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Detectar se é um reset password flow
        const params = new URLSearchParams(window.location.search);
        const isRecovery = params.get('type') === 'recovery';

        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Se vem de recovery link, mostrar tela de reset password
          if (isRecovery) {
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
        setSession(session);
        setUser(session?.user ?? null);

        // Se o evento é de recovery (reset password), manter isResetPasswordRequired como true
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          const params = new URLSearchParams(window.location.search);
          if (params.get('type') === 'recovery') {
            setIsResetPasswordRequired(true);
            return;
          }
        }

        if (session?.user) {
          setIsResetPasswordRequired(false);
          await fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          setIsResetPasswordRequired(false);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
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
