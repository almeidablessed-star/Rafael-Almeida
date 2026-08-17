import React, { useMemo } from 'react';
import { getIngredientStocks, getStockMovements } from '../utils/stockManager';
import { ArrowDown, ArrowUp, RotateCcw, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface StockMovementsHistoryProps {
  maxItems?: number;
}

export const StockMovementsHistory: React.FC<StockMovementsHistoryProps> = ({ maxItems = 50 }) => {
  const stocks = useMemo(() => getIngredientStocks(), []);
  const movements = useMemo(() => getStockMovements(), []);

  // Sort movements by date descending (most recent first)
  const sortedMovements = useMemo(() => {
    return [...movements]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, maxItems);
  }, [movements, maxItems]);

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'consumption':
        return <ArrowDown size={16} className="text-[#DC2626]" />;
      case 'return':
        return <RotateCcw size={16} className="text-[#16A34A]" />;
      case 'restock':
        return <ArrowUp size={16} className="text-[#0EA5E9]" />;
      default:
        return <TrendingUp size={16} className="text-[#7A6E80]" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'consumption':
        return 'bg-red-50 border-red-200';
      case 'return':
        return 'bg-green-50 border-green-200';
      case 'restock':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'consumption':
        return 'Consumo';
      case 'return':
        return 'Devolução';
      case 'restock':
        return 'Reposição';
      default:
        return 'Movimento';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
  };

  if (stocks.length === 0 && movements.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#EDE6EF] p-8 text-center">
        <div className="text-[#7A6E80] text-sm">
          Nenhum movimento de estoque registrado ainda.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stocks Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {stocks.map((stock) => (
          <div
            key={stock.id}
            className={`p-3 rounded-lg border transition-colors ${
              stock.currentQuantity < 0
                ? 'bg-[#FEE2E2] border-[#FECACA]'
                : stock.currentQuantity === 0
                ? 'bg-[#FEF3C7] border-[#FDE68A]'
                : 'bg-[#F0FDF4] border-[#DCFCE7]'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-[#241B2B]">{stock.name}</p>
                <p className="text-[10px] text-[#7A6E80] mt-0.5">
                  {stock.unit} • Atualizado {formatDate(stock.lastUpdated)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-bold ${
                    stock.currentQuantity < 0
                      ? 'text-[#DC2626]'
                      : stock.currentQuantity === 0
                      ? 'text-[#D97706]'
                      : 'text-[#16A34A]'
                  }`}
                >
                  {stock.currentQuantity}
                </p>
                {stock.currentQuantity < 0 && (
                  <p className="text-[10px] text-[#DC2626] font-semibold">negativo</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Movements History */}
      {sortedMovements.length > 0 && (
        <div className="bg-white rounded-lg border border-[#EDE6EF] overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-[#3A2350] to-[#5A3F7F] border-b border-[#5A3F7F]">
            <p className="text-xs font-bold text-white uppercase tracking-wide">
              Histórico de Movimentações ({sortedMovements.length})
            </p>
          </div>

          <div className="divide-y divide-[#EDE6EF]">
            {sortedMovements.map((movement) => (
              <div key={movement.id} className={`p-3.5 ${getMovementColor(movement.type)}`}>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-[#EDE6EF] flex items-center justify-center">
                    {getMovementIcon(movement.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-[#241B2B]">
                          {movement.ingredientName}
                        </p>
                        <p className="text-[10px] text-[#7A6E80] mt-1">
                          {movement.description}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-[#7A6E80] whitespace-nowrap">
                        {formatDate(movement.date)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-current border-opacity-10">
                      <div className="flex items-center gap-1">
                        <span className="inline-block px-2 py-1 bg-white bg-opacity-50 rounded text-[10px] font-bold text-[#241B2B]">
                          {getMovementLabel(movement.type)}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#241B2B]">
                        {movement.type === 'consumption' || movement.type === 'restock'
                          ? movement.type === 'consumption'
                            ? `−${movement.quantity}`
                            : `+${movement.quantity}`
                          : `+${movement.quantity}`}{' '}
                        {movement.unit}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
