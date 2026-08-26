import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { UserProfile } from '../types';
import { getStoredUserProfile, saveStoredUserProfile } from '../utils/userProfile';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  User,
  X,
  Camera,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Check,
  Sparkles,
  Building,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (profile: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const { user, userProfile } = useAuth();
  const currentProfile = getStoredUserProfile();

  // Sem defaults pessoais: estes cinco campos vinham pre-preenchidos com o
  // nome, os dois e-mails, o telefone, o endereco e o Instagram reais da dona
  // do app. Qualquer compradora que abrisse o perfil encontrava os dados dela
  // ja no formulario — e podia salva-los sem perceber. Campo nao preenchido
  // comeca vazio.
  const [name, setName] = useState(userProfile?.nome || currentProfile.name || '');
  const [email, setEmail] = useState(user?.email || currentProfile.email || '');
  const [phone, setPhone] = useState(currentProfile.phone || '');
  const [address, setAddress] = useState(currentProfile.address || '');
  const [instagram, setInstagram] = useState(currentProfile.instagram || '');
  const [photoUrl, setPhotoUrl] = useState(userProfile?.foto_url || currentProfile.photoUrl || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Usuário não encontrado');
      return;
    }

    setIsSaving(true);

    try {
      // Update user profile in Supabase
      const { error } = await supabase
        .from('usuarias')
        .update({
          nome: name.trim() || 'Carula Cake Confeitaria',
          foto_url: photoUrl.trim(),
        })
        .eq('id', user.id);

      if (error) {
        alert('Erro ao salvar perfil');
        return;
      }

      // Also update localStorage for fallback
      const updated: UserProfile = {
        name: name.trim() || 'Carula Cake Confeitaria',
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        instagram: instagram.trim(),
        photoUrl: photoUrl.trim(),
      };

      saveStoredUserProfile(updated);
      onProfileUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      alert('Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-900/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-highlight overflow-hidden animate-fadeIn border-2 border-pink-200 my-auto max-h-[90vh] flex flex-col my-auto" aria-labelledby="profileModalTitle">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#FF5935] via-[#E5613C] to-[#8E5CF0] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-semantic-warning-300" />
            <h3 id="profileModalTitle" className="font-brand font-black text-base">
              Meu Perfil de Confeiteira & Logo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
          <p className="text-xs text-slate-600 font-medium">
            Suas informações e foto/logo serão colocadas na <strong>parte superior dos PDFs de orçamentos</strong> enviados aos seus clientes! ✨
          </p>

          {/* Photo Preview & Upload */}
          <div className="flex flex-col items-center justify-center space-y-2 p-3 bg-pink-50/70 rounded-lg border border-pink-200">
            <div className="relative w-20 h-20 rounded-full bg-white border-2 border-[var(--color-semantic-orange)] shadow-sm flex items-center justify-center overflow-hidden">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-pink-300" />
              )}
              <label className="absolute inset-0 bg-slate-900/40 opacity-0 hover:opacity-100 text-white cursor-pointer transition-opacity" style={{ zIndex: -1 }}>
                <Camera className="w-6 h-6" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label className="px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-[11px] font-bold cursor-pointer shadow-card">
                Escolher Foto/Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="px-2.5 py-1 text-slate-500 hover:text-rose-600 text-[11px] font-bold"
                >
                  Remover
                </button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-pink-600" /> Nome da Confeitaria / Confeiteira *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carula Cake Confeitaria"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-semantic-success-600" /> Telefone / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: (781) 420-6892"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-purple-600" /> E-mail *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: contato@carulacake.com"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-semantic-warning-600" /> Endereço / Cidade *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Beverly, MA"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Instagram className="w-3.5 h-3.5 text-rose-500" /> Instagram
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Ex: @carulacake"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-100 text-slate-700 font-bold text-xs hover:bg-neutral-200"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-semantic-success-300" />
                  <span>Salvo!</span>
                </>
              ) : isSaving ? (
                <>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Salvar Perfil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
