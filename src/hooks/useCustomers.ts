import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Customer } from '../types';

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

export const useCustomers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchCustomers();
  }, [user]);

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

      const mapped = data?.map(mapSupabaseToCustomer) || [];
      setCustomers(mapped);
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
      const supabaseData = mapCustomerToSupabase(customerData);

      const { data, error: insertError } = await supabase
        .from('clientes')
        .insert([
          {
            usuaria_id: user.id,
            ...supabaseData,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      const newCustomer = mapSupabaseToCustomer(data);
      setCustomers([newCustomer, ...customers]);
      return newCustomer;
    } catch (err: any) {
      const message = err.message || 'Erro ao adicionar cliente';
      setError(message);
      throw err;
    }
  };

  const updateCustomer = async (id: string, customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const supabaseData = mapCustomerToSupabase(customerData);

      const { data, error: updateError } = await supabase
        .from('clientes')
        .update(supabaseData)
        .eq('id', parseInt(id))
        .eq('usuaria_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updatedCustomer = mapSupabaseToCustomer(data);
      setCustomers(customers.map(c => c.id === id ? updatedCustomer : c));
      return updatedCustomer;
    } catch (err: any) {
      const message = err.message || 'Erro ao atualizar cliente';
      setError(message);
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

      setCustomers(customers.filter(c => c.id !== id));
    } catch (err: any) {
      const message = err.message || 'Erro ao deletar cliente';
      setError(message);
      throw err;
    }
  };

  return {
    customers,
    isLoading,
    error,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  };
};
