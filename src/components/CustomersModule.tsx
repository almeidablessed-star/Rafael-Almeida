import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Customer, CustomerEvent } from '../types';
import { formatDateBr, formatDayMonthOnly } from '../utils/formatters';
import {
  Users,
  Plus,
  Search,
  Phone,
  Calendar,
  Heart,
  MapPin,
  Building,
  FileText,
  MessageCircle,
  Edit3,
  Trash2,
  Sparkles,
  Bell,
  Settings,
  CheckCircle2,
  X,
  Globe,
  PlusCircle,
  Camera,
  Gift,
  Cake,
  User,
  Image as ImageIcon,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const MENU_CANVA_URL =
  'https://www.canva.com/design/DAG--k_X91E/3m0qL5l-K1_O9n2KzR6oAQ/view?utm_content=DAG--k_X91E&utm_campaign=designshare&utm_medium=link2&utm_source=unspecified';

export interface UniversalHoliday {
  id: string;
  title: string;
  date2026: string; // YYYY-MM-DD
  country: 'BR' | 'EUA' | 'Universal';
  messageTemplate: string;
}

export const UNIVERSAL_HOLIDAYS: UniversalHoliday[] = [
  {
    id: 'h0',
    title: 'Ano Novo / Réveillon',
    date2026: '2026-01-01',
    country: 'Universal',
    messageTemplate:
      'Olá, {nome}! 🥂✨ Prepare-se para a virada de ano! Encomende o bolo da sua festa com a Carula Cake para começar o ano adoçado!',
  },
  {
    id: 'h1',
    title: "Valentine's Day (Dia dos Namorados EUA)",
    date2026: '2026-02-14',
    country: 'EUA',
    messageTemplate:
      "Olá, {nome}! 💖 O Valentine's Day está chegando! 🍫✨ Gostaria de encomendar um bolo especial ou doces artesanais da Carula Cake para comemorar?",
  },
  {
    id: 'h1b',
    title: 'Páscoa',
    date2026: '2026-04-05',
    country: 'Universal',
    messageTemplate:
      'Olá, {nome}! 🐰🍫 A Páscoa vem aí! Nossos ovos de colher, bolos de Páscoa e sobremesas especiais já estão com encomendas abertas na Carula Cake!',
  },
  {
    id: 'h2',
    title: 'Dia das Mães (BR/EUA)',
    date2026: '2026-05-10',
    country: 'Universal',
    messageTemplate:
      'Olá, {nome}! 🌸 O Dia das Mães está se aproximando! 💕 Surpreenda quem você ama com uma caixa de doces ou bolo especial da Carula Cake!',
  },
  {
    id: 'h3',
    title: 'Dia dos Namorados (Brasil)',
    date2026: '2026-06-12',
    country: 'BR',
    messageTemplate:
      'Olá, {nome}! ❤️ O Dia dos Namorados no Brasil está chegando! 🍰✨ Garanta sua caixa de doces ou bolo de festa com a Carula Cake!',
  },
  {
    id: 'h3b',
    title: 'Festa Junina / São João',
    date2026: '2026-06-24',
    country: 'BR',
    messageTemplate:
      'Olá, {nome}! 🌽🔥 A época de Festa Junina chegou! Bolos caseiros de milho, fubá cremoso e paçoca fresquinhos da Carula Cake para o seu arraial!',
  },
  {
    id: 'h4',
    title: "Father's Day (Dia dos Pais EUA)",
    date2026: '2026-06-21',
    country: 'EUA',
    messageTemplate:
      'Olá, {nome}! 👔 O Dia dos Pais (EUA) vem aí! ✨ Encomende um bolo delicioso da Carula Cake para presentear seu pai!',
  },
  {
    id: 'h5',
    title: 'Dia dos Avós (Brasil)',
    date2026: '2026-07-26',
    country: 'BR',
    messageTemplate:
      'Olá, {nome}! 👵👴 O Dia dos Avós está chegando! 💕 Demonstre todo seu amor com os doces e bolos especiais da Carula Cake!',
  },
  {
    id: 'h6',
    title: 'Dia dos Pais (Brasil)',
    date2026: '2026-08-09',
    country: 'BR',
    messageTemplate:
      'Olá, {nome}! 👔 O Dia dos Pais no Brasil está chegando! 🎉 Garanta a sobremesa perfeita com a Carula Cake para o almoço em família!',
  },
  {
    id: 'h6b',
    title: 'Dia das Crianças (Brasil)',
    date2026: '2026-10-12',
    country: 'BR',
    messageTemplate:
      'Olá, {nome}! 🎈🧸 O Dia das Crianças está se aproximando! Que tal encomendar um bolo divertido e colorido da Carula Cake para festejar?',
  },
  {
    id: 'h6c',
    title: 'Dia dos Professores',
    date2026: '2026-10-15',
    country: 'Universal',
    messageTemplate:
      'Olá, {nome}! 🍎📚 O Dia dos Professores vem aí! Mimos e caixas de doces especiais para presentear com carinho quem ensina nossos filhos!',
  },
  {
    id: 'h6d',
    title: 'Halloween',
    date2026: '2026-10-31',
    country: 'EUA',
    messageTemplate:
      'Olá, {nome}! 🎃👻 Halloween se aproximando! Encomende cupcakes temáticos e bolos assustadoramente deliciosos na Carula Cake!',
  },
  {
    id: 'h7',
    title: 'Thanksgiving (Ação de Graças EUA)',
    date2026: '2026-11-26',
    country: 'EUA',
    messageTemplate:
      'Olá, {nome}! 🍂 O Thanksgiving está se aproximando! 🥧✨ Deixe sua ceia ainda mais gostosa com os bolos e sobremesas da Carula Cake!',
  },
  {
    id: 'h8',
    title: 'Natal',
    date2026: '2026-12-25',
    country: 'Universal',
    messageTemplate:
      'Olá, {nome}! 🎄✨ O Natal vem aí! Nossas encomendas para a ceia já estão abertas. Reserve seu bolo especial da Carula Cake com antecedência!',
  },
];

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'Camila Santos',
    phone: '(781) 420-6892',
    eventDate: '2026-08-25',
    recurringEventTitle: 'Aniversário',
    additionalEvents: [
      { id: 'e1', title: 'Aniversário do Lucas (Filho 1)', date: '2026-10-15', type: 'personal' },
      { id: 'e2', title: 'Aniversário da Sophia (Filha 2)', date: '2026-11-04', type: 'personal' },
    ],
    address: '103 Cabot St',
    city: 'Beverly',
    notes: '',
    createdAt: Date.now() - 1000000,
  },
  {
    id: '2',
    name: 'Ana Paula Silva',
    phone: '(857) 310-9941',
    eventDate: '2026-09-12',
    recurringEventTitle: 'Mesversário do Gabriel',
    additionalEvents: [
      { id: 'e3', title: 'Aniversário de Casamento', date: '2026-11-20', type: 'personal' },
    ],
    address: '45 Broadway St',
    city: 'Somerville',
    notes: '',
    createdAt: Date.now() - 500000,
  },
];

