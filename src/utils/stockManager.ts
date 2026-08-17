import { IngredientStock, StockMovement, ConsumedIngredient, FichaTecnica } from '../types';

const STOCK_KEY = 'carula_ingredient_stocks';
const STOCK_MOVEMENTS_KEY = 'carula_stock_movements';

// Get current ingredient stocks
export const getIngredientStocks = (): IngredientStock[] => {
  const stored = localStorage.getItem(STOCK_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Get stock movements history
export const getStockMovements = (): StockMovement[] => {
  const stored = localStorage.getItem(STOCK_MOVEMENTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Save stocks and movements
const saveStocks = (stocks: IngredientStock[]) => {
  localStorage.setItem(STOCK_KEY, JSON.stringify(stocks));
};

const saveMovements = (movements: StockMovement[]) => {
  localStorage.setItem(STOCK_MOVEMENTS_KEY, JSON.stringify(movements));
};

// Get or create ingredient stock
export const getOrCreateStock = (ingredientId: string, ingredientName: string, unit: string): IngredientStock => {
  const stocks = getIngredientStocks();
  let stock = stocks.find(s => s.id === ingredientId);

  if (!stock) {
    stock = {
      id: ingredientId,
      name: ingredientName,
      unit: unit as 'g' | 'kg' | 'ml' | 'L' | 'un' | 'pacote',
      currentQuantity: 0,
      lastUpdated: new Date().toISOString(),
    };
    stocks.push(stock);
    saveStocks(stocks);
  }

  return stock;
};

// Consume ingredients from a technical sheet when sale is created
export const consumeIngredientsFromFicha = (
  fichaId: string,
  ficha: FichaTecnica,
  transactionId: string,
  saleDate: string
): ConsumedIngredient[] => {
  const stocks = getIngredientStocks();
  const movements = getStockMovements();
  const consumed: ConsumedIngredient[] = [];

  // Process each ingredient in the technical sheet
  ficha.ingredients.forEach(ingredient => {
    // Ensure stock exists
    let stock = stocks.find(s => s.id === ingredient.id);
    if (!stock) {
      stock = {
        id: ingredient.id,
        name: ingredient.name,
        unit: ingredient.unit,
        currentQuantity: 0,
        lastUpdated: new Date().toISOString(),
      };
      stocks.push(stock);
    }

    // Consume the quantity
    stock.currentQuantity -= ingredient.quantity;
    stock.lastUpdated = new Date().toISOString();

    // Record the movement
    const movement: StockMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: saleDate,
      type: 'consumption',
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      relatedTransactionId: transactionId,
      relatedFichaId: fichaId,
      description: `Consumo: ${ficha.name} (Pedido #${transactionId.slice(-6)})`,
      createdAt: Date.now(),
    };
    movements.push(movement);

    // Add to consumed list
    consumed.push({
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
    });
  });

  // Save updated stocks and movements
  saveStocks(stocks);
  saveMovements(movements);

  return consumed;
};

// Return ingredients to stock when sale is cancelled
export const returnIngredientsToStock = (
  transactionId: string,
  consumedIngredients: ConsumedIngredient[],
  cancellationDate: string
): void => {
  const stocks = getIngredientStocks();
  const movements = getStockMovements();

  consumedIngredients.forEach(consumed => {
    // Find and update stock
    const stock = stocks.find(s => s.id === consumed.ingredientId);
    if (stock) {
      stock.currentQuantity += consumed.quantity;
      stock.lastUpdated = new Date().toISOString();

      // Record the return movement
      const movement: StockMovement = {
        id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: cancellationDate,
        type: 'return',
        ingredientId: consumed.ingredientId,
        ingredientName: consumed.ingredientName,
        quantity: consumed.quantity,
        unit: consumed.unit,
        relatedTransactionId: transactionId,
        description: `Devolução: ${consumed.ingredientName} (Pedido #${transactionId.slice(-6)} cancelado)`,
        createdAt: Date.now(),
      };
      movements.push(movement);
    }
  });

  // Save updated stocks and movements
  saveStocks(stocks);
  saveMovements(movements);
};

// Get current balance for an ingredient
export const getIngredientBalance = (ingredientId: string): number => {
  const stocks = getIngredientStocks();
  const stock = stocks.find(s => s.id === ingredientId);
  return stock?.currentQuantity ?? 0;
};

// Add stock manually (restock)
export const addStockManually = (
  ingredientId: string,
  ingredientName: string,
  unit: string,
  quantity: number,
  description: string,
  transactionId?: string
): void => {
  const stocks = getIngredientStocks();
  const movements = getStockMovements();

  // Get or create stock
  let stock = stocks.find(s => s.id === ingredientId);
  if (!stock) {
    stock = {
      id: ingredientId,
      name: ingredientName,
      unit: unit as 'g' | 'kg' | 'ml' | 'L' | 'un' | 'pacote',
      currentQuantity: 0,
      lastUpdated: new Date().toISOString(),
    };
    stocks.push(stock);
  }

  // Add quantity
  stock.currentQuantity += quantity;
  stock.lastUpdated = new Date().toISOString();

  // Record movement
  const movement: StockMovement = {
    id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString().split('T')[0],
    type: 'restock',
    ingredientId,
    ingredientName,
    quantity,
    unit,
    relatedTransactionId: transactionId,
    description,
    createdAt: Date.now(),
  };
  movements.push(movement);

  // Save
  saveStocks(stocks);
  saveMovements(movements);
};
