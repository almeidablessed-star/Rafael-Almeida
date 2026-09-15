import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { EstruturaFinanceira } from '../utils/financialEngine';

const RESUMO_DISTRIBUICAO_REDESIGN_HABILITADO = true;

/**
 * Card de faturamento necessario + distribuicao percentual. Usado por
 * "Minha Empresa" (MinhaEmpresaCard) E pelo Dashboard — MESMO componente, nao
 * dois blocos de JSX parecidos, para garantir que os dois lugares mostrem
 * exatamente o mesmo numero, sempre (spec Parte 5, Teste 10: consistencia
 * entre telas). Quem muda a formula muda aqui uma vez so.
 *
 * Atras de flag (2026-09-14): redesign visual afeta as duas telas de uma vez
 * (componente compartilhado), maior risco que um redesign isolado — ver
 * `RESUMO_DISTRIBUICAO_REDESIGN_HABILITADO`.
 */
const LINHAS_COR = {
  'CMV / Reposição': '#A85E86',
  'Despesas da empresa': '#6E3F72',
  'Investimento': '#B08D57',
  'Mão de obra': '#7E4F9E',
  'Lucro da empresa': '#A9D8B8',
} as const;

export const ResumoDistribuicaoCard: React.FC<{ estrutura: EstruturaFinanceira }> = ({ estrutura }) => {
  const { formatCurrency } = useCurrency();

  const linhas = [
    ['CMV / Reposição', estrutura.cmvTargetPercent, estrutura.cmvAmount],
    ['Despesas da empresa', estrutura.custosPercent, estrutura.custosAmount],
    ['Investimento', estrutura.investmentTargetPercent, estrutura.investimentoAmount],
    ['Mão de obra', estrutura.maoDeObraPercent, estrutura.maoDeObraAmount],
    ['Lucro da empresa', estrutura.profitTargetPercent, estrutura.lucroAmount],
  ] as const;

  if (!RESUMO_DISTRIBUICAO_REDESIGN_HABILITADO) {
    return (
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)', boxShadow: '0 20px 45px rgba(58,35,80,.3)' }}
      >
        <h3 className="font-serif-display text-[18px] text-white">Resumo & Distribuição</h3>
        {!estrutura.valido ? (
          <p className="text-[12px] text-white/90" style={{ fontFamily: "'Manrope', sans-serif" }}>{estrutura.mensagemErro}</p>
        ) : (
          <>
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/70" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>Faturamento necessário</p>
              <p className="font-serif-display text-[26px] text-white">{formatCurrency(estrutura.faturamentoNecessario)}</p>
            </div>
            <div className="rounded-xl bg-white/95 overflow-hidden">
              {linhas.map(([nome, pct, valor], i) => (
                <div key={nome} className={`flex items-center justify-between px-3 py-2 ${i > 0 ? 'border-t border-[#E6E1DB]' : ''}`}>
                  <span className="text-[11px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>{nome}</span>
                  <span className="text-[11px]" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>{pct.toFixed(2)}%</span>
                  <span className="text-[11px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>{formatCurrency(valor)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: '20px',
        overflow: 'hidden',
        background: '#FFFFFF',
        border: '1px solid rgba(58,35,80,0.08)',
        boxShadow: '0 8px 20px rgba(58,35,80,.09)',
      }}
    >
      <div style={{ background: '#ECDFEE', padding: '20px 22px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
        <h3 className="font-serif-display" style={{ margin: 0, fontSize: '24px', lineHeight: 1.15, color: '#3A2350' }}>
          Resumo & Distribuição
        </h3>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A85E86', fontFamily: "'Manrope', sans-serif" }}>
          Mensal
        </span>
      </div>

      {!estrutura.valido ? (
        <p className="text-[12px] p-4" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>{estrutura.mensagemErro}</p>
      ) : (
        <>
          <div style={{ padding: '22px 22px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: '#FAF7FA', borderBottom: '1px solid rgba(58,35,80,0.08)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>
              Faturamento necessário
            </span>
            <span className="font-serif-display" style={{ fontSize: '44px', lineHeight: 1.05, color: '#3A2350' }}>
              {formatCurrency(estrutura.faturamentoNecessario)}
            </span>
          </div>

          <div style={{ padding: '8px 12px 14px', display: 'flex', flexDirection: 'column' }}>
            {linhas.map(([nome, pct, valor], i) => (
              <div
                key={nome}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,1fr) auto',
                  gap: '4px 12px',
                  padding: '12px 10px',
                  borderBottom: i < linhas.length - 1 ? '1px solid rgba(58,35,80,0.06)' : 'none',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>{nome}</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#3A2350', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: "'Manrope', sans-serif" }}>
                  {formatCurrency(valor)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: '#F1ECF2', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '999px', width: `${Math.min(Math.max(pct, 0), 100)}%`, background: LINHAS_COR[nome] }} />
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#7A6E80', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: "'Manrope', sans-serif" }}>
                  {pct.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
