import React, { useState } from 'react';
import { Transaction, Customer } from '../types';
import { formatCurrency, formatDateBr } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  PlusCircle,
  Clock,
  CheckCircle2,
  Edit3,
  Trash2,
  Cake,
  X,
  Users,
} from 'lucide-react';

interface OrdersCalendarProps {
  transactions: Transaction[];
  customers?: Customer[];
  onOpenAddModal?: () => void;
  onOpenAddModalWithDate?: (date: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
  onTogglePaymentStatus?: (tx: Transaction) => void;
  /**
   * Versao computador do Inicio (docs/design/desktop-redesign, Main.dc.html):
   * so muda a disposicao e as medidas. Clicar num dia abre os MESMOS modais do
   * celular ("Pedidos de dd/mm" e "Gostaria de lancar um pedido para...?").
   *
   * O desenho punha esse conteudo num painel abaixo do calendario, mas o
   * Rafael testou (26/10/2026) e o clique parecia nao fazer nada: num dia
   * livre so mudava a data dentro da frase, e em janela menor o painel ficava
   * fora da tela. Ele pediu a mesma reacao do celular.
   */
  computador?: boolean;
}

/** Legenda que tambem filtra (ver `filtro` abaixo). Igual no celular e no computador. */
const ITENS_LEGENDA = [
  { id: 'hoje', rotulo: 'Hoje', amostra: { background: 'var(--color-surface)', border: '1.5px solid var(--color-brand-700)' } },
  { id: 'com-pedido', rotulo: 'Com Pedido', amostra: { background: 'linear-gradient(150deg, #8F5A9C, #C4626F)' } },
  { id: 'livre', rotulo: 'Livre', amostra: { background: '#B4E7B4' } },
] as const;

export const OrdersCalendar: React.FC<OrdersCalendarProps> = ({
  transactions,
  customers = [],
  onOpenAddModal,
  onOpenAddModalWithDate,
  onEditTransaction,
  onDeleteTransaction,
  onTogglePaymentStatus,
  computador = false,
}) => {
  const { formatCurrency: formatMoney } = useCurrency();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [detailsDayStr, setDetailsDayStr] = useState<string | null>(null);
  const [confirmEmptyDayStr, setConfirmEmptyDayStr] = useState<string | null>(null);

  /**
   * Filtro da legenda. `null` = sem filtro, que e o estado normal.
   *
   * Um de cada vez: clicar num item liga aquele e desliga qualquer outro,
   * clicar no mesmo desliga. Os dias que nao combinam NAO somem da grade —
   * ficam apagados no lugar. Tira-los faria os dias seguintes andarem de
   * coluna e o dia 15 cair numa quarta que nao e a dele.
   */
  type FiltroAgenda = 'hoje' | 'com-pedido' | 'livre';
  const [filtro, setFiltro] = useState<FiltroAgenda | null>(null);
  const alternarFiltro = (qual: FiltroAgenda) =>
    setFiltro((atual) => (atual === qual ? null : qual));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];

