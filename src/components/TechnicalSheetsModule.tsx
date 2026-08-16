import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface TechnicalSheetsModuleProps {
  onAddSheet?: () => void;
}

export const TechnicalSheetsModule: React.FC<TechnicalSheetsModuleProps> = ({
  onAddSheet,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('bolos');

  return (
    <div className="space-y-4 animate-fadeIn pb-8">
      {/* Header Card — Flutuante com cabeçalho roxo */}
      <div
        className="overflow-hidden shadow-card rounded-t-[40px]"
        style={{
          boxShadow: '0 30px 70px rgba(58,35,80,.26)',
        }}
      >
        {/* Header Strip com gradiente */}
        <div
          className="px-5 py-5 flex items-center justify-between gap-3"
          style={{
            background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
          }}
        >
          {/* Título */}
          <span
            className="text-white font-bold tracking-tight"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: '29px',
              lineHeight: 1.1,
            }}
          >
            Fichas Técnicas
          </span>

          {/* Botão Nova Ficha */}
          <button
            onClick={onAddSheet}
            className="flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            style={{
              background: 'rgba(255,255,255,.18)',
              border: '1px solid rgba(255,255,255,.3)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '11px',
              padding: '9px 14px',
              borderRadius: '14px',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={14} strokeWidth={3} />
            Nova Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
