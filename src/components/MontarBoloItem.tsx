import React from 'react';
import { AlertTriangle, Check, Pencil } from 'lucide-react';
import { FichaTecnica } from '../types';
import { CategoriaFicha, ConfigCategorias, VARIOS, rotuloDaEscolha } from '../utils/categoriasFichas';
import {
  ContaDaMontagem,
  MontagemState,
  fichasDaAba,
  nomeDoBoloMontado,
  passosDaMontagem,
  tamanhoDaFicha,
  tamanhosDaMontagem,
} from '../utils/boloMontado';

/**
 * O miolo do item "Montar bolo" no formulario de pedido: tamanho uma vez, uma
 * fileira de opcoes por aba marcada, a previa de como o item vai sair e a mao
 * de obra editavel. As contas vem prontas do formulario (calcularMontagem) —
 * aqui so se escolhe. Ver utils/boloMontado.ts.
 */
interface MontarBoloItemProps {
  /** Para o id do campo de mao de obra (pode haver mais de um bolo montado). */
  itemId: string;
  montagem: MontagemState;
  conta: ContaDaMontagem;
  fichas: FichaTecnica[];
  config: ConfigCategorias;
  quantidade: number;
  formatMoney: (n: number) => string;
  currencySymbol: string;
  onChange: (m: MontagemState) => void;
}

const ROTULO: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#7A6E80', display: 'block', marginBottom: '6px' };

const estiloChip = (ativo: boolean, apagado: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  minHeight: '36px',
  padding: '6px 12px',
  borderRadius: '9px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: apagado ? 'default' : 'pointer',
  border: ativo ? '1px solid #3A2350' : '1px solid rgba(58,35,80,0.16)',
  background: ativo ? '#3A2350' : '#fff',
  color: ativo ? '#fff' : '#3A2350',
  opacity: apagado ? 0.45 : 1,
  textAlign: 'left',
});

const textoDoNumero = (n: number) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');

