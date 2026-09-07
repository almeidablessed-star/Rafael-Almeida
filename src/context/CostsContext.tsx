import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { AdministrativeCosts, DespesaEmpresa } from '../types';
import { somarDespesasEmpresa } from '../utils/financialEngine';

/** Campos da configuracao financeira que o onboarding preenche passo a passo. Ver [[CostsContextType.salvarPassoOnboarding]]. */
export type CamposOnboarding = Partial<
  Pick<
    AdministrativeCosts,
    'monthlyIncomeTarget' | 'horaTrabalho' | 'workingDaysPerWeek' | 'cmvTargetPercent' | 'investmentTargetPercent' | 'profitTargetPercent'
  >
>;

interface CostsContextType {
  administrativeCosts: AdministrativeCosts | null;
  isLoading: boolean;
  error: string | null;
  saveCosts: (costs: AdministrativeCosts) => Promise<void>;
  fetchCosts: () => Promise<void>;
  /** Persiste os campos de um passo do onboarding e atualiza em qual passo a usuaria esta. Cria a linha se ainda nao existir. */
  salvarPassoOnboarding: (passo: number, campos: CamposOnboarding) => Promise<void>;
  /** Substitui a lista de despesas da conta, calculando insercao/atualizacao/remocao contra o que ja existe no banco. */
  salvarDespesas: (despesas: DespesaEmpresa[]) => Promise<DespesaEmpresa[]>;
  /** Marca o onboarding financeiro como concluido — unico campo que libera o resto do app (ver [[FinancialOnboardingGate]]). */
  concluirOnboarding: () => Promise<void>;
  /** Edicao pos-onboarding (aba "Minha Empresa"): mesmo upsert parcial de `salvarPassoOnboarding`, mas sem mexer no passo, e registrando o antes/depois em `configuracao_empresa_historico` (spec Parte 2, item 29). */
  salvarConfiguracaoEmpresa: (campos: CamposOnboarding) => Promise<void>;
}

/** Rotulo humano de cada campo, usado so no historico de alteracoes. */
const CAMPOS_ONBOARDING_LABEL: Record<keyof CamposOnboarding, string> = {
  monthlyIncomeTarget: 'Recebimento desejado',
  horaTrabalho: 'Valor da hora',
  workingDaysPerWeek: 'Dias de trabalho por semana',
  cmvTargetPercent: 'Meta de CMV',
  investmentTargetPercent: 'Meta de investimento',
  profitTargetPercent: 'Meta de lucro',
};

const CostsContext = createContext<CostsContextType | undefined>(undefined);

/**
 * Soma as despesas MENSAIS das 7 colunas fixas (legado, ainda vivas na tabela
 * mas nao mais escritas pelo app — ver migration 20260906). `hora_trabalho`
 * fica DE FORA de proposito, ver [[AdministrativeCosts.horaTrabalho]].
 */
const somarCustosMensaisLegado = (c: {
  agua?: number; aluguel?: number; energia?: number; gas?: number;
  gasolina?: number; internet?: number; limpeza?: number;
}) =>
  (c.agua || 0) + (c.aluguel || 0) + (c.energia || 0) + (c.gas || 0) +
  (c.gasolina || 0) + (c.internet || 0) + (c.limpeza || 0);

const mapDespesaFromDb = (row: any): DespesaEmpresa => ({
  id: row.id,
  nome: row.nome,
  valor: Number(row.valor) || 0,
  percentualRateio: Number(row.percentual_rateio) || 100,
  ordem: Number(row.ordem) || 0,
});

const CAMPOS_ONBOARDING_PARA_COLUNA: Record<keyof CamposOnboarding, string> = {
  monthlyIncomeTarget: 'monthly_income_target',
  horaTrabalho: 'hora_trabalho',
  workingDaysPerWeek: 'working_days_per_week',
  cmvTargetPercent: 'cmv_target_percent',
  investmentTargetPercent: 'investment_target_percent',
  profitTargetPercent: 'profit_target_percent',
};

