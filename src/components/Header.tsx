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
    <header className="sticky top-0 z-30 bg-[#F8F1E4]/98 backdrop-blur-md border-b border-[#E8A0B0]/40 shadow-2xs px-3 pt-safe-header sm:pt-3 pb-2.5">
      <div className="max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* TOP BRAND HEADER - RESPONSIVE & CENTERED ON MOBILE SO NOTHING CUTS OFF */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          {/* PROFILE BUTTON AT TOP LEFT/CENTER */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-1.5 p-1.5 pr-2.5 bg-white hover:bg-[#F5C6CE]/20 border border-[#E8A0B0] rounded-2xl shadow-2xs transition-all active:scale-95 shrink-0"
            title="Meu Perfil de Confeiteira (Sair no PDF)"
          >
            <div className="w-8 h-8 rounded-xl bg-[#2B2420] text-white flex items-center justify-center overflow-hidden font-black text-xs shadow-2xs shrink-0">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-[#F5C6CE]" />
              )}
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-[10px] font-extrabold uppercase text-[#E8A0B0] leading-tight">
                Meu Perfil
              </span>
              <span className="block text-[11px] font-black text-[#2B2420] truncate max-w-[100px]">
                {profile.name || 'Carula Cake'}
              </span>
            </div>
          </button>

          {/* CENTERED LOGO */}
          <div className="flex-1 flex justify-center text-center px-1">
            <CarulaLogo size="md" />
          </div>

          {/* ACTION BUTTONS (MOBILE RIGHT & DESKTOP) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onOpenPwaModal}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-[#2B2420] hover:bg-[#2B2420]/90 text-[#F5C6CE] text-[11px] font-bold transition-colors active:scale-95 flex items-center gap-1 shadow-2xs"
              title="Instalar no Celular"
            >
              <Smartphone className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#F5C6CE]" />
              <span className="hidden sm:inline">App</span>
            </button>

            <button
              onClick={onOpenBackupModal}
              className="p-1.5 rounded-xl bg-white hover:bg-[#F5C6CE]/20 text-[#2B2420] border border-[#E8A0B0]/60 text-xs font-bold transition-colors active:scale-95"
              title="Backup e Dados"
            >
              <Download className="w-4 h-4 text-[#2B2420]" />
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
