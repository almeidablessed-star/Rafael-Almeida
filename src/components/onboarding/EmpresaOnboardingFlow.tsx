import React, { useEffect, useState } from 'react';
import { useCosts } from '../../context/CostsContext';
import { useFichasTecnicas } from '../../context/FichasTecnicasContext';
import { useCurrency } from '../../context/CurrencyContext';
import { DespesaEmpresa, PeriodoReset } from '../../types';
import {
  calcularEstruturaFinanceira,
  calcularMetaHoras,
  somarDespesasEmpresa,
} from '../../utils/financialEngine';
import { CampoComAjuda } from './CampoComAjuda';
import { CustomSelect } from '../CustomSelect';

/**
 * Onboarding financeiro obrigatorio (spec "Minha Empresa", Parte 3), com o
 * visual validado do app (Parte 1): mesmo gradiente/cards/tipografia/sombras
 * ja usados em Dashboard.tsx e TransactionFormModal.tsx.
 *
 * Cabecalho + card de conteudo copiam AO PE DA LETRA a tecnica de recorte de
 * FichasTecnicasModule.tsx (mesmo wrapper `overflow-hidden` + `marginBottom:
 * -100px`/`paddingBottom: 100px`, cabecalho SEM nenhum border-radius proprio,
 * conteudo full-bleed com `marginTop: -70px` e `borderRadius: '28px 28px 0
 * 0'`). Uma tentativa anterior (cabecalho com radius proprio + card flutuante
 * inset) nao ficou boa — o cabecalho nao pode ter radius nenhum: e o
 * conteudo por cima, com seu proprio radius e a sobreposicao generosa, que
 * "recorta" a curva. Ver FichasTecnicasModule.tsx para a referencia exata.
 */

const TOTAL_PASSOS = 9;

const DESPESAS_REDESIGN_HABILITADO = true;

/**
 * Categorias mais comuns de despesa fixa de confeitaria caseira, pra nao
 * comecar o passo 5 com a lista vazia. So entra em jogo quando a conta ainda
 * nao tem nenhuma despesa salva (`administrativeCosts.despesas` vazio) — ver
 * o efeito de carga inicial abaixo. Valores zerados, so os nomes vem prontos;
 * a pessoa edita, remove ou adiciona outras normalmente.
 */
