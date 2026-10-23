import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Campo de data com o calendario da Carula, no lugar do `<input type="date">`.
 *
 * O calendario nativo do navegador nao segue o layout do app (Chrome mostra o
 * azul dele, o iPhone mostra a roda). Este abre um cartao central com a tela
 * de dias e, tocando no "mes de ano" do topo, a tela de meses do modelo
 * "3a Seletor de mes" do design system (cabecalho em degrade, ano em faixa,
 * meses em grade de 4, selecionado roxo cheio, mes atual com borda rosa).
 *
 * O valor continua no formato do input nativo ("aaaa-mm-dd", "" = vazio), entao
 * quem usa so troca `onChange={(e) => x(e.target.value)}` por `onChange={x}`.
 *
 * Validacao: os formularios usam `noValidate` + `form.querySelector(':invalid')`
 * e mostram o erro pelo `id`. Por isso o `id` e o `required` vao num input
 * escondido que carrega o mesmo valor: vazio + required continua `:invalid`.
 */

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const COR = {
  roxo: '#3A2350',
  roxoMedio: '#6E3F72',
  rosa: '#C4626F',
  rosaClaro: '#F5B9C6',
  lavanda: '#F3E9F3',
  superficie: '#F6F2F5',
  tinta: '#241B2B',
  tintaSuave: '#7A6E80',
  borda: 'rgba(58, 35, 80, 0.08)',
};

const FONTE = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function lerData(valor: string): { ano: number; mes: number; dia: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor || '');
  if (!m) return null;
  return { ano: Number(m[1]), mes: Number(m[2]) - 1, dia: Number(m[3]) };
}

function montarData(ano: number, mes: number, dia: number) {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function hojeLocal() {
  const d = new Date();
  return { ano: d.getFullYear(), mes: d.getMonth(), dia: d.getDate() };
}

interface CampoDataProps {
  value: string;
  onChange: (valor: string) => void;
  id?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Esconde o icone de calendario (campo pequeno dentro de uma linha). */
  semIcone?: boolean;
  /** Texto quando nao ha data. */
  placeholder?: string;
}

const CampoData: React.FC<CampoDataProps> = ({
  value,
  onChange,
  id,
  required,
  className,
  style,
  semIcone,
  placeholder = 'dd/mm/aaaa',
}) => {
  const [aberto, setAberto] = useState(false);
  const data = lerData(value);
  const texto = data ? `${String(data.dia).padStart(2, '0')}/${String(data.mes + 1).padStart(2, '0')}/${data.ano}` : placeholder;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <input
        id={id}
        required={required}
        value={value}
        onChange={() => {}}
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none', width: '100%', height: '100%' }}
      />
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: 'inherit',
          ...style,
          ...(data ? null : { color: '#A096A6' }),
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{texto}</span>
        {!semIcone && <Calendar size={16} strokeWidth={2} style={{ flexShrink: 0, color: COR.roxoMedio }} />}
      </button>
      {aberto && (
        <Calendario
          valor={value}
          podeLimpar={!required}
          onEscolher={(v) => {
            onChange(v);
            setAberto(false);
          }}
          onFechar={() => setAberto(false)}
        />
      )}
    </div>
  );
};

interface CalendarioProps {
  valor: string;
  podeLimpar: boolean;
  onEscolher: (valor: string) => void;
  onFechar: () => void;
}

