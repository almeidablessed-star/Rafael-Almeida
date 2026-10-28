import React, { useEffect, useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import { useCosts } from '../context/CostsContext';
import { useCurrency } from '../context/CurrencyContext';
import { DespesaEmpresa, PeriodoReset } from '../types';
import {
  calcularEstruturaFinanceira,
  calcularMetaHoras,
  somarDespesasEmpresa,
} from '../utils/financialEngine';
import { CampoComAjuda } from './onboarding/CampoComAjuda';
import { CampoNumerico } from './CampoNumerico';
import { ResumoDistribuicaoCard } from './ResumoDistribuicaoCard';
import { CustomSelect } from './CustomSelect';

/**
 * Painel "Minha Empresa" — substitui o antigo AdminCostsCard (que so lia as 7
 * colunas fixas legadas). E a MESMA tela do onboarding financeiro
 * (EmpresaOnboardingFlow), so que sem navegacao por passos: as 4 secoes da
 * spec Parte 3, item 4, todas visiveis, editaveis a qualquer momento.
 *
 * O Resumo/Distribuicao (secao 4) nunca fica escondido e recalcula a cada
 * tecla digitada nas secoes 1-3, mesmo antes de salvar — e o "preview em
 * tempo real" da spec Parte 4, item 8.
 */

const inputClass =
  'w-full px-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe';
const botaoPrimario =
  'px-4 py-2.5 rounded-xl text-white text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 hover:brightness-110 disabled:opacity-50';
const botaoSecundario =
  'px-4 py-2.5 rounded-xl bg-white border border-[#E6E1DB] text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-all active:scale-95 disabled:opacity-50';
const secaoTitulo = 'font-serif-display text-[18px] leading-tight';
const secaoCard = 'bg-[#F6F2F5] rounded-2xl p-4 space-y-3';
/** Cor de destaque no topo de cada card de despesa, alternando por posicao —
 * so decorativo, nao representa categoria nenhuma. */
const DESPESA_ACCENTS = ['#A85E86', '#7E4F9E', '#B08D57', '#A9D8B8', '#6E3F72'];

/**
 * Frase inteira por periodo, em vez de montar com concatenacao.
 *
 * Portugues tem concordancia de genero: "toda semana", "toda quinzena", mas
 * "todo mes". Montar com `'tod' + a/o + substantivo` produz exatamente o tipo
 * de erro que ja apareceu neste app ("Já existe um ficha técnica"). O
 * vocabulario carrega o artigo pronto.
 */
const PERIODO_DESCRICAO: Record<PeriodoReset, string> = {
  semanal: 'Toda semana — de segunda a domingo',
  quinzenal: 'A cada quinzena — dias 1 a 15 e 16 ao fim do mês',
  mensal: 'Todo mês — do dia 1 ao fim do mês',
};

/**
 * `computador`: versao computador em duas colunas (docs/design/desktop-redesign,
 * Empresa.dc.html). `colunaDireita` entra abaixo do Resumo, na coluna da direita
 * (o CostsModule passa os gastos avulsos). No celular nada disso e usado.
 */
export const MinhaEmpresaCard: React.FC<{ computador?: boolean; colunaDireita?: React.ReactNode }> = ({
  computador = false,
  colunaDireita,
}) => {
  const { administrativeCosts, salvarConfiguracaoEmpresa, salvarDespesas, error } = useCosts();
  const { formatCurrency, symbol } = useCurrency();

  const [carregouInicial, setCarregouInicial] = useState(false);

  const [monthlyIncomeTarget, setMonthlyIncomeTarget] = useState(0);
  const [horaTrabalho, setHoraTrabalho] = useState(0);
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState(6);
  const [periodoReset, setPeriodoReset] = useState<PeriodoReset>('semanal');
  const [despesas, setDespesas] = useState<DespesaEmpresa[]>([]);
  const [cmvTargetPercent, setCmvTargetPercent] = useState(34);
  const [investmentTargetPercent, setInvestmentTargetPercent] = useState(5);
  const [profitTargetPercent, setProfitTargetPercent] = useState(13);

  const [editandoRemuneracao, setEditandoRemuneracao] = useState(false);
  const [editandoMetas, setEditandoMetas] = useState(false);
  const [editandoPeriodo, setEditandoPeriodo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroLocal, setErroLocal] = useState('');

  useEffect(() => {
    if (!administrativeCosts || carregouInicial) return;
    setMonthlyIncomeTarget(administrativeCosts.monthlyIncomeTarget);
    setHoraTrabalho(administrativeCosts.horaTrabalho);
    setWorkingDaysPerWeek(administrativeCosts.workingDaysPerWeek);
    setPeriodoReset(administrativeCosts.periodoReset);
    setDespesas(administrativeCosts.despesas);
    setCmvTargetPercent(administrativeCosts.cmvTargetPercent);
    setInvestmentTargetPercent(administrativeCosts.investmentTargetPercent);
    setProfitTargetPercent(administrativeCosts.profitTargetPercent);
    setCarregouInicial(true);
  }, [administrativeCosts, carregouInicial]);

  if (!administrativeCosts || !carregouInicial) return null;

  const metaHoras = calcularMetaHoras(monthlyIncomeTarget, horaTrabalho, workingDaysPerWeek);
  const despesasMensais = somarDespesasEmpresa(despesas);
  const estrutura = calcularEstruturaFinanceira(
    monthlyIncomeTarget,
    despesasMensais,
    cmvTargetPercent,
    investmentTargetPercent,
    profitTargetPercent
  );

  const salvarRemuneracao = async () => {
    setErroLocal('');
    setSalvando(true);
    try {
      await salvarConfiguracaoEmpresa({ monthlyIncomeTarget, horaTrabalho, workingDaysPerWeek });
      setEditandoRemuneracao(false);
    } catch (err: any) {
      setErroLocal(err.message || 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const cancelarRemuneracao = () => {
    setMonthlyIncomeTarget(administrativeCosts.monthlyIncomeTarget);
    setHoraTrabalho(administrativeCosts.horaTrabalho);
    setWorkingDaysPerWeek(administrativeCosts.workingDaysPerWeek);
    setEditandoRemuneracao(false);
  };

  const salvarMetas = async () => {
    setErroLocal('');
    setSalvando(true);
    try {
      await salvarConfiguracaoEmpresa({ cmvTargetPercent, investmentTargetPercent, profitTargetPercent });
      setEditandoMetas(false);
    } catch (err: any) {
      setErroLocal(err.message || 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const salvarPeriodo = async () => {
    setErroLocal('');
    setSalvando(true);
    try {
      await salvarConfiguracaoEmpresa({ periodoReset });
      setEditandoPeriodo(false);
    } catch (err: any) {
      setErroLocal(err.message || 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const cancelarPeriodo = () => {
    setPeriodoReset(administrativeCosts.periodoReset);
    setEditandoPeriodo(false);
  };

  const cancelarMetas = () => {
    setCmvTargetPercent(administrativeCosts.cmvTargetPercent);
    setInvestmentTargetPercent(administrativeCosts.investmentTargetPercent);
    setProfitTargetPercent(administrativeCosts.profitTargetPercent);
    setEditandoMetas(false);
  };

  const salvarDespesasHandler = async () => {
    setErroLocal('');
    setSalvando(true);
    try {
      const salvas = await salvarDespesas(despesas);
      setDespesas(salvas);
    } catch (err: any) {
      setErroLocal(err.message || 'Erro ao salvar despesas.');
    } finally {
      setSalvando(false);
    }
  };

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

  // ------------------------------------------------------------------
  // As secoes, cada uma num bloco. O celular empilha na ordem de sempre; o
  // computador (`pc`) arruma em duas colunas, como em
  // docs/design/desktop-redesign/Empresa.dc.html: Remuneracao, Periodo + Metas
  // lado a lado e Despesas a esquerda; Resumo e a `colunaDireita` (os gastos
  // avulsos, que vem do CostsModule) a direita.
  // ------------------------------------------------------------------
  const pc = computador;

  // Formularios de edicao (Remuneracao, Periodo, Metas) no computador: campos
  // de 46px e botoes de 44px, como o resto da tela. No celular, sem mudanca.
  const campoEdicaoPc: React.CSSProperties = { height: '46px', boxSizing: 'border-box', padding: '0 14px', fontSize: '15px', borderRadius: '12px', marginTop: '6px' };
  const botaoEdicaoPc: React.CSSProperties = { flex: 1, height: '44px', padding: '0 16px', fontSize: '13px', borderRadius: '12px' };

  // Cartao de secao e caixinhas de valor do computador: brancos, com as
  // caixinhas em lilas claro. No celular continuam as classes de sempre.
  const secaoPc = (extra?: React.CSSProperties): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    padding: '22px',
    borderRadius: '22px',
    background: '#FFFFFF',
    boxShadow: '0 8px 20px rgba(58,35,80,0.08)',
    ...extra,
  });
  const caixaPc: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px', padding: '14px 16px', borderRadius: '14px', background: '#FAF7FA', border: '1px solid #EDE6EF' };
  const rotuloCaixa: React.CSSProperties = { color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800, ...(pc ? { fontSize: '11px' } : {}) };
  const valorCaixa = (tamanho: 'grande' | 'medio'): React.CSSProperties => ({
    color: '#241B2B',
    fontFamily: "'Manrope', sans-serif",
    ...(pc ? (tamanho === 'grande' ? { fontSize: '18px', fontWeight: 800, marginTop: 0, fontVariantNumeric: 'tabular-nums' } : { fontSize: '15px', fontWeight: 700, marginTop: 0 }) : {}),
  });
  const tituloSecao: React.CSSProperties = { color: '#241B2B', ...(pc ? { margin: 0, fontSize: '26px', lineHeight: 1.15 } : {}) };
  const botaoEditar = (rotulo: string, aoClicar: () => void) => (
    <button
      onClick={aoClicar}
      className={pc ? 'rounded-full flex items-center justify-center text-[#6E3F72] hover:bg-[#F3E9F3] transition-colors' : 'w-7 h-7 rounded-full flex items-center justify-center text-[#6E3F72] hover:bg-white transition-colors'}
      title="Editar"
      {...(pc ? { type: 'button' as const, 'aria-label': rotulo, style: { width: '40px', height: '40px' } } : {})}
    >
      <Edit3 size={pc ? 16 : 14} />
    </button>
  );

  const textoDespesas = 'Aluguel, luz, internet... custos fixos, independente de quanto você vende. O que já está no custo do produto não entra aqui de novo.';

  const avisoErro = (error || erroLocal) && (
    <div className="p-2.5 rounded-xl bg-[#FDF4F5] border border-[rgba(196,98,111,.35)] text-[12px] text-[#C4626F]" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {error || erroLocal}
    </div>
  );

  const secaoRemuneracao = (
      <div className={pc ? undefined : secaoCard} style={pc ? secaoPc() : undefined}>
        <div className="flex items-center justify-between">
          <h3 className={secaoTitulo} style={tituloSecao}>Sua Remuneração</h3>
          {!editandoRemuneracao && botaoEditar('Editar sua remuneração', () => setEditandoRemuneracao(true))}
        </div>

        {!editandoRemuneracao ? (
          <div className="grid grid-cols-2 gap-2" style={pc ? { gap: '10px' } : undefined}>
            <div className="bg-white rounded-xl p-3 border border-[#E6E1DB]" style={pc ? caixaPc : undefined}>
              <p className="text-[9px] uppercase tracking-[0.05em]" style={rotuloCaixa}>Recebimento desejado</p>
              <p className="text-[13px] font-bold mt-1" style={valorCaixa('grande')}>{formatCurrency(monthlyIncomeTarget)}/mês</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-[#E6E1DB]" style={pc ? caixaPc : undefined}>
              <p className="text-[9px] uppercase tracking-[0.05em]" style={rotuloCaixa}>Valor da hora</p>
              <p className="text-[13px] font-bold mt-1" style={valorCaixa('grande')}>{formatCurrency(horaTrabalho)}/hora</p>
            </div>
            <div className="col-span-2 bg-white rounded-xl p-3 border border-[#E6E1DB]" style={pc ? caixaPc : undefined}>
              <p className="text-[9px] uppercase tracking-[0.05em]" style={rotuloCaixa}>Meta de horas (referência, não obrigação)</p>
              <p className="text-[12px] font-bold mt-1" style={valorCaixa('medio')}>
                {workingDaysPerWeek} dias/semana · {metaHoras.horasPorMes.toFixed(1)}h/mês → {metaHoras.horasPorSemana.toFixed(1)}h/semana → {metaHoras.horasPorDia.toFixed(1)}h/dia
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", ...(pc ? { fontSize: '13px' } : {}) }}>Quanto você quer receber por mês</label>
              <CampoComAjuda microcopy="É quanto você quer receber pelo seu trabalho — nunca o lucro da empresa. São coisas diferentes." />
              <CampoNumerico className={inputClass} style={pc ? campoEdicaoPc : undefined} value={monthlyIncomeTarget} onChange={setMonthlyIncomeTarget} ariaLabel="Quanto você quer receber por mês" />
            </div>
            <div>
              <label className="text-[11px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", ...(pc ? { fontSize: '13px' } : {}) }}>Valor da sua hora</label>
              <CampoComAjuda microcopy="Multiplicado pelas horas de cada receita, vira a mão de obra daquele produto." />
              <CampoNumerico className={inputClass} style={pc ? campoEdicaoPc : undefined} value={horaTrabalho} onChange={setHoraTrabalho} ariaLabel="Valor da sua hora" />
            </div>
            <div>
              <label className="text-[11px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", ...(pc ? { fontSize: '13px' } : {}) }}>Dias de trabalho por semana</label>
              <CustomSelect
                value={String(workingDaysPerWeek)}
                onChange={(v) => setWorkingDaysPerWeek(Number(v))}
                options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: String(n) }))}
                ariaLabel="Dias de trabalho por semana"
                style={{ marginTop: '4px' }}
              />
            </div>
            <div className="flex gap-2">
              <button className={botaoSecundario} style={pc ? botaoEdicaoPc : undefined} onClick={cancelarRemuneracao} disabled={salvando}><X size={13} className="inline mr-1" />Cancelar</button>
              <button className={botaoPrimario} style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)', ...(pc ? botaoEdicaoPc : {}) }} onClick={salvarRemuneracao} disabled={salvando}>
                <Save size={13} />{salvando ? 'Salvando' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </div>
  );

  /*
    Secao propria, e nao um campo dentro de "Sua Remuneracao", de proposito.
    La dentro ele ficaria colado em "Dias de trabalho por semana", e as duas
    coisas nao tem relacao nenhuma: dias por semana e rotina de trabalho e
    alimenta a meta de HORAS, que continua sempre semanal. Lado a lado, o
    arranjo sugeriria que escolher "quinzenal" converteria as horas junto —
    que e exatamente a duvida que a microcopy abaixo existe para matar.
  */
  const secaoPeriodo = (
      <div className={pc ? undefined : secaoCard} style={pc ? secaoPc({ flex: '1 1 260px', minWidth: 0 }) : undefined}>
        <div className="flex items-center justify-between">
          <h3 className={secaoTitulo} style={tituloSecao}>Período das Metas</h3>
          {!editandoPeriodo && botaoEditar('Editar período das metas', () => setEditandoPeriodo(true))}
        </div>

        {!editandoPeriodo ? (
          <div className="bg-white rounded-xl p-3 border border-[#E6E1DB]" style={pc ? caixaPc : undefined}>
            <p className="text-[9px] uppercase tracking-[0.05em]" style={rotuloCaixa}>Suas metas zeram</p>
            <p className="text-[13px] font-bold mt-1" style={valorCaixa('medio')}>
              {PERIODO_DESCRICAO[periodoReset]}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", ...(pc ? { fontSize: '13px' } : {}) }}>De quanto em quanto tempo suas metas recomeçam</label>
              <CampoComAjuda microcopy="Trocar aqui reagrupa todo o seu histórico no novo período — nenhum valor de venda muda, só o recorte com que você vê. Sua meta de horas continua semanal de qualquer jeito." />
              <CustomSelect
                value={periodoReset}
                onChange={(v) => setPeriodoReset(v as PeriodoReset)}
                options={[
                  { value: 'semanal', label: 'Toda semana (segunda a domingo)' },
                  { value: 'quinzenal', label: 'A cada quinzena (dias 1–15 e 16 ao fim do mês)' },
                  { value: 'mensal', label: 'Todo mês (mês cheio)' },
                ]}
                ariaLabel="Período de reset das metas"
                style={{ marginTop: '4px' }}
              />
            </div>
            <div className="flex gap-2">
              <button className={botaoSecundario} style={pc ? botaoEdicaoPc : undefined} onClick={cancelarPeriodo} disabled={salvando}><X size={13} className="inline mr-1" />Cancelar</button>
              <button className={botaoPrimario} style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)', ...(pc ? botaoEdicaoPc : {}) }} onClick={salvarPeriodo} disabled={salvando}>
                <Save size={13} />{salvando ? 'Salvando' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </div>
  );

  // Secao 3 — Despesas do Negocio
  const secaoDespesas = (
      <div className={pc ? undefined : secaoCard} style={pc ? secaoPc() : undefined}>
        <div className="flex items-center justify-between" style={pc ? { alignItems: 'baseline', gap: '12px' } : undefined}>
          <h3 className={secaoTitulo} style={tituloSecao}>Despesas do Negócio</h3>
          <span className="text-[12px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", ...(pc ? { fontSize: '16px', fontWeight: 800, fontVariantNumeric: 'tabular-nums' } : {}) }}>{formatCurrency(despesasMensais)}</span>
        </div>
        {pc ? (
          <>
            <p style={{ margin: 0, fontSize: '13px', color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>{textoDespesas}</p>
            {/* No computador o aviso do "% do negocio" aparece uma vez so, aqui
                no topo (no celular ele se repete em cada despesa). */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', borderRadius: '14px', background: '#F3E9F3' }}>
              <span aria-hidden="true" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: '#3A2350', color: '#FFFFFF', fontSize: '12px', fontWeight: 800 }}>?</span>
              <p style={{ margin: 0, fontSize: '13px', color: '#4A3F52', fontFamily: "'Manrope', sans-serif" }}>
                Se essa despesa também é usada na sua vida pessoal, informe em “% do negócio” só a parte que é da confeitaria. Deixe 100 se ela é toda do negócio.
              </p>
            </div>
          </>
        ) : (
          <CampoComAjuda microcopy={textoDespesas} />
        )}
        <div
          className={pc ? undefined : 'space-y-2'}
          style={pc ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' } : undefined}
        >
          {despesas.map((d, i) => {
            const exemploRateio = d.nome && d.valor
              ? `Você informou ${formatCurrency(d.valor)} de ${d.nome.trim()}. Se só uma parte é do negócio, ajuste esse número — por exemplo, 50 significa que ${formatCurrency(d.valor * 0.5)} entram como custo real da confeitaria.`
              : undefined;
            return (
            <div
              key={d.id ?? `novo-${i}`}
              className="overflow-hidden shadow-[0_8px_20px_rgba(58,35,80,.09)] hover:shadow-[0_20px_36px_rgba(58,35,80,.18)] hover:-translate-y-[3px] focus-within:shadow-[0_20px_36px_rgba(58,35,80,.18)] focus-within:-translate-y-[3px] transition-all duration-200"
              style={{ borderRadius: '16px', background: '#FFFFFF', border: pc ? '1px solid rgba(58,35,80,0.1)' : '1px solid rgba(58,35,80,0.08)' }}
            >
              <div style={{ height: '4px', background: DESPESA_ACCENTS[i % DESPESA_ACCENTS.length] }} />
              <div className={pc ? undefined : 'p-3 space-y-2'} style={pc ? { display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px' } : undefined}>
                <input type="text" placeholder="Nome da despesa" value={d.nome} onChange={(e) => atualizarDespesa(i, 'nome', e.target.value)}
                  {...(pc ? { 'aria-label': 'Nome da despesa' } : {})}
                  style={{ fontFamily: "'Manrope', sans-serif", fontSize: '17px', fontWeight: 600, padding: pc ? '0 14px' : '12px 14px', ...(pc ? { height: '46px', boxSizing: 'border-box' as const } : {}), borderRadius: '10px', border: '1px solid rgba(58,35,80,0.14)' }}
                  className="w-full bg-white focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe" />
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs font-semibold block mb-1" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>Valor ({symbol})</label>
                    <CampoNumerico placeholder="0" ariaLabel="Valor da despesa" value={d.valor} onChange={(valor) => atualizarDespesa(i, 'valor', valor)}
                      style={{ fontFamily: "'Manrope', sans-serif", fontSize: '16px', fontWeight: 600, padding: pc ? '0 12px' : '11px 13px', ...(pc ? { height: '44px', boxSizing: 'border-box' as const } : {}), borderRadius: '10px', border: '1px solid rgba(58,35,80,0.14)', background: '#FAF7FA', fontVariantNumeric: 'tabular-nums' }}
                      className="w-full focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe" />
                  </div>
                  <div className="w-24">
                    <label className="text-xs font-semibold block mb-1" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>% do negócio</label>
                    <CampoNumerico placeholder="100" ariaLabel="Percentual do negócio" value={d.percentualRateio} onChange={(valor) => atualizarDespesa(i, 'percentualRateio', valor)}
                      style={{ fontFamily: "'Manrope', sans-serif", fontSize: '16px', fontWeight: 600, padding: pc ? '0 12px' : '11px 13px', ...(pc ? { height: '44px', boxSizing: 'border-box' as const } : {}), borderRadius: '10px', border: '1px solid rgba(58,35,80,0.14)', background: '#FAF7FA', fontVariantNumeric: 'tabular-nums' }}
                      className="w-full focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe" />
                  </div>
                  <div className="flex-shrink-0" style={pc ? { display: 'flex', flexDirection: 'column', alignItems: 'center' } : undefined}>
                    <span className="text-[10px] font-semibold block mb-1 text-right" style={{ color: pc ? '#94505E' : '#A96A78', letterSpacing: '0.02em', fontFamily: "'Manrope', sans-serif", ...(pc ? { fontSize: '11px', textAlign: 'center' as const } : {}) }}>Excluir</span>
                    <button
                      onClick={() => removerDespesa(i)}
                      aria-label={pc ? `Excluir a despesa ${d.nome.trim() || 'sem nome'}` : 'Remover despesa'}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all active:scale-95"
                      style={{ border: '1px solid rgba(196,98,111,0.28)', background: '#FDEFF2', color: pc ? '#B04E5C' : '#C4626F', boxShadow: '0 2px 6px rgba(196,98,111,0.12)', ...(pc ? { width: '44px', height: '44px', fontSize: '18px' } : {}) }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F5B9C6'; e.currentTarget.style.color = '#6E2231'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(196,98,111,0.26)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#FDEFF2'; e.currentTarget.style.color = pc ? '#B04E5C' : '#C4626F'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(196,98,111,0.12)'; }}
                    >
                      ×
                    </button>
                  </div>
                </div>
                {pc ? (
                  // Computador: o aviso ja aparece uma vez no topo; aqui fica so o
                  // "?" com o exemplo calculado com os numeros desta despesa.
                  exemploRateio && (
                    <CampoComAjuda
                      variant="computador"
                      microcopy="Quer ver um exemplo com os números desta despesa?"
                      exemploDinamico={exemploRateio}
                      ariaLabelAjuda={`Ver exemplo com os números de ${d.nome.trim()}`}
                    />
                  )
                ) : (
                  <CampoComAjuda
                    variant="card"
                    microcopy="Se essa despesa também é usada na sua vida pessoal, informe aqui só a parte que é do negócio. Deixe 100 se ela é toda da confeitaria."
                    exemploDinamico={exemploRateio}
                    ariaLabelAjuda="Ver exemplo com os números da sua conta"
                  />
                )}
              </div>
            </div>
            );
          })}
        </div>
        <button
          onClick={adicionarDespesa}
          className="w-full py-2.5 rounded-xl border border-dashed border-[#E6E1DB] text-[12px] font-bold text-[#6E3F72] hover:bg-white transition-all"
          {...(pc ? { type: 'button' as const, style: { height: '46px', padding: 0, borderColor: '#D9CCDB', borderRadius: '12px', fontSize: '13px', fontWeight: 800 } } : {})}
        >
          + Adicionar despesa
        </button>
        <button
          className={botaoPrimario + ' w-full'}
          style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)', ...(pc ? { height: '48px', padding: 0, borderRadius: '12px', fontSize: '13px', fontWeight: 800, gap: '8px' } : {}) }}
          onClick={salvarDespesasHandler}
          disabled={salvando}
        >
          <Save size={pc ? 15 : 13} />{salvando ? 'Salvando' : 'Salvar despesas'}
        </button>
      </div>
  );

  // Secao 3 — Metas da Empresa
  const caixaMetaPc: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '12px 6px', borderRadius: '14px', background: '#FAF7FA', border: '1px solid #EDE6EF' };
  const valorMeta: React.CSSProperties = { color: '#241B2B', fontFamily: "'Manrope', sans-serif", ...(pc ? { fontSize: '18px', fontWeight: 800, marginTop: 0 } : {}) };
  const secaoMetas = (
      <div className={pc ? undefined : secaoCard} style={pc ? secaoPc({ flex: '1 1 260px', minWidth: 0 }) : undefined}>
        <div className="flex items-center justify-between">
          <h3 className={secaoTitulo} style={tituloSecao}>Metas da Empresa</h3>
          {!editandoMetas && botaoEditar('Editar metas da empresa', () => setEditandoMetas(true))}
        </div>

        {!editandoMetas ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl p-3 border border-[#E6E1DB] text-center" style={pc ? caixaMetaPc : undefined}>
              <p className="text-[9px] uppercase tracking-[0.05em]" style={rotuloCaixa}>CMV</p>
              <p className="text-[14px] font-bold mt-1" style={valorMeta}>{cmvTargetPercent}%</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-[#E6E1DB] text-center" style={pc ? caixaMetaPc : undefined}>
              <p className="text-[9px] uppercase tracking-[0.05em]" style={rotuloCaixa}>Investimento</p>
              <p className="text-[14px] font-bold mt-1" style={valorMeta}>{investmentTargetPercent}%</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-[#E6E1DB] text-center" style={pc ? caixaMetaPc : undefined}>
              <p className="text-[9px] uppercase tracking-[0.05em]" style={rotuloCaixa}>Lucro</p>
              <p className="text-[14px] font-bold mt-1" style={valorMeta}>{profitTargetPercent}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", ...(pc ? { fontSize: '13px' } : {}) }}>Meta de CMV (%)</label>
              <CampoComAjuda microcopy="Quanto do preço do bolo vai embora só com ingredientes e embalagem. Quanto menor, mais sobra pra você." exemploDinamico={exemploCmv} ariaLabelAjuda="Ver exemplo com os números da sua conta" />
              <CampoNumerico className={inputClass} style={pc ? campoEdicaoPc : undefined} value={cmvTargetPercent} onChange={setCmvTargetPercent} ariaLabel="Meta de CMV em porcentagem" />
            </div>
            <div>
              <label className="text-[11px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", ...(pc ? { fontSize: '13px' } : {}) }}>Meta de investimento (%)</label>
              <CampoComAjuda microcopy="Uma reserva pra comprar equipamento, fazer curso, crescer o negócio — sem tirar do seu bolso." exemploDinamico={exemploInvestimento} ariaLabelAjuda="Ver exemplo com os números da sua conta" />
              <CampoNumerico className={inputClass} style={pc ? campoEdicaoPc : undefined} value={investmentTargetPercent} onChange={setInvestmentTargetPercent} ariaLabel="Meta de investimento em porcentagem" />
            </div>
            <div>
              <label className="text-[11px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif", ...(pc ? { fontSize: '13px' } : {}) }}>Meta de lucro (%)</label>
              <CampoComAjuda microcopy="O que sobra pra empresa, além do que você já recebe pelo seu trabalho." exemploDinamico={exemploLucro} ariaLabelAjuda="Ver exemplo com os números da sua conta" />
              <CampoNumerico className={inputClass} style={pc ? campoEdicaoPc : undefined} value={profitTargetPercent} onChange={setProfitTargetPercent} ariaLabel="Meta de lucro em porcentagem" />
            </div>
            <div className="flex gap-2">
              <button className={botaoSecundario} style={pc ? botaoEdicaoPc : undefined} onClick={cancelarMetas} disabled={salvando}><X size={13} className="inline mr-1" />Cancelar</button>
              <button className={botaoPrimario} style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)', ...(pc ? botaoEdicaoPc : {}) }} onClick={salvarMetas} disabled={salvando}>
                <Save size={13} />{salvando ? 'Salvando' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </div>
  );

  // Secao 4 — Resumo / Distribuicao. SEMPRE visivel, nunca em accordion.
  // Recalcula a cada tecla digitada nas secoes acima, salvo ou nao.
  // Mesmo componente usado no Dashboard — ver [[ResumoDistribuicaoCard]].
  const secaoResumo = <ResumoDistribuicaoCard estrutura={estrutura} computador={pc ? 'largo' : false} />;

  if (pc) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '24px', fontFamily: "'Manrope', sans-serif" }}>
        <div style={{ flex: '3 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {avisoErro}
          {secaoRemuneracao}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: '24px' }}>
            {secaoPeriodo}
            {secaoMetas}
          </div>
          {secaoDespesas}
        </div>
        <div style={{ flex: '2 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {secaoResumo}
          {colunaDireita}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {avisoErro}

      {/* Secao 1 — Sua Remuneracao */}
      {secaoRemuneracao}

      {secaoPeriodo}

      {secaoDespesas}

      {secaoMetas}

      {secaoResumo}
    </div>
  );
};