export function getStoredCustomers(): Customer[] {
  try {
    const data = localStorage.getItem('carula_customers');
    if (data) {
      const parsed: Customer[] = JSON.parse(data);
      return parsed.map((c) => ({
        ...c,
        notes: '',
      }));
    }
  } catch (e) {
    console.error('Error loading customers from localStorage:', e);
  }
  return DEFAULT_CUSTOMERS;
}

export function saveStoredCustomers(customers: Customer[]) {
  try {
    localStorage.setItem('carula_customers', JSON.stringify(customers));
  } catch (e) {
    console.error('Error saving customers to localStorage:', e);
  }
}

export const CustomersModule: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(getStoredCustomers());
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [recurringEventTitle, setRecurringEventTitle] = useState('Aniversário');
  const [additionalEvents, setAdditionalEvents] = useState<CustomerEvent[]>([]);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Expanded customers state in the Dates view
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    saveStoredCustomers(customers);
  }, [customers]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setPhotoUrl('');
    setEventDate('');
    setRecurringEventTitle('Aniversário');
    setAdditionalEvents([]);
    setAddress('');
    setCity('');
    setNotes('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingId(c.id);
    setName(c.name);
    setPhone(c.phone);
    setPhotoUrl(c.photoUrl || '');
    setEventDate(c.eventDate || '');
    setRecurringEventTitle(c.recurringEventTitle || 'Aniversário');
    setAdditionalEvents(c.additionalEvents || []);
    setAddress(c.address || '');
    setCity(c.city || '');
    setNotes(c.notes || '');
    setIsFormOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddExtraEventField = () => {
    setAdditionalEvents((prev) => [
      ...prev,
      { id: Date.now().toString(), title: 'Aniversário do Filho(a)', date: '', type: 'personal' },
    ]);
  };

  const handleUpdateExtraEvent = (id: string, field: keyof CustomerEvent, value: string) => {
    setAdditionalEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleRemoveExtraEvent = (id: string) => {
    setAdditionalEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCustomer: Customer = {
      id: editingId || String(Date.now()),
      name: name.trim(),
      phone: phone.trim(),
      photoUrl: photoUrl || undefined,
      eventDate: eventDate || undefined,
      recurringEventTitle: recurringEventTitle.trim() || 'Aniversário',
      additionalEvents: additionalEvents.filter((ev) => ev.title && ev.date),
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: editingId ? undefined : Date.now(),
    };

    if (editingId) {
      setCustomers((prev) => prev.map((c) => (c.id === editingId ? newCustomer : c)));
    } else {
      setCustomers((prev) => [newCustomer, ...prev]);
    }

    setIsFormOpen(false);
    setEditingId(null);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta cliente?')) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Filter customers by search term
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Saved WhatsApp preference: 'business' | 'standard' | 'ask'
  const [waPreference, setWaPreference] = useState<'business' | 'standard' | 'ask'>(() => {
    return (localStorage.getItem('carula_wa_preference') as any) || 'business';
  });

  const [waModalData, setWaModalData] = useState<{
    customer: Customer;
    phone: string;
    message: string;
  } | null>(null);

  const [expandedDatesCustomerId, setExpandedDatesCustomerId] = useState<string | null>(null);

  // Execute WhatsApp send
  const executeSendWhatsApp = (phone: string, msg: string, targetType: 'business' | 'standard' | 'web') => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '1' + cleanPhone;
    } else if (cleanPhone.length === 11 && !cleanPhone.startsWith('1') && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }

    const encodedMsg = encodeURIComponent(msg);
    const isAndroid = /android/i.test(navigator.userAgent);

    if (targetType === 'business') {
      if (isAndroid) {
        window.location.href = `intent://send?phone=${cleanPhone}&text=${encodedMsg}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`;
      } else {
        window.location.href = `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`;
      }
    } else if (targetType === 'standard') {
      if (isAndroid) {
        window.location.href = `intent://send?phone=${cleanPhone}&text=${encodedMsg}#Intent;package=com.whatsapp;scheme=whatsapp;end`;
      } else {
        window.location.href = `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`;
      }
    } else {
      window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`, '_blank');
    }
  };

  // Handler triggered when clicking 'Avisar' or message button
  const handleSendReminder = (
    customer: Customer,
    eventTitleParam?: string,
    eventDateParam?: string,
    customMsgTemplate?: string,
    forceModal: boolean = false
  ) => {
    // Format date WITHOUT YEAR (only DD/MM) as requested by user!
    const dateFormatted = eventDateParam
      ? formatDayMonthOnly(eventDateParam)
      : customer.eventDate
      ? formatDayMonthOnly(customer.eventDate)
      : 'breve';

    const eventTitle = eventTitleParam || customer.recurringEventTitle || 'Aniversário';

    // Check if event is customer's OWN birthday
    const isCustomerOwnBirthday =
      eventTitle.toLowerCase().includes('aniversário da cliente') ||
      eventTitle.toLowerCase().includes('meu aniversário') ||
      (eventTitle.toLowerCase() === 'aniversário' && (!eventTitleParam || eventTitleParam === customer.recurringEventTitle));

    let bodyMsg = '';

    if (customMsgTemplate) {
      bodyMsg = customMsgTemplate
        .replace('{nome}', customer.name)
        .replace('{data_sem_ano}', dateFormatted);
    } else if (isCustomerOwnBirthday) {
      bodyMsg = `Olá, ${customer.name}! 🎉🎂 Parabéns pelo seu aniversário! Que o seu novo ano venha recheado de paz, saúde e muitas alegrias! 💖✨ Para comemorar essa data tão especial, que tal garantir um bolo bem delicioso e personalizado com a Carula Cake?`;
    } else {
      bodyMsg = `Olá, ${customer.name}! ✨ Tudo bem? Vi que a data especial (${eventTitle}) está se aproximando (${dateFormatted})! 🎂 Gostaria de garantir sua encomenda de bolo ou doces com a Carula Cake para comemorar essa data?`;
    }

    // Pure message strictly WITHOUT menu Canva link attached (as explicitly requested!)
    const fullMessage = bodyMsg;

    if (!forceModal && waPreference !== 'ask') {
      executeSendWhatsApp(customer.phone, fullMessage, waPreference);
    } else {
      setWaModalData({
        customer,
        phone: customer.phone,
        message: fullMessage,
      });
    }
  };

  // Group events by CUSTOMER so customer names don't repeat endlessly in 100 separate tabs
  const customerGroupedList = customers.map((c) => {
    const events: {
      title: string;
      date: string;
      dateShort: string;
      isHoliday: boolean;
      customTemplate?: string;
    }[] = [];

    // 1. Primary event (e.g. Birthday)
    if (c.eventDate) {
      events.push({
        title: c.recurringEventTitle || 'Aniversário',
        date: c.eventDate,
        dateShort: formatDayMonthOnly(c.eventDate),
        isHoliday: false,
      });
    }

    // 2. Kid's / Relative's Birthdays
    if (c.additionalEvents && c.additionalEvents.length > 0) {
      c.additionalEvents.forEach((ev) => {
        if (ev.date && ev.title) {
          events.push({
            title: ev.title,
            date: ev.date,
            dateShort: formatDayMonthOnly(ev.date),
            isHoliday: false,
          });
        }
      });
    }

    // 3. Featured universal holidays for fast access
    UNIVERSAL_HOLIDAYS.forEach((h) => {
      events.push({
        title: h.title,
        date: h.date2026,
        dateShort: formatDayMonthOnly(h.date2026),
        isHoliday: true,
        customTemplate: h.messageTemplate,
      });
    });

    // Sort customer events chronologically
    events.sort((a, b) => (a.date > b.date ? 1 : -1));

    return {
      customer: c,
      events,
    };
  });

  return (
    <div className="space-y-5 pb-12 animate-fadeIn">
      {/* Top Title Header - Roxo Gradiente */}
      <div
        className="text-white overflow-hidden"
        style={{
          background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
          borderRadius: '40px',
          padding: '20px',
          boxShadow: '0 30px 70px rgba(58,35,80,0.26)',
        }}
      >
        <div className="flex flex-col items-center text-center">
          {/* Title */}
          <span
            className="text-white font-serif-display"
            style={{
              fontSize: '28px',
              lineHeight: 1,
            }}
          >
            Clientes
          </span>
          {/* Subtitle */}
          <span
            style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.7)',
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 500,
              marginTop: '8px',
            }}
          >
            {customers.length} {customers.length === 1 ? 'cliente cadastrada' : 'clientes cadastradas'}
          </span>
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="bg-[var(--color-semantic-success)] text-[var(--color-neutral-charcoal)] p-3.5 rounded-lg shadow-sm text-xs font-bold flex items-center gap-2 border border-[var(--color-text-muted)] animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-[var(--color-neutral-charcoal)] shrink-0" />
          <span>Cliente salva com sucesso!</span>
        </div>
      )}

      {/* SEARCH BAR & ADD BUTTON */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '9px',
          paddingLeft: '18px',
          paddingRight: '18px',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search
            className="w-4 h-4 absolute top-1/2 -translate-y-1/2"
            style={{
              color: '#A096A6',
              left: '13px',
            }}
          />
          <input
            type="text"
            placeholder="Buscar cliente por nome, telefone ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 12px 11px 34px',
              background: '#FFFFFF',
              borderRadius: '14px',
              fontSize: '11px',
              color: '#A096A6',
              border: 'none',
              boxShadow: '0 6px 14px rgba(58,35,80,.07)',
              fontFamily: "'Manrope', sans-serif",
              outline: 'none',
            }}
            onFocus={(e) => e.currentTarget.style.boxShadow = '0 6px 14px rgba(58,35,80,.07)'}
            onBlur={(e) => e.currentTarget.style.boxShadow = '0 6px 14px rgba(58,35,80,.07)'}
          />
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            background: '#3A2350',
            color: '#F5B9C6',
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 800,
            fontSize: '11.5px',
            padding: '12px',
            borderRadius: '14px',
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 10px 20px rgba(58,35,80,.3)',
            transition: 'transform .22s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Cadastrar Nova Cliente</span>
        </button>
      </div>

      {/* CLIENT FORM MODAL */}
      {isFormOpen && (
        <form
          onSubmit={handleSave}
          className="bg-white p-5 rounded-xl border-2 border-[var(--color-accent-gold)] shadow-sm space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-neutral-hero)]">
            <h3 className="font-brand font-black text-base text-[var(--color-neutral-charcoal)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--color-accent-gold)]" />
              {editingId ? 'Editar Cadastro da Cliente' : 'Cadastrar Nova Cliente'}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-[var(--color-neutral-charcoal)]/60 hover:text-[var(--color-neutral-charcoal)] font-bold px-2 py-1"
            >
              Cancelar
            </button>
          </div>

          {/* CUSTOMER PHOTO UPLOAD */}
          <div className="flex items-center gap-4 bg-[var(--color-neutral-hero)] p-3 rounded-lg border border-[var(--color-accent-gold)]/40">
            <div className="w-16 h-16 rounded-full border-2 border-[var(--color-accent-gold)] bg-white text-[var(--color-neutral-charcoal)] flex items-center justify-center overflow-hidden shrink-0 shadow-card relative">
              {photoUrl ? (
                <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-[var(--color-accent-gold)]" />
              )}
            </div>
            <div>
              <label htmlFor="photo-upload" className="block text-xs font-black text-[var(--color-neutral-charcoal)] mb-1 flex items-center gap-1 cursor-pointer">
                <Camera className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" /> Foto da Cliente
              </label>
              <label
                htmlFor="photo-upload"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-neutral-charcoal)] text-[var(--color-accent-gold)] hover:bg-black rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-card"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{photoUrl ? 'Alterar Foto' : 'Escolher Foto'}</span>
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-black text-[var(--color-neutral-charcoal)] mb-1 flex items-center gap-1">
                👤 Nome da Cliente *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Camila Santos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-[var(--color-neutral-hero)]/50 border border-[var(--color-accent-gold)]/40 rounded-xl text-xs font-bold text-[var(--color-neutral-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[var(--color-neutral-charcoal)] mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" /> Telefone / WhatsApp *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: (781) 420-6892"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 bg-[var(--color-neutral-hero)]/50 border border-[var(--color-accent-gold)]/40 rounded-xl text-xs font-bold text-[var(--color-neutral-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-[var(--color-neutral-charcoal)] mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-neutral-charcoal)]" /> Data do Aniversário da Cliente
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-[var(--color-neutral-hero)]/50 border border-[var(--color-accent-gold)]/40 rounded-xl text-xs font-bold text-[var(--color-neutral-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
              />
            </div>
          </div>

          {/* ADDITIONAL COMMEMORATIVE DATES */}
          <div className="space-y-2 pt-2 border-t border-[var(--color-neutral-hero)]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[var(--color-neutral-charcoal)] flex items-center gap-1">
                <PlusCircle className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
                Datas Comemorativas
              </label>
              <button
                type="button"
                onClick={handleAddExtraEventField}
                className="px-2.5 py-1 bg-[var(--color-pastry-lavender)] hover:bg-[var(--color-pastry-lavender)]/80 text-[var(--color-neutral-charcoal)] rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Adicionar Data
              </button>
            </div>

            {additionalEvents.map((ev) => (
              <div key={ev.id} className="flex items-center gap-2 bg-[var(--color-neutral-hero)] p-2 rounded-xl border border-[var(--color-accent-gold)]/40">
                <input
                  type="text"
                  placeholder="Nome da data comemorativa"
                  value={ev.title}
                  onChange={(e) => handleUpdateExtraEvent(ev.id, 'title', e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-[var(--color-accent-gold)]/40 rounded-lg text-xs font-bold text-[var(--color-neutral-charcoal)]"
                />
                <input
                  type="date"
                  value={ev.date}
                  onChange={(e) => handleUpdateExtraEvent(ev.id, 'date', e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[var(--color-accent-gold)]/40 rounded-lg text-xs font-bold text-[var(--color-neutral-charcoal)]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveExtraEvent(ev.id)}
                  className="p-1 text-[var(--color-neutral-charcoal)]/40 hover:text-semantic-error cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-black text-[var(--color-neutral-charcoal)] mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" /> Endereço de Entrega
              </label>
              <input
                type="text"
                placeholder="Ex: 103 Cabot St"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 bg-[var(--color-neutral-hero)]/50 border border-[var(--color-accent-gold)]/40 rounded-xl text-xs font-bold text-[var(--color-neutral-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[var(--color-neutral-charcoal)] mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-[var(--color-neutral-charcoal)]" /> Cidade
              </label>
              <input
                type="text"
                placeholder="Ex: Beverly, Boston, Somerville..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2 bg-[var(--color-neutral-hero)]/50 border border-[var(--color-accent-gold)]/40 rounded-xl text-xs font-bold text-[var(--color-neutral-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-[var(--color-neutral-charcoal)] mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[var(--color-neutral-charcoal)]/60" /> Observações
            </label>
            <textarea
              rows={2}
              placeholder="Observações..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-[var(--color-neutral-hero)]/50 border border-[var(--color-accent-gold)]/40 rounded-xl text-xs font-medium text-[var(--color-neutral-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-neutral-hero)]">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl bg-[var(--color-neutral-hero)] text-[var(--color-neutral-charcoal)] font-bold text-xs hover:bg-[var(--color-accent-gold)]/20"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[var(--color-neutral-charcoal)] hover:bg-black text-[var(--color-accent-gold)] font-brand font-bold text-xs shadow-sm"
            >
              Salvar Cadastro
            </button>
          </div>
        </form>
      )}

      {/* CUSTOMERS LIST */}
      <div
        className="space-y-3"
        style={{
          paddingLeft: '18px',
          paddingRight: '18px',
        }}
      >
        {filteredCustomers.length === 0 ? (
          <div className="p-8 rounded-xl bg-white border border-dashed border-[var(--color-accent-gold)]/40 text-center space-y-2">
            <Users className="w-10 h-10 text-[var(--color-neutral-charcoal)]/30 mx-auto" />
            <p className="text-xs text-[var(--color-neutral-charcoal)]/60 font-medium">
              Nenhuma cliente encontrada.
            </p>
          </div>
        ) : (
          filteredCustomers.map((c) => {
            const cGroup = customerGroupedList.find((g) => g.customer.id === c.id);
            const cEvents = cGroup?.events || [];

            return (
              <div
                key={c.id}
                className="bg-white shadow-card transition-all overflow-hidden"
                style={{
                  borderRadius: '24px',
                }}
              >
                {/* GRADIENT HEADER */}
                <div
                  style={{
                    background: 'linear-gradient(140deg,#3A2350,#6E3F72 60%,#A85E86)',
                    padding: '14px 15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,.16)',
                      border: '1px solid rgba(255,255,255,.3)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: '21px',
                      flexShrink: 0,
                    }}
                  >
                    {c.photoUrl ? (
                      <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" style={{ borderRadius: '50%' }} />
                    ) : (
                      c.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Name and City */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Instrument Serif', serif",
                        fontSize: '21px',
                        color: '#FFFFFF',
                        lineHeight: 1.1,
                      }}
                    >
                      {c.name}
                    </span>
                    {c.city && (
                      <span
                        style={{
                          alignSelf: 'flex-start',
                          fontSize: '9.5px',
                          fontWeight: 800,
                          color: '#3A2350',
                          background: '#F0E2C8',
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontFamily: "'Manrope', sans-serif",
                        }}
                      >
                        📍 {c.city}
                      </span>
                    )}
                  </div>

                  {/* WhatsApp Icon */}
                  <button
                    onClick={() => handleSendReminder(c)}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '12px',
                      background: '#F5B9C6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      border: 'none',
                      boxShadow: '0 6px 14px rgba(0,0,0,.2)',
                      transition: 'transform .2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    title="Enviar mensagem no WhatsApp"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3A2350" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.2-5.5A8.4 8.4 0 1 1 21 11.5z"></path>
                    </svg>
                  </button>
                </div>

                {/* CARD CONTENT */}
                <div
                  style={{
                    padding: '14px 15px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '11px',
                  }}
                >
                  <div className="flex items-center gap-3 flex-wrap justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: '#241B2B',
                          background: '#F6F2F5',
                          padding: '4px 9px',
                          borderRadius: '999px',
                          fontFamily: "'Manrope', sans-serif",
                        }}
                      >
                        📞 {c.phone}
                      </span>
                      {c.address && (
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            color: '#5B4A6B',
                            background: '#F6F2F5',
                            padding: '4px 9px',
                            borderRadius: '999px',
                            fontFamily: "'Manrope', sans-serif",
                          }}
                          title={c.address}
                        >
                          🏠 {c.address}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        style={{
                          width: '28px',
                          height: '28px',
                          background: '#F6F2F5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background .2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#EFE6F0'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#F6F2F5'}
                        title="Editar Cliente"
                      >
                        <Edit3 className="w-3.5 h-3.5" style={{ stroke: '#7A6E80', strokeWidth: 2 }} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        style={{
                          width: '28px',
                          height: '28px',
                          background: '#F6F2F5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background .2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#FBE9EC'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#F6F2F5'}
                        title="Excluir Cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ stroke: '#C4626F', strokeWidth: 2 }} />
                      </button>
                    </div>
                  </div>

                  {c.notes && (
                    <p className="text-[11px] text-[var(--color-neutral-charcoal)]/70 italic bg-[var(--color-neutral-hero)] p-2 rounded-xl border border-[var(--color-accent-gold)]/30">
                      📝 "{c.notes}"
                    </p>
                  )}
                </div>

                {/* EXPANDABLE COMMEMORATIVE DATES SECTION */}
                <div
                  style={{
                    paddingTop: '8px',
                    paddingBottom: '14px',
                    paddingLeft: '15px',
                    paddingRight: '15px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedDatesCustomerId(expandedDatesCustomerId === c.id ? null : c.id)}
                    style={{
                      background: '#F6F2F5',
                      border: '1px solid rgba(36,27,43,.08)',
                      borderRadius: '16px 16px 0 0',
                      borderBottomWidth: '0px',
                      padding: '7px 13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'background .2s ease',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#EFE6F0'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#F6F2F5'}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        color: '#241B2B',
                        fontFamily: "'Manrope', sans-serif",
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>🗓️</span>
                      <span>Todas as Datas Comemorativas</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 600,
                          background: '#3A2350',
                          color: '#F5B9C6',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontFamily: "'Manrope', sans-serif",
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {cEvents.length} {cEvents.length === 1 ? 'data' : 'datas'}
                      </span>
                      {expandedDatesCustomerId === c.id ? (
                        <ChevronUp className="w-4 h-4" style={{ color: '#3A2350' }} />
                      ) : (
                        <ChevronDown className="w-4 h-4" style={{ color: '#3A2350' }} />
                      )}
                    </div>
                  </button>

                  {/* Collapsible content: only visible when opened */}
                  {expandedDatesCustomerId === c.id && (
                    <div
                      style={{
                        background: '#FAF7FA',
                        border: '1px solid rgba(36,27,43,.08)',
                        borderTop: 'none',
                        borderRadius: '0 0 16px 16px',
                        padding: '12px',
                        marginTop: '-11px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          letterSpacing: '.06em',
                          color: '#7A6E80',
                          textTransform: 'uppercase',
                          fontFamily: "'Manrope', sans-serif",
                        }}
                      >
                        🗓️ Datas e Lembretes de {c.name}:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cEvents.map((ev) => (
                          <div
                            key={`${ev.date}-${ev.title}`}
                            style={{
                              padding: '9px 11px',
                              borderRadius: '13px',
                              border: '1px solid rgba(36,27,43,.06)',
                              background: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '9px',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                                {ev.isHoliday ? <Gift className="w-3.5 h-3.5 text-[var(--color-neutral-charcoal)] shrink-0" /> : <Cake className="w-3.5 h-3.5 text-[var(--color-neutral-charcoal)] shrink-0" />}
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#241B2B',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontFamily: "'Manrope', sans-serif",
                                  }}
                                >
                                  {ev.title}
                                </span>
                              </div>
                              <p
                                style={{
                                  fontSize: '10px',
                                  color: '#7A6E80',
                                  fontFamily: "'Manrope', sans-serif",
                                }}
                              >
                                Data: <span style={{ color: '#241B2B', background: '#F0E2C8', padding: '1px 6px', borderRadius: '5px' }}>{ev.dateShort}</span>
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSendReminder(c, ev.title, ev.date, ev.customTemplate)}
                              className="px-2.5 py-1.5 rounded-xl bg-[var(--color-neutral-charcoal)] text-white hover:bg-black font-extrabold text-[10px] flex items-center gap-1 shrink-0 active:scale-95 transition-transform cursor-pointer"
                              title="Mandar mensagem no WhatsApp sem ano"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
                              <span>Avisar</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* WHATSAPP BUSINESS CONFIG AT THE BOTTOM OF THE TAB */}
      <div
        style={{
          marginLeft: '18px',
          marginRight: '18px',
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '22px',
            padding: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
            boxShadow: '0 8px 20px rgba(58,35,80,.09)',
          }}
        >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: 0,
          }}
        >
          <span
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </span>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontFamily: "'Instrument Serif',serif",
                fontSize: '17px',
                color: '#241B2B',
                lineHeight: 1.15,
              }}
            >
              Envio via WhatsApp
            </span>
            <span
              style={{
                fontSize: '10.5px',
                color: '#7A6E80',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Modo atual:{' '}
              <strong
                style={{
                  color: '#4C7358',
                  fontWeight: 600,
                }}
              >
                {waPreference === 'business' ? 'WhatsApp Business' : waPreference === 'standard' ? 'WhatsApp Comum' : 'Perguntar Sempre'}
              </strong>
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            if (customers.length > 0) {
              handleSendReminder(customers[0], undefined, undefined, undefined, true);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#4C7358',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 800,
            padding: '9px 13px',
            borderRadius: '14px',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 8px 16px rgba(76,115,88,.3)',
            transition: 'transform .22s ease',
            fontFamily: "'Manrope', sans-serif",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          title="Configurar aplicativo do WhatsApp"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.2-5.5A8.4 8.4 0 1 1 21 11.5z"></path>
          </svg>
          <span>Configurar WhatsApp</span>
        </button>
        </div>
      </div>

      {/* WHATSAPP SELECTOR & SEND MODAL */}
      {waModalData && createPortal(
        <div className="fixed inset-0 z-[99999] bg-[var(--color-ink)]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border-2 border-[var(--color-accent-gold)] overflow-hidden animate-fadeIn p-5 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-neutral-hero)] pb-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[var(--color-neutral-charcoal)]" />
                <h3 className="font-brand font-black text-base text-[var(--color-neutral-charcoal)]">
                  Enviar Mensagem WhatsApp
                </h3>
              </div>
              <button
                onClick={() => setWaModalData(null)}
                className="p-1 rounded-xl text-[var(--color-neutral-charcoal)]/40 hover:text-[var(--color-neutral-charcoal)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-[var(--color-neutral-charcoal)]/80 font-medium">
                Cliente: <strong className="text-[var(--color-neutral-charcoal)]">{waModalData.customer.name}</strong> ({waModalData.phone})
              </p>
              <div className="p-3 bg-[var(--color-neutral-hero)] rounded-lg border border-[var(--color-accent-gold)]/40 text-xs text-[var(--color-neutral-charcoal)] font-medium whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                "{waModalData.message}"
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[var(--color-neutral-charcoal)] block">
                Escolha o aplicativo do WhatsApp para abrir:
              </span>

              <button
                onClick={() => {
                  executeSendWhatsApp(waModalData.phone, waModalData.message, 'business');
                  setWaModalData(null);
                }}
                className="w-full py-3 px-4 rounded-lg bg-[var(--color-neutral-charcoal)] hover:bg-black text-[var(--color-accent-gold)] font-bold text-xs shadow-sm flex items-center justify-between transition-all active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <span className="bg-[var(--color-accent-gold)] text-[var(--color-neutral-charcoal)] p-1 rounded-lg font-black text-[10px]">
                    BUSINESS
                  </span>
                  <span>Abrir no WhatsApp Business</span>
                </div>
                <Sparkles className="w-4 h-4 text-[var(--color-accent-gold)]" />
              </button>

              <button
                onClick={() => {
                  executeSendWhatsApp(waModalData.phone, waModalData.message, 'standard');
                  setWaModalData(null);
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-[var(--color-neutral-hero)] hover:bg-[var(--color-accent-gold)]/30 text-[var(--color-neutral-charcoal)] font-bold text-xs flex items-center justify-between transition-all active:scale-95 border border-[var(--color-accent-gold)]/40"
              >
                <span>Abrir no WhatsApp Comum / Padrão</span>
                <MessageCircle className="w-4 h-4 text-[var(--color-neutral-charcoal)]/60" />
              </button>

              <button
                onClick={() => {
                  executeSendWhatsApp(waModalData.phone, waModalData.message, 'web');
                  setWaModalData(null);
                }}
                className="w-full py-2 px-4 rounded-lg text-[var(--color-neutral-charcoal)]/60 hover:text-[var(--color-neutral-charcoal)] font-semibold text-xs text-center"
              >
                Abrir pelo Navegador (wa.me)
              </button>
            </div>

            {/* Default preference setting checkbox */}
            <div className="pt-3 border-t border-[var(--color-neutral-hero)] flex items-center justify-between">
              <label className="flex items-center gap-2 text-[11px] text-[var(--color-neutral-charcoal)]/80 font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={waPreference === 'business'}
                  onChange={(e) => {
                    const pref = e.target.checked ? 'business' : 'ask';
                    setWaPreference(pref);
                    localStorage.setItem('carula_wa_preference', pref);
                  }}
                  className="rounded border-[var(--color-accent-gold)] text-[var(--color-neutral-charcoal)] focus:ring-[var(--color-neutral-charcoal)]"
                />
                <span>Sempre abrir direto no WhatsApp Business</span>
              </label>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
