import React from 'react';
import { useCurrency } from '../context/CurrencyContext';

/**
 * Cartao de saldo de um cofrinho, em DINHEIRO.
 *
 * Nasceu inline no Dashboard e virou componente quando a aba Compras passou a
 * mostrar os mesmos cofrinhos: eram para ser cartoes irmaos, e duas copias do
 * mesmo bloco de estilo iriam divergir na primeira edicao de qualquer uma das
 * duas telas — foi exatamente o que aconteceu com os aneis que este cartao
 * substituiu. Quem muda a aparencia aqui muda nas duas telas de uma vez.
 *
 * Nao calcula nada: recebe os numeros ja prontos de `calculateWeeklyBalances`,
 * a mesma fonte nas duas telas.
 */
export const CardDeSaldo: React.FC<{
  nome: string;
  /** Quanto sobrou. Negativo aparece em vermelho. */
  saldo: number;
  /** Quanto entrou nesta parte no periodo, mostrado embaixo. */
  entrou: number;
  negativo: boolean;
  /**
   * Versao baixa, em linha (nome a esquerda, valor a direita), para a segunda
   * fila do Inicio — Investimento e Lucro, dois por linha.
   */
  compacto?: boolean;
  /** Fundo verde-claro do Lucro, para ele se distinguir dos outros. */
  destaque?: boolean;
}> = ({ nome, saldo, entrou, negativo, compacto = false, destaque = false }) => {
  const { formatCurrency: formatMoney } = useCurrency();

  if (compacto) {
    return (
      <div
        className="flex-1 min-w-0 rounded-[18px] text-center transition-all duration-300"
        style={{
          background: destaque && !negativo ? '#EEF7F0' : '#FFFFFF',
          boxShadow: '0 8px 20px rgba(58,35,80,0.08)',
          padding: '10px 12px',
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        {/* Tudo centralizado e empilhado: nome, valor logo abaixo e "de ...
            que entraram" embaixo (pedido do Rafael, 25/10/2026). Antes o nome
            ficava a esquerda e o valor a direita, na mesma linha. */}
        <div
          className="text-[9px] uppercase tracking-[0.05em]"
          style={{ color: destaque && !negativo ? '#3F6B4C' : '#7A6E80', fontWeight: 800 }}
        >
          {nome}
        </div>
        <div
          className="text-[15px] mt-0.5"
          style={{
            color: negativo ? '#C4626F' : destaque ? '#26402F' : '#241B2B',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {formatMoney(saldo || 0)}
        </div>
        <div className="text-[9.5px] mt-0.5" style={{ color: '#9A8FA0' }}>
          de {formatMoney(entrou || 0)} que entraram
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 bg-white rounded-[22px] p-4 text-center transition-all duration-300"
      style={{ boxShadow: '0 8px 20px rgba(58,35,80,0.08)' }}
    >
      <div
        className="text-[9px] uppercase tracking-[0.05em]"
        style={{
          color: '#7A6E80',
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 800,
          minHeight: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {nome}
      </div>
      {/* #C4626F e o vermelho que o app ja usa para "passou do limite". */}
      <div
        className="text-[19px] mt-1"
        style={{
          color: negativo ? '#C4626F' : '#241B2B',
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 800,
          letterSpacing: '-0.02em',
        }}
      >
        {formatMoney(saldo || 0)}
      </div>
      <div className="text-[9.5px] mt-1" style={{ color: '#9A8FA0', fontFamily: "'Manrope', sans-serif" }}>
        de {formatMoney(entrou || 0)} que entraram
      </div>
    </div>
  );
};
