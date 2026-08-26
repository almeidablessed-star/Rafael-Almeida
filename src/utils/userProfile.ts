import { UserProfile } from '../types';

/**
 * Perfil vazio. NAO reintroduzir dados de nenhuma confeitaria aqui.
 *
 * Ate 2026-08-26 este objeto continha o nome, o e-mail, o telefone e o
 * endereco reais da dona do app. Como o Carula e vendido a outras
 * confeiteiras, toda compradora gerava orcamento com o contato pessoal dela —
 * e nao tinha como corrigir, porque a tela de perfil grava no Supabase e este
 * arquivo le do localStorage.
 *
 * Campo nao preenchido deve sair EM BRANCO na folha de orcamento. Um orcamento
 * com o contato de outra pessoa e pior do que um sem contato.
 *
 * A fonte de verdade do perfil e a tabela `usuarias` no Supabase, via
 * useAuth().userProfile. Este modulo sobreviveu apenas para UserProfileModal,
 * que so e renderizado por Header.tsx — codigo morto que nenhuma tela monta.
 */
const DEFAULT_PROFILE: UserProfile = {
  name: '',
  email: '',
  phone: '',
  address: '',
  instagram: '',
  photoUrl: '',
};

export function getStoredUserProfile(): UserProfile {
  try {
    const data = localStorage.getItem('carula_user_profile');
    if (data) {
      return { ...DEFAULT_PROFILE, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Error loading user profile:', e);
  }
  return DEFAULT_PROFILE;
}

export function saveStoredUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem('carula_user_profile', JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving user profile:', e);
  }
}
