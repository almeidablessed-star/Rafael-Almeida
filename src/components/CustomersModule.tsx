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
      {/* Top Title Header - Premium Style */}
      <div className="bg-gradient-to-br from-[#D4C5E2]/20 to-[#D4C5E2]/5 rounded-2xl p-5 border border-[#D4C5E2]/30 shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#D4C5E2] text-[#5A4B6B] rounded-full flex items-center justify-center shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-xl sm:text-2xl text-[#5A4B6B]">
              Clientes
            </h2>
            <p className="text-xs text-[#5A4B6B]/70 font-medium">
              {customers.length} {customers.length === 1 ? 'cliente cadastrada' : 'clientes cadastradas'}
            </p>
          </div>
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--color-neutral-charcoal)]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar cliente por nome, telefone ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[var(--color-accent-gold)]/50 rounded-lg text-xs font-bold text-[var(--color-neutral-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] shadow-xs"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-2.5 px-4 bg-[var(--color-neutral-charcoal)] hover:bg-black text-[var(--color-accent-gold)] font-bold text-xs rounded-lg shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
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
            <div className="w-16 h-16 rounded-full border-2 border-[var(--color-accent-gold)] bg-white text-[var(--color-neutral-charcoal)] flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-neutral-charcoal)] text-[var(--color-accent-gold)] hover:bg-black rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
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
      <div className="space-y-3">
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
                className="p-4 rounded-xl border border-[var(--color-accent-gold)]/40 bg-white shadow-xs hover:border-[var(--color-accent-gold)] transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Customer Photo Avatar */}
                      <div className="w-9 h-9 rounded-full border-2 border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)] text-[var(--color-neutral-charcoal)] flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                        {c.photoUrl ? (
                          <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-[var(--color-neutral-charcoal)]" />
                        )}
                      </div>

                      <span className="font-bold text-base text-[var(--color-neutral-charcoal)]">
                        {c.name}
                      </span>

                      {c.city && (
                        <span className="bg-[var(--color-pastry-lavender)] text-[var(--color-neutral-charcoal)] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          📍 {c.city}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--color-neutral-charcoal)]/80 flex-wrap">
                      <span className="font-bold flex items-center gap-1 text-[var(--color-neutral-charcoal)]">
                        📞 {c.phone}
                      </span>
                      {c.address && (
                        <span className="text-[var(--color-neutral-charcoal)]/60 truncate">
                          🏠 {c.address}
                        </span>
                      )}
                    </div>

                    {c.notes && (
                      <p className="text-[11px] text-[var(--color-neutral-charcoal)]/70 italic bg-[var(--color-neutral-hero)] p-2 rounded-xl border border-[var(--color-accent-gold)]/30">
                        📝 "{c.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleSendReminder(c)}
                      className="p-2 rounded-xl bg-[var(--color-neutral-charcoal)] text-[var(--color-accent-gold)] hover:bg-black font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      title="Mandar mensagem no WhatsApp sem ano e sem link"
                    >
                      <MessageCircle className="w-4 h-4 text-[var(--color-accent-gold)]" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-2 rounded-xl text-[var(--color-neutral-charcoal)]/60 hover:text-[var(--color-neutral-charcoal)] hover:bg-[var(--color-neutral-hero)] transition-colors cursor-pointer"
                      title="Editar Cliente"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-2 rounded-xl text-[var(--color-neutral-charcoal)]/40 hover:text-semantic-error hover:bg-semantic-error/10 transition-colors cursor-pointer"
                      title="Excluir Cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE COMMEMORATIVE DATES SECTION */}
                <div className="pt-2 border-t border-[var(--color-accent-gold)]/30 mt-1">
                  <button
                    type="button"
                    onClick={() => setExpandedDatesCustomerId(expandedDatesCustomerId === c.id ? null : c.id)}
                    className="w-full py-2 px-3 rounded-lg bg-[var(--color-neutral-hero)] hover:bg-[var(--color-accent-gold)]/30 text-[var(--color-neutral-charcoal)] text-xs font-bold flex items-center justify-between transition-all cursor-pointer border border-[var(--color-accent-gold)]/40 shadow-xs"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">🗓️</span>
                      <span>Todas as Datas Comemorativas</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black bg-[var(--color-neutral-charcoal)] text-[var(--color-accent-gold)] px-2.5 py-0.5 rounded-full">
                        {cEvents.length} {cEvents.length === 1 ? 'data' : 'datas'}
                      </span>
                      {expandedDatesCustomerId === c.id ? (
                        <ChevronUp className="w-4 h-4 text-[var(--color-neutral-charcoal)]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[var(--color-neutral-charcoal)]" />
                      )}
                    </div>
                  </button>

                  {/* Collapsible content: only visible when opened */}
                  {expandedDatesCustomerId === c.id && (
                    <div className="mt-2.5 space-y-2 p-3 bg-[var(--color-neutral-hero)]/60 rounded-lg border border-[var(--color-accent-gold)]/40 animate-fadeIn">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-neutral-charcoal)]/80">
                        🗓️ Datas e Lembretes de {c.name}:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cEvents.map((ev, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                              ev.isHoliday
                                ? 'bg-[var(--color-pastry-lavender)]/30 border-[var(--color-pastry-lavender)]'
                                : 'bg-white border-[var(--color-accent-gold)]/50 shadow-xs'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                {ev.isHoliday ? <Gift className="w-3.5 h-3.5 text-[var(--color-neutral-charcoal)] shrink-0" /> : <Cake className="w-3.5 h-3.5 text-[var(--color-neutral-charcoal)] shrink-0" />}
                                <span className="font-bold text-[var(--color-neutral-charcoal)] truncate">
                                  {ev.title}
                                </span>
                              </div>
                              <p className="text-[11px] font-black text-[var(--color-neutral-charcoal)] mt-0.5">
                                Data: <span className="bg-[var(--color-pastry-yellow)] px-1.5 py-0.2 rounded text-[var(--color-neutral-charcoal)]">{ev.dateShort}</span>
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
      <div className="pt-4 border-t border-[var(--color-accent-gold)]/40 flex items-center justify-between flex-wrap gap-3 bg-white p-4 rounded-xl border border-[var(--color-accent-gold)]/40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-semantic-success/20 text-semantic-success rounded-xl">
            <MessageCircle className="w-5 h-5 text-semantic-success" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[var(--color-neutral-charcoal)]">
              Envio via WhatsApp
            </h4>
            <p className="text-[11px] text-[var(--color-neutral-charcoal)]/70 font-medium">
              Modo atual: <strong className="text-semantic-success font-extrabold">{waPreference === 'business' ? 'WhatsApp Business' : waPreference === 'standard' ? 'WhatsApp Comum' : 'Perguntar Sempre'}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (customers.length > 0) {
              handleSendReminder(customers[0], undefined, undefined, undefined, true);
            }
          }}
          className="px-4 py-2 rounded-lg bg-semantic-success hover:bg-semantic-success/90 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
          title="Configurar aplicativo do WhatsApp"
        >
          <MessageCircle className="w-4 h-4 text-white" />
          <span>Configurar WhatsApp</span>
        </button>
      </div>

      {/* WHATSAPP SELECTOR & SEND MODAL */}
      {waModalData && createPortal(
        <div className="fixed inset-0 z-[99999] bg-[#0D0B08]/80 backdrop-blur-xs flex items-center justify-center p-4">
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