export const CostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [administrativeCosts, setAdministrativeCosts] = useState<AdministrativeCosts | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const montarAdministrativeCosts = (data: any, despesas: DespesaEmpresa[]): AdministrativeCosts => ({
    id: data?.id,
    agua: data?.agua || 0,
    aluguel: data?.aluguel || 0,
    energia: data?.energia || 0,
    gas: data?.gas || 0,
    gasolina: data?.gasolina || 0,
    internet: data?.internet || 0,
    limpeza: data?.limpeza || 0,
    horaTrabalho: data?.hora_trabalho || 0,
    // Calculado aqui, e nao lido de `data.total`: o app nunca GRAVA aquela
    // coluna (ela nem existe mais), entao ler dela devolveria sempre nulo.
    total: somarCustosMensaisLegado(data || {}),
    monthlyIncomeTarget: data?.monthly_income_target || 0,
    workingDaysPerWeek: data?.working_days_per_week || 6,
    cmvTargetPercent: data?.cmv_target_percent ?? 34,
    investmentTargetPercent: data?.investment_target_percent ?? 5,
    profitTargetPercent: data?.profit_target_percent ?? 13,
    despesas,
    onboardingPassoAtual: data?.onboarding_financeiro_passo_atual || 1,
    onboardingCompletoEm: data?.onboarding_financeiro_completo_em || null,
  });

  const fetchCosts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const [{ data, error: fetchError }, { data: despesasData, error: despesasError }] = await Promise.all([
        supabase.from('administrative_costs').select('*').eq('usuaria_id', user.id).single(),
        supabase.from('despesas_empresa').select('*').eq('usuaria_id', user.id).order('ordem', { ascending: true }),
      ]);

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      if (despesasError) {
        throw despesasError;
      }

      const despesas = (despesasData || []).map(mapDespesaFromDb);
      setAdministrativeCosts(montarAdministrativeCosts(data, despesas));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar custos');
      console.error('Error fetching costs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCosts = async (costs: AdministrativeCosts) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      const { error: saveError } = await supabase
        .from('administrative_costs')
        .upsert({
          usuaria_id: user.id,
          agua: costs.agua,
          aluguel: costs.aluguel,
          energia: costs.energia,
          gas: costs.gas,
          gasolina: costs.gasolina,
          internet: costs.internet,
          limpeza: costs.limpeza,
          hora_trabalho: costs.horaTrabalho,
        }, { onConflict: 'usuaria_id' });

      if (saveError) throw saveError;

      setAdministrativeCosts({ ...costs, total: somarCustosMensaisLegado(costs) });
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar custos');
      throw err;
    }
  };

  /**
   * Upsert parcial: so grava as colunas presentes em `campos`, mais o passo
   * atual. Colunas omitidas mantem o valor que ja tinham no banco — o
   * Supabase (via `ON CONFLICT ... DO UPDATE SET`) so atualiza as colunas do
   * payload, nunca reseta as demais para o default.
   */
  const salvarPassoOnboarding = async (passo: number, campos: CamposOnboarding) => {
    if (!user) throw new Error('User not authenticated');

    const payload: Record<string, any> = {
      usuaria_id: user.id,
      onboarding_financeiro_passo_atual: passo,
    };
    (Object.keys(campos) as (keyof CamposOnboarding)[]).forEach((campo) => {
      const coluna = CAMPOS_ONBOARDING_PARA_COLUNA[campo];
      payload[coluna] = campos[campo];
    });

    const { error: saveError } = await supabase
      .from('administrative_costs')
      .upsert(payload, { onConflict: 'usuaria_id' });
    if (saveError) throw saveError;

    setAdministrativeCosts((atual) => {
      const base = atual ?? montarAdministrativeCosts(null, []);
      return { ...base, ...campos, onboardingPassoAtual: passo };
    });
  };

  /**
   * Substitui a lista de despesas: atualiza quem tem `id`, insere quem nao
   * tem, remove quem sumiu da lista nova. Sem transacao client-side (o
   * projeto nao usa RPC para isso ainda) — na pior hipotese de falha no meio,
   * o proximo save corrige o estado, e nada e perdido porque so removemos
   * IDs que continuam identificados.
   */
  const salvarDespesas = async (despesas: DespesaEmpresa[]): Promise<DespesaEmpresa[]> => {
    if (!user) throw new Error('User not authenticated');

    const { data: existentes, error: fetchError } = await supabase
      .from('despesas_empresa')
      .select('id')
      .eq('usuaria_id', user.id);
    if (fetchError) throw fetchError;

    const idsNovaLista = new Set(despesas.filter((d) => d.id != null).map((d) => d.id));
    const idsParaRemover = (existentes || []).map((r) => r.id).filter((id) => !idsNovaLista.has(id));

    if (idsParaRemover.length > 0) {
      const { error: deleteError } = await supabase.from('despesas_empresa').delete().in('id', idsParaRemover);
      if (deleteError) throw deleteError;
    }

    const salvas: DespesaEmpresa[] = [];
    for (let i = 0; i < despesas.length; i++) {
      const d = despesas[i];
      const linha = {
        usuaria_id: user.id,
        nome: d.nome,
        valor: d.valor,
        percentual_rateio: d.percentualRateio,
        ordem: i,
      };

      if (d.id != null) {
        const { data, error: updateError } = await supabase
          .from('despesas_empresa')
          .update(linha)
          .eq('id', d.id)
          .select()
          .single();
        if (updateError) throw updateError;
        salvas.push(mapDespesaFromDb(data));
      } else {
        const { data, error: insertError } = await supabase
          .from('despesas_empresa')
          .insert(linha)
          .select()
          .single();
        if (insertError) throw insertError;
        salvas.push(mapDespesaFromDb(data));
      }
    }

    setAdministrativeCosts((atual) => (atual ? { ...atual, despesas: salvas } : atual));
    return salvas;
  };

  /**
   * Mesmo upsert parcial de `salvarPassoOnboarding`, para uso pos-onboarding
   * na aba "Minha Empresa" — nao mexe em `onboarding_financeiro_passo_atual`
   * (nao ha "passo" fora do fluxo guiado). Cada campo alterado gera uma linha
   * em `configuracao_empresa_historico` com o valor antigo e o novo, para a
   * usuaria poder olhar pra tras (spec Parte 2, item 29).
   */
  const salvarConfiguracaoEmpresa = async (campos: CamposOnboarding) => {
    if (!user) throw new Error('User not authenticated');
    if (!administrativeCosts) throw new Error('Configuracao ainda nao carregada');

    const payload: Record<string, any> = { usuaria_id: user.id };
    const historico: { usuaria_id: string; campo: string; valor_antigo: string; valor_novo: string }[] = [];

    (Object.keys(campos) as (keyof CamposOnboarding)[]).forEach((campo) => {
      const valorNovo = campos[campo];
      const valorAntigo = administrativeCosts[campo];
      if (valorNovo === undefined || valorNovo === valorAntigo) return;

      payload[CAMPOS_ONBOARDING_PARA_COLUNA[campo]] = valorNovo;
      historico.push({
        usuaria_id: user.id,
        campo: CAMPOS_ONBOARDING_LABEL[campo],
        valor_antigo: String(valorAntigo),
        valor_novo: String(valorNovo),
      });
    });

    if (historico.length === 0) return;

    const { error: saveError } = await supabase
      .from('administrative_costs')
      .upsert(payload, { onConflict: 'usuaria_id' });
    if (saveError) throw saveError;

    setAdministrativeCosts((atual) => (atual ? { ...atual, ...campos } : atual));

    // Historico e best-effort: uma falha aqui nao pode desfazer um save que
    // ja aconteceu, so fica sem registro daquela alteracao especifica.
    const { error: historicoError } = await supabase.from('configuracao_empresa_historico').insert(historico);
    if (historicoError) console.error('Erro ao registrar historico:', historicoError);
  };

  const concluirOnboarding = async () => {
    if (!user) throw new Error('User not authenticated');

    const agora = new Date().toISOString();
    const { error: saveError } = await supabase
      .from('administrative_costs')
      .upsert({ usuaria_id: user.id, onboarding_financeiro_completo_em: agora }, { onConflict: 'usuaria_id' });
    if (saveError) throw saveError;

    setAdministrativeCosts((atual) => (atual ? { ...atual, onboardingCompletoEm: agora } : atual));
  };

  useEffect(() => {
    if (user) {
      fetchCosts();
    } else {
      setAdministrativeCosts(null);
    }
  }, [user]);

  return (
    <CostsContext.Provider value={{
      administrativeCosts,
      isLoading,
      error,
      saveCosts,
      fetchCosts,
      salvarPassoOnboarding,
      salvarDespesas,
      concluirOnboarding,
      salvarConfiguracaoEmpresa,
    }}>
      {children}
    </CostsContext.Provider>
  );
};

export const useCosts = () => {
  const context = useContext(CostsContext);
  if (!context) {
    throw new Error('useCosts deve ser usado dentro de CostsProvider');
  }
  return context;
};

export { somarDespesasEmpresa };
