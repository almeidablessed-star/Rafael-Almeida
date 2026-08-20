import { supabase } from '../lib/supabase';
import { FichaTecnica, IngredientUsage } from '../types';

/**
 * Ajusta o estoque com base nos insumos de uma ficha técnica
 * @param userId - ID do usuário autenticado
 * @param ficha - Ficha técnica com ingredientes
 * @param multiplier - 1 para consumir estoque, -1 para devolver
 * @param quantity - Quantidade de produtos (padrão 1)
 */
export async function adjustStockFromFicha(
  userId: string,
  ficha: FichaTecnica,
  multiplier: 1 | -1,
  quantity: number = 1
): Promise<void> {
  console.log('DEBUG: adjustStockFromFicha - ENTRY POINT', {
    fichaName: ficha.name,
    fichaId: ficha.id,
    userId,
    multiplier,
    quantity,
    ingredientsCount: ficha.ingredients?.length || 0,
  });

  if (!ficha.ingredients || ficha.ingredients.length === 0) {
    console.log('DEBUG: No ingredients to adjust, returning early');
    return;
  }

  console.log('DEBUG: Starting to process ingredients', {
    ingredientsList: ficha.ingredients.map(i => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
    })),
  });

  const adjustments = ficha.ingredients.map(async (ingredient: IngredientUsage) => {
    console.log(`DEBUG: Processing ingredient "${ingredient.name}"`, {
      ingredientName: ingredient.name,
      ingredientQuantity: ingredient.quantity,
      ingredientUnit: ingredient.unit,
    });

    try {
      // Buscar o item de estoque pelo nome do insumo
      console.log(`DEBUG: Querying Supabase for ingredient "${ingredient.name}"`, {
        userId,
        searchTerm: `%${ingredient.name}%`,
      });

      const { data: estoqueItem, error: fetchError } = await supabase
        .from('estoque')
        .select('*')
        .eq('usuaria_id', userId)
        .ilike('item', `%${ingredient.name}%`)
        .single();

      console.log(`DEBUG: Supabase query result for "${ingredient.name}"`, {
        found: !!estoqueItem,
        errorMessage: fetchError?.message,
        itemId: estoqueItem?.id,
        itemName: estoqueItem?.item,
        currentQuantity: estoqueItem?.quantidade_atual,
      });

      if (fetchError || !estoqueItem) {
        console.warn(`Insumo "${ingredient.name}" não encontrado no Supabase:`, fetchError?.message);
        return;
      }

      // Calcular nova quantidade (pode ficar negativa)
      const totalAdjustment = (ingredient.quantity || 0) * quantity * multiplier;
      const novaQuantidade = estoqueItem.quantidade_atual + totalAdjustment;

      console.log(`DEBUG: Calculating new quantity for "${ingredient.name}"`, {
        currentQty: estoqueItem.quantidade_atual,
        ingredientQty: ingredient.quantity,
        multiplier,
        quantity,
        totalAdjustment,
        newQuantity: novaQuantidade,
      });

      // Atualizar estoque
      console.log(`DEBUG: About to update Supabase for "${ingredient.name}"`);
      const { error: updateError } = await supabase
        .from('estoque')
        .update({ quantidade_atual: novaQuantidade })
        .eq('id', estoqueItem.id)
        .eq('usuaria_id', userId);

      if (updateError) {
        console.error(`Erro ao atualizar "${ingredient.name}":`, {
          message: updateError.message,
          code: updateError.code,
        });
        return;
      }

      console.log(`✓ ${ingredient.name}: ${estoqueItem.quantidade_atual} → ${novaQuantidade}`);
    } catch (err: any) {
      console.error(`Erro com "${ingredient.name}":`, {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
    }
  });

  console.log('DEBUG: Waiting for all adjustments to complete', {
    adjustmentCount: adjustments.length,
  });

  await Promise.all(adjustments);
  console.log('DEBUG: All adjustments completed');
}

/**
 * Log de operação de estoque para auditoria
 */
export async function logStockOperation(
  userId: string,
  operation: 'consumo' | 'devolucao',
  pedidoId: string,
  fichaTecnicaId: string,
  details: string
): Promise<void> {
  try {
    await supabase
      .from('stock_logs')
      .insert([
        {
          usuaria_id: userId,
          operation,
          pedido_id: pedidoId,
          ficha_tecnica_id: fichaTecnicaId,
          details,
          created_at: new Date().toISOString(),
        },
      ]);
  } catch (err: any) {
    console.error('Erro ao registrar operação de estoque:', err.message);
  }
}