  const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  // Calculate calendar grid days
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Trocar de mes limpa o filtro: "Hoje" noutro mes apagaria a grade inteira,
  // e um mes todo cinza parece tela quebrada, nao filtro ligado.
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDateStr(null);
    setFiltro(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDateStr(null);
    setFiltro(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    const todayStr = new Date().toISOString().split('T')[0];
    setSelectedDateStr(todayStr);
  };

  // Filter only 'venda' (orders) for calendar
  const monthSales = transactions.filter((tx) => {
    if (tx.type !== 'venda') return false;
    if (!tx.date) return false;
    // `date` e string no tipo, mas a conversao defensiva fica: ela ja existia
    // e protege contra um valor fora do formato vindo do banco. O `unknown`
    // existe so para o compilador aceitar as duas verificacoes.
    const dateBruta: unknown = tx.date;
    const dateStr = typeof dateBruta === 'string' ? dateBruta : (dateBruta instanceof Date ? dateBruta.toISOString().split('T')[0] : String(dateBruta));
    const [y, m] = dateStr.split('-').map(Number);
    return y === year && m === month + 1;
  });

  // Group sales by date string 'YYYY-MM-DD'
  const salesByDate: Record<string, Transaction[]> = {};
  monthSales.forEach((tx) => {
    // `date` e string no tipo, mas a conversao defensiva fica: ela ja existia
    // e protege contra um valor fora do formato vindo do banco. O `unknown`
    // existe so para o compilador aceitar as duas verificacoes.
    const dateBruta: unknown = tx.date;
    const dateStr = typeof dateBruta === 'string' ? dateBruta : (dateBruta instanceof Date ? dateBruta.toISOString().split('T')[0] : String(dateBruta));
    if (!salesByDate[dateStr]) {
      salesByDate[dateStr] = [];
    }
    salesByDate[dateStr].push(tx);
  });

  // Today string YYYY-MM-DD
  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

  // Transactions to display in list below calendar
  const displayTransactions = selectedDateStr
    ? salesByDate[selectedDateStr] || []
    : monthSales;

  // Datas comemorativas de clientes que caem no mes exibido. Aniversario e
  // sempre recorrente — compara so dia/mes, igual o resto do app ja faz
  // (formatDayMonthOnly ignora o ano ao mostrar, entao a comparacao aqui
  // segue a mesma regra pra nao contradizer o que a tela de Clientes exibe).
  interface MonthEvent {
    day: number;
    title: string;
    customerName: string;
  }
  const monthEvents: MonthEvent[] = [];
  customers.forEach((c) => {
    const addIfInMonth = (dateStr: string | undefined, title: string) => {
      if (!dateStr) return;
      const [, m, d] = dateStr.split('-').map(Number);
      if (m !== month + 1 || !d) return;
      monthEvents.push({ day: d, title, customerName: c.name });
    };
    addIfInMonth(c.eventDate, c.recurringEventTitle || 'Aniversário');
    (c.additionalEvents || []).forEach((ev) => {
      if (ev.date && ev.title) addIfInMonth(ev.date, ev.title);
    });
  });
  monthEvents.sort((a, b) => a.day - b.day);

  // Os dois modais do dia, iguais no celular e no computador.
  const modaisDoDia = (
    <>
      {/* Modal: Detalhes dos Pedidos do Dia */}
      {detailsDayStr && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[99999] animate-fadeIn"
          onClick={() => setDetailsDayStr(null)}
        >
          <div
            className="w-full bg-white rounded-[24px] p-6 space-y-4 max-h-[80vh] max-w-md overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b">
              <h3 className="font-serif-display text-lg" style={{ color: '#241B2B' }}>
                Pedidos de {formatDateBr(detailsDayStr)}
              </h3>
              <button
                onClick={() => setDetailsDayStr(null)}
                className="p-1 rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {(salesByDate[detailsDayStr] || []).map((tx) => (
                <div key={tx.id} className="pb-3 border-b last:border-b-0">
                  <p className="font-bold text-sm" style={{ color: '#241B2B' }}>
                    {tx.customerName || 'Cliente não informado'}
                  </p>
                  <p className="text-xs" style={{ color: '#7A6E80' }}>
                    {tx.description}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs font-semibold" style={{ color: '#241B2B' }}>
                      {formatMoney(tx.totalValue)}
                    </p>
                    <p className="text-xs" style={{ color: tx.paymentStatus === 'pago' ? '#4CAF7D' : '#F5A623' }}>
                      {tx.paymentStatus === 'pago' ? 'Pago' : 'Pendente'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Confirmar Lançamento de Pedido em Dia Vazio */}
      {confirmEmptyDayStr && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[99999] animate-fadeIn"
          onClick={() => setConfirmEmptyDayStr(null)}
        >
          <div
            className="bg-white rounded-[24px] p-6 space-y-4 w-[90%] max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif-display text-lg" style={{ color: '#241B2B' }}>
              Lançar Pedido
            </h3>
            <p style={{ color: '#7A6E80', fontSize: '14px' }}>
              Gostaria de lançar um pedido para {formatDateBr(confirmEmptyDayStr)}?
            </p>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setConfirmEmptyDayStr(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#F6F2F5', color: '#241B2B' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setConfirmEmptyDayStr(null);
                  onOpenAddModalWithDate?.(confirmEmptyDayStr);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6E3F72 0%, #3A2350 100%)' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (computador) {
    const botaoMes: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '44px',
      height: '44px',
      border: 0,
      borderRadius: '50%',
      background: 'transparent',
      color: '#241B2B',
      cursor: 'pointer',
    };

    return (
      <section
        aria-labelledby="agenda-titulo"
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          padding: '24px',
          borderRadius: '22px',
          background: '#FFFFFF',
          boxShadow: '0 8px 20px rgba(58,35,80,0.08)',
          fontFamily: "'Manrope', sans-serif",
          color: '#241B2B',
        }}
      >
        <h2 id="agenda-titulo" className="font-serif-display" style={{ margin: 0, fontSize: '28px', fontWeight: 400, lineHeight: 1.1 }}>
          Agenda de Pedidos
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <button type="button" onClick={handlePrevMonth} aria-label="Mês anterior" title="Mês anterior" style={botaoMes}>
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.2em' }}>{monthNames[month]}</span>
          <button type="button" onClick={handleNextMonth} aria-label="Próximo mês" title="Próximo mês" style={botaoMes}>
            <ChevronRight size={20} strokeWidth={2} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            aria-hidden="true"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: '7px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: '#7A6E80',
            }}
          >
            {daysOfWeek.map((day, idx) => (
              <span key={`dia-semana-${idx}`}>{day}</span>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '7px' }}>
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <span key={`vazio-${i}`} aria-hidden="true" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayOrders = salesByDate[dayStr] || [];
              const hasOrders = dayOrders.length > 0;
              const isToday = dayStr === todayStr;
              const combina =
                !filtro || (filtro === 'hoje' ? isToday : filtro === 'com-pedido' ? hasOrders : !hasOrders);
              const sombra = hasOrders ? '0 6px 14px rgba(143,90,156,0.34)' : '0 6px 14px rgba(76,175,80,0.24)';

              return (
                <button
                  key={dayStr}
                  type="button"
                  // Mesma reacao do celular: dia com pedido abre os pedidos do
                  // dia; dia livre pergunta se quer lancar um pedido nele.
                  onClick={combina ? () => (hasOrders ? setDetailsDayStr(dayStr) : setConfirmEmptyDayStr(dayStr)) : undefined}
                  disabled={!combina}
                  aria-label={
                    `${dayNum} de ${monthNames[month].toLowerCase()}${isToday ? ', hoje' : ''}, ` +
                    (hasOrders ? `${dayOrders.length} ${dayOrders.length > 1 ? 'pedidos' : 'pedido'}` : 'livre')
                  }
                  style={{
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    borderRadius: '13px',
                    // Hoje: contorno roxo. O numero NAO muda de cor (no celular
                    // fica roxo, que sobre o degrade nao dava leitura).
                    border: isToday && combina ? '2px solid #3A2350' : 0,
                    background: !combina ? 'transparent' : hasOrders ? 'linear-gradient(150deg, #8F5A9C, #C4626F)' : '#B4E7B4',
                    color: !combina ? '#D3C9D6' : hasOrders ? '#FFFFFF' : '#1B5E1B',
                    boxShadow: !combina ? 'none' : sombra,
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: combina ? 'pointer' : 'default',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (combina) e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>

        <div
          role="group"
          aria-label="Filtrar dias"
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '4px 20px' }}
        >
          {ITENS_LEGENDA.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => alternarFiltro(item.id)}
              aria-pressed={filtro === item.id}
              title={filtro === item.id ? 'Mostrar todos os dias' : `Ver só os dias: ${item.rotulo}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: '44px',
                padding: '0 4px',
                border: 0,
                background: 'none',
                opacity: !filtro || filtro === item.id ? 1 : 0.4,
                transition: 'opacity 0.2s ease',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              <span style={{ width: '12px', height: '12px', borderRadius: '4px', boxSizing: 'border-box', ...item.amostra }} />
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6E80' }}>
                {item.rotulo}
              </span>
            </button>
          ))}
        </div>

        {monthEvents.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '14px', borderTop: '1px solid #EDE6EF' }}>
            <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6E80' }}>
              Datas Comemorativas do Mês
            </h3>
            {monthEvents.map((ev, i) => (
              <p key={i} style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: '8px', fontSize: '13px' }}>
                <span style={{ fontWeight: 800, color: '#6E3F72' }}>
                  {String(ev.day).padStart(2, '0')}/{String(month + 1).padStart(2, '0')}
                </span>
                <span aria-hidden="true" style={{ color: '#B9AEBD' }}>—</span>
                <span>{ev.title} {ev.customerName}</span>
              </p>
            ))}
          </div>
        )}

        {modaisDoDia}
      </section>
    );
  }

  return (
    <div className="bg-white rounded-[22px] p-6 shadow-card space-y-4">
      {/* Title */}
      <div>
        <h2 className="font-serif-display text-[23px]" style={{ color: '#241B2B' }}>
          Agenda de Pedidos
        </h2>
      </div>

      {/* Header Month Control */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-full transition-all hover:-translate-x-0.5"
            style={{ color: 'var(--color-ink)', background: 'transparent' }}
            title="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-base uppercase tracking-widest" style={{ color: 'var(--color-ink)', fontFamily: "'Manrope', sans-serif", fontWeight: 800, flex: 1, textAlign: 'center' }}>
          {monthNames[month]}
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-full transition-all hover:translate-x-0.5"
            style={{ color: 'var(--color-ink)', background: 'transparent' }}
            title="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div>
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
          {daysOfWeek.map((day, idx) => (
            <span key={`day-${idx}`} className="text-xs uppercase tracking-widest py-2" style={{ color: 'var(--color-ink-soft)', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
              {day}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Leading empty cells */}
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-[22px] flex items-center justify-center font-black text-sm" style={{ color: '#D3C9D6', background: 'transparent' }} />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayOrders = salesByDate[dayStr] || [];
            const hasOrders = dayOrders.length > 0;
            const isToday = dayStr === todayStr;

            // Roxo (tem pedido) e verde (livre) aparecem sempre juntos —
            // nao ha mais toggle escondendo uma cor de cada vez.
            let bgColor: string;
            let textColor: string;
            let boxShadowStyle: string;
            let fontWeightStyle: number;

            if (hasOrders) {
              bgColor = 'linear-gradient(150deg, #8F5A9C, #C4626F)';
              textColor = '#FFFFFF';
              boxShadowStyle = '0 6px 14px rgba(143,90,156,0.34)';
              fontWeightStyle = 800;
            } else {
              bgColor = '#B4E7B4';
              textColor = '#1B5E1B';
              boxShadowStyle = '0 6px 14px rgba(76,175,80,0.34)';
              fontWeightStyle = 800;
            }

            if (isToday) {
              textColor = '#6E3F72';
            }

            // Fora do filtro: a celula fica apagada no lugar, com a mesma cor
            // das celulas vazias do inicio do mes, e para de responder ao
            // clique — um dia que nao esta a vista nao deve abrir detalhes.
            const combinaComFiltro =
              !filtro ||
              (filtro === 'hoje' ? isToday : filtro === 'com-pedido' ? hasOrders : !hasOrders);

            if (!combinaComFiltro) {
              bgColor = 'transparent';
              textColor = '#D3C9D6';
              boxShadowStyle = 'none';
              fontWeightStyle = 800;
            }

            const handleDayClick = () => {
              if (hasOrders) {
                // Abrir modal de detalhes
                setDetailsDayStr(dayStr);
              } else {
                // Abrir diálogo de confirmação
                setConfirmEmptyDayStr(dayStr);
              }
            };

            return (
              <button
                key={dayStr}
                onClick={combinaComFiltro ? handleDayClick : undefined}
                disabled={!combinaComFiltro}
                className="aspect-square rounded-[13px] flex items-center justify-center"
                style={{
                  background: bgColor,
                  color: textColor,
                  border: isToday && combinaComFiltro ? '1.5px solid #6E3F72' : 'none',
                  fontSize: '12px',
                  fontWeight: fontWeightStyle,
                  boxShadow: boxShadowStyle,
                  transition: 'all 0.2s ease',
                  cursor: combinaComFiltro ? 'pointer' : 'default',
                }}
                onMouseEnter={(e) => {
                  if (combinaComFiltro) e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                title={`${dayNum} de ${monthNames[month].toLowerCase()}`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* LEGENDA que tambem FILTRA. Clicar num item deixa so os dias daquele
          tipo a vista; clicar de novo mostra todos. Um de cada vez.
          Quando ha filtro ligado, os outros dois desbotam — e o unico sinal
          de estado, sem cor nova: a cor ativa e a do proprio quadradinho. */}
      <div className="pt-4 border-t flex items-center justify-center gap-6 text-xs uppercase tracking-widest">
        {ITENS_LEGENDA.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => alternarFiltro(item.id)}
            aria-pressed={filtro === item.id}
            title={filtro === item.id ? 'Mostrar todos os dias' : `Ver só os dias: ${item.rotulo}`}
            className="flex items-center gap-2 cursor-pointer"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              opacity: !filtro || filtro === item.id ? 1 : 0.4,
              transition: 'opacity 0.2s ease',
            }}
          >
            <div className="w-3 h-3 rounded" style={item.amostra} />
            <span style={{ color: 'var(--color-ink-soft)', fontSize: '10px', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
              {item.rotulo}
            </span>
          </button>
        ))}
      </div>

      {/* Datas Comemorativas do mes exibido — mesmo card, secao a mais.
          Recalcula sozinho ao trocar de mes porque usa a mesma variavel
          `month` do grid acima. Sem estado vazio dedicado: se nao ha nada
          no mes, a secao so nao aparece. */}
      {monthEvents.length > 0 && (
        <div className="pt-4 border-t space-y-2">
          <h4 className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-ink-soft)', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
            Datas Comemorativas do Mês
          </h4>
          <div className="space-y-1.5">
            {monthEvents.map((ev, i) => (
              <div key={i} className="flex items-baseline gap-1.5 text-xs">
                <span style={{ color: '#6E3F72', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
                  {String(ev.day).padStart(2, '0')}/{String(month + 1).padStart(2, '0')}
                </span>
                <span style={{ color: '#D3C9D6' }}>—</span>
                <span style={{ color: '#241B2B' }}>{ev.title} {ev.customerName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {modaisDoDia}
    </div>
  );
};

