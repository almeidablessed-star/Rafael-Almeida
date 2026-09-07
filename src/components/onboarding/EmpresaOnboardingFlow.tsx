import React, { useEffect, useState } from 'react';
import { useCosts } from '../../context/CostsContext';
import { useFichasTecnicas } from '../../context/FichasTecnicasContext';
import { useCurrency } from '../../context/CurrencyContext';
import { DespesaEmpresa } from '../../types';
import {
  calcularEstruturaFinanceira,
  calcularMetaHoras,
  somarDespesasEmpresa,
} from '../../utils/financialEngine';
import { CarulaLogo } from '../CarulaLogo';
import { CampoComAjuda } from './CampoComAjuda';

/**
 * Onboarding financeiro obrigatorio (spec "Minha Empresa", Parte 3), com o
 * visual validado do app (Parte 1): mesmo gradiente/cards/tipografia/sombras
 * ja usados em Dashboard.tsx e TransactionFormModal.tsx. Nenhum token novo —
 * o card com raio 40px citado na referencia do spec nao existe em nenhuma
 * tela real do app (o maior card real e rounded-2xl com a mesma sombra
 * grande); por isso este componente segue o codigo real, nao a referencia.
 */

const TOTAL_PASSOS = 8;

const inputClass =
  'w-full px-4 py-3 bg-white border border-[#E6E1DB] rounded-xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe';
const labelClass = 'font-serif-display text-[22px] leading-[1.25]';
const botaoPrimario =
  'w-full py-3.5 rounded-2xl text-white text-sm font-bold active:scale-98 transition-all flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50';
const botaoSecundario =
  'px-4 py-3 rounded-xl bg-white border border-[#E6E1DB] text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-all active:scale-95 disabled:opacity-50';