export const MontarBoloItem: React.FC<MontarBoloItemProps> = ({
  itemId,
  montagem,
  conta,
  fichas,
  config,
  quantidade,
  formatMoney,
  currencySymbol,
  onChange,
}) => {
  const passos = passosDaMontagem(config, montagem);
  const tamanhos = tamanhosDaMontagem(fichas, passos);
  const maoEditada = (montagem.maoDeObra ?? '').trim() !== '';

  const alternar = (categoria: CategoriaFicha, fichaId: string) => {
    const atuais = montagem.escolhas[categoria] || [];
    const limite = config[categoria].montagem > 0 ? config[categoria].montagem : atuais.length;
    let novas: string[];
    if (atuais.includes(fichaId)) novas = atuais.filter((id) => id !== fichaId);
    // "Escolha 1" troca direto, como um botao de radio.
    else if (limite === 1) novas = [fichaId];
    else if (limite < VARIOS && atuais.length >= limite) return;
    else novas = [...atuais, fichaId];
    onChange({ ...montagem, escolhas: { ...montagem.escolhas, [categoria]: novas } });
  };

  if (passos.length === 0) {
    return (
      <p style={{ fontSize: '12px', color: '#7A6E80', margin: 0, lineHeight: 1.45 }}>
        Nenhuma aba está marcada para o Montar bolo. Em Fichas, toque em “Editar abas” e escolha quais abas entram.
      </p>
    );
  }

  const partesComNome = conta.partes.map((p) => p.nome);

  return (
    <>
      <div>
        <label style={ROTULO}>1 · Tamanho do bolo</label>
        {tamanhos.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#7A6E80', margin: 0 }}>As fichas dessas abas ainda não têm tamanhos cadastrados.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tamanhos.map((t) => {
              const ativo = t === montagem.tamanho;
              return (
                <button key={t} type="button" aria-pressed={ativo} onClick={() => onChange({ ...montagem, tamanho: t })} style={estiloChip(ativo, false)}>
                  {ativo && <Check style={{ width: 13, height: 13 }} strokeWidth={3} aria-hidden="true" />}
                  {t}
                </button>
              );
            })}
          </div>
        )}
        <p style={{ fontSize: '12px', color: '#7A6E80', marginTop: '5px', lineHeight: 1.4 }}>
          Escolhe uma vez só; todas as partes seguem esse tamanho.
        </p>
      </div>

      {passos.map((categoria, i) => {
        const aba = config[categoria];
        const escolhidas = montagem.escolhas[categoria] || [];
        const limite = aba.montagem > 0 ? aba.montagem : escolhidas.length;
        const cheio = limite > 1 && limite < VARIOS && escolhidas.length >= limite;
        const opcoes = fichasDaAba(fichas, categoria);
        return (
          <div key={categoria}>
            <label style={ROTULO}>
              {i + 2} · {aba.nome} <span style={{ fontWeight: 500 }}>({aba.montagem > 0 ? rotuloDaEscolha(aba.montagem) : 'aba fora do Montar bolo'})</span>
            </label>
            {opcoes.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#7A6E80', margin: 0 }}>Nenhuma ficha nesta aba ainda.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {opcoes.map((ficha) => {
                  const ativo = escolhidas.includes(ficha.id);
                  const tamanho = tamanhoDaFicha(ficha, montagem.tamanho);
                  const semTamanho = !tamanho;
                  const apagado = !ativo && (semTamanho || cheio);
                  return (
                    <button
                      key={ficha.id}
                      type="button"
                      aria-pressed={ativo}
                      disabled={apagado}
                      onClick={() => alternar(categoria, ficha.id)}
                      style={estiloChip(ativo, apagado)}
                    >
                      {ativo && <Check style={{ width: 13, height: 13 }} strokeWidth={3} aria-hidden="true" />}
                      {ficha.name}
                      <span style={{ fontWeight: 500, opacity: 0.75 }}>
                        {semTamanho ? `sem ${montagem.tamanho || 'tamanho'}` : formatMoney(tamanho.preco || 0)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {cheio && (
              <p style={{ fontSize: '12px', color: '#7A6E80', marginTop: '5px' }}>Já são {limite}. Desmarque um para trocar.</p>
            )}
          </div>
        );
      })}

      {conta.semOTamanho.length > 0 && (
        <p
          role="alert"
          className="flex items-start gap-1.5"
          style={{ fontSize: '12px', fontWeight: 600, color: '#B45309', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '8px 10px', margin: 0, lineHeight: 1.4 }}
        >
          <AlertTriangle aria-hidden="true" style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
          {conta.semOTamanho.join(', ')} não {conta.semOTamanho.length === 1 ? 'tem' : 'têm'} o tamanho {montagem.tamanho}. Troque o tamanho ou desmarque.
        </p>
      )}

      <div style={{ background: '#FAF7FA', border: '1px solid rgba(58,35,80,0.14)', borderRadius: '12px', padding: '11px 12px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '.12em', color: '#6E3F72' }}>VAI SAIR NO PEDIDO ASSIM</span>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#3A2350', marginTop: '4px' }}>{nomeDoBoloMontado(montagem.tamanho)}</div>
        {partesComNome.length > 0 ? (
          <div className="flex flex-wrap" style={{ gap: '4px', marginTop: '6px' }}>
            {partesComNome.map((nome, idx) => (
              <span key={`${nome}-${idx}`} style={{ fontSize: '11px', fontWeight: 700, color: '#6E3F72', background: '#F3E9F3', borderRadius: '999px', padding: '2px 9px' }}>
                {nome}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: '#7A6E80' }}>Escolha as partes do bolo</div>
        )}
      </div>

      <div>
        <label htmlFor={`montar-bolo-mao-de-obra-${itemId}`} style={{ ...ROTULO, marginBottom: '4px' }}>
          Mão de obra deste bolo <span style={{ fontWeight: 500 }}>{quantidade > 1 ? '(por unidade)' : ''}</span>
        </label>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(58,35,80,0.22)', borderRadius: '10px', padding: '0 10px', background: '#fff' }}
          className="focus-within:ring-2 focus-within:ring-[#3A2350]/25"
        >
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#3A2350' }}>{currencySymbol}</span>
          <input
            id={`montar-bolo-mao-de-obra-${itemId}`}
            type="text"
            inputMode="decimal"
            value={maoEditada ? montagem.maoDeObra : textoDoNumero(conta.maoDeObraDasPartes)}
            onChange={(e) => onChange({ ...montagem, maoDeObra: e.target.value.replace(/-/g, '') })}
            onBlur={(e) => {
              // Igual a soma (ou vazio) volta a ser automatica: se ela trocar
              // uma parte depois, a mao de obra acompanha.
              const v = e.target.value.trim();
              if (!v || v === textoDoNumero(conta.maoDeObraDasPartes)) onChange({ ...montagem, maoDeObra: '' });
            }}
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', padding: '11px 0', fontSize: '15px', fontWeight: 700, color: '#3A2350', background: 'transparent' }}
          />
          <Pencil aria-hidden="true" style={{ width: 15, height: 15, color: '#7A6E80', flexShrink: 0 }} />
        </div>
        <p style={{ fontSize: '12px', color: '#7A6E80', marginTop: '5px', lineHeight: 1.4 }}>
          {maoEditada ? (
            <>
              Soma das partes: {formatMoney(conta.maoDeObraDasPartes)}. O preço do bolo muda pela diferença.{' '}
              <button
                type="button"
                onClick={() => onChange({ ...montagem, maoDeObra: '' })}
                style={{ color: '#6E3F72', fontWeight: 700, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Voltar para a soma
              </button>
            </>
          ) : (
            'Soma do tempo de cada parte, como está nas fichas. Pode trocar: o preço do bolo muda pela diferença.'
          )}
        </p>
      </div>
    </>
  );
};