const Calendario: React.FC<CalendarioProps> = ({ valor, podeLimpar, onEscolher, onFechar }) => {
  const hoje = hojeLocal();
  const selecionada = lerData(valor);
  const [ano, setAno] = useState(selecionada?.ano ?? hoje.ano);
  const [mes, setMes] = useState(selecionada?.mes ?? hoje.mes);
  const [telaMeses, setTelaMeses] = useState(false);
  // Na tela de meses, o ano aberto (grade de meses) pode ser outro que o da tela de dias.
  const [anoAberto, setAnoAberto] = useState(ano);
  const anoAbertoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onFechar]);

  useLayoutEffect(() => {
    if (telaMeses) anoAbertoRef.current?.scrollIntoView({ block: 'start' });
  }, [telaMeses, anoAberto]);

  const mudarMes = (passo: number) => {
    const d = new Date(ano, mes + passo, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth());
  };

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const celulas: (number | null)[] = [
    ...Array.from({ length: primeiroDiaSemana }, () => null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  const anos: number[] = [];
  for (let a = Math.min(1940, ano); a <= Math.max(hoje.ano + 6, ano); a++) anos.push(a);

  const botaoSeta: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    border: 'none',
    background: 'rgba(255,255,255,0.14)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  };

  const rodapeBotao: React.CSSProperties = {
    height: '40px',
    padding: '0 16px',
    borderRadius: '12px',
    fontFamily: FONTE,
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  };

  return createPortal(
    <div
      onClick={onFechar}
      style={{
        position: 'fixed',
        inset: 0,
        // Acima dos modais do app (z-[99999]), que abrem este campo.
        zIndex: 100000,
        background: 'rgba(36, 27, 43, 0.38)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'carulaDataFundo 160ms ease-out',
      }}
    >
      <style>{`
        @keyframes carulaDataFundo { from { opacity: 0 } to { opacity: 1 } }
        @keyframes carulaDataCartao { from { opacity: 0; transform: translateY(8px) scale(0.97) } to { opacity: 1; transform: none } }
        .carula-data-celula:hover { background: ${COR.lavanda} !important; }
        .carula-data-ano:hover { background: ${COR.superficie} !important; }
        @media (prefers-reduced-motion: reduce) { .carula-data-cartao { animation: none !important } }
      `}</style>
      <div
        role="dialog"
        aria-label="Escolher data"
        className="carula-data-cartao"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '320px',
          background: '#FFFFFF',
          border: `1px solid ${COR.borda}`,
          borderRadius: '16px',
          boxShadow: '0 20px 36px rgba(58,35,80,0.18)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: FONTE,
          color: COR.tinta,
          animation: 'carulaDataCartao 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '12px 12px 12px 16px',
            background: `linear-gradient(115deg, ${COR.roxo} 0%, ${COR.roxoMedio} 70%, ${COR.rosa} 140%)`,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setAnoAberto(ano);
              setTelaMeses((t) => !t);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              background: 'transparent',
              padding: '6px 0',
              fontFamily: FONTE,
              fontSize: '15px',
              fontWeight: 700,
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <span>{MESES[mes]} de {ano}</span>
            <span
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.75)',
                display: 'inline-block',
                transform: telaMeses ? 'rotate(180deg)' : 'none',
                transition: 'transform 160ms ease',
              }}
            >
              ▼
            </span>
          </button>
          {!telaMeses && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" aria-label="Mês anterior" onClick={() => mudarMes(-1)} style={botaoSeta}>
                <ChevronLeft size={18} />
              </button>
              <button type="button" aria-label="Próximo mês" onClick={() => mudarMes(1)} style={botaoSeta}>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {telaMeses ? (
          <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px' }}>
            {anos.map((a) =>
              a === anoAberto ? (
                <div key={a} ref={anoAbertoRef}>
                  <div style={{ padding: '8px 10px', borderRadius: '8px', background: COR.superficie, fontSize: '14px', fontWeight: 700 }}>{a}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px', padding: '8px 2px 10px' }}>
                    {MESES_CURTOS.map((nome, i) => {
                      const ativo = a === ano && i === mes;
                      const atual = a === hoje.ano && i === hoje.mes;
                      return (
                        <button
                          key={nome}
                          type="button"
                          className={ativo ? undefined : 'carula-data-celula'}
                          onClick={() => {
                            setAno(a);
                            setMes(i);
                            setTelaMeses(false);
                          }}
                          style={{
                            height: '40px',
                            borderRadius: '10px',
                            border: !ativo && atual ? `1.5px solid ${COR.rosaClaro}` : 'none',
                            background: ativo ? COR.roxo : atual ? '#FFFFFF' : 'transparent',
                            fontFamily: FONTE,
                            fontSize: '14px',
                            fontWeight: ativo || atual ? 700 : 500,
                            color: ativo ? '#FFFFFF' : atual ? COR.roxo : COR.tinta,
                            boxShadow: ativo ? '0 8px 20px rgba(58,35,80,0.18)' : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {nome}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <button
                  key={a}
                  type="button"
                  className="carula-data-ano"
                  onClick={() => setAnoAberto(a)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    fontFamily: FONTE,
                    fontSize: '14px',
                    fontWeight: 600,
                    color: COR.tinta,
                    cursor: 'pointer',
                  }}
                >
                  {a}
                </button>
              )
            )}
          </div>
        ) : (
          <div style={{ padding: '10px 10px 4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '2px', marginBottom: '4px' }}>
              {DIAS_SEMANA.map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: COR.tintaSuave, padding: '4px 0' }}>
                  {d}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '2px' }}>
              {celulas.map((dia, i) => {
                if (dia === null) return <div key={`v${i}`} />;
                const ativo = !!selecionada && selecionada.ano === ano && selecionada.mes === mes && selecionada.dia === dia;
                const ehHoje = hoje.ano === ano && hoje.mes === mes && hoje.dia === dia;
                return (
                  <button
                    key={dia}
                    type="button"
                    className={ativo ? undefined : 'carula-data-celula'}
                    onClick={() => onEscolher(montarData(ano, mes, dia))}
                    style={{
                      height: '38px',
                      borderRadius: '10px',
                      border: !ativo && ehHoje ? `1.5px solid ${COR.rosaClaro}` : 'none',
                      background: ativo ? COR.roxo : 'transparent',
                      fontFamily: FONTE,
                      fontSize: '14px',
                      fontWeight: ativo || ehHoje ? 700 : 500,
                      color: ativo ? '#FFFFFF' : ehHoje ? COR.roxo : COR.tinta,
                      boxShadow: ativo ? '0 8px 20px rgba(58,35,80,0.18)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {dia}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: podeLimpar ? 'space-between' : 'flex-end',
            gap: '8px',
            padding: '10px 12px 12px',
            borderTop: telaMeses ? `1px solid ${COR.borda}` : 'none',
          }}
        >
          {podeLimpar && (
            <button
              type="button"
              onClick={() => onEscolher('')}
              style={{ ...rodapeBotao, border: `1px solid ${COR.borda}`, background: '#FFFFFF', color: COR.tintaSuave }}
            >
              Limpar
            </button>
          )}
          <button
            type="button"
            onClick={() => onEscolher(montarData(hoje.ano, hoje.mes, hoje.dia))}
            style={{ ...rodapeBotao, border: 'none', background: COR.lavanda, color: COR.roxo }}
          >
            Hoje
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CampoData;