export const EmpresaOnboardingFlow: React.FC = () => {
  const { administrativeCosts, salvarPassoOnboarding, salvarDespesas, concluirOnboarding } = useCosts();
  const { fichas } = useFichasTecnicas();
  const { formatCurrency } = useCurrency();

  const [passo, setPasso] = useState(1);
  const [carregouInicial, setCarregouInicial] = useState(false);

  const [monthlyIncomeTarget, setMonthlyIncomeTarget] = useState(0);
  const [horaTrabalho, setHoraTrabalho] = useState(0);
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState(6);
  const [despesas, setDespesas] = useState<DespesaEmpresa[]>([]);
  const [cmvTargetPercent, setCmvTargetPercent] = useState(34);
  const [investmentTargetPercent, setInvestmentTargetPercent] = useState(5);
  const [profitTargetPercent, setProfitTargetPercent] = useState(13);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!administrativeCosts || carregouInicial) return;
    setPasso(Math.min(Math.max(administrativeCosts.onboardingPassoAtual, 1), TOTAL_PASSOS));
    setMonthlyIncomeTarget(administrativeCosts.monthlyIncomeTarget);
    setHoraTrabalho(administrativeCosts.horaTrabalho);
    setWorkingDaysPerWeek(administrativeCosts.workingDaysPerWeek);
    setDespesas(administrativeCosts.despesas);
    setCmvTargetPercent(administrativeCosts.cmvTargetPercent);
    setInvestmentTargetPercent(administrativeCosts.investmentTargetPercent);
    setProfitTargetPercent(administrativeCosts.profitTargetPercent);
    setCarregouInicial(true);
  }, [administrativeCosts, carregouInicial]);

  if (!carregouInicial) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDE7DC]">
        <div className="w-10 h-10 rounded-full border-4 border-[#E6E1DB] border-t-[#6E3F72] animate-spin" />
      </div>
    );
  }

  const irParaPasso = async (novoPasso: number, campos: Parameters<typeof salvarPassoOnboarding>[1] = {}) => {
    setErro('');
    setSalvando(true);
    try {
      await salvarPassoOnboarding(novoPasso, campos);
      setPasso(novoPasso);
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const avancar = (campos: Parameters<typeof salvarPassoOnboarding>[1] = {}) => irParaPasso(passo + 1, campos);
  const voltar = () => irParaPasso(passo - 1);

  const avancarComDespesas = async () => {
    setErro('');
    setSalvando(true);
    try {
      const salvas = await salvarDespesas(despesas);
      setDespesas(salvas);
      await salvarPassoOnboarding(passo + 1, {});
      setPasso(passo + 1);
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar despesas. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const confirmarConclusao = async () => {
    setErro('');
    setSalvando(true);
    try {
      await concluirOnboarding();
    } catch (err: any) {
      setErro(err.message || 'Erro ao concluir onboarding. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const metaHoras = calcularMetaHoras(monthlyIncomeTarget, horaTrabalho, workingDaysPerWeek);
  const despesasMensais = somarDespesasEmpresa(despesas);
  const estrutura = calcularEstruturaFinanceira(
    monthlyIncomeTarget,
    despesasMensais,
    cmvTargetPercent,
    investmentTargetPercent,
    profitTargetPercent
  );

  const precosAtuais = (fichas || [])
    .flatMap((f) => (f.tamanhos || []).map((t) => Number(t.preco) || 0))
    .filter((v) => v > 0);
  const precoMedioAtual = precosAtuais.length > 0 ? precosAtuais.reduce((s, v) => s + v, 0) / precosAtuais.length : null;

  const adicionarDespesa = () => setDespesas((atual) => [...atual, { nome: '', valor: 0, percentualRateio: 100, ordem: atual.length }]);
  const removerDespesa = (index: number) => setDespesas((atual) => atual.filter((_, i) => i !== index));
  const atualizarDespesa = (index: number, campo: keyof DespesaEmpresa, valor: string | number) =>
    setDespesas((atual) => atual.map((d, i) => (i === index ? { ...d, [campo]: valor } : d)));

  const exemploCmv = estrutura.valido
    ? `Com seu faturamento necessário de ${formatCurrency(estrutura.faturamentoNecessario)}, isso significa aproximadamente ${formatCurrency(estrutura.cmvAmount)} por mês indo para ingredientes e embalagens.`
    : undefined;
  const exemploInvestimento = estrutura.valido
    ? `Com seu faturamento necessário de ${formatCurrency(estrutura.faturamentoNecessario)}, isso significa aproximadamente ${formatCurrency(estrutura.investimentoAmount)} por mês de reserva para o negócio.`
    : undefined;
  const exemploLucro = estrutura.valido
    ? `Com seu faturamento necessário de ${formatCurrency(estrutura.faturamentoNecessario)}, isso significa aproximadamente ${formatCurrency(estrutura.lucroAmount)} por mês de lucro para a empresa, além do que você recebe pelo seu trabalho.`
    : undefined;

  return (
    <div className="min-h-screen bg-[#EDE7DC]">
      {/* Cabecalho gradiente — mesmo padrao do topo do Dashboard */}
      <div
        className="text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
          padding: '20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top, 0px))',
          paddingBottom: '28px',
          boxShadow: '0 30px 70px rgba(58,35,80,0.26)',
          borderRadius: '0px 0px 32px 32px',
        }}
      >
        <div className="flex justify-center mb-3">
          <CarulaLogo />
        </div>
        <div className="font-serif-display text-[26px] text-white text-center leading-[1.2]">
          Vamos montar sua estrutura financeira
        </div>
        <p className="text-center text-[12px] text-white/75 mt-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Isso ajuda a saber quanto você precisa faturar — não só o que cobrar por bolo
        </p>

        {/* Indicador de progresso */}
        <div className="mt-5 max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="text-[9px] uppercase tracking-[0.14em] text-white/75"
              style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}
            >
              Passo {passo} de {TOTAL_PASSOS}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(passo / TOTAL_PASSOS) * 100}%`,
                background: 'linear-gradient(90deg, #F5CFD4, #F5B9C6)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Card de conteudo do passo */}
      <div className="max-w-sm mx-auto px-4 -mt-4 relative z-10 pb-10">
        <div
          className="bg-[#F6F2F5] rounded-2xl p-5"
          style={{ boxShadow: '0 8px 20px rgba(58,35,80,0.09)' }}
        >
          {erro && (
            <div className="mb-3 p-2.5 rounded-xl bg-[#FDF4F5] border border-[rgba(196,98,111,.35)] text-[12px] text-[#C4626F]" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {erro}
            </div>
          )}

          {passo === 1 && (
            <div className="space-y-3">
              <h2 className={labelClass} style={{ color: '#241B2B' }}>Quanto você quer receber por mês pelo seu trabalho?</h2>
              <CampoComAjuda microcopy="É quanto você quer receber pelo seu trabalho — nunca o lucro da empresa. São coisas diferentes." />
              <input
                type="number"
                className={inputClass}
                value={monthlyIncomeTarget || ''}
                onChange={(e) => setMonthlyIncomeTarget(Number(e.target.value))}
                placeholder="0"
              />
              <div className="pt-2">
                <button className={botaoPrimario} style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)', boxShadow: '0 10px 24px rgba(58,35,80,.35)' }} onClick={() => avancar({ monthlyIncomeTarget })} disabled={salvando}>
                  Avançar
                </button>
              </div>
            </div>
          )}

          {passo === 2 && (
            <div className="space-y-3">
              <h2 className={labelClass} style={{ color: '#241B2B' }}>Quanto vale sua hora de trabalho?</h2>
              <CampoComAjuda microcopy="Multiplicado pelas horas de cada receita, vira a mão de obra daquele produto — automaticamente, sem você fazer a conta." />
              <input
                type="number"
                className={inputClass}
                value={horaTrabalho || ''}
                onChange={(e) => setHoraTrabalho(Number(e.target.value))}
                placeholder="0"
              />
              <div className="flex gap-2 pt-2">
                <button className={botaoSecundario} onClick={voltar} disabled={salvando}>Voltar</button>
                <div className="flex-1">
                  <button className={botaoPrimario} style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)', boxShadow: '0 10px 24px rgba(58,35,80,.35)' }} onClick={() => avancar({ horaTrabalho })} disabled={salvando}>
                    Avançar
                  </button>
                </div>
              </div>
            </div>
          )}

          {passo === 3 && (
            <div className="space-y-3">
              <h2 className={labelClass} style={{ color: '#241B2B' }}>Quantos dias por semana você quer trabalhar?</h2>
              <select
                className={inputClass}
                value={workingDaysPerWeek}
                onChange={(e) => setWorkingDaysPerWeek(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <div className="p-3 rounded-xl border border-[#E6E1DB] bg-white">
                <p className="text-[10px] uppercase tracking-[0.05em]" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                  Meta de referência — não é uma obrigação
                </p>
                <p className="text-[13px] font-bold mt-1" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>
                  {metaHoras.horasPorMes.toFixed(1)}h/mês → {metaHoras.horasPorSemana.toFixed(1)}h/semana → {metaHoras.horasPorDia.toFixed(1)}h/dia
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button className={botaoSecundario} onClick={voltar} disabled={salvando}>Voltar</button>
                <div className="flex-1">
                  <button className={botaoPrimario} style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)', boxShadow: '0 10px 24px rgba(58,35,80,.35)' }} onClick={() => avancar({ workingDaysPerWeek })} disabled={salvando}>
                    Avançar
                  </button>
                </div>
              </div>
            </div>
          )}

          {passo === 4 && (
            <div className="space-y-3">
              <h2 className={labelClass} style={{ color: '#241B2B' }}>Despesas mensais do negócio</h2>
              <CampoComAjuda microcopy="Aluguel, luz, internet... custos fixos, independente de quanto você vende. O que já está no custo do produto (embalagem, insumos) não entra aqui de novo." />
              <div className="space-y-2">
                {despesas.map((d, i) => (
                  <div key={d.id ?? `novo-${i}`} className="p-3 rounded-xl border border-[#E6E1DB] bg-white space-y-2">
                    <input
                      type="text"
                      placeholder="Nome da despesa"
                      value={d.nome}
                      onChange={(e) => atualizarDespesa(i, 'nome', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E6E1DB] rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe"
                    />
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        placeholder="Valor"
                        value={d.valor || ''}
                        onChange={(e) => atualizarDespesa(i, 'valor', Number(e.target.value))}
                        className="flex-1 px-3 py-2 bg-white border border-[#E6E1DB] rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe"
                      />
                      <input
                        type="number"
                        placeholder="% negócio"
                        value={d.percentualRateio}
                        onChange={(e) => atualizarDespesa(i, 'percentualRateio', Number(e.target.value))}
                        className="w-24 px-3 py-2 bg-white border border-[#E6E1DB] rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe"
                      />
                      <button
                        onClick={() => removerDespesa(i)}
                        className="w-8 h-8 flex-shrink-0 rounded-full bg-[#FDF4F5] text-[#C4626F] flex items-center justify-center text-xs font-bold"
                        aria-label="Remover despesa"
                      >
                        ×
                      </button>
                    </div>
                    {d.percentualRateio < 100 && (
                      <p className="text-[10px]" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>
                        Se essa despesa também é usada na sua vida pessoal, aqui vale só a parte da confeitaria.
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={adicionarDespesa}
                className="w-full py-2.5 rounded-xl border border-dashed border-[#E6E1DB] text-[12px] font-bold text-[#6E3F72] hover:bg-white transition-all"
              >
                + Adicionar despesa
              </button>
              <div className="p-3 rounded-xl bg-white border border-[#E6E1DB] flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.05em]" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>Total considerado</span>
                <span className="text-[15px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>{formatCurrency(despesasMensais)}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <button className={botaoSecundario} onClick={voltar} disabled={salvando}>Voltar</button>
                <div className="flex-1">
                  <button className={botaoPrimario} style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)', boxShadow: '0 10px 24px rgba(58,35,80,.35)' }} onClick={avancarComDespesas} disabled={salvando}>
                    Avançar
                  </button>
                </div>
              </div>
            </div>
          )}

          {passo === 5 && (
            <div className="space-y-3">
              <h2 className={labelClass} style={{ color: '#241B2B' }}>Meta de CMV (%)</h2>
              <CampoComAjuda
                microcopy="Quanto do preço do bolo vai embora só com ingredientes e embalagem. Quanto menor, mais sobra pra você."
                exemploDinamico={exemploCmv}
              />
              <input
                type="number"
                className={inputClass}
                value={cmvTargetPercent}
                onChange={(e) => setCmvTargetPercent(Number(e.target.value))}
              />
              <div className="flex gap-2 pt-2">
                <button className={botaoSecundario} onClick={voltar} disabled={salvando}>Voltar</button>
                <div className="flex-1">
                  <button className={botaoPrimario} style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)', boxShadow: '0 10px 24px rgba(58,35,80,.35)' }} onClick={() => avancar({ cmvTargetPercent })} disabled={salvando}>
                    Avançar
                  </button>
                </div>
              </div>
            </div>
          )}

          {passo === 6 && (
            <div className="space-y-3">
              <h2 className={labelClass} style={{ color: '#241B2B' }}>Meta de investimento (%)</h2>
              <CampoComAjuda
                microcopy="Uma reserva pra comprar equipamento, fazer curso, crescer o negócio — sem tirar do seu bolso."
                exemploDinamico={exemploInvestimento}
              />
              <input
                type="number"
                className={inputClass}
                value={investmentTargetPercent}
                onChange={(e) => setInvestmentTargetPercent(Number(e.target.value))}
              />
              <div className="flex gap-2 pt-2">
                <button className={botaoSecundario} onClick={voltar} disabled={salvando}>Voltar</button>
                <div className="flex-1">
                  <button className={botaoPrimario} style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)', boxShadow: '0 10px 24px rgba(58,35,80,.35)' }} onClick={() => avancar({ investmentTargetPercent })} disabled={salvando}>
                    Avançar
                  </button>
                </div>
              </div>
            </div>
          )}

          {passo === 7 && (
            <div className="space-y-3">
              <h2 className={labelClass} style={{ color: '#241B2B' }}>Meta de lucro (%)</h2>
              <CampoComAjuda
                microcopy="O que sobra pra empresa, além do que você já recebe pelo seu trabalho."
                exemploDinamico={exemploLucro}
              />
              <input
                type="number"
                className={inputClass}
                value={profitTargetPercent}
                onChange={(e) => setProfitTargetPercent(Number(e.target.value))}
              />
              <div className="flex gap-2 pt-2">
                <button className={botaoSecundario} onClick={voltar} disabled={salvando}>Voltar</button>
                <div className="flex-1">
                  <button className={botaoPrimario} style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)', boxShadow: '0 10px 24px rgba(58,35,80,.35)' }} onClick={() => avancar({ profitTargetPercent })} disabled={salvando}>
                    Avançar
                  </button>
                </div>
              </div>
            </div>
          )}

          {passo === 8 && (
            <div className="space-y-3">
              <h2 className={labelClass} style={{ color: '#241B2B' }}>Resumo</h2>
              <CampoComAjuda microcopy="Quanto você precisa vender no total pra cobrir tudo — seu trabalho, os custos fixos e o lucro da empresa." />

              {!estrutura.valido ? (
                <div className="p-3 rounded-xl bg-[#FDF4F5] border border-[rgba(196,98,111,.35)] text-[12px] text-[#C4626F]" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  {estrutura.mensagemErro}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-white border border-[#E6E1DB] text-center">
                    <p className="text-[10px] uppercase tracking-[0.05em]" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>Faturamento necessário</p>
                    <p className="font-serif-display text-[28px]" style={{ color: '#241B2B' }}>{formatCurrency(estrutura.faturamentoNecessario)}</p>
                  </div>

                  <div className="rounded-xl border border-[#E6E1DB] bg-white overflow-hidden">
                    {[
                      ['CMV / Reposição', estrutura.cmvTargetPercent, estrutura.cmvAmount],
                      ['Despesas da empresa', estrutura.custosPercent, estrutura.custosAmount],
                      ['Investimento', estrutura.investmentTargetPercent, estrutura.investimentoAmount],
                      ['Mão de obra', estrutura.maoDeObraPercent, estrutura.maoDeObraAmount],
                      ['Lucro da empresa', estrutura.profitTargetPercent, estrutura.lucroAmount],
                    ].map(([nome, pct, valor], i) => (
                      <div key={nome as string} className={`flex items-center justify-between px-3 py-2.5 ${i > 0 ? 'border-t border-[#E6E1DB]' : ''}`}>
                        <span className="text-[12px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>{nome}</span>
                        <span className="text-[12px]" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>{(pct as number).toFixed(2)}%</span>
                        <span className="text-[12px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>{formatCurrency(valor as number)}</span>
                      </div>
                    ))}
                  </div>

                  {precoMedioAtual != null && (
                    <p className="text-[11px] p-2.5 rounded-xl bg-white border border-[#E6E1DB]" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>
                      Hoje seus produtos custam em média {formatCurrency(precoMedioAtual)}. A comparação detalhada com o preço sugerido por produto chega quando as fichas técnicas forem religadas a este mesmo motor de cálculo.
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button className={botaoSecundario} onClick={voltar} disabled={salvando}>Voltar</button>
                <div className="flex-1">
                  <button
                    className={botaoPrimario}
                    style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)', boxShadow: '0 10px 24px rgba(58,35,80,.35)' }}
                    onClick={confirmarConclusao}
                    disabled={salvando || !estrutura.valido}
                  >
                    Confirmar e concluir
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