const DESPESAS_PADRAO: DespesaEmpresa[] = [
  { nome: 'Aluguel', valor: 0, percentualRateio: 100, ordem: 0 },
  { nome: 'Energia', valor: 0, percentualRateio: 100, ordem: 1 },
  { nome: 'Água', valor: 0, percentualRateio: 100, ordem: 2 },
  { nome: 'Internet', valor: 0, percentualRateio: 100, ordem: 3 },
  { nome: 'Gás', valor: 0, percentualRateio: 100, ordem: 4 },
];

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
  const { formatCurrency, symbol } = useCurrency();

  const [passo, setPasso] = useState(1);
  const [carregouInicial, setCarregouInicial] = useState(false);

  const [monthlyIncomeTarget, setMonthlyIncomeTarget] = useState(0);
  const [horaTrabalho, setHoraTrabalho] = useState(0);
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState(6);
  const [periodoReset, setPeriodoReset] = useState<PeriodoReset>('semanal');
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
    setPeriodoReset(administrativeCosts.periodoReset);
    setDespesas(
      DESPESAS_REDESIGN_HABILITADO && administrativeCosts.despesas.length === 0
        ? DESPESAS_PADRAO
        : administrativeCosts.despesas
    );
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
    <div
      className="overflow-hidden shadow-card"
      style={{
        boxShadow: '0 30px 70px rgba(58,35,80,.26)',
        background: '#F6F2F5',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '-100px',
        paddingBottom: '100px',
      }}
    >
      {/* Cabecalho gradiente — SEM nenhum border-radius proprio (ver comentario
          do topo do arquivo: e o conteudo por cima que recorta a curva). */}
      <div
        className="text-white relative"
        style={{
          background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
          padding: '20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top, 0px))',
          paddingBottom: '120px',
        }}
      >
        <div className="flex justify-center mb-3">
          <span className="font-serif-display text-white" style={{ fontSize: '22px', letterSpacing: '0.06em' }}>
            CARULA
          </span>
        </div>
        <div className="font-serif-display text-[26px] text-white text-center leading-[1.2]">
          Vamos montar sua estrutura financeira
        </div>
        <p className="text-center text-[12px] text-white/75 mt-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Isso ajuda a saber quanto você precisa faturar — não só o que cobrar por bolo.
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
            <span
              className="text-[10px] text-white/75"
              style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
            >
              {Math.round((passo / TOTAL_PASSOS) * 100)}%
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

      {/* Conteudo full-bleed — mesma tecnica de FichasTecnicasModule.tsx:
          marginTop negativo maior que qualquer radius envolvido, radius so
          nos cantos superiores, escapando o max-width do pai via margin
          left/right calc(-50vw + 50%) e devolvendo o respiro com padding. */}
      <div
        className="flex flex-col gap-4"
        style={{
          marginTop: '-70px',
          background: '#FFFFFF',
          borderRadius: '28px 28px 0 0',
          position: 'relative',
          padding: '20px',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          paddingLeft: 'calc(20px + max(0px, env(safe-area-inset-left)))',
          paddingRight: 'calc(20px + max(0px, env(safe-area-inset-right)))',
        }}
      >
        <div className="max-w-sm mx-auto w-full flex flex-col gap-4">
        <div
          className="bg-white overflow-hidden"
          style={{ borderRadius: '28px', border: '1px solid rgba(58,35,80,0.08)', boxShadow: '0 8px 20px rgba(58,35,80,0.09)' }}
        >
          <div style={{ height: '4px', background: '#A85E86' }} />
          <div className="p-5">
          {erro && (
            <div className="mb-3 p-2.5 rounded-xl bg-[#FDF4F5] border border-[rgba(196,98,111,.35)] text-[12px] text-[#C4626F]" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {erro}
            </div>
          )}

          {passo === 1 && (
            <div className="space-y-3">
              <h2 className={labelClass} style={{ color: '#241B2B' }}>Quanto você quer receber por mês pelo seu trabalho?</h2>
              <CampoComAjuda microcopy="É quanto você quer receber pelo seu trabalho — nunca o lucro da empresa. São coisas diferentes." />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>
                  Pró-labore mensal
                </label>
                <div className="flex items-stretch overflow-hidden" style={{ borderRadius: '8px', border: '1px solid rgba(58,35,80,0.14)', background: '#FFFFFF' }}>
                  <span
                    className="flex items-center px-3 flex-shrink-0"
                    style={{ background: '#F3E9F3', fontSize: '14px', fontWeight: 600, color: '#3A2350', fontFamily: "'Manrope', sans-serif" }}
                  >
                    {symbol}
                  </span>
                  <input
                    type="number"
                    value={monthlyIncomeTarget || ''}
                    onChange={(e) => setMonthlyIncomeTarget(Number(e.target.value))}
                    placeholder="0"
                    className="flex-1 min-w-0 focus:outline-none"
                    style={{ padding: '10px 12px', border: 'none', background: 'transparent', fontSize: '14px', color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}
                  />
                </div>
              </div>
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
              <CustomSelect
                value={String(workingDaysPerWeek)}
                onChange={(v) => setWorkingDaysPerWeek(Number(v))}
                ariaLabel="Dias de trabalho por semana"
                options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: String(n) }))}
              />
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
              <h2 className={labelClass} style={{ color: '#241B2B' }}>Com que frequência você quer resetar suas metas?</h2>
              <CampoComAjuda microcopy="É de quanto em quanto tempo suas metas zeram e recomeçam. Não muda nenhum valor de venda, só o recorte com que você acompanha. Dá pra trocar depois em Minha Empresa." />
              <CustomSelect
                value={periodoReset}
                onChange={(v) => setPeriodoReset(v as PeriodoReset)}
                ariaLabel="Período de reset das metas"
                options={[
                  { value: 'semanal', label: 'Toda semana (segunda a domingo)' },
                  { value: 'quinzenal', label: 'A cada quinzena (dias 1–15 e 16 ao fim do mês)' },
                  { value: 'mensal', label: 'Todo mês (mês cheio)' },
                ]}
              />
              <div className="p-3 rounded-xl border border-[#E6E1DB] bg-white">
                <p className="text-[10px] uppercase tracking-[0.05em]" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                  Sua meta de horas continua semanal
                </p>
                <p className="text-[13px] font-bold mt-1" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>
                  {metaHoras.horasPorSemana.toFixed(1)}h/semana → {metaHoras.horasPorDia.toFixed(1)}h/dia
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button className={botaoSecundario} onClick={voltar} disabled={salvando}>Voltar</button>
                <div className="flex-1">
                  <button className={botaoPrimario} style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)', boxShadow: '0 10px 24px rgba(58,35,80,.35)' }} onClick={() => avancar({ periodoReset })} disabled={salvando}>
                    Avançar
                  </button>
                </div>
              </div>
            </div>
          )}

          {passo === 5 && (
            <div className="space-y-3">
              <h2 className={labelClass} style={{ color: '#241B2B' }}>Despesas mensais do negócio</h2>
              <CampoComAjuda microcopy="Aluguel, luz, internet... custos fixos, independente de quanto você vende. O que já está no custo do produto (embalagem, insumos) não entra aqui de novo." />
              <div className="space-y-2">
                {despesas.map((d, i) => {
                  if (!DESPESAS_REDESIGN_HABILITADO) {
                    return (
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
                    );
                  }

                  // Mesmo layout de MinhaEmpresaCard.tsx (secao "Despesas do
                  // Negocio" pos-onboarding): labels "Valor (R$)"/"% do
                  // negocio" + CampoComAjuda com exemplo dinamico por item.
                  // O wrapper <div className="flex-1"> em vez do <input> reto
                  // como filho do flex tambem e o que evita o vazamento do
                  // campo pra fora do card (bug so visivel aqui, onde o
                  // container e mais estreito que em Minha Empresa).
                  const exemploRateio = d.nome && d.valor
                    ? `Você informou ${formatCurrency(d.valor)} de ${d.nome.trim()}. Se só uma parte é do negócio, ajuste esse número — por exemplo, 50 significa que ${formatCurrency(d.valor * 0.5)} entram como custo real da confeitaria.`
                    : undefined;

                  return (
                    <div key={d.id ?? `novo-${i}`} className="p-3 rounded-xl border border-[#E6E1DB] bg-white space-y-2">
                      <input
                        type="text"
                        placeholder="Nome da despesa"
                        value={d.nome}
                        onChange={(e) => atualizarDespesa(i, 'nome', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E6E1DB] rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe"
                      />
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 min-w-0">
                          <label className="text-[9px] font-bold block mb-1" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>
                            Valor ({symbol})
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            value={d.valor || ''}
                            onChange={(e) => atualizarDespesa(i, 'valor', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-[#E6E1DB] rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe"
                          />
                        </div>
                        <div className="w-24 flex-shrink-0">
                          <label className="text-[9px] font-bold block mb-1" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>
                            % do negócio
                          </label>
                          <input
                            type="number"
                            placeholder="100"
                            value={d.percentualRateio || ''}
                            onChange={(e) => atualizarDespesa(i, 'percentualRateio', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-[#E6E1DB] rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe"
                          />
                        </div>
                        <button
                          onClick={() => removerDespesa(i)}
                          className="w-8 h-8 flex-shrink-0 rounded-full bg-[#FDF4F5] text-[#C4626F] flex items-center justify-center text-xs font-bold"
                          aria-label="Remover despesa"
                        >
                          ×
                        </button>
                      </div>
                      <CampoComAjuda
                        microcopy="Se essa despesa também é usada na sua vida pessoal, informe aqui só a parte que é do negócio. Deixe 100 se ela é toda da confeitaria."
                        exemploDinamico={exemploRateio}
                      />
                    </div>
                  );
                })}
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

          {passo === 6 && (
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

          {passo === 7 && (
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

          {passo === 8 && (
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

          {passo === 9 && (
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

        {passo === 1 && (
          <div className="p-3.5 rounded-xl flex items-start gap-2.5" style={{ background: '#F3E9F3' }}>
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: '#3A2350', color: '#FFFFFF', fontSize: '12px', fontWeight: 700 }}
            >
              ?
            </span>
            <p className="text-[12.5px] leading-relaxed m-0" style={{ color: '#6E3F72', fontFamily: "'Manrope', sans-serif" }}>
              Sem ideia do valor? Pense no que você precisa receber para viver tranquila — dá pra ajustar depois.
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
