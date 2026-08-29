export interface AdministrativeCosts {
  id?: string;
  agua: number;
  aluguel: number;
  energia: number;
  gas: number;
  gasolina: number;
  internet: number;
  limpeza: number;
  horaTrabalho: number;
  total: number; // Calculado automaticamente
}

export type TransactionType = 'venda' | 'reposicao' | 'maodeobra' | 'custo' | 'investimento';

export type PaymentMethod = 'zelle' | 'cash' | 'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | 'outro';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  photoUrl?: string;
  instagram?: string;
  laborPeriod?: LaborPeriod;
}

export type LaborPeriod = 'diaria' | 'semanal' | 'mensal' | 'anual' | 'encomenda';

export type CostCategory = 'fixo' | 'variavel' | 'investimento';

export type PaymentStatus = 'pago' | 'pendente';

export interface CustomerEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type?: 'personal' | 'holiday';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  photoUrl?: string; // Base64 or image URL of customer
  eventDate?: string; // YYYY-MM-DD
  recurringEventTitle?: string; // e.g. "Aniversário"
  additionalEvents?: CustomerEvent[];
  address?: string;
  city?: string;
  notes?: string;
  createdAt?: number;
}

export interface ConsumedIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
}

/**
 * Vinculo entre um item do pedido e a ficha tecnica que o produz.
 * Um pedido pode ter varios itens diferentes ("2x Bolo Franciele + 3x Bolo
 * Matilda"), entao o vinculo e uma LISTA — o campo legado `fichaId` sozinho
 * nao consegue representar isso.
 */
export interface FichaOrderItem {
  fichaId: string;
  fichaName: string;
  quantity: number; // quantas unidades DESTE item foram vendidas
  selectedTamanhoId?: string; // ID do TamanhoOpcao selecionado (para custos específicos do tamanho)
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  customerName?: string;
  customerPhone?: string;
  customerPhotoUrl?: string; // Base64 or image URL of customer for quote header
  eventDate?: string; // YYYY-MM-DD
  deliveryTime?: string; // e.g. "14:30"
  deliveryAddress?: string;
  observations?: string;
  inspirationImage?: string; // Photo URL / base64 of cake inspiration
  quantity: number;
  unitValue: number;
  totalValue: number;
  signalValue?: number; // Valor do sinal/entrada pago (opcional). Se não preenchido, = totalValue
  date: string; // YYYY-MM-DD
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  supplier?: string;
  laborPeriod?: LaborPeriod;
  category?: CostCategory;
  notes?: string;
  createdAt: number;
  fichaId?: string; // Legado: primeira ficha do pedido. Preferir `fichaItems`.
  fichaItems?: FichaOrderItem[]; // Todas as fichas do pedido, com a qtd de cada item
  consumedIngredients?: ConsumedIngredient[]; // Ingredients automatically consumed from this sale
}

export type TimePeriod = 'hoje' | 'semana' | 'mes' | 'ano' | 'tudo' | 'personalizado';

export type TabType = 'dashboard' | 'pedidos' | 'fichas' | 'clientes' | 'estoque' | 'compras' | 'semana' | 'vendas' | 'reposicao' | 'custos' | 'historico';

export interface BakeryPreset {
  id: string;
  name: string;
  type: TransactionType;
  defaultUnitValue: number;
  categoryTag?: string;
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit: 'g' | 'kg' | 'ml' | 'L' | 'un' | 'pacote';
  minThreshold: number;
  minThresholdUnit: 'g' | 'kg' | 'ml' | 'L' | 'un' | 'pacote';
  costPerUnit: number; // Cost per unit (e.g. per gram or per ml or per unit)
}

export interface IngredientUsage {
  id: string;
  name: string;
  quantity: number;
  unit: 'g' | 'kg' | 'ml' | 'L' | 'un' | 'pacote';
  unitCost: number;
  totalCost: number;
}

export interface IngredientStock {
  id: string;
  name: string;
  unit: 'g' | 'kg' | 'ml' | 'L' | 'un' | 'pacote';
  currentQuantity: number; // Can be negative
  lastUpdated: string; // ISO date
}

export type StockMovementType = 'consumption' | 'return' | 'restock';

export interface StockMovement {
  id: string;
  date: string; // ISO date
  type: StockMovementType;
  ingredientId: string;
  ingredientName: string;
  quantity: number; // Positive for consumption/return, negative for reversal
  unit: string;
  relatedTransactionId?: string; // Which sale/restock caused this
  relatedFichaId?: string; // Which technical sheet was used
  description: string;
  createdAt: number;
}

export interface TamanhoOpcao {
  id: string;
  descricao: string; // e.g. "10 fatias", "15 fatias", "20 fatias"
  preco: number;
  quantidade?: number; // e.g. número de fatias, unidades, etc
  maoDeObraCost?: number; // Custo de mão de obra específico deste tamanho
  custoCost?: number; // Custo operacional específico deste tamanho
  investimentoCost?: number; // Investimento específico deste tamanho
}

export interface FichaTecnica {
  id: string;
  name: string;
  category: 'bolos' | 'doces' | 'salgados' | 'saudaveis' | 'kids';
  imageUrl?: string;
  tamanhos: TamanhoOpcao[]; // Lista de tamanhos com preços
  ingredients: IngredientUsage[];
  reposicaoCost: number;
  maoDeObraCost: number;
  custoCost: number;
  investimentoCost: number;
  createdAt?: number;
}

export interface SummaryTotals {
  totalVendas: number;
  totalAReceber: number;
  totalReposicao: number;
  totalMaoDeObra: number;
  totalCustos: number;
  totalInvestimento: number;
  totalSaidas: number;
  lucroLiquido: number;
  isPositive: boolean;
  totalTransactionsCount: number;
}

export interface WeeklyArchive {
  id: string;
  year: number;
  month: number;
  weekNumber: number;
  startDate: string; // YYYY-MM-DD (segunda-feira)
  endDate: string; // YYYY-MM-DD (domingo)
  archivedAt: string; // ISO string
  lucroLiquido: number;
  vendidas: number;
  saldos: number;
  aReceber: number;
  transactionCount: number;
}
