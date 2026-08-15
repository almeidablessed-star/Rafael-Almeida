/* ============================================================
   Carula Confeitaria — carula-ui.tsx
   Componentes visuais prontos. Copie para src/components/carula-ui.tsx.
   Depende de 01-index.css (classes .car-*).
   Nenhuma lógica de negócio aqui: tudo entra por props.
   ============================================================ */

import React from 'react';

/* ---------------- ícones (SVG inline, stroke arredondado) ---------------- */

type IconProps = { size?: number; color?: string };
const S = ({ size = 18, color = 'currentColor', width = 1.9, children }: IconProps & { width?: number; children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
       strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

export const IconHome    = (p: IconProps) => <S {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></S>;
export const IconOrders  = (p: IconProps) => <S {...p}><path d="M4 7h16l-1.2 13H5.2z" /><path d="M9 7a3 3 0 0 1 6 0" /></S>;
export const IconFichas  = (p: IconProps) => <S {...p}><path d="M4 4h9a3 3 0 0 1 3 3v13H6a2 2 0 0 1-2-2z" /><path d="M20 5v15" /></S>;
export const IconUsers   = (p: IconProps) => <S {...p}><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><circle cx="17.5" cy="10" r="2.2" /></S>;
export const IconStock   = (p: IconProps) => <S {...p}><rect x="3" y="10" width="8" height="7" rx="1.2" /><rect x="13" y="10" width="8" height="7" rx="1.2" /><rect x="8" y="3" width="8" height="6" rx="1.2" /></S>;
export const IconWallet  = (p: IconProps) => <S {...p}><rect x="3" y="6" width="18" height="13" rx="3" /><circle cx="17" cy="12.5" r="1.4" fill="currentColor" stroke="none" /></S>;
export const IconPlus    = (p: IconProps) => <S {...p} width={3}><path d="M12 5v14M5 12h14" /></S>;
export const IconEdit    = (p: IconProps) => <S {...p} width={2}><path d="M4 20h4l10-10-4-4L4 16z" /></S>;
export const IconTrash   = (p: IconProps) => <S {...p} width={2}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></S>;
export const IconCopy    = (p: IconProps) => <S {...p} width={2}><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></S>;
export const IconSearch  = (p: IconProps) => <S {...p} width={2}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></S>;
export const IconPdf     = (p: IconProps) => <S {...p} width={2}><path d="M6 9V3h12v6" /><rect x="6" y="13" width="12" height="8" /><path d="M6 17H3v-6h18v6h-3" /></S>;
export const IconChevron = (p: IconProps) => <S {...p} width={2.4}><path d="M6 9l6 6 6-6" /></S>;
export const IconLeft    = (p: IconProps) => <S {...p} width={2.4}><path d="M15 5l-7 7 7 7" /></S>;
export const IconRight   = (p: IconProps) => <S {...p} width={2.4}><path d="M9 5l7 7-7 7" /></S>;
export const IconDownload= (p: IconProps) => <S {...p} width={2}><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" /></S>;
export const IconWhats   = (p: IconProps) => <S {...p} width={2}><path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.2-5.5A8.4 8.4 0 1 1 21 11.5z" /></S>;
export const IconAlert   = (p: IconProps) => <S {...p} width={2.4}><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></S>;
/* ícone de versão mobile — substitui o antigo, malfeito */
export const IconMobile  = (p: IconProps) => <S {...p}><rect x="7" y="2" width="10" height="20" rx="2.6" /><path d="M11 5.4h2" /><path d="M12 18.4h.01" /></S>;

/* ---------------- primitivos ---------------- */

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { lift?: boolean; hover?: boolean; pad?: number }> =
  ({ lift, hover = true, pad = 16, children, className = '', style, ...rest }) => (
    <div {...rest}
      className={['car-card', hover && !lift ? 'car-card--hover' : '', lift ? 'car-card--lift' : '', className].filter(Boolean).join(' ')}
      style={{ padding: pad, display: 'flex', flexDirection: 'column', gap: 12, ...style }}>
      {children}
    </div>
  );

type PillTone = 'paid' | 'pending' | 'alert' | 'brand' | 'cat' | 'sand' | 'onDark';
const PILL_CLASS: Record<PillTone, string> = {
  paid: 'car-pill--paid', pending: 'car-pill--pending', alert: 'car-pill--alert',
  brand: 'car-pill--brand', cat: 'car-pill--cat', sand: 'car-pill--sand', onDark: 'car-pill--on-dark',
};

export const Pill: React.FC<{ tone?: PillTone; as?: 'span' | 'button'; onClick?: () => void; children: React.ReactNode }> =
  ({ tone = 'cat', as = 'span', onClick, children }) => {
    const cls = ['car-pill', PILL_CLASS[tone], as === 'button' ? 'car-pill--action' : ''].filter(Boolean).join(' ');
    return as === 'button'
      ? <button type="button" className={cls} onClick={onClick}>{children}</button>
      : <span className={cls}>{children}</span>;
  };

export const IconButton: React.FC<{ label: string; danger?: boolean; round?: boolean; onClick?: () => void; children: React.ReactNode }> =
  ({ label, danger, round, onClick, children }) => (
    <button type="button" aria-label={label} onClick={onClick}
      className={['car-icon-btn', danger ? 'car-icon-btn--danger' : '', round ? 'car-icon-btn--round' : ''].filter(Boolean).join(' ')}>
      {children}
    </button>
  );

export const SearchField: React.FC<{ placeholder: string; value?: string; onChange?: (v: string) => void }> =
  ({ placeholder, value, onChange }) => (
    <div className="car-search">
      <span className="car-search__icon"><IconSearch size={16} color="#A096A6" /></span>
      <input type="search" placeholder={placeholder} value={value} onChange={(e) => onChange?.(e.target.value)} />
    </div>
  );

export const Segmented: React.FC<{ options: { key: string; label: string }[]; value: string; onChange: (k: string) => void }> =
  ({ options, value, onChange }) => (
    <div className="car-seg" role="group">
      {options.map((o) => (
        <button key={o.key} type="button" aria-pressed={value === o.key} onClick={() => onChange(o.key)}>{o.label}</button>
      ))}
    </div>
  );

export const CategoryChips: React.FC<{ options: string[]; value: string; onChange: (v: string) => void }> =
  ({ options, value, onChange }) => (
    <div className="car-chips" role="group">
      {options.map((o) => (
        <button key={o} type="button" className="car-chip" aria-pressed={value === o} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  );

/* ---------------- botão "Lançar Pedido" (etiqueta de comanda) ---------------- */

export const ComandaButton: React.FC<{ onClick?: () => void; label?: string; kicker?: string }> =
  ({ onClick, label = '+ Lançar Pedido', kicker = 'NOVA COMANDA' }) => (
    <button type="button" className="car-comanda" onClick={onClick}>
      <span className="car-comanda__notch car-comanda__notch--l" />
      <span className="car-comanda__notch car-comanda__notch--r" />
      <span className="car-comanda__text">
        <span className="car-comanda__kicker">{kicker}</span>
        <span className="car-comanda__title">{label}</span>
      </span>
      <span className="car-comanda__seal"><IconPlus size={21} color="#3A2350" /></span>
      <span className="car-sweep" />
    </button>
  );

/* ---------------- medidores ---------------- */

/** Anel simples: margem do lucro, cofrinhos, percentuais. */
export const RingGauge: React.FC<{ percent: number; size?: number; stroke?: number; color?: string; track?: string; glow?: boolean; children?: React.ReactNode }> =
  ({ percent, size = 66, stroke = 7, color = '#6E3F72', track = '#F1ECF2', glow, children }) => {
    const r = (size - stroke) / 2 - 1;
    const C = 2 * Math.PI * r;
    const p = Math.max(0, Math.min(100, percent));
    const box = '0 0 ' + size + ' ' + size;
    return (
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={box} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
                  strokeDasharray={C} strokeDashoffset={C - (C * p) / 100}
                  style={glow ? { filter: 'drop-shadow(0 0 8px ' + color + '99)' } : undefined} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
          {children ?? <span style={{ fontSize: Math.round(size * 0.2), fontWeight: 800, color: 'var(--car-ink)' }}>{Math.round(p)}%</span>}
        </div>
      </div>
    );
  };

/** Arco 0–100 do Estoque. Escala: 100% = 4x o mínimo do insumo. */
export const ArcGauge: React.FC<{ quantity: number; min: number; width?: number }> = ({ quantity, min, width = 84 }) => {
  const percent = Math.min(100, Math.round((quantity / (min * 4)) * 100));
  const color = quantity <= min ? 'var(--car-rose-600)' : percent < 45 ? 'var(--car-sand-700)' : 'var(--car-brand-700)';
  const L = 126;
  const h = Math.round(width * 0.62);
  return (
    <div style={{ position: 'relative', width, height: h, flexShrink: 0 }}>
      <svg width={width} height={h} viewBox="0 0 84 52" aria-hidden="true">
        <path d="M9 48a33 33 0 0 1 66 0" fill="none" stroke="var(--car-track)" strokeWidth={10} strokeLinecap="round" />
        <path d="M9 48a33 33 0 0 1 66 0" fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
              strokeDasharray={L} strokeDashoffset={L - (L * percent) / 100} />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 2, textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--car-ink)' }}>{percent}%</div>
    </div>
  );
};

/** Anel de composição das Fichas: reposição + mão de obra + custos op., sugestão ao centro. */
export const CompositionRing: React.FC<{ reposicao: number; maoDeObra: number; custos: number; sugestao: string; size?: number }> =
  ({ reposicao, maoDeObra, custos, sugestao, size = 88 }) => {
    const stroke = 10;
    const r = (size - stroke) / 2 - 4;
    const C = 2 * Math.PI * r;
    const total = reposicao + maoDeObra + custos || 1;
    const a = (C * reposicao) / total;
    const b = (C * maoDeObra) / total;
    const c = (C * custos) / total;
    const box = '0 0 ' + size + ' ' + size;
    const dash = (v: number) => v + ' ' + (C - v);
    return (
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={box} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--car-track)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#6E3F72" strokeWidth={stroke} strokeDasharray={dash(a)} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#C4626F" strokeWidth={stroke} strokeDasharray={dash(b)} strokeDashoffset={-a} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#B08D57" strokeWidth={stroke} strokeDasharray={dash(c)} strokeDashoffset={-(a + b)} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
          <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.03em', color: '#8A7E90' }}>SUGESTÃO</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--car-ink)', marginTop: 3 }}>{sugestao}</span>
        </div>
      </div>
    );
  };

export const LegendRow: React.FC<{ color: string; label: string; value: string }> = ({ color, label, value }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#5B4A6B' }}>
    <span style={{ width: 9, height: 9, borderRadius: 3, background: color, flexShrink: 0 }} />
    {label}
    <strong style={{ color: 'var(--car-ink)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{value}</strong>
  </span>
);

export const StackedBar: React.FC<{ parts: { pct: number; color: string }[] }> = ({ parts }) => (
  <div className="car-stack">
    {parts.map((p, i) => <div key={i} style={{ width: p.pct + '%', background: p.color }} />)}
  </div>
);

/* ---------------- comanda de pedido ---------------- */

export const OrderTicket: React.FC<{
  customer: string; paid: boolean; statusLabel: string; date: string; payment: string; value: string;
  onPdf?: () => void; onToggleStatus?: () => void; onEdit?: () => void; onDelete?: () => void;
}> = ({ customer, paid, statusLabel, date, payment, value, onPdf, onToggleStatus, onEdit, onDelete }) => (
  <div className={['car-ticket', paid ? '' : 'car-ticket--pending'].filter(Boolean).join(' ')}>
    <span className="car-ticket__stripe" />
    <span className="car-ticket__notch car-ticket__notch--l" />
    <span className="car-ticket__notch car-ticket__notch--r" />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
        <Pill tone="cat">👤 CLIENTE: {customer}</Pill>
        <Pill tone={paid ? 'paid' : 'pending'}>{statusLabel}</Pill>
      </div>
      <div style={{ fontSize: 11, color: 'var(--car-ink-soft)' }}>
        📅 Data: <strong style={{ color: 'var(--car-ink)' }}>{date}</strong> • Pgto: <strong style={{ color: 'var(--car-ink)' }}>{payment}</strong>
      </div>
      <div className="car-ticket__foot">
        <span className="car-ticket__value">{value}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Pill tone="brand" as="button" onClick={onPdf}><IconPdf size={11} color="#F5B9C6" />PDF</Pill>
          <Pill tone={paid ? 'pending' : 'paid'} as="button" onClick={onToggleStatus}>{paid ? 'Pendente' : 'Marcar PAGO'}</Pill>
          <IconButton label="Editar" round onClick={onEdit}><IconEdit size={13} color="#7A6E80" /></IconButton>
          <IconButton label="Excluir" round danger onClick={onDelete}><IconTrash size={13} color="#C4626F" /></IconButton>
        </div>
      </div>
    </div>
  </div>
);

/* ---------------- calendário do mês (só os dias) ---------------- */

export type CalendarDay = { day: number; inMonth: boolean; booked?: boolean; today?: boolean };

export const MonthCalendar: React.FC<{
  monthLabel: string; days: CalendarDay[]; onPrev?: () => void; onNext?: () => void; onSelect?: (d: number) => void;
}> = ({ monthLabel, days, onPrev, onNext, onSelect }) => (
  <Card pad={20} style={{ gap: 14 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <span className="car-serif" style={{ fontSize: 23, color: 'var(--car-ink)' }}>Agenda de Pedidos</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconButton label="Mês anterior" onClick={onPrev}><IconLeft size={13} color="#7A6E80" /></IconButton>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', color: 'var(--car-brand-700)' }}>{monthLabel}</span>
        <IconButton label="Próximo mês" onClick={onNext}><IconRight size={13} color="#7A6E80" /></IconButton>
      </div>
    </div>
    <div className="car-cal-head">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
    <div className="car-cal-grid">
      {days.map((d, i) => (
        <button key={i} type="button" disabled={!d.inMonth} onClick={() => onSelect?.(d.day)}
          className={['car-day', !d.inMonth ? 'car-day--out' : '', d.booked ? 'car-day--booked' : '', d.today ? 'car-day--today' : ''].filter(Boolean).join(' ')}>
          {d.day}
        </button>
      ))}
    </div>
    <div style={{ borderTop: '1px solid var(--car-hairline)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, fontWeight: 700, color: 'var(--car-ink-soft)' }}>
        <span style={{ width: 11, height: 11, borderRadius: 4, background: 'var(--car-grad-day)' }} />Com pedido
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, fontWeight: 700, color: 'var(--car-ink-soft)' }}>
        <span style={{ width: 11, height: 11, borderRadius: 4, background: 'var(--car-surface)', border: '1px solid rgba(36,27,43,.14)' }} />Livre
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, fontWeight: 700, color: 'var(--car-ink-soft)' }}>
        <span style={{ width: 11, height: 11, borderRadius: 4, border: '1.5px solid var(--car-brand-700)' }} />Hoje
      </span>
    </div>
  </Card>
);

/* ---------------- card de insumo (Estoque) ---------------- */

export const StockCard: React.FC<{
  name: string; quantity: number; unit: string; min: number;
  onDec?: () => void; onInc?: () => void; onEdit?: () => void; onDelete?: () => void;
}> = ({ name, quantity, unit, min, onDec, onInc, onEdit, onDelete }) => {
  const low = quantity <= min;
  return (
    <div className="car-card car-card--lift"
      style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14,
               background: low ? '#FDF4F5' : 'var(--car-card)',
               border: '1px solid ' + (low ? 'rgba(196,98,111,.35)' : 'rgba(36,27,43,.06)') }}>
      <ArcGauge quantity={quantity} min={min} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--car-ink)' }}>{name}</span>
          {low && <Pill tone="alert"><IconAlert size={10} color="#FFF8F6" />Estoque Baixo</Pill>}
        </div>
        <span style={{ fontSize: 11, color: 'var(--car-ink-soft)' }}>
          Alerta quando menor que: <strong style={{ color: 'var(--car-ink)' }}>{min} {unit}</strong>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 2, flexWrap: 'wrap', rowGap: 8 }}>
          <div className="car-stepper">
            <button type="button" aria-label="Diminuir" onClick={onDec}>−</button>
            <span className="car-stepper__val">{quantity} <span className="car-stepper__unit">{unit}</span></span>
            <button type="button" aria-label="Aumentar" onClick={onInc}>+</button>
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            <IconButton label="Editar" onClick={onEdit}><IconEdit size={14} color="#7A6E80" /></IconButton>
            <IconButton label="Excluir" danger onClick={onDelete}><IconTrash size={14} color="#C4626F" /></IconButton>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- datas do cliente (recolhível) ---------------- */

export const DatesDisclosure: React.FC<{
  customerName: string; count: number;
  dates: { emoji: string; title: string; date: string }[];
  onNotify?: (title: string) => void; defaultOpen?: boolean;
}> = ({ customerName, count, dates, onNotify, defaultOpen = false }) => {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                 padding: '11px 14px', background: 'var(--car-surface)', border: '1px solid var(--car-hairline)',
                 borderBottom: open ? 'none' : '1px solid var(--car-hairline)',
                 borderRadius: open ? '16px 16px 0 0' : '16px', cursor: 'pointer', textAlign: 'left',
                 fontFamily: 'Manrope, sans-serif' }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--car-ink)' }}>🗓️ Todas as Datas Comemorativas</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Pill tone="brand">{count} datas</Pill>
          <span style={{ display: 'flex', transition: 'transform .25s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <IconChevron size={14} color="#3A2350" />
          </span>
        </span>
      </button>
      {open && (
        <div style={{ background: 'var(--car-surface-2)', border: '1px solid var(--car-hairline)', borderTop: 'none',
                      borderRadius: '0 0 16px 16px', padding: 13, display: 'flex', flexDirection: 'column', gap: 9 }}>
          <span className="car-label">🗓️ Datas e Lembretes de {customerName}:</span>
          {dates.map((d) => (
            <div key={d.title} style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#fff',
                                        border: '1px solid rgba(36,27,43,.06)', borderRadius: 13, padding: '10px 11px' }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--car-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.emoji} {d.title}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--car-ink-soft)' }}>
                  Data: <strong style={{ color: 'var(--car-ink)', background: 'var(--car-sand-300)', padding: '1px 6px', borderRadius: 5 }}>{d.date}</strong>
                </span>
              </div>
              <Pill tone="brand" as="button" onClick={() => onNotify?.(d.title)}><IconWhats size={11} color="#F5B9C6" />Avisar</Pill>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------- cabeçalho mobile (11a) ---------------- */

const headerIconBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 11, border: 'none', background: 'rgba(255,255,255,.16)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};

export const AppHeader: React.FC<{ onProfile?: () => void; onMobileInfo?: () => void; onDownload?: () => void }> =
  ({ onProfile, onMobileInfo, onDownload }) => (
    <header className="car-hero" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <button type="button" className="car-avatar" aria-label="Abrir perfil da confeiteira" onClick={onProfile}>
        <span className="car-avatar__inner">C</span>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
        <span className="car-serif" style={{ fontSize: 32, color: '#fff', letterSpacing: '.01em' }}>Carula</span>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.44em', color: 'rgba(247,220,225,.78)', marginTop: 3, paddingLeft: '.44em' }}>
          CONFEITARIA
        </span>
      </div>
      <div style={{ display: 'flex', gap: 7 }}>
        <button type="button" aria-label="Versão mobile" onClick={onMobileInfo} style={headerIconBtn}>
          <IconMobile size={15} color="#F5B9C6" />
        </button>
        <button type="button" aria-label="Baixar dados" onClick={onDownload} style={headerIconBtn}>
          <IconDownload size={15} color="#F5B9C6" />
        </button>
      </div>
    </header>
  );

/* ---------------- navegação: mesma lista nas duas formas ---------------- */

export const TABS = [
  { key: 'inicio',   label: 'Início',   Icon: IconHome },
  { key: 'pedidos',  label: 'Pedidos',  Icon: IconOrders },
  { key: 'fichas',   label: 'Fichas',   Icon: IconFichas },
  { key: 'clientes', label: 'Clientes', Icon: IconUsers },
  { key: 'estoque',  label: 'Estoque',  Icon: IconStock },
  { key: 'saldos',   label: 'Saldos',   Icon: IconWallet },
] as const;

export type TabKey = typeof TABS[number]['key'];

export const BottomNav: React.FC<{ active: TabKey; onChange: (k: TabKey) => void }> = ({ active, onChange }) => (
  <nav className="car-nav">
    {TABS.map(({ key, label, Icon }) => {
      const on = key === active;
      return (
        <button key={key} type="button" className="car-nav__item" aria-current={on ? 'page' : undefined} onClick={() => onChange(key)}>
          <Icon size={19} color={on ? '#F5B9C6' : '#A096A6'} />
          <span>{label}</span>
        </button>
      );
    })}
  </nav>
);

export const Sidebar: React.FC<{ active: TabKey; onChange: (k: TabKey) => void; onProfile?: () => void; onMobileInfo?: () => void; onDownload?: () => void }> =
  ({ active, onChange, onProfile, onMobileInfo, onDownload }) => (
    <aside className="car-side">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" className="car-avatar" style={{ width: 40, height: 40 }} aria-label="Abrir perfil da confeiteira" onClick={onProfile}>
          <span className="car-avatar__inner" style={{ fontSize: 18 }}>C</span>
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span className="car-serif" style={{ fontSize: 26, color: '#fff' }}>Carula</span>
          <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '.38em', color: 'rgba(247,220,225,.7)', marginTop: 3 }}>CONFEITARIA</span>
        </div>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {TABS.map(({ key, label, Icon }) => {
          const on = key === active;
          return (
            <button key={key} type="button" className="car-side__item" aria-current={on ? 'page' : undefined} onClick={() => onChange(key)}>
              <Icon size={18} color={on ? '#3A2350' : '#C7B6CE'} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <button type="button" onClick={onMobileInfo}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)',
                   padding: '8px 11px', borderRadius: 12, fontSize: 9.5, fontWeight: 800, letterSpacing: '.06em', color: '#F5B9C6', cursor: 'pointer' }}>
          <IconMobile size={13} color="#F5B9C6" />VERSÃO MOBILE
        </button>
        <button type="button" onClick={onDownload}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.08)', border: 'none',
                   padding: '8px 11px', borderRadius: 12, fontSize: 9.5, fontWeight: 700, color: 'rgba(247,220,225,.75)', cursor: 'pointer' }}>
          <IconDownload size={13} color="rgba(247,220,225,.8)" />Baixar dados
        </button>
      </div>
    </aside>
  );

/* ---------------- blocos de página ---------------- */

export const PageHeader: React.FC<{ title: string; subtitle?: string; children?: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
                padding: '22px 30px', background: 'var(--car-card)', borderBottom: '1px solid var(--car-hairline)' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span className="car-serif" style={{ fontSize: 30, color: 'var(--car-ink)' }}>{title}</span>
      {subtitle && <span style={{ fontSize: 12, color: 'var(--car-ink-soft)' }}>{subtitle}</span>}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{children}</div>
  </div>
);

/** Card de destaque em degradê: lucro do mês, saldo total, total em vendas. */
export const HeroCard: React.FC<{ glow?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({ glow, children, style }) => (
  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 26, padding: 22,
                background: 'var(--car-grad-brand)', boxShadow: 'var(--car-sh-hero)',
                display: 'flex', flexDirection: 'column', gap: 14, ...style }}>
    {glow && <span className="car-glow" />}
    {children}
  </div>
);

/** Painel claro que sobrepõe o cabeçalho em degradê (mobile). */
export const SheetBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding: '16px 18px 18px', marginTop: -14, background: 'var(--car-surface)',
                borderRadius: '28px 28px 0 0', position: 'relative', display: 'flex', flexDirection: 'column', gap: 14 }}>
    {children}
  </div>
);

/** Shell responsivo: barra inferior abaixo de 1024px, sidebar acima. */
export const AppShell: React.FC<{
  active: TabKey; onChange: (k: TabKey) => void;
  header?: React.ReactNode; desktopHeader?: React.ReactNode; children: React.ReactNode;
}> = ({ active, onChange, header, desktopHeader, children }) => {
  const [wide, setWide] = React.useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width:1024px)').matches);
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width:1024px)');
    const on = (e: MediaQueryListEvent) => setWide(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  if (wide) {
    return (
      <div className="car-app" style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar active={active} onChange={onChange} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {desktopHeader}
          <div style={{ flex: 1 }}>{children}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="car-app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {header}
      <div style={{ flex: 1 }}>{children}</div>
      <BottomNav active={active} onChange={onChange} />
    </div>
  );
};
