import React, { useState, useEffect } from 'react';
import { Download, Smartphone, User, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { getStoredUserProfile } from '../utils/userProfile';
import { useAuth } from '../context/AuthContext';
import { UserProfileModal } from './UserProfileModal';
import { CarulaLogo } from './CarulaLogo';

interface HeaderProps {
  onOpenPwaModal: () => void;
  onOpenBackupModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPwaModal,
  onOpenBackupModal,
}) => {
  const { fetchUserPhoto } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(getStoredUserProfile());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    setProfile(getStoredUserProfile());
  }, [isProfileModalOpen]);

  useEffect(() => {
    const loadPhoto = async () => {
      const photoUrl = await fetchUserPhoto();
      if (photoUrl) {
        setProfile(prev => ({ ...prev, photoUrl }));
      }
    };
    loadPhoto();
  }, [fetchUserPhoto]);

  return (
    <header
      className="sticky top-0 z-30 px-5 pt-safe-header sm:pt-4 pb-0 shadow-modal"
      style={{ background: 'var(--brand-gradient)' }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-between py-4 gap-4">

        {/* Avatar (36px with gradient ring) */}
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="flex-shrink-0 w-9 h-9 rounded-full transition-all duration-250 hover:scale-110 focus:outline-none"
          style={{
            background: 'linear-gradient(140deg, var(--color-rose-200), var(--color-rose-600))',
            padding: '2px',
          }}
          title="Meu Perfil"
        >
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="font-marca text-base text-[var(--color-brand-700)]">C</span>
            )}
          </div>
        </button>

        {/* Brand (Centered) */}
        <div className="flex-1 text-center">
          <div className="font-marca text-3xl text-white" style={{ lineHeight: 1 }}>
            Carula
          </div>
          <div
            className="text-[8px] font-black text-white uppercase"
            style={{ letterSpacing: '0.44em', marginTop: '2px' }}
          >
            CONFEITARIA
          </div>
        </div>

        {/* Action Icons (32px, radius 11px) */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <button
            onClick={onOpenPwaModal}
            className="w-8 h-8 rounded-[11px] bg-white/16 text-white hover:bg-white/24 transition-colors flex items-center justify-center"
            title="Versão Mobile"
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenBackupModal}
            className="w-8 h-8 rounded-[11px] bg-white/16 text-white hover:bg-white/24 transition-colors flex items-center justify-center"
            title="Baixar Dados"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* USER PROFILE MODAL */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onProfileUpdated={(updated) => setProfile(updated)}
      />
    </header>
  );
};
