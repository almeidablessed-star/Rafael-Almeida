import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';

/** Espera a pessoa parar de digitar, para a tela nao pular a cada letra. */
const ESPERA_AO_DIGITAR_MS = 1000;

/**
 * Aviso no card do insumo da ficha quando o nome nao bate com nenhum produto.
 *
 * Fica montado mesmo sem nada para mostrar: assim ele percebe a digitacao desde
 * a primeira letra. Ao abrir uma ficha salva, o aviso ja aparece direto.
 */
export const AvisoInsumoSemCadastro: React.FC<{
  nome: string;
  ativo: boolean;
  /** Frase sobre o custo zerado. Sem ela, o insumo ainda tem um custo anterior. */
  avisoDeCusto?: string;
  onCadastrar: () => void;
}> = ({ nome, ativo, avisoDeCusto, onCadastrar }) => {
  const [parouDeDigitar, setParouDeDigitar] = useState(true);
  const nomeAnterior = useRef(nome);

  useEffect(() => {
    if (nomeAnterior.current === nome) return;
    nomeAnterior.current = nome;
    setParouDeDigitar(false);
    const espera = window.setTimeout(() => setParouDeDigitar(true), ESPERA_AO_DIGITAR_MS);
    return () => window.clearTimeout(espera);
  }, [nome]);

  if (!ativo || !parouDeDigitar || !nome.trim()) return null;

  return (
    <div style={{ padding: '0 14px 14px 16px' }} role="status">
      <div className="animate-slideUp" style={{ background: '#FCEFF2', border: '1px solid rgba(196,98,111,.28)', borderRadius: '16px', padding: '12px' }}>
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#C4626F', marginTop: '1px' }} strokeWidth={2.2} />
          <div className="min-w-0">
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#3A2350', lineHeight: 1.3, overflowWrap: 'anywhere' }}>
              "{nome.trim()}" ainda não está nos seus produtos
            </p>
            {avisoDeCusto && (
              <p style={{ margin: '3px 0 0', fontSize: '12px', fontWeight: 600, color: '#7A6E80', lineHeight: 1.4 }}>
                {avisoDeCusto}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onCadastrar}
          className="w-full flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-[0.98]"
          style={{ marginTop: '10px', minHeight: '44px', border: 'none', borderRadius: '12px', background: '#3A2350', color: '#FFFFFF', fontSize: '13px', fontWeight: 800, fontFamily: 'inherit', boxShadow: '0 8px 16px rgba(58,35,80,.22)' }}
        >
          <Plus className="w-4 h-4" strokeWidth={2.6} />
          Cadastrar este produto
        </button>
      </div>
    </div>
  );
};
