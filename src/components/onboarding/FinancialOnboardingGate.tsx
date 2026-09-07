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
    return <p>Carregando...</p>;
  }

  if (!administrativeCosts.onboardingCompletoEm) {
    return <EmpresaOnboardingFlow />;
  }

  return <>{children}</>;
};
