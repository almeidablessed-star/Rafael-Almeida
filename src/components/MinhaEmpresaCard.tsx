import React, { useEffect, useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import { useCosts } from '../context/CostsContext';
import { useCurrency } from '../context/CurrencyContext';
import { DespesaEmpresa } from '../types';
import {
  calcularEstruturaFinanceira,
  calcularMetaHoras,
  somarDespesasEmpresa,
} from '../utils/financialEngine';
import { CampoComAjuda } from './onboarding/CampoComAjuda';
import { ResumoDistribuicaoCard } from './ResumoDistribuicaoCard';

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

export const MinhaEmpresaCard: React.FC = () => {
  const { administrativeCosts, salvarConfiguracaoEmpresa, salvarDespesas, error } = useCosts();
  const { formatCurrency } = useCurrency();

  const [carregouInicial, setCarregouInicial] = useState(false);

  const [monthlyIncomeTarget, setMonthlyIncomeTarget] = useState(0);
  const [horaTrabalho, setHoraTrabalho] = useState(0);
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState(6);
  const [despesas, setDespesas] = useState<DespesaEmpresa[]>([]);
  const [cmvTargetPercent, setCmvTargetPercent] = useState(34);
  const [investmentTargetPercent, setInvestmentTargetPercent] = useState(5);
  const [profitTargetPercent, setProfitTargetPercent] = useState(13);

  const [editandoRemuneracao, setEditandoRemuneracao] = useState(false);
  const [editandoMetas, setEditandoMetas] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroLocal, setErroLocal] = useState('');

  useEffect(() => {
    if (!administrativeCosts || carregouInicial) return;
    setMonthlyIncomeTarget(administrativeCosts.monthlyIncomeTarget);
    setHoraTrabalho(administrativeCosts.horaTrabalho);
    setWorkingDaysPerWeek(administrativeCosts.workingDaysPerWeek);
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

  return (
    <div className="space-y-4">
      {(error || erroLocal) && (
        <div className="p-2.5 rounded-xl bg-[#FDF4F5] border border-[rgba(196,98,111,.35)] text-[12px] text-[#C4626F]" style={{ fontFamily: "'Manrope', sans-serif" }}>
          {error || erroLocal}
        </div>
      )}

      {/* Secao 1 — Sua Remuneracao */}
      <div className={secaoCard}>
        <div className="flex items-center justify-between">
          <h3 className={secaoTitulo} style={{ color: '#241B2B' }}>Sua Remuneração</h3>
          {!editandoRemuneracao && (
            <button onClick={() => setEditandoRemuneracao(true)} className="w-7 h-7 rounded-full flex items-center justify-center text-[#6E3F72] hover:bg-white transition-colors" title="Editar">
              <Edit3 size={14} />
            </button>
          )}
        </div>

        {!editandoRemuneracao ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-xl p-3 border border-[#E6E1DB]">
              <p className="text-[9px] uppercase tracking-[0.05em]" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>Recebimento desejado</p>
              <p className="text-[13px] font-bold mt-1" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>{formatCurrency(monthlyIncomeTarget)}/mês</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-[#E6E1DB]">
              <p className="text-[9px] uppercase tracking-[0.05em]" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>Valor da hora</p>
              <p className="text-[13px] font-bold mt-1" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>{formatCurrency(horaTrabalho)}/hora</p>
            </div>
            <div className="col-span-2 bg-white rounded-xl p-3 border border-[#E6E1DB]">
              <p className="text-[9px] uppercase tracking-[0.05em]" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>Meta de horas (referência, não obrigação)</p>
              <p className="text-[12px] font-bold mt-1" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>
                {workingDaysPerWeek} dias/semana · {metaHoras.horasPorMes.toFixed(1)}h/mês → {metaHoras.horasPorSemana.toFixed(1)}h/semana → {metaHoras.horasPorDia.toFixed(1)}h/dia
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>Quanto você quer receber por mês</label>
              <CampoComAjuda microcopy="É quanto você quer receber pelo seu trabalho — nunca o lucro da empresa. São coisas diferentes." />
              <input type="number" className={inputClass} value={monthlyIncomeTarget || ''} onChange={(e) => setMonthlyIncomeTarget(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-[11px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>Valor da sua hora</label>
              <CampoComAjuda microcopy="Multiplicado pelas horas de cada receita, vira a mão de obra daquele produto." />
              <input type="number" className={inputClass} value={horaTrabalho || ''} onChange={(e) => setHoraTrabalho(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-[11px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>Dias de trabalho por semana</label>
              <select className={inputClass} value={workingDaysPerWeek} onChange={(e) => setWorkingDaysPerWeek(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button className={botaoSecundario} onClick={cancelarRemuneracao} disabled={salvando}><X size={13} className="inline mr-1" />Cancelar</button>
              <button className={botaoPrimario} style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)' }} onClick={salvarRemuneracao} disabled={salvando}>
                <Save size={13} />{salvando ? 'Salvando' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Secao 2 — Despesas do Negocio */}
      <div className={secaoCard}>
        <div className="flex items-center justify-between">
          <h3 className={secaoTitulo} style={{ color: '#241B2B' }}>Despesas do Negócio</h3>
          <span className="text-[12px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>{formatCurrency(despesasMensais)}</span>
        </div>
        <CampoComAjuda microcopy="Aluguel, luz, internet... custos fixos, independente de quanto você vende. O que já está no custo do produto não entra aqui de novo." />
        <div className="space-y-2">
          {despesas.map((d, i) => {
            const exemploRateio = d.nome && d.valor
              ? `Você informou ${formatCurrency(d.valor)} de ${d.nome.trim()}. Se só uma parte é do negócio, ajuste esse número — por exemplo, 50 significa que ${formatCurrency(d.valor * 0.5)} entram como custo real da confeitaria.`
              : undefined;
            return (
            <div key={d.id ?? `novo-${i}`} className="p-3 rounded-xl border border-[#E6E1DB] bg-white space-y-2">
              <input type="text" placeholder="Nome da despesa" value={d.nome} onChange={(e) => atualizarDespesa(i, 'nome', e.target.value)}
                style={{ fontFamily: "'Manrope', sans-serif" }}
                className="w-full px-3 py-2 bg-white border border-[#E6E1DB] rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe" />
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-[9px] font-bold block mb-1" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>Valor (R$)</label>
                  <input type="number" placeholder="0" value={d.valor || ''} onChange={(e) => atualizarDespesa(i, 'valor', Number(e.target.value))}
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                    className="w-full px-3 py-2 bg-white border border-[#E6E1DB] rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe" />
                </div>
                <div className="w-24">
                  <label className="text-[9px] font-bold block mb-1" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>% do negócio</label>
                  <input type="number" placeholder="100" value={d.percentualRateio} onChange={(e) => atualizarDespesa(i, 'percentualRateio', Number(e.target.value))}
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                    className="w-full px-3 py-2 bg-white border border-[#E6E1DB] rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6E3F72] input-mobile-safe" />
                </div>
                <button onClick={() => removerDespesa(i)} className="w-8 h-8 flex-shrink-0 rounded-full bg-[#FDF4F5] text-[#C4626F] flex items-center justify-center text-xs font-bold" aria-label="Remover despesa">×</button>
              </div>
              <CampoComAjuda
                microcopy="Se essa despesa também é usada na sua vida pessoal, informe aqui só a parte que é do negócio. Deixe 100 se ela é toda da confeitaria."
                exemploDinamico={exemploRateio}
              />
            </div>
            );
          })}
        </div>
        <button onClick={adicionarDespesa} className="w-full py-2.5 rounded-xl border border-dashed border-[#E6E1DB] text-[12px] font-bold text-[#6E3F72] hover:bg-white transition-all">
          + Adicionar despesa
        </button>
        <button className={botaoPrimario + ' w-full'} style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)' }} onClick={salvarDespesasHandler} disabled={salvando}>
          <Save size={13} />{salvando ? 'Salvando' : 'Salvar despesas'}
        </button>
      </div>

      {/* Secao 3 — Metas da Empresa */}
      <div className={secaoCard}>
        <div className="flex items-center justify-between">
          <h3 className={secaoTitulo} style={{ color: '#241B2B' }}>Metas da Empresa</h3>
          {!editandoMetas && (
            <button onClick={() => setEditandoMetas(true)} className="w-7 h-7 rounded-full flex items-center justify-center text-[#6E3F72] hover:bg-white transition-colors" title="Editar">
              <Edit3 size={14} />
            </button>
          )}
        </div>

        {!editandoMetas ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl p-3 border border-[#E6E1DB] text-center">
              <p className="text-[9px] uppercase tracking-[0.05em]" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>CMV</p>
              <p className="text-[14px] font-bold mt-1" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>{cmvTargetPercent}%</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-[#E6E1DB] text-center">
              <p className="text-[9px] uppercase tracking-[0.05em]" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>Investimento</p>
              <p className="text-[14px] font-bold mt-1" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>{investmentTargetPercent}%</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-[#E6E1DB] text-center">
              <p className="text-[9px] uppercase tracking-[0.05em]" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>Lucro</p>
              <p className="text-[14px] font-bold mt-1" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>{profitTargetPercent}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>Meta de CMV (%)</label>
              <CampoComAjuda microcopy="Quanto do preço do bolo vai embora só com ingredientes e embalagem. Quanto menor, mais sobra pra você." exemploDinamico={exemploCmv} />
              <input type="number" className={inputClass} value={cmvTargetPercent} onChange={(e) => setCmvTargetPercent(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-[11px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>Meta de investimento (%)</label>
              <CampoComAjuda microcopy="Uma reserva pra comprar equipamento, fazer curso, crescer o negócio — sem tirar do seu bolso." exemploDinamico={exemploInvestimento} />
              <input type="number" className={inputClass} value={investmentTargetPercent} onChange={(e) => setInvestmentTargetPercent(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-[11px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>Meta de lucro (%)</label>
              <CampoComAjuda microcopy="O que sobra pra empresa, além do que você já recebe pelo seu trabalho." exemploDinamico={exemploLucro} />
              <input type="number" className={inputClass} value={profitTargetPercent} onChange={(e) => setProfitTargetPercent(Number(e.target.value))} />
            </div>
            <div className="flex gap-2">
              <button className={botaoSecundario} onClick={cancelarMetas} disabled={salvando}><X size={13} className="inline mr-1" />Cancelar</button>
              <button className={botaoPrimario} style={{ background: 'linear-gradient(150deg, #3A2350, #6E3F72 55%, #A85E86)' }} onClick={salvarMetas} disabled={salvando}>
                <Save size={13} />{salvando ? 'Salvando' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Secao 4 — Resumo / Distribuicao. SEMPRE visivel, nunca em accordion.
          Recalcula a cada tecla digitada nas secoes acima, salvo ou nao.
          Mesmo componente usado no Dashboard — ver [[ResumoDistribuicaoCard]]. */}
      <ResumoDistribuicaoCard estrutura={estrutura} />
    </div>
  );
};
