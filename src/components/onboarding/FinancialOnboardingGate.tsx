import React from 'react';
import { useCosts } from '../../context/CostsContext';
import { EmpresaOnboardingFlow } from './EmpresaOnboardingFlow';

/**
 * Bloqueia o restante do app ate o onboarding financeiro obrigatorio ser
 * concluido (spec "Minha Empresa", Parte 3, item 2). Precisa ficar DENTRO de
 * `CostsProvider` (e' o unico dado que ele consulta), inserido em App.tsx
 * sem reordenar nenhum provider existente.
 *
 * A unica fonte de verdade sobre "concluido" e
 * `administrativeCosts.onboardingCompletoEm` — nunca os valores dos campos,
 * que ja nascem preenchidos com os defaults sugeridos (34/5/13) mesmo sem a
 * usuaria ter confirmado nada.
 */
export const FinancialOnboardingGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { administrativeCosts, isLoading } = useCosts();

  if (isLoading || !administrativeCosts) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F5F5F5] to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#6E3F72] animate-spin" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!administrativeCosts.onboardingCompletoEm) {
    return <EmpresaOnboardingFlow />;
  }

  return <>{children}</>;
};
