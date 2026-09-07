import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { EstruturaFinanceira } from '../utils/financialEngine';

/**
 * Card de faturamento necessario + distribuicao percentual. Usado por
 * "Minha Empresa" (MinhaEmpresaCard) E pelo Dashboard — MESMO componente, nao
 * dois blocos de JSX parecidos, para garantir que os dois lugares mostrem
 * exatamente o mesmo numero, sempre (spec Parte 5, Teste 10: consistencia
 * entre telas). Quem muda a formula muda aqui uma vez so.
 */
export const ResumoDistribuicaoCard: React.FC<{ estrutura: EstruturaFinanceira }> = ({ estrutura }) => {
  const { formatCurrency } = useCurrency();

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
            {[
              ['CMV / Reposição', estrutura.cmvTargetPercent, estrutura.cmvAmount],
              ['Despesas da empresa', estrutura.custosPercent, estrutura.custosAmount],
              ['Investimento', estrutura.investmentTargetPercent, estrutura.investimentoAmount],
              ['Mão de obra', estrutura.maoDeObraPercent, estrutura.maoDeObraAmount],
              ['Lucro da empresa', estrutura.profitTargetPercent, estrutura.lucroAmount],
            ].map(([nome, pct, valor], i) => (
              <div key={nome as string} className={`flex items-center justify-between px-3 py-2 ${i > 0 ? 'border-t border-[#E6E1DB]' : ''}`}>
                <span className="text-[11px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>{nome}</span>
                <span className="text-[11px]" style={{ color: '#7A6E80', fontFamily: "'Manrope', sans-serif" }}>{(pct as number).toFixed(2)}%</span>
                <span className="text-[11px] font-bold" style={{ color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}>{formatCurrency(valor as number)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
