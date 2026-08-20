import { useAuth } from '../context/AuthContext';
import { usePedidos } from './usePedidos';
import { useFichasTecnicas } from './useFichasTecnicas';
import { adjustStockFromFicha } from '../utils/stockAdjustment';
import { Transaction } from '../types';

/**
 * Hook que coordena a criação/deleção de pedidos com ajuste automático de estoque
 * Quando um pedido é criado, o estoque dos insumos é consumido automaticamente
 * Quando um pedido é deletado, o estoque é devolvido
 */
export const useOrderWithStockAdjustment = () => {
  const { user } = useAuth();
  const { pedidos, addPedido, updatePedido, deletePedido, isLoading, error, fetchPedidos } = usePedidos();
  const { fichas } = useFichasTecnicas();

  /**
   * Adiciona um pedido e ajusta o estoque com base na ficha técnica
   */
  const addPedidoWithStockAdjustment = async (
    pedidoData: Transaction,
    fichaTecnicaId?: string
  ) => {
    console.log('DEBUG: addPedidoWithStockAdjustment - ENTRY POINT', {
      fichaTecnicaId,
      userExists: !!user,
      userId: user?.id,
      pedidoDataId: pedidoData.id,
      pedidoDataType: pedidoData.type,
      fichasArrayLength: fichas.length,
    });

    if (!user) throw new Error('User not authenticated');

    // Adicionar pedido ao Supabase
    console.log('DEBUG: About to call addPedido from usePedidos hook', {
      pedidoDataKeys: Object.keys(pedidoData),
      pedidoData: JSON.stringify(pedidoData, null, 2),
    });

    let newPedido;
    try {
      newPedido = await addPedido(pedidoData);
      console.log('DEBUG: addPedido returned successfully', {
        pedidoId: newPedido.id,
        pedidoDescription: newPedido.description,
      });
    } catch (addPedidoError: any) {
      console.error('DEBUG: addPedido FAILED', {
        message: addPedidoError.message,
        stack: addPedidoError.stack,
      });
      throw addPedidoError;
    }

    // Se houver ID da ficha, ajustar estoque
    if (fichaTecnicaId) {
      console.log('DEBUG: fichaTecnicaId exists, attempting stock adjustment', {
        fichaTecnicaId,
        fichasInMemory: fichas.length,
      });

      try {
        const ficha = fichas.find(f => f.id === fichaTecnicaId);
        console.log('DEBUG: Searched for ficha in memory', {
          found: !!ficha,
          fichaId: fichaTecnicaId,
          fichaName: ficha?.name,
          ingredientCount: ficha?.ingredients?.length || 0,
        });

        if (ficha) {
          console.log('DEBUG: Calling adjustStockFromFicha with multiplier=1, quantity=1', {
            fichaName: ficha.name,
            fichaId: ficha.id,
            userId: user.id,
            ingredientsCount: ficha.ingredients?.length,
          });

          await adjustStockFromFicha(user.id, ficha, 1, 1);
          console.log(`✓ Estoque ajustado para pedido ${newPedido.id}`);
        } else {
          console.warn(`Ficha ${fichaTecnicaId} não encontrada nas fichas em memória`, {
            availableFichaIds: fichas.map(f => f.id),
            searchedId: fichaTecnicaId,
          });
        }
      } catch (err: any) {
        console.error('Erro ao ajustar estoque:', {
          message: err.message,
          stack: err.stack,
          name: err.name,
        });
      }
    } else {
      console.log('DEBUG: No fichaTecnicaId provided, skipping stock adjustment');
    }

    return newPedido;
  };

  /**
   * Deleta um pedido e reverte o ajuste de estoque
   */
  const deletePedidoWithStockAdjustment = async (
    pedidoId: string,
    fichaTecnicaId?: string
  ) => {
    if (!user) throw new Error('User not authenticated');

    // Se houver ID da ficha, devolver estoque
    if (fichaTecnicaId) {
      try {
        const ficha = fichas.find(f => f.id === fichaTecnicaId);
        if (ficha) {
          await adjustStockFromFicha(user.id, ficha, -1, 1);
          console.log(`✓ Estoque devolvido automaticamente para pedido ${pedidoId}`);
        }
      } catch (err: any) {
        console.error('Erro ao devolver estoque:', err.message);
        // Não falhar a deleção se o ajuste de estoque falhar
      }
    }

    // Deletar pedido
    await deletePedido(pedidoId);
  };

  return {
    pedidos,
    isLoading,
    error,
    addPedidoWithStockAdjustment,
    updatePedido,
    deletePedidoWithStockAdjustment,
    fetchPedidos,
  };
};
