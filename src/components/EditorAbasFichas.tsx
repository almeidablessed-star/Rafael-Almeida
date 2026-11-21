import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { avisar } from './AvisoApp';
import { CustomSelect } from './CustomSelect';
import {
  CategoriaFicha,
  ConfigCategorias,
  EMOJIS_DAS_CATEGORIAS,
  ESCOLHAS_DE_MONTAGEM,
  NOME_MAXIMO,
  ORDEM_DAS_CATEGORIAS,
  VARIOS,
} from '../utils/categoriasFichas';

/**
 * "Editar abas" da tela de Fichas: o nome e o emoji de cada uma das 5 abas e
 * se ela entra no "Montar bolo" do pedido (e quantas dela a cliente escolhe).
 * As fichas nao mudam de lugar — so o que a aba mostra. Ver utils/categoriasFichas.ts.
 */
interface EditorAbasFichasProps {
  config: ConfigCategorias;
  contagem: Record<CategoriaFicha, number>;
  onSalvar: (config: ConfigCategorias) => Promise<boolean>;
  onFechar: () => void;
}

const ROTULO_DA_MONTAGEM: Record<number, string> = {
  0: 'Não entra',
  1: 'Escolhe 1',
  2: 'Até 2',
  3: 'Até 3',
  4: 'Até 4',
  [VARIOS]: 'Quantos quiser',
};

const OPCOES_MONTAGEM = ESCOLHAS_DE_MONTAGEM.map((n) => ({ value: String(n), label: ROTULO_DA_MONTAGEM[n] }));

export const EditorAbasFichas: React.FC<EditorAbasFichasProps> = ({ config, contagem, onSalvar, onFechar }) => {
  const [rascunho, setRascunho] = useState<ConfigCategorias>(config);
  const [escolhendoEmoji, setEscolhendoEmoji] = useState<CategoriaFicha | null>(null);
  const [salvando, setSalvando] = useState(false);

  const mudar = (chave: CategoriaFicha, campo: Partial<ConfigCategorias[CategoriaFicha]>) =>
    setRascunho((r) => ({ ...r, [chave]: { ...r[chave], ...campo } }));

  const salvar = async () => {
    setSalvando(true);
    const deu = await onSalvar(rascunho);
    setSalvando(false);
    if (deu) onFechar();
    else avisar('Não deu para salvar agora. Confira a internet e tente de novo.', { titulo: 'Abas não salvas' });
  };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 8px 20px rgba(58,35,80,0.09)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        maxWidth: '640px',
      }}
    >
      <div>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#3A2350' }}>Abas das fichas</span>
        <p style={{ fontSize: '12px', color: '#7A6E80', lineHeight: 1.45, margin: '4px 0 0' }}>
          Dê o nome que combina com o seu jeito de vender. As fichas continuam onde estão; só o nome da aba muda.
        </p>
      </div>

      <div
        style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#FAF7FA', border: '1px solid rgba(58,35,80,0.1)', borderRadius: '12px', padding: '10px 12px' }}
      >
        <Layers aria-hidden="true" style={{ width: 16, height: 16, color: '#6E3F72', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: '12px', color: '#7A6E80', lineHeight: 1.45, margin: 0 }}>
          <strong style={{ color: '#3A2350' }}>Montar bolo:</strong> vende o bolo montado pela cliente? Cadastre massas, recheios e
          extras em abas separadas e escolha quantos de cada a cliente pode pedir. No pedido aparece o botão “Montar bolo”.
        </p>
      </div>

      {ORDEM_DAS_CATEGORIAS.map((chave) => {
        const aba = rascunho[chave];
        return (
          <div key={chave} style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(58,35,80,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setEscolhendoEmoji(escolhendoEmoji === chave ? null : chave)}
                aria-label={`Trocar o emoji da aba ${aba.nome}`}
                aria-expanded={escolhendoEmoji === chave}
                style={{
                  width: '44px', height: '44px', flexShrink: 0, borderRadius: '10px', fontSize: '20px', cursor: 'pointer',
                  border: escolhendoEmoji === chave ? '1.5px solid #3A2350' : '1px solid rgba(58,35,80,0.14)', background: '#FAF7FA',
                }}
              >
                {aba.icone}
              </button>
              <input
                value={aba.nome}
                maxLength={NOME_MAXIMO}
                aria-label="Nome da aba"
                onChange={(e) => mudar(chave, { nome: e.target.value })}
                onBlur={(e) => { if (!e.target.value.trim()) mudar(chave, { nome: config[chave].nome }); }}
                style={{
                  flex: 1, minWidth: 0, height: '44px', border: '1px solid rgba(58,35,80,0.14)', borderRadius: '10px',
                  padding: '0 12px', fontSize: '15px', fontWeight: 600, color: '#3A2350', background: '#FAF7FA',
                }}
              />
              <span style={{ fontSize: '12px', color: '#A096A6', minWidth: '52px', textAlign: 'right' }}>
                {contagem[chave] === 1 ? '1 ficha' : `${contagem[chave]} fichas`}
              </span>
            </div>

            {escolhendoEmoji === chave && (
              <div role="group" aria-label="Emojis" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {EMOJIS_DAS_CATEGORIAS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => { mudar(chave, { icone: emoji }); setEscolhendoEmoji(null); }}
                    aria-pressed={aba.icone === emoji}
                    style={{
                      width: '40px', height: '40px', borderRadius: '10px', fontSize: '19px', cursor: 'pointer',
                      border: aba.icone === emoji ? '1.5px solid #3A2350' : '1px solid rgba(58,35,80,0.12)',
                      background: aba.icone === emoji ? '#F3E9F3' : '#fff',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#7A6E80', flexShrink: 0 }}>No Montar bolo</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <CustomSelect
                  value={String(aba.montagem)}
                  onChange={(v) => mudar(chave, { montagem: Number(v) })}
                  options={OPCOES_MONTAGEM}
                  ariaLabel={`Aba ${aba.nome} no Montar bolo`}
                />
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
        <button
          type="button"
          onClick={onFechar}
          disabled={salvando}
          style={{ flex: 1, minHeight: '48px', borderRadius: '12px', border: '1px solid rgba(58,35,80,0.14)', background: '#fff', color: '#3A2350', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          style={{ flex: 1, minHeight: '48px', borderRadius: '12px', border: 'none', background: '#3A2350', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: salvando ? 0.7 : 1 }}
        >
          {salvando ? 'Salvando…' : 'Salvar abas'}
        </button>
      </div>
    </div>
  );
};
