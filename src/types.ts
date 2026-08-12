export type TransactionType = 'venda' | 'reposicao' | 'maodeobra' | 'custo' | 'investimento';

export type PaymentMethod = 'zelle' | 'cash' | 'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | 'outro';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  photoUrl?: string;
  instagram?: string;
}

export type LaborPeriod = 'diaria' | 'semanal' | 'mensal' | 'encomenda';

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
  date: string; // YYYY-MM-DD
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  supplier?: string;
  laborPeriod?: LaborPeriod;
  category?: CostCategory;
  notes?: string;
  createdAt: number;
}

export type TimePeriod = 'hoje' | 'semana' | 'mes' | 'ano' | 'tudo' | 'personalizado';

export type TabType = 'dashboard' | 'pedidos' | 'fichas' | 'clientes' | 'estoque' | 'saldos' | 'semana' | 'catalogo' | 'vendas' | 'reposicao' | 'maodeobra' | 'custos' | 'historico';

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

export interface FichaTecnica {
  id: string;
  name: string;
  category: 'bolos' | 'doces' | 'salgados' | 'saudaveis' | 'kids';
  imageUrl?: string;
  yieldInfo: string; // e.g. "10 fatias" or "50 unidades"
  ingredients: IngredientUsage[];
  maoDeObraCost: number;
  custoCost: number;
  investimentoCost: number;
  sugestaoVenda: number;
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
