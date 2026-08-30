import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  nome: string;
  nome_confeitaria: string;
  moeda: 'USD' | 'BRL';
  foto_url?: string;
  // Contato da confeitaria, exibido no orcamento. Opcionais e possivelmente
  // vazios: perfil incompleto sai EM BRANCO na folha, nunca com valor padrao.
  telefone?: string;
  endereco?: string;
  instagram?: string;
  laborPeriod?: 'diaria' | 'semanal' | 'mensal' | 'anual' | 'encomenda';
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
  // Rele o perfil do banco. Sem isso, editar o perfil so aparece na folha de
  // orcamento depois de recarregar a pagina, porque o contexto guarda a copia
  // lida no login.
  refreshUserProfile: () => Promise<void>;
  fetchUserPhoto: () => Promise<string | null>;
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

  // Identidade da usuaria logada, fora do estado de render.
  //
  // O Supabase reemite SIGNED_IN de tempos em tempos (renovacao de token, foco
  // da aba) e entrega um objeto `user` NOVO a cada evento, mesmo sendo a mesma
  // pessoa. Como `setUser` trocava o estado por esse objeto diferente-porem-
  // igual, a identidade que os contexts observam em `useEffect([user])` mudava
  // junto — e Estoque, Fichas, Clientes e Custos refaziam a busca inteira a
  // cada poucos segundos, com o app parado (16 requisicoes em 13 segundos).
  //
  // Guardando o id aqui, adotamos o objeto novo so quando a usuaria muda DE
  // FATO. Um ref, e nao estado, porque precisa ser lido de dentro do callback
  // do listener sem re-registrar o listener.
  const currentUserIdRef = useRef<string | null>(null);

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

        const currentUser = currentSession?.user ?? null;
        if (currentUserIdRef.current !== (currentUser?.id ?? null)) {
          currentUserIdRef.current = currentUser?.id ?? null;
          setUser(currentUser);
        }

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

    // Callback SINCRONO de proposito. O cliente de auth do Supabase serializa
    // as chamadas disparadas de dentro deste callback; um `await` numa consulta
    // ao banco aqui dentro reentra no cliente e ele reemite o evento, que era a
    // outra metade do laco de buscas. A consulta de perfil sai daqui sem espera.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Mid-handoff: the page owning the flow redirects when it is ready, and
        // the session is persisted for the reload to pick up. Ignoring the event
        // keeps the current screen on until then.
        if (authTransitionRef.current) return;

        const nextUser = session?.user ?? null;
        const nextUserId = nextUser?.id ?? null;
        const userChanged = currentUserIdRef.current !== nextUserId;

        // Mesma logica do `user`: um token renovado e uma sessao nova de
        // verdade, mas um evento repetido com o mesmo token nao e.
        setSession((prev) =>
          prev?.access_token === session?.access_token ? prev : session
        );

        if (userChanged) {
          currentUserIdRef.current = nextUserId;
          setUser(nextUser);
        }

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
          // So quando a usuaria muda: antes, cada evento repetido refazia a
          // consulta a `usuarias` sem nenhum dado novo para buscar.
          if (userChanged) {
            void fetchUserProfile(session.user.id);
          }
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
        .select('id,nome,nome_confeitaria,moeda,telefone,endereco,instagram,labor_period,created_at')
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
        setUserProfile({
          ...data,
          laborPeriod: (data.labor_period as any) || 'mensal',
        });
        setIsSetupRequired(false);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsValidatingProfile(false);
    }
  };

  /**
   * Rele o perfil do banco depois de uma edicao.
   *
   * Deliberadamente NAO mexe em isSetupRequired nem em isValidatingProfile,
   * diferente de fetchUserProfile: esses dois disparam a tela de setup e o
   * estado de carregamento, e faze-lo aqui traria de volta o bug que f67122d
   * corrigiu (a tela de setup tomando conta no meio de um fluxo). Aqui o
   * usuario ja esta logado e com perfil — so queremos os campos frescos.
   *
   * Falha silenciosa e proposital: se a releitura nao funcionar, o contexto
   * segue com a copia anterior. Perder uma atualizacao de exibicao e melhor
   * do que derrubar quem esta no meio de um orcamento.
   */
  const refreshUserProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('usuarias')
        .select('id,nome,nome_confeitaria,moeda,telefone,endereco,instagram,labor_period,foto_url,created_at')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setUserProfile({
          ...data,
          laborPeriod: (data.labor_period as any) || 'mensal',
        });
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
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

  const fetchUserPhoto = async (): Promise<string | null> => {
    if (!user) return null;
    if (userProfile?.foto_url) return userProfile.foto_url;

    try {
      const { data, error } = await supabase
        .from('usuarias')
        .select('foto_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data?.foto_url || null;
    } catch (err: any) {
      console.error('Error fetching user photo:', err);
      return null;
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
        refreshUserProfile,
        fetchUserPhoto,
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
