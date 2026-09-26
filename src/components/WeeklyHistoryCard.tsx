import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDateBr } from '../utils/formatters';
import { getWeeklySummariesByYearMonth, getHistoryYears, getHistoryMonthsByYear } from '../utils/weeklyArchiveUtils';
import { useCosts } from '../context/CostsContext';
import { rotulos } from '../utils/periodoReset';

interface WeeklyHistoryCardProps {
  transactions: Transaction[];
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const SimpleSelect: React.FC<{ value: number; onChange: (val: number) => void; options: { label: string; value: number }[]; disabled?: boolean }> = ({ value, onChange, options, disabled: disabledProp }) => {
  const disabled = disabledProp || options.length === 0;
  const label = options.find(o => o.value === value)?.label || 'Selecionar';

  if (options.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          padding: '10px 12px',
          borderRadius: '14px',
          background: '#FAF7FA',
          fontFamily: "'Manrope', sans-serif",
          fontSize: '11px',
          fontWeight: 600,
          color: '#A096A6',
          opacity: 0.5,
        }}
      >
        {label}
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      disabled={disabled}
      style={{
        flex: 1,
        padding: '10px 12px',
        borderRadius: '14px',
        background: '#FAF7FA',
        border: 'none',
        fontFamily: "'Manrope', sans-serif",
        fontSize: '11px',
        fontWeight: 600,
        color: '#241B2B',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3e%3cpath fill='%23241B2B' d='M2 4l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
        paddingRight: '24px',
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export const WeeklyHistoryCard: React.FC<WeeklyHistoryCardProps> = ({ transactions }) => {
  // O periodo escolhida pela usuaria e o que decide como as transacoes se
  // agrupam aqui. Trocar o periodo reagrupa o historico inteiro na hora, sem
  // migrar dado nenhum: este card sempre derivou tudo das transacoes.
  const { administrativeCosts } = useCosts();
  const periodoReset = administrativeCosts?.periodoReset ?? 'semanal';
  const vocab = rotulos(periodoReset);
  const years = useMemo(() => getHistoryYears(transactions, periodoReset), [transactions, periodoReset]);
  const currentYear = new Date().getFullYear();

  const [filterYear, setFilterYear] = useState(years.length > 0 ? years[0] : currentYear);
  const months = useMemo(() => getHistoryMonthsByYear(transactions, filterYear, periodoReset), [transactions, filterYear, periodoReset]);
  const [filterMonth, setFilterMonth] = useState(months.length > 0 ? months[0] : 1);

  // `transactions` chega assincronamente do Supabase — no primeiro render
  // (ou logo apos a usuaria lancar a primeira compra/venda) `years`/`months`
  // ainda pode estar vazio ou desatualizado em relacao ao `useState` inicial
  // acima, que so roda uma vez. Sem isto, o ano/mes selecionado ficava preso
  // no valor do primeiro render mesmo depois dos dados chegarem.
  React.useEffect(() => {
    if (years.length > 0 && !years.includes(filterYear)) {
      setFilterYear(years[0]);
    }
  }, [years, filterYear]);

  React.useEffect(() => {
    if (months.length > 0 && !months.includes(filterMonth)) {
      setFilterMonth(months[0]);
    }
  }, [months, filterMonth]);

  /**
   * No modo MENSAL o seletor de mes vira ruido: cada mes tem exatamente uma
   * janela, entao escolher "Setembro" daria uma lista de um item so. Nesse
   * modo o seletor some e a lista passa a ser a dos MESES do ano escolhido —
   * que e a granularidade que a pessoa realmente quer comparar ali.
   *
   * Nos outros dois periodos nada muda: ano -> mes -> janelas do mes.
   */
  const modoMensal = periodoReset === 'mensal';

  const filteredSummaries = useMemo(
    () =>
      modoMensal
        ? months.flatMap((m) => getWeeklySummariesByYearMonth(transactions, filterYear, m, periodoReset))
        : getWeeklySummariesByYearMonth(transactions, filterYear, filterMonth, periodoReset),
    [transactions, filterYear, filterMonth, periodoReset, modoMensal, months]
  );

  /**
   * Rotulo de cada linha do Historico.
   *
   * Quinzena usa a forma ordinal ("1ª Quinzena"), que e como se fala; semana
   * segue cardinal ("Semana 3"), que e como ja estava e como a confeiteira leu
   * o historico inteiro ate hoje. No mensal o proprio nome do mes e o rotulo —
   * repetir "Mês 1: 01/09 - 30/09" nao acrescenta nada.
   */
  const rotuloJanela = (summary: { weekNumber: number; month: number }) => {
    if (periodoReset === 'mensal') return monthNames[summary.month - 1];
    if (periodoReset === 'quinzenal') return `${summary.weekNumber}ª Quinzena`;
    return `Semana ${summary.weekNumber}`;
  };

  const hasData = filteredSummaries.length > 0;

  return (
    <div
      style={{
        marginLeft: '20px',
        marginRight: '20px',
        padding: '16px',
        borderRadius: '24px',
        background: '#FFFFFF',
        boxShadow: '0 8px 20px rgba(58,35,80,.09)',
        marginBottom: '20px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '12px' }}>
        <h3
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: '19px',
            color: '#241B2B',
            margin: 0,
            marginBottom: '4px',
          }}
        >
          📊 Histórico
        </h3>
        <p
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: '10px',
            color: '#7A6E80',
            margin: 0,
          }}
        >
          Visualize o desempenho {vocab.anteriores}
        </p>
      </div>

      {/* Filtros */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        <SimpleSelect
          value={filterYear}
          onChange={(newYear) => {
            setFilterYear(newYear);
            const newMonths = getHistoryMonthsByYear(transactions, newYear, periodoReset);
            setFilterMonth(newMonths.length > 0 ? newMonths[0] : 1);
          }}
          options={years.map((year) => ({
            value: year,
            label: `Ano: ${year}`,
          }))}
        />

        {/* Escondido no modo mensal: la a lista ja e a dos meses do ano. */}
        {!modoMensal && (
          <SimpleSelect
            value={filterMonth}
            onChange={setFilterMonth}
            options={months.map((month) => ({
              value: month,
              label: `Mês: ${monthNames[month - 1]}`,
            }))}
            disabled={months.length === 0}
          />
        )}
      </div>

      {/* Lista de semanas */}
      {hasData ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '9px',
          }}
        >
          {filteredSummaries.map((summary) => (
            <div
              key={summary.id}
              style={{
                padding: '12px',
                background: '#FAF7FA',
                borderRadius: '16px',
                transition: 'all 0.25s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#F3E9F3';
                (e.currentTarget as HTMLElement).style.transform = 'translateX(3px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#FAF7FA';
                (e.currentTarget as HTMLElement).style.transform = 'translateX(0)';
              }}
            >
              {/* Título da semana */}
              <div
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#241B2B',
                  marginBottom: '6px',
                }}
              >
                {rotuloJanela(summary)}: {formatDateBr(summary.startDate)} - {formatDateBr(summary.endDate)}
              </div>

              {/* Valores */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#6E3F72',
                  }}
                >
                  <span>Lucro Líquido:</span>
                  <span>{formatCurrency(summary.lucroLiquido)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#3D5245',
                  }}
                >
                  <span>Vendas Pagas:</span>
                  <span>{formatCurrency(summary.vendidas)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#7A6E80',
                  }}
                >
                  <span>Saídas:</span>
                  <span>{formatCurrency(summary.saldos)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#B08D57',
                  }}
                >
                  <span>A Receber:</span>
                  <span>{formatCurrency(summary.aReceber)}</span>
                </div>
              </div>

              {/* Contagem de transações */}
              <div
                style={{
                  marginTop: '6px',
                  paddingTop: '6px',
                  borderTop: '1px dashed rgba(36,27,43,.1)',
                  fontSize: '9px',
                  color: '#9A8FA0',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                {summary.transactionCount} transações
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: '#9A8FA0',
            fontFamily: "'Manrope', sans-serif",
            fontSize: '12px',
          }}
        >
          Nenhum histórico disponível para este período
        </div>
      )}
    </div>
  );
};
