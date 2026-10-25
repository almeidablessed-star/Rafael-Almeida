import type { Currency } from '../context/CurrencyContext';

/**
 * Exemplos (placeholder) dos campos de telefone e endereco, conforme a moeda
 * da usuaria. Antes eram sempre americanos — "(781) 420-6892", "103 Cabot St,
 * Beverly" — e quem usa R$ via um formato que nao e o dela.
 *
 * A moeda e o melhor sinal que o app tem do pais: nao ha campo de pais no
 * perfil. EUR cai no formato de Portugal, o mercado de lingua portuguesa que
 * usa euro.
 */
export interface ExemplosContato {
  telefone: string;
  rua: string;
  cidades: string;
}

const EXEMPLOS: Record<Currency, ExemplosContato> = {
  BRL: {
    telefone: '(11) 98765-4321',
    rua: 'Rua das Flores, 120',
    cidades: 'São Paulo, Campinas, Santos...',
  },
  USD: {
    telefone: '(781) 420-6892',
    rua: '103 Cabot St',
    cidades: 'Beverly, Boston, Somerville...',
  },
  EUR: {
    telefone: '912 345 678',
    rua: 'Rua Augusta, 120',
    cidades: 'Lisboa, Porto, Braga...',
  },
};

export const exemplosContato = (moeda: Currency): ExemplosContato => EXEMPLOS[moeda] ?? EXEMPLOS.BRL;
