import React, { useState, useMemo } from 'react';
import { FichaTecnica, IngredientUsage } from '../types';
import { getIngredientBalance } from '../utils/stockManager';
import { AlertTriangle, ChevronDown } from 'lucide-react';

interface FichaTecnicaSelectorProps {
  fichas: FichaTecnica[];
  selectedFichaId?: string;
  onSelect: (fichaId: string | undefined) => void;
}

export const FichaTecnicaSelector: React.FC<FichaTecnicaSelectorProps> = ({
  fichas,
  selectedFichaId,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedFicha = useMemo(
    () => fichas.find(f => f.id === selectedFichaId),
    [fichas, selectedFichaId]
  );

  // Check which ingredients will go negative
  const negativeIngredients = useMemo(() => {
    if (!selectedFicha) return [];
    return selectedFicha.ingredients.filter(ing => {
      const currentBalance = getIngredientBalance(ing.id);
      return currentBalance - ing.quantity < 0;
    });
  }, [selectedFicha]);

  return (
    <div className="space-y-4">
      {/* Ficha Selector */}
      <div>
        <label className="block text-xs font-bold text-[#7A6E80] uppercase mb-2 tracking-wide">
          Ficha Técnica (Opcional)
        </label>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-2.5 bg-white border border-[#EDE6EF] rounded-lg text-left flex items-center justify-between hover:border-[#C4626F] transition-colors"
            style={{ color: selectedFichaId ? '#241B2B' : '#999' }}
          >
            <span className="text-sm font-semibold">
              {selectedFicha ? selectedFicha.name : 'Nenhuma ficha selecionada'}
            </span>
            <ChevronDown size={18} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EDE6EF] rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {/* Clear Selection */}
              <button
                onClick={() => {
                  onSelect(undefined);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-semibold text-[#7A6E80] hover:bg-[#F5F1EA] border-b border-[#EDE6EF]"
              >
                Limpar Seleção
              </button>

              {/* Fichas List */}
              {fichas.map(ficha => (
                <button
                  key={ficha.id}
                  onClick={() => {
                    onSelect(ficha.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm font-semibold border-b border-[#EDE6EF] last:border-b-0 hover:bg-[#F5F1EA] transition-colors ${
                    selectedFichaId === ficha.id ? 'bg-[#F5F1EA] text-[#3A2350]' : 'text-[#241B2B]'
                  }`}
                >
                  {ficha.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ingredients Preview */}
      {selectedFicha && (
        <div className="space-y-2">
          {/* Warning if ingredients will go negative */}
          {negativeIngredients.length > 0 && (
            <div className="flex gap-2 p-3 bg-[#FFF5E6] border-l-4 border-[#F59E0B] rounded">
              <AlertTriangle size={18} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#92400E]">
                <strong>Aviso:</strong> {negativeIngredients.length > 1 ? 'Alguns insumos vão' : 'Um insumo vai'} ficar com estoque negativo
              </div>
            </div>
          )}

          {/* Ingredients List */}
          <div className="bg-white rounded-lg border border-[#EDE6EF] p-3 space-y-2">
            <p className="text-xs font-bold text-[#7A6E80] uppercase">Insumos que serão consumidos:</p>
            <div className="space-y-1.5">
              {selectedFicha.ingredients.map(ingredient => {
                const currentBalance = getIngredientBalance(ingredient.id);
                const willBeNegative = currentBalance - ingredient.quantity < 0;

                return (
                  <div
                    key={ingredient.id}
                    className={`flex justify-between items-center text-xs p-2 rounded transition-colors ${
                      willBeNegative
                        ? 'bg-[#FEE2E2] border border-[#FECACA]'
                        : 'bg-[#F0FDF4] border border-[#DCFCE7]'
                    }`}
                  >
                    <span className="font-semibold text-[#241B2B]">{ingredient.name}</span>
                    <div className="flex gap-2 items-center">
                      <span className={willBeNegative ? 'text-[#DC2626] font-bold' : 'text-[#16A34A]'}>
                        -{ingredient.quantity} {ingredient.unit}
                      </span>
                      <span className="text-[#7A6E80] text-xs">
                        (saldo: {currentBalance}{ingredient.unit} {willBeNegative ? '→ negativo' : '✓'})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
