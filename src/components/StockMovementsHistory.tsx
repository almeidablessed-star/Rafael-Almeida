import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useEstoque } from '../context/EstoqueContext';
import { ArrowDown, ArrowUp, RotateCcw, TrendingUp, X, History } from 'lucide-react';
import type { MovimentoEstoque } from '../context/EstoqueContext';

/**
 * Historico de movimentacoes do estoque.
 *
 * Le da tabela `estoque_movimentos` pelo EstoqueContext. Antes lia
 * `carula_stock_movements` do localStorage — o historico do estoque SOMBRA — e
 * ficava logo abaixo dos cards da aba Estoque, que ja mostravam o estoque real
 * do Supabase. As duas metades da mesma tela falavam de estoques diferentes: os
 * cards diziam "1000 ml de leite" e aqui embaixo dizia "nenhum movimento
 * registrado", mesmo depois de uma compra.
 *
 * O resumo de saldos que existia aqui em cima foi removido: repetia, com
 * numeros de outra fonte, exatamente os cards que aparecem logo acima.
 *
 * A lista inline mostra so os ultimos INLINE_LIMIT movimentos: com o app usado
 * majoritariamente no celular, a lista inteira renderizada na pagina virava
 * scroll infinito conforme mais movimentos eram lancados. O historico completo
 * mora num modal fullscreen, superficie feita pra rolar bastante.
 */

const INLINE_LIMIT = 5;

const icone = (tipo: string) => {
  switch (tipo) {
    case 'consumo':
      return <ArrowDown size={16} className="text-[#DC2626]" />;
    case 'devolucao':
      return <RotateCcw size={16} className="text-[#16A34A]" />;
    case 'entrada':
      return <ArrowUp size={16} className="text-[#0EA5E9]" />;
    default:
      return <TrendingUp size={16} className="text-[#7A6E80]" />;
  }
};

const cor = (tipo: string) => {
  switch (tipo) {
    case 'consumo':
      return 'bg-red-50 border-red-200';
    case 'devolucao':
      return 'bg-green-50 border-green-200';
    case 'entrada':
      return 'bg-blue-50 border-blue-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const rotulo = (tipo: string) => {
  switch (tipo) {
    case 'consumo':
      return 'Consumo';
    case 'devolucao':
      return 'Devolução';
    case 'entrada':
      return 'Entrada';
    default:
      return 'Movimento';
  }
};

const formatarData = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });

// Numeros longos de conversao ("0.20000000000000004 kg") nao ajudam ninguem.
const formatarQuantidade = (valor: number) =>
  Number(valor.toFixed(3)).toLocaleString('pt-BR');

const MovementRow: React.FC<{ mov: MovimentoEstoque }> = ({ mov }) => (
  <div className={`p-3.5 ${cor(mov.tipo)}`}>
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-[#EDE6EF] flex items-center justify-center">
        {icone(mov.tipo)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-[#241B2B]">{mov.itemNome}</p>
            <p className="text-[10px] text-[#7A6E80] mt-1">{mov.descricao}</p>
          </div>
          <span className="text-[10px] font-bold text-[#7A6E80] whitespace-nowrap">
            {formatarData(mov.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-current border-opacity-10">
          <span className="inline-block px-2 py-1 bg-white bg-opacity-50 rounded text-[10px] font-bold text-[#241B2B]">
            {rotulo(mov.tipo)}
          </span>
          <span className="text-xs font-bold text-[#241B2B]">
            {mov.tipo === 'consumo' ? '−' : '+'}
            {formatarQuantidade(mov.quantidade)} {mov.unidade}
          </span>
        </div>
      </div>
    </div>
  </div>
);

const FullHistoryModal: React.FC<{ movimentos: MovimentoEstoque[]; onClose: () => void }> = ({
  movimentos,
  onClose,
}) => {
  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-white flex flex-col">
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-[#3A2350] to-[#5A3F7F]">
        <div className="flex items-center gap-2 min-w-0">
          <History size={18} className="text-white flex-shrink-0" />
          <p className="text-sm font-bold text-white truncate">
            Histórico Completo ({movimentos.length})
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[#EDE6EF]">
        {movimentos.map((mov) => (
          <MovementRow key={mov.id} mov={mov} />
        ))}
      </div>
    </div>,
    document.body
  );
};

export const StockMovementsHistory: React.FC = () => {
  const { movimentos } = useEstoque();
  const [modalAberto, setModalAberto] = useState(false);

  const visiveis = movimentos.slice(0, INLINE_LIMIT);

  if (visiveis.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#EDE6EF] p-8 text-center">
        <div className="text-[#7A6E80] text-sm">
          Nenhum movimento de estoque registrado ainda.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[#EDE6EF] overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-[#3A2350] to-[#5A3F7F] border-b border-[#5A3F7F]">
        <p className="text-xs font-bold text-white uppercase tracking-wide">
          Histórico de Movimentações
        </p>
      </div>

      <div className="divide-y divide-[#EDE6EF]">
        {visiveis.map((mov) => (
          <MovementRow key={mov.id} mov={mov} />
        ))}
      </div>

      {movimentos.length > INLINE_LIMIT && (
        <button
          onClick={() => setModalAberto(true)}
          className="w-full py-3 text-xs font-bold text-[#5A3F7F] hover:bg-[#F7F2FA] transition-colors border-t border-[#EDE6EF]"
        >
          Ver histórico completo ({movimentos.length})
        </button>
      )}

      {modalAberto && (
        <FullHistoryModal movimentos={movimentos} onClose={() => setModalAberto(false)} />
      )}
    </div>
  );
};
