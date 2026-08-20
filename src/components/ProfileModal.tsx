import React, { useRef, useState } from 'react';
import { X, Camera, Edit2 } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

interface ProfileData {
  photo: string | null;
  name: string;
  phone: string;
  email: string;
  address: string;
  instagram: string;
  currency: 'BRL' | 'USD';
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onLogout }) => {
  const { currency, setCurrency } = useCurrency();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profileData, setProfileData] = useState<ProfileData>(() => {
    const stored = localStorage.getItem('carula_profile');
    return stored ? JSON.parse(stored) : {
      photo: null,
      name: 'Carula Confeitaria',
      phone: '',
      email: localStorage.getItem('user_email') || '',
      address: '',
      instagram: '',
      currency: 'BRL',
    };
  });

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileData(prev => ({
          ...prev,
          photo: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (!profileData.name.trim()) {
      setMessage({ type: 'error', text: 'Nome é obrigatório' });
      return;
    }

    localStorage.setItem('carula_profile', JSON.stringify(profileData));
    setMessage({ type: 'success', text: 'Perfil salvo com sucesso!' });

    setTimeout(() => {
      setMessage(null);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(58, 35, 80, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '40px',
          overflow: 'auto',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '32px 24px 120px 24px',
          width: '90%',
          maxWidth: '420px',
          zIndex: 1001,
          boxShadow: '0 20px 60px rgba(58, 35, 80, 0.2)',
          maxHeight: '85vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Currency Selector - Minimal */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <button
            onClick={() => setCurrency(currency === 'BRL' ? 'USD' : 'BRL')}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 8px',
              fontFamily: "'Manrope', sans-serif",
              fontSize: '13px',
              fontWeight: 600,
              color: '#7A6E80',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#3A2350';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#7A6E80';
            }}
            title={`Clique para alternar para ${currency === 'BRL' ? 'USD' : 'BRL'}`}
          >
            {currency}
            <span style={{ fontSize: '10px', lineHeight: 1 }}>▼</span>
          </button>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '28px', color: '#241B2B', margin: 0 }}>
            Meu Perfil
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#241B2B',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Photo Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', position: 'relative' }}>
          {/* Photo Circle */}
          <div
            style={{
              position: 'relative',
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: profileData.photo ? 'transparent' : 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(58, 35, 80, 0.15)',
            }}
          >
            {profileData.photo ? (
              <img
                src={profileData.photo}
                alt="Profile"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#FFFFFF' }}>C</div>
            )}

            {/* Camera Button - Centered */}
            {!profileData.photo && (
              <button
                onClick={handlePhotoClick}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#3A2350',
                  border: '2px solid #FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#5A3A70';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#3A2350';
                }}
                title="Adicionar foto"
              >
                <Camera size={18} />
              </button>
            )}
          </div>

          {/* Edit Button - Outside Circle Bottom Right */}
          {profileData.photo && (
            <button
              onClick={handlePhotoClick}
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#C4626F',
                border: '2px solid #FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(196, 98, 111, 0.3)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#E07080';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#C4626F';
              }}
              title="Trocar foto"
            >
              <Edit2 size={16} />
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {/* Nome */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: '#7A6E80',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Nome da Confeitaria/Confeiteira
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Digite o nome"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #EDE6EF',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '14px',
                color: '#241B2B',
                background: '#FFFFFF',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#C4626F';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#EDE6EF';
              }}
            />
          </div>

          {/* Telefone */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: '#7A6E80',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Telefone/WhatsApp
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #EDE6EF',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '14px',
                color: '#241B2B',
                background: '#FFFFFF',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#C4626F';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#EDE6EF';
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: '#7A6E80',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              E-mail
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="seu@email.com"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #EDE6EF',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '14px',
                color: '#241B2B',
                background: '#FFFFFF',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#C4626F';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#EDE6EF';
              }}
            />
          </div>

          {/* Endereço/Cidade */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: '#7A6E80',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Endereço/Cidade
            </label>
            <input
              type="text"
              value={profileData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Rua Exemplo, 123 - São Paulo, SP"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #EDE6EF',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '14px',
                color: '#241B2B',
                background: '#FFFFFF',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#C4626F';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#EDE6EF';
              }}
            />
          </div>

          {/* Instagram */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: '#7A6E80',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Instagram
            </label>
            <input
              type="text"
              value={profileData.instagram}
              onChange={(e) => handleChange('instagram', e.target.value)}
              placeholder="@seu_usuario"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #EDE6EF',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '14px',
                color: '#241B2B',
                background: '#FFFFFF',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#C4626F';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#EDE6EF';
              }}
            />
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              borderRadius: '8px',
              background: message.type === 'success' ? '#D4F1D4' : '#FFE6E6',
              color: message.type === 'success' ? '#2D5E2D' : '#C41E3A',
              fontSize: '12px',
              fontWeight: 600,
              textAlign: 'center',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {message.text}
          </div>
        )}

        {/* Logout Button - Discrete */}
        {onLogout && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', paddingTop: '8px', borderTop: '1px solid #F0E8F2' }}>
            <button
              onClick={onLogout}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px 12px',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '12px',
                fontWeight: 600,
                color: '#C4626F',
                cursor: 'pointer',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = '#E07080';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = '#C4626F';
              }}
              title="Sair da conta"
            >
              Log Out
            </button>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              background: '#EDE6EF',
              color: '#3A2350',
              border: 'none',
              fontFamily: "'Manrope', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#DDD6E5';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#EDE6EF';
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              background: '#3A2350',
              color: '#FFFFFF',
              border: 'none',
              fontFamily: "'Manrope', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#5A3A70';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#3A2350';
            }}
          >
            Salvar Perfil
          </button>
        </div>
      </div>
    </>
  );
};
