export interface CakeRecipeItem {
  cakeName: string;
  slices: number;
  venda: number;
  reposicao: number;
  maodeobra: number;
  custo: number;
  investimento: number;
  lucroLiquido: number;
}

export const BAKERY_CATALOG: CakeRecipeItem[] = [
  // 1. Bolo Franciele
  { cakeName: 'Bolo Franciele', slices: 10, venda: 45.00, reposicao: 15.00, maodeobra: 20.00, custo: 5.00, investimento: 5.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Franciele', slices: 15, venda: 100.00, reposicao: 38.00, maodeobra: 40.00, custo: 11.00, investimento: 11.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Franciele', slices: 20, venda: 135.00, reposicao: 56.00, maodeobra: 50.00, custo: 14.50, investimento: 14.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Franciele', slices: 25, venda: 180.00, reposicao: 80.00, maodeobra: 70.00, custo: 15.00, investimento: 15.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Franciele', slices: 30, venda: 250.00, reposicao: 125.00, maodeobra: 100.00, custo: 12.50, investimento: 12.50, lucroLiquido: 0 },

  // 2. Bolo Fernanda
  { cakeName: 'Bolo Fernanda', slices: 10, venda: 45.00, reposicao: 15.00, maodeobra: 20.00, custo: 5.00, investimento: 5.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Fernanda', slices: 15, venda: 100.00, reposicao: 38.00, maodeobra: 40.00, custo: 11.00, investimento: 11.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Fernanda', slices: 20, venda: 135.00, reposicao: 50.00, maodeobra: 50.00, custo: 17.50, investimento: 17.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Fernanda', slices: 25, venda: 180.00, reposicao: 80.00, maodeobra: 70.00, custo: 15.00, investimento: 15.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Fernanda', slices: 30, venda: 250.00, reposicao: 125.00, maodeobra: 100.00, custo: 12.50, investimento: 12.50, lucroLiquido: 0 },

  // 3. Bolo Kaenny
  { cakeName: 'Bolo Kaenny', slices: 10, venda: 50.00, reposicao: 18.00, maodeobra: 20.00, custo: 6.00, investimento: 6.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Kaenny', slices: 15, venda: 112.00, reposicao: 52.00, maodeobra: 40.00, custo: 10.00, investimento: 10.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Kaenny', slices: 20, venda: 147.00, reposicao: 79.00, maodeobra: 50.00, custo: 9.00, investimento: 9.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Kaenny', slices: 25, venda: 195.00, reposicao: 106.00, maodeobra: 70.00, custo: 9.50, investimento: 9.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Kaenny', slices: 30, venda: 280.00, reposicao: 150.00, maodeobra: 100.00, custo: 15.00, investimento: 15.00, lucroLiquido: 0 },

  // 4. Bolo Matilda
  { cakeName: 'Bolo Matilda', slices: 10, venda: 50.00, reposicao: 15.00, maodeobra: 20.00, custo: 7.50, investimento: 7.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Matilda', slices: 15, venda: 112.00, reposicao: 40.00, maodeobra: 40.00, custo: 16.00, investimento: 16.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Matilda', slices: 20, venda: 147.00, reposicao: 58.00, maodeobra: 50.00, custo: 19.50, investimento: 19.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Matilda', slices: 25, venda: 195.00, reposicao: 88.00, maodeobra: 70.00, custo: 18.50, investimento: 18.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Matilda', slices: 30, venda: 280.00, reposicao: 130.00, maodeobra: 100.00, custo: 25.00, investimento: 25.00, lucroLiquido: 0 },

  // 5. Bolo Klicya
  { cakeName: 'Bolo Klicya', slices: 10, venda: 55.00, reposicao: 24.00, maodeobra: 25.00, custo: 3.00, investimento: 3.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Klicya', slices: 15, venda: 125.00, reposicao: 60.00, maodeobra: 50.00, custo: 7.50, investimento: 7.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Klicya', slices: 20, venda: 160.00, reposicao: 93.00, maodeobra: 60.00, custo: 3.50, investimento: 3.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Klicya', slices: 25, venda: 210.00, reposicao: 125.00, maodeobra: 80.00, custo: 2.50, investimento: 2.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Klicya', slices: 30, venda: 310.00, reposicao: 200.00, maodeobra: 100.00, custo: 5.00, investimento: 5.00, lucroLiquido: 0 },

  // 6. Bolo Isabel
  { cakeName: 'Bolo Isabel', slices: 10, venda: 45.00, reposicao: 16.00, maodeobra: 20.00, custo: 4.50, investimento: 4.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Isabel', slices: 15, venda: 100.00, reposicao: 40.00, maodeobra: 40.00, custo: 10.00, investimento: 10.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Isabel', slices: 20, venda: 135.00, reposicao: 58.00, maodeobra: 50.00, custo: 13.50, investimento: 13.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Isabel', slices: 25, venda: 180.00, reposicao: 85.00, maodeobra: 70.00, custo: 12.50, investimento: 12.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Isabel', slices: 30, venda: 250.00, reposicao: 130.00, maodeobra: 100.00, custo: 10.00, investimento: 10.00, lucroLiquido: 0 },

  // 7. Bolo Any
  { cakeName: 'Bolo Any', slices: 10, venda: 45.00, reposicao: 16.00, maodeobra: 20.00, custo: 4.50, investimento: 4.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Any', slices: 15, venda: 100.00, reposicao: 38.00, maodeobra: 40.00, custo: 11.00, investimento: 11.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Any', slices: 20, venda: 135.00, reposicao: 57.00, maodeobra: 50.00, custo: 14.00, investimento: 14.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Any', slices: 25, venda: 180.00, reposicao: 84.00, maodeobra: 70.00, custo: 13.00, investimento: 13.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Any', slices: 30, venda: 250.00, reposicao: 129.00, maodeobra: 100.00, custo: 10.50, investimento: 10.50, lucroLiquido: 0 },

  // 8. Bolo Lauren
  { cakeName: 'Bolo Lauren', slices: 10, venda: 45.00, reposicao: 16.00, maodeobra: 20.00, custo: 4.50, investimento: 4.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Lauren', slices: 15, venda: 100.00, reposicao: 39.00, maodeobra: 40.00, custo: 7.50, investimento: 7.50, lucroLiquido: 6.00 },
  { cakeName: 'Bolo Lauren', slices: 20, venda: 135.00, reposicao: 56.00, maodeobra: 50.00, custo: 14.50, investimento: 14.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Lauren', slices: 25, venda: 180.00, reposicao: 82.00, maodeobra: 70.00, custo: 14.00, investimento: 14.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Lauren', slices: 30, venda: 250.00, reposicao: 136.00, maodeobra: 100.00, custo: 7.00, investimento: 7.00, lucroLiquido: 0 },

  // 9. Bolo Morgana
  { cakeName: 'Bolo Morgana', slices: 10, venda: 55.00, reposicao: 20.00, maodeobra: 20.00, custo: 7.50, investimento: 7.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Morgana', slices: 15, venda: 125.00, reposicao: 51.00, maodeobra: 40.00, custo: 17.00, investimento: 17.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Morgana', slices: 20, venda: 160.00, reposicao: 78.00, maodeobra: 50.00, custo: 16.00, investimento: 16.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Morgana', slices: 25, venda: 210.00, reposicao: 105.00, maodeobra: 70.00, custo: 17.50, investimento: 17.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Morgana', slices: 30, venda: 310.00, reposicao: 173.00, maodeobra: 100.00, custo: 18.50, investimento: 18.50, lucroLiquido: 0 },

  // 10. Bolo Amanda
  { cakeName: 'Bolo Amanda', slices: 10, venda: 50.00, reposicao: 20.00, maodeobra: 20.00, custo: 5.00, investimento: 5.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Amanda', slices: 15, venda: 112.00, reposicao: 46.00, maodeobra: 40.00, custo: 13.00, investimento: 13.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Amanda', slices: 20, venda: 147.00, reposicao: 72.00, maodeobra: 60.00, custo: 7.50, investimento: 7.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Amanda', slices: 25, venda: 195.00, reposicao: 100.00, maodeobra: 70.00, custo: 12.50, investimento: 12.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Amanda', slices: 30, venda: 280.00, reposicao: 147.00, maodeobra: 100.00, custo: 16.50, investimento: 16.50, lucroLiquido: 0 },

  // 11. Bolo Vanessa
  { cakeName: 'Bolo Vanessa', slices: 10, venda: 50.00, reposicao: 22.00, maodeobra: 20.00, custo: 4.00, investimento: 4.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Vanessa', slices: 15, venda: 112.00, reposicao: 46.00, maodeobra: 40.00, custo: 13.00, investimento: 13.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Vanessa', slices: 20, venda: 147.00, reposicao: 68.00, maodeobra: 60.00, custo: 9.50, investimento: 9.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Vanessa', slices: 25, venda: 195.00, reposicao: 94.00, maodeobra: 70.00, custo: 15.50, investimento: 15.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Vanessa', slices: 30, venda: 280.00, reposicao: 143.00, maodeobra: 100.00, custo: 18.50, investimento: 18.50, lucroLiquido: 0 },

  // 12. Bolo Adriana
  { cakeName: 'Bolo Adriana', slices: 10, venda: 55.00, reposicao: 18.00, maodeobra: 20.00, custo: 8.50, investimento: 8.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Adriana', slices: 15, venda: 125.00, reposicao: 45.00, maodeobra: 40.00, custo: 20.00, investimento: 20.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Adriana', slices: 20, venda: 160.00, reposicao: 67.00, maodeobra: 60.00, custo: 16.50, investimento: 16.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Adriana', slices: 25, venda: 210.00, reposicao: 98.00, maodeobra: 70.00, custo: 21.00, investimento: 21.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Adriana', slices: 30, venda: 310.00, reposicao: 148.00, maodeobra: 100.00, custo: 31.00, investimento: 31.00, lucroLiquido: 0 },

  // 13. Bolo Alexia
  { cakeName: 'Bolo Alexia', slices: 10, venda: 50.00, reposicao: 19.00, maodeobra: 20.00, custo: 5.50, investimento: 5.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Alexia', slices: 15, venda: 112.00, reposicao: 49.00, maodeobra: 40.00, custo: 11.50, investimento: 11.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Alexia', slices: 20, venda: 147.00, reposicao: 70.00, maodeobra: 60.00, custo: 8.50, investimento: 8.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Alexia', slices: 25, venda: 195.00, reposicao: 100.00, maodeobra: 70.00, custo: 12.50, investimento: 12.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Alexia', slices: 30, venda: 280.00, reposicao: 160.00, maodeobra: 100.00, custo: 10.00, investimento: 10.00, lucroLiquido: 0 },

  // 14. Bolo Letícia
  { cakeName: 'Bolo Letícia', slices: 10, venda: 45.00, reposicao: 12.00, maodeobra: 20.00, custo: 6.50, investimento: 6.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Letícia', slices: 15, venda: 100.00, reposicao: 39.00, maodeobra: 40.00, custo: 10.50, investimento: 10.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Letícia', slices: 20, venda: 135.00, reposicao: 57.00, maodeobra: 60.00, custo: 9.00, investimento: 9.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Letícia', slices: 25, venda: 180.00, reposicao: 85.00, maodeobra: 70.00, custo: 12.50, investimento: 12.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Letícia', slices: 30, venda: 250.00, reposicao: 125.00, maodeobra: 100.00, custo: 12.50, investimento: 12.50, lucroLiquido: 0 },

  // 15. Bolo Karina
  { cakeName: 'Bolo Karina', slices: 10, venda: 55.00, reposicao: 17.00, maodeobra: 20.00, custo: 9.00, investimento: 9.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Karina', slices: 15, venda: 125.00, reposicao: 44.00, maodeobra: 40.00, custo: 20.50, investimento: 20.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Karina', slices: 20, venda: 160.00, reposicao: 64.00, maodeobra: 60.00, custo: 18.00, investimento: 18.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Karina', slices: 25, venda: 210.00, reposicao: 109.00, maodeobra: 70.00, custo: 15.50, investimento: 15.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Karina', slices: 30, venda: 310.00, reposicao: 144.00, maodeobra: 100.00, custo: 33.00, investimento: 33.00, lucroLiquido: 0 },

  // 16. Bolo Maria
  { cakeName: 'Bolo Maria', slices: 10, venda: 50.00, reposicao: 12.00, maodeobra: 20.00, custo: 9.00, investimento: 9.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Maria', slices: 15, venda: 112.00, reposicao: 50.00, maodeobra: 40.00, custo: 11.00, investimento: 11.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Maria', slices: 20, venda: 147.00, reposicao: 74.00, maodeobra: 60.00, custo: 6.50, investimento: 6.50, lucroLiquido: 0 },
  { cakeName: 'Bolo Maria', slices: 25, venda: 195.00, reposicao: 103.00, maodeobra: 70.00, custo: 11.00, investimento: 11.00, lucroLiquido: 0 },
  { cakeName: 'Bolo Maria', slices: 30, venda: 280.00, reposicao: 170.00, maodeobra: 100.00, custo: 5.00, investimento: 5.00, lucroLiquido: 0 },

  // 17. Doces Adicionais
  { cakeName: 'Cupcake (6 un)', slices: 6, venda: 24.00, reposicao: 13.00, maodeobra: 10.00, custo: 0.00, investimento: 0.00, lucroLiquido: 1.00 },
  { cakeName: 'Brigadeiros (12 un)', slices: 12, venda: 22.00, reposicao: 9.00, maodeobra: 10.00, custo: 3.00, investimento: 3.00, lucroLiquido: 0 },
  { cakeName: 'Brigadeiros (24 un)', slices: 24, venda: 36.00, reposicao: 17.00, maodeobra: 18.00, custo: 1.00, investimento: 1.00, lucroLiquido: 0 },
  { cakeName: 'Brigadeiros (50 un)', slices: 50, venda: 71.00, reposicao: 36.50, maodeobra: 34.50, custo: 0.00, investimento: 0.00, lucroLiquido: 0 },
  { cakeName: 'Brigadeiros (100 un)', slices: 100, venda: 133.00, reposicao: 73.00, maodeobra: 60.00, custo: 0.00, investimento: 0.00, lucroLiquido: 0 },
];

export const UNIQUE_CAKE_NAMES = Array.from(new Set(BAKERY_CATALOG.map(c => c.cakeName)));

export const getCakeOptionsByName = (name: string): CakeRecipeItem[] => {
  return BAKERY_CATALOG.filter(c => c.cakeName.toLowerCase() === name.toLowerCase());
};

export const getExactCakeRecipe = (name: string, slices: number): CakeRecipeItem | undefined => {
  return BAKERY_CATALOG.find(c => c.cakeName.toLowerCase() === name.toLowerCase() && c.slices === slices);
};

// Calculate proportional breakdown for any custom gross value based on catalog averages or a specific recipe
export const calculateProportionalBreakdown = (grossTotal: number, selectedRecipe?: CakeRecipeItem) => {
  if (grossTotal <= 0) {
    return {
      faturamentoBruto: 0,
      reposicao: 0,
      maodeobra: 0,
      custos: 0,
      investimento: 0,
      lucroLiquido: 0,
      reposicaoPct: 30,
      maodeobraPct: 33.3,
      custosPct: 16.7,
      investimentoPct: 20,
    };
  }

  // If a specific recipe is selected, use its exact cost ratios
  if (selectedRecipe && selectedRecipe.venda > 0) {
    const ratio = grossTotal / selectedRecipe.venda;
    const reposicao = selectedRecipe.reposicao * ratio;
    const maodeobra = selectedRecipe.maodeobra * ratio;
    const custos = selectedRecipe.custo * ratio;
    const investimento = selectedRecipe.investimento * ratio;
    const totalDespesas = reposicao + maodeobra + custos + investimento;
    const lucroLiquido = Math.max(0, grossTotal - totalDespesas);

    return {
      faturamentoBruto: grossTotal,
      reposicao,
      maodeobra,
      custos,
      investimento,
      lucroLiquido,
      reposicaoPct: (reposicao / grossTotal) * 100,
      maodeobraPct: (maodeobra / grossTotal) * 100,
      custosPct: (custos / grossTotal) * 100,
      investimentoPct: (investimento / grossTotal) * 100,
    };
  }

  // Default general bakery catalog proportions (Average: 30% Insumos, 33.3% Mão de obra, 16.7% Custos, 20% Investimento)
  const reposicao = grossTotal * 0.30;
  const maodeobra = grossTotal * 0.3333;
  const custos = grossTotal * 0.1667;
  const investimento = grossTotal * 0.20;
  const totalDespesas = reposicao + maodeobra + custos + investimento;
  const lucroLiquido = Math.max(0, grossTotal - totalDespesas);

  return {
    faturamentoBruto: grossTotal,
    reposicao,
    maodeobra,
    custos,
    investimento,
    lucroLiquido,
    reposicaoPct: 30,
    maodeobraPct: 33.3,
    custosPct: 16.7,
    investimentoPct: 20,
  };
};
