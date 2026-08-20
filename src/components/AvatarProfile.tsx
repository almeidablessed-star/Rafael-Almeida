import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface AvatarProfileProps {
  onClick?: () => void;
}

export const AvatarProfile: React.FC<AvatarProfileProps> = ({ onClick }) => {
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [initials, setInitials] = useState<string>('');

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('carula_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        if (profile.photo) {
          setProfilePhoto(profile.photo);
        }
        if (profile.name) {
          const names = profile.name.trim().split(' ');
          const initial = names[0]?.[0]?.toUpperCase() || '';
          setInitials(initial);
        }
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    }
  }, []);

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[40px] h-[40px] rounded-full flex items-center justify-center cursor-pointer transition-all"
      style={{
        background: profilePhoto ? 'transparent' : 'rgba(255,255,255,.16)',
        border: profilePhoto ? 'none' : '2px solid rgba(255,255,255,.24)',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!profilePhoto) {
          e.currentTarget.style.background = 'rgba(255,255,255,.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!profilePhoto) {
          e.currentTarget.style.background = 'rgba(255,255,255,.16)';
        }
      }}
      title="Abrir perfil"
    >
      {profilePhoto ? (
        <img
          src={profilePhoto}
          alt="Perfil"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
          }}
        />
      ) : initials ? (
        <span
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#F7DCE1',
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          {initials}
        </span>
      ) : (
        <User size={20} color="#F7DCE1" strokeWidth={2} />
      )}
    </button>
  );
};
