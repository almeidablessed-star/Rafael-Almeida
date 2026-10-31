import React from 'react';
import { useTelaDeComputador } from '../hooks/useTelaDeComputador';

/**
 * "Carregando..." de quando o app abre (ProtectedRoute e o portao do onboarding).
 *
 * No computador usa `.entrada-computador` para soltar o #root da coluna de
 * celular (ver index.css): sem isso a coluna com as laterais bege aparecia antes
 * da versao computador.
 */
export const TelaCarregando: React.FC = () => {
  const pc = useTelaDeComputador();
  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        pc ? 'entrada-computador bg-[#F6F2F5]' : 'bg-gradient-to-b from-[#F5F5F5] to-white'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#6E3F72] animate-spin" />
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  );
};
