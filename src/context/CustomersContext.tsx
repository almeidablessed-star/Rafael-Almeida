import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { gerarMiniatura } from '../utils/imageCompression';
import { useAuth } from './AuthContext';
import { Customer, CustomerEvent } from '../types';

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
  foto_mini?: string | null;
  city?: string;
  notes?: string;
  eventDate?: string;
  recurringEventTitle?: string;
  additionalEvents?: CustomerEvent[] | null;
  created_at: string;
}

interface CustomersContextType {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  fetchCustomers: () => Promise<void>;
  fetchCustomerPhoto: (customerId: string) => Promise<string | null>;
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
  fotoMini: data.foto_mini || undefined,
  eventDate: data.eventDate,
  recurringEventTitle: data.recurringEventTitle,
  additionalEvents: data.additionalEvents || undefined,
  address: data.endereco,
  city: data.city,
  notes: data.notes,
  createdAt: new Date(data.created_at).getTime(),
});

/**
 * Foto e miniatura andam juntas, e `undefined` quer dizer "a foto nao foi
 * carregada nesta tela": as duas colunas ficam de FORA do update e o banco
 * mantem o que tinha. Antes `undefined` virava NULL, entao salvar a edicao
 * antes de a foto terminar de carregar (~2 s) apagava a foto da cliente.
 * Mesmo cuidado de `fotoOuOmitida` em TransacoesContext.
 */
const fotoEMiniatura = async (photoUrl: string | undefined) => {
  if (photoUrl === undefined) return {};
  if (!photoUrl) return { photoUrl: null, foto_mini: null };
  return { photoUrl, foto_mini: await gerarMiniatura(photoUrl) };
};

const mapCustomerToSupabase = (customer: Omit<Customer, 'id' | 'createdAt'>) => ({
  nome: customer.name,
  telefone: customer.phone,
  eventDate: customer.eventDate || null,
  recurringEventTitle: customer.recurringEventTitle || null,
  additionalEvents: customer.additionalEvents || [],
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
        // Sem `photoUrl` (a foto inteira, pesada) mas COM `foto_mini`: a lista
        // mostra a miniatura. Ate 25/10/2026 a lista vinha sem foto nenhuma, e
        // a foto so aparecia depois de abrir "Editar" — e sumia ao reabrir.
        .select('id,usuaria_id,nome,telefone,endereco,city,notes,eventDate,recurringEventTitle,additionalEvents,created_at,foto_mini')
        .eq('usuaria_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCustomers(data?.map(mapSupabaseToCustomer) || []);
      void gerarMiniaturasQueFaltam();
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar clientes');
      console.error('Error fetching customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clientes cadastradas antes da miniatura existir: tem foto, mas `foto_mini`
   * vazia. Uma vez por sessao, busca a foto de cada uma (so dessas), gera a
   * miniatura e grava — depois disso a lista ja as mostra com foto. Uma por
   * vez, para nao baixar todas as fotos pesadas ao mesmo tempo no 4G.
   */
  const miniaturasEmAndamentoRef = useRef(false);
  const gerarMiniaturasQueFaltam = async () => {
    if (!user || miniaturasEmAndamentoRef.current) return;
    miniaturasEmAndamentoRef.current = true;
    try {
      const { data: pendentes, error: erroPendentes } = await supabase
        .from('clientes')
        .select('id')
        .eq('usuaria_id', user.id)
        .not('photoUrl', 'is', null)
        .is('foto_mini', null);
      if (erroPendentes || !pendentes) return;

      for (const { id } of pendentes) {
        const { data: linha } = await supabase
          .from('clientes')
          .select('photoUrl')
          .eq('id', id)
          .eq('usuaria_id', user.id)
          .single();
        if (!linha?.photoUrl) continue;
        const mini = await gerarMiniatura(linha.photoUrl);
        if (!mini) continue;
        const { error: erroGravar } = await supabase
          .from('clientes')
          .update({ foto_mini: mini })
          .eq('id', id)
          .eq('usuaria_id', user.id);
        if (erroGravar) continue;
        setCustomers((prev) => prev.map((c) => (c.id === String(id) ? { ...c, fotoMini: mini } : c)));
      }
    } catch (err) {
      console.error('Erro ao gerar miniaturas das clientes:', err);
    } finally {
      miniaturasEmAndamentoRef.current = false;
    }
  };

  const fetchCustomerPhoto = async (customerId: string): Promise<string | null> => {
    const existing = customers.find(c => c.id === customerId);
    if (existing?.photoUrl) return existing.photoUrl;

    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('photoUrl')
        .eq('id', parseInt(customerId))
        .eq('usuaria_id', user?.id)
        .single();

      if (error) throw error;
      return data?.photoUrl || null;
    } catch (err: any) {
      console.error('Error fetching customer photo:', err);
      return null;
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const { data, error: insertError } = await supabase
        .from('clientes')
        .insert([{ usuaria_id: user.id, ...mapCustomerToSupabase(customerData), ...(await fotoEMiniatura(customerData.photoUrl)) }])
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
        .update({ ...mapCustomerToSupabase(customerData), ...(await fotoEMiniatura(customerData.photoUrl)) })
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
      value={{ customers, isLoading, error, fetchCustomers, fetchCustomerPhoto, addCustomer, updateCustomer, deleteCustomer }}
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
