import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Customer } from '../types';

/**
 * Fonte unica das clientes, compartilhada por todas as telas.
 *
 * Antes isto era o hook `hooks/useCustomers.ts`, com estado LOCAL. Cada
 * componente que o chamava criava uma copia independente, e o useEffect de
 * busca dependia so de [user] — que e definido no login e nunca muda. Na
 * pratica cada tela buscava do banco uma unica vez, no carregamento da pagina,
 * e nunca mais.
 *
 * O sintoma: cadastrar uma cliente na aba Clientes atualizava a copia DAQUELA
 * tela; o formulario de pedido continuava com a lista congelada e a cliente
 * nova so aparecia depois de um F5. Como o TransactionFormModal fica montado o
 * tempo todo (o `if (!isOpen) return null` vem depois dos hooks), nem abrir e
 * fechar o modal ajudava.
 *
 * Com um provider unico, quem cadastra e quem consulta compartilham o mesmo
 * array: a cliente nova aparece na hora, em qualquer tela.
 *
 * As fichas tecnicas tinham a mesma estrutura vulneravel e foram convertidas
 * do mesmo jeito — ver [[FichasTecnicasContext]].
 */

/** Formato da tabela `clientes` no Supabase. */
interface SupabaseCustomer {
  id: number;
  usuaria_id: string;
  nome: string;
  telefone: string;
  endereco?: string;
  photoUrl?: string;
  city?: string;
  notes?: string;
  eventDate?: string;
  recurringEventTitle?: string;
  created_at: string;
}

interface CustomersContextType {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  fetchCustomers: () => Promise<void>;
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>;
  updateCustomer: (id: string, data: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

const mapSupabaseToCustomer = (data: SupabaseCustomer): Customer => ({
  id: String(data.id),
  name: data.nome,
  phone: data.telefone,
  photoUrl: data.photoUrl,
  eventDate: data.eventDate,
  recurringEventTitle: data.recurringEventTitle,
  address: data.endereco,
  city: data.city,
  notes: data.notes,
  createdAt: new Date(data.created_at).getTime(),
});

const mapCustomerToSupabase = (customer: Omit<Customer, 'id' | 'createdAt'>) => ({
  nome: customer.name,
  telefone: customer.phone,
  photoUrl: customer.photoUrl || null,
  eventDate: customer.eventDate || null,
  recurringEventTitle: customer.recurringEventTitle || null,
  endereco: customer.address || null,
  city: customer.city || null,
  notes: customer.notes || null,
});

export const CustomersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      // Logout limpa a lista: sem isto, as clientes da conta anterior
      // continuariam em memoria para quem entrasse depois.
      setCustomers([]);
      return;
    }
    fetchCustomers();
  }, [user]);

  const fetchCustomers = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('clientes')
        .select('*')
        .eq('usuaria_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCustomers(data?.map(mapSupabaseToCustomer) || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar clientes');
      console.error('Error fetching customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const { data, error: insertError } = await supabase
        .from('clientes')
        .insert([{ usuaria_id: user.id, ...mapCustomerToSupabase(customerData) }])
        .select()
        .single();

      if (insertError) throw insertError;

      const newCustomer = mapSupabaseToCustomer(data);
      // Atualizacao funcional: duas telas podem cadastrar em sequencia, e a
      // forma `[novo, ...customers]` usaria uma copia possivelmente velha.
      setCustomers((prev) => [newCustomer, ...prev]);
      return newCustomer;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar cliente');
      throw err;
    }
  };

  const updateCustomer = async (id: string, customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const { data, error: updateError } = await supabase
        .from('clientes')
        .update(mapCustomerToSupabase(customerData))
        .eq('id', parseInt(id))
        .eq('usuaria_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updated = mapSupabaseToCustomer(data);
      setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar cliente');
      throw err;
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('clientes')
        .delete()
        .eq('id', parseInt(id))
        .eq('usuaria_id', user.id);

      if (deleteError) throw deleteError;

      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar cliente');
      throw err;
    }
  };

  return (
    <CustomersContext.Provider
      value={{ customers, isLoading, error, fetchCustomers, addCustomer, updateCustomer, deleteCustomer }}
    >
      {children}
    </CustomersContext.Provider>
  );
};

export const useCustomers = () => {
  const context = useContext(CustomersContext);
  if (!context) {
    throw new Error('useCustomers precisa estar dentro de <CustomersProvider>');
  }
  return context;
};
