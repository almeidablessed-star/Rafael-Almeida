import React, { useState, useEffect } from 'react';
import { Download, Smartphone, User, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { getStoredUserProfile } from '../utils/userProfile';
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
  const [profile, setProfile] = useState<UserProfile>(getStoredUserProfile());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    setProfile(getStoredUserProfile());
  }, [isProfileModalOpen]);

  return (
    <header className="sticky top-0 z-30 bg-brand-gradient px-5 pt-safe-header sm:pt-4 pb-0 shadow-modal">
      <div className="max-w-lg mx-auto flex items-center justify-between py-4 gap-4">

        {/* Avatar (36px with gradient ring) — 11A */}
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="flex-shrink-0 w-[36px] h-[36px] rounded-full transition-transform focus:outline-none"
          style={{
            background: 'linear-gradient(140deg, #F5B9C6, #C4626F)',
            padding: '2px',
          }}
          title="Meu Perfil"
        >
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="font-marca text-[16px] text-[#6E3F72]">C</span>
            )}
          </div>
        </button>

        {/* Brand (Centered) — 11A Marca Centrada */}
        <div className="flex-1 text-center">
          <div className="font-marca text-[32px] text-white" style={{ lineHeight: 1, fontWeight: 400, fontFamily: "'Instrument Serif', serif" }}>
            Carula
          </div>
          <div
            className="text-[8px] text-white uppercase"
            style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, letterSpacing: '0.44em', marginTop: '2px' }}
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
