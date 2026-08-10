import { UserProfile } from '../types';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Carula Cake Confeitaria',
  email: 'p.ssoaca@gmail.com',
  phone: '(781) 420-6892',
  address: 'Beverly, MA',
  instagram: 'carula.cake',
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
