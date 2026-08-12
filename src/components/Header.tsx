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
    <header className="sticky top-0 z-30 bg-[#FAFAF7]/98 backdrop-blur-md border-b border-[#E6E1DB]/40 shadow-xs px-3 pt-safe-header sm:pt-3 pb-2.5">
      <div className="max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* TOP BRAND HEADER - RESPONSIVE & CENTERED ON MOBILE SO NOTHING CUTS OFF */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          {/* PROFILE BUTTON AT TOP LEFT/CENTER */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-1.5 p-1.5 pr-2.5 bg-white hover:bg-[#E6E1DB]/10 border border-[#E6E1DB] rounded-lg shadow-xs transition-all active:scale-95 shrink-0"
            title="Meu Perfil de Confeiteira (Sair no PDF)"
          >
            <div className="w-8 h-8 rounded-lg bg-[#3E3430] text-white flex items-center justify-center overflow-hidden font-black text-xs shadow-xs shrink-0">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-[#C9A878]" />
              )}
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-[10px] font-extrabold uppercase text-[#C9A878] leading-tight">
                Meu Perfil
              </span>
              <span className="block text-[11px] font-black text-[#0D0B08] truncate max-w-[100px]">
                {profile.name || 'Carula Cake'}
              </span>
            </div>
          </button>

          {/* CENTERED LOGO */}
          <div className="flex-1 flex justify-center text-center px-1">
            <span className="text-2xl sm:text-3xl font-black text-[#3E3430] tracking-tight" style={{ fontFamily: "'Manrope', sans-serif", letterSpacing: '-0.5px' }}>
              Carula APP
            </span>
          </div>

          {/* ACTION BUTTONS (MOBILE RIGHT & DESKTOP) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onOpenPwaModal}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#3E3430] hover:bg-[#2A2520] text-[#C9A878] text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1 shadow-xs"
              title="Instalar no Celular"
            >
              <Smartphone className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">App</span>
            </button>

            <button
              onClick={onOpenBackupModal}
              className="p-1.5 rounded-lg bg-white hover:bg-[#FAFAF7] text-[#0D0B08] border border-[#E6E1DB] text-xs font-bold transition-all active:scale-95"
              title="Backup e Dados"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
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
