import React from 'react';
import { TabType } from '../types';
import { BottomNav } from './BottomNav';
import { Check, Trash2, Edit3, FileText, Calendar } from 'lucide-react';

interface AppShellProps {
  active: TabType;
  onChange: (tab: TabType) => void;
  header: React.ReactNode;
  desktopHeader?: React.ReactNode;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  active,
  onChange,
  header,
  desktopHeader,
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--car-surface)' }}>
      {/* Mobile Header */}
      <div>
        {header}
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pb-20 overflow-y-auto">
        <div className="flex-1">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div>
        <BottomNav activeTab={active} onTabChange={onChange} />
      </div>
    </div>
  );
};

/* =========== RingGauge =========== */
interface RingGaugeProps {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  glow?: boolean;
}

export const RingGauge: React.FC<RingGaugeProps> = ({
  percent,
  size = 92,
  stroke = 9,
  color = 'var(--car-rose-200)',
  track = 'rgba(255, 255, 255, .18)',
  glow = true,
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percent / 100);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.3,
          fontWeight: 800,
          color: '#fff',
        }}
      >
        {Math.round(percent)}%
      </div>
      {glow && (
        <div
          style={{
            position: 'absolute',
            top: -size * 0.3,
            right: -size * 0.3,
            width: size * 1.6,
            height: size * 1.6,
            background: `radial-gradient(circle, ${color}33, transparent 70%)`,
            borderRadius: '50%',
            pointerEvents: 'none',
            animation: 'car-glow 6s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
};

/* =========== Pill =========== */
interface PillProps {
  children: React.ReactNode;
  tone?: 'paid' | 'pending' | 'alert' | 'brand' | 'sand' | 'cat' | 'on-dark';
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const Pill: React.FC<PillProps> = ({ children, tone = 'brand', icon, onClick }) => {
  const toneClass = `car-pill--${tone}`;
  return (
    <span className={`car-pill ${toneClass}`} style={onClick ? { cursor: 'pointer' } : {}} onClick={onClick}>
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
};

/* =========== SearchField =========== */
interface SearchFieldProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  placeholder = 'Buscar...',
  value,
  onChange,
}) => {
  return (
    <div className="car-search">
      <div className="car-search__icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="6" cy="6" r="5" />
          <line x1="11" y1="11" x2="15" y2="15" />
        </svg>
      </div>
      <input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
};

/* =========== Segmented =========== */
interface SegmentedOption {
  id: string;
  label: string;
  count?: number;
}

interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (id: string) => void;
}

export const Segmented: React.FC<SegmentedProps> = ({ options, value, onChange }) => {
  return (
    <div className="car-seg">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          aria-pressed={value === opt.id}
        >
          {opt.label} {opt.count !== undefined && `(${opt.count})`}
        </button>
      ))}
    </div>
  );
};

/* =========== OrderTicket =========== */
interface OrderTicketProps {
  isPending: boolean;
  clientName: string;
  description: string;
  date: string;
  value: number;
  paymentStatus: 'pago' | 'pendente';
  onMarkPaid?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPdf?: () => void;
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  isPending,
  clientName,
  description,
  date,
  value,
  paymentStatus,
  onMarkPaid,
  onEdit,
  onDelete,
  onPdf,
}) => {
  return (
    <div className={`car-ticket ${isPending ? 'car-ticket--pending' : ''}`}>
      <div className="car-ticket__stripe"></div>
      <div className="car-ticket__notch car-ticket__notch--l"></div>
      <div className="car-ticket__notch car-ticket__notch--r"></div>

      <div style={{ paddingLeft: '12px', paddingRight: '12px' }}>
        {/* Header with status */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <Pill tone="brand">👤 {clientName.toUpperCase()}</Pill>
          <Pill tone={paymentStatus === 'pago' ? 'paid' : 'pending'}>
            {paymentStatus === 'pago' ? '✓ PAGO' : '⏳ PENDENTE'}
          </Pill>
        </div>

        {/* Description + Date */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '12px', color: 'var(--car-ink)', marginBottom: '4px' }}>{description}</div>
          <div style={{ fontSize: '10px', color: 'var(--car-ink-soft)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar width="12" height="12" /> {date}
          </div>
        </div>

        {/* Divider */}
        <div className="car-ticket__foot">
          <div className="car-ticket__value">R$ {(value / 100).toFixed(2).replace('.', ',')}</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
            {onPdf && (
              <button className="car-icon-btn" onClick={onPdf} title="Gerar PDF">
                <FileText width="16" height="16" />
              </button>
            )}
            {onMarkPaid && (
              <Pill tone={paymentStatus === 'pago' ? 'paid' : 'pending'} onClick={onMarkPaid}>
                {paymentStatus === 'pago' ? '✓ Pago' : 'Marcar PAGO'}
              </Pill>
            )}
            {onEdit && (
              <button className="car-icon-btn" onClick={onEdit} title="Editar">
                <Edit3 width="16" height="16" />
              </button>
            )}
            {onDelete && (
              <button className="car-icon-btn car-icon-btn--danger" onClick={onDelete} title="Excluir">
                <Trash2 width="16" height="16" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========== CategoryChips =========== */
interface CategoryChipsProps {
  categories: { id: string; label: string; icon: string }[];
  active: string | null;
  onChange: (id: string) => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({ categories, active, onChange }) => {
  return (
    <div className="car-chips">
      {categories.map((cat) => (
        <button
          key={cat.id}
          className="car-chip"
          aria-pressed={active === cat.id}
          onClick={() => onChange(cat.id)}
        >
          {cat.icon} {cat.label}
        </button>
      ))}
    </div>
  );
};

/* =========== ArcGauge =========== */
interface ArcGaugeProps {
  quantity: number;
  min: number;
  size?: number;
}

export const ArcGauge: React.FC<ArcGaugeProps> = ({ quantity, min, size = 84 }) => {
  const percent = Math.min(100, Math.round((quantity / (min * 4)) * 100));
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percent / 100);

  let strokeColor = 'var(--car-brand-700)';
  if (quantity <= min) {
    strokeColor = 'var(--car-rose-600)';
  } else if (percent >= 45) {
    strokeColor = 'var(--car-sand-700)';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(36,27,43,.08)" strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.6s ease' }}
        />
      </svg>
      <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--car-ink)' }}>{percent}%</span>
    </div>
  );
};

/* =========== LegendRow =========== */
interface LegendRowProps {
  color: string;
  label: string;
  value: string | number;
}

export const LegendRow: React.FC<LegendRowProps> = ({ color, label, value }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ color: 'var(--car-ink-soft)' }}>{label}:</span>
      <span style={{ fontWeight: 800, color: 'var(--car-ink)' }}>{value}</span>
    </div>
  );
};

/* =========== CompositionRing =========== */
interface CompositionRingProps {
  reposicao: number;
  maoDeObra: number;
  custos: number;
  sugestao: string;
}

export const CompositionRing: React.FC<CompositionRingProps> = ({
  reposicao,
  maoDeObra,
  custos,
  sugestao,
}) => {
  const total = reposicao + maoDeObra + custos;
  const repoPercent = (reposicao / total) * 100;
  const mdoPercent = (maoDeObra / total) * 100;
  const cusPercent = (custos / total) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Ring Chart */}
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ margin: '0 auto' }}>
        <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(36,27,43,.08)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="#6E3F72"
          strokeWidth="8"
          strokeDasharray={`${(repoPercent / 100) * 283} 283`}
          transform="rotate(-90 60 60)"
          strokeLinecap="round"
        />
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="#C4626F"
          strokeWidth="8"
          strokeDasharray={`${(mdoPercent / 100) * 283} 283`}
          strokeDashoffset={-((repoPercent / 100) * 283)}
          transform="rotate(-90 60 60)"
          strokeLinecap="round"
        />
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="#B08D57"
          strokeWidth="8"
          strokeDasharray={`${(cusPercent / 100) * 283} 283`}
          strokeDashoffset={-(((repoPercent + mdoPercent) / 100) * 283)}
          transform="rotate(-90 60 60)"
          strokeLinecap="round"
        />
        <text x="60" y="70" textAnchor="middle" style={{ fontSize: '12px', fontWeight: 800, fill: 'var(--car-ink)' }}>
          {sugestao}
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <LegendRow color="#6E3F72" label="Reposição" value={`R$ ${(reposicao).toFixed(2)}`} />
        <LegendRow color="#C4626F" label="Mão de Obra" value={`R$ ${(maoDeObra).toFixed(2)}`} />
        <LegendRow color="#B08D57" label="Custos" value={`R$ ${(custos).toFixed(2)}`} />
      </div>
    </div>
  );
};

/* =========== StockCard =========== */
interface StockCardProps {
  name: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  onIncrement: () => void;
  onDecrement: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const StockCard: React.FC<StockCardProps> = ({
  name,
  quantity,
  minThreshold,
  unit,
  onIncrement,
  onDecrement,
  onEdit,
  onDelete,
}) => {
  const isLow = quantity <= minThreshold;
  return (
    <div
      className="car-card--lift"
      style={{
        background: isLow ? '#FDF4F5' : 'var(--car-card)',
        border: isLow ? '1px solid rgba(196, 98, 111, .35)' : '1px solid rgba(36, 27, 43, .08)',
        padding: '16px',
        display: 'flex',
        gap: '12px',
        cursor: 'pointer',
        borderRadius: 'var(--car-r-card)',
        boxShadow: 'var(--car-sh-card)',
        transition: 'transform .28s ease, box-shadow .28s ease',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <ArcGauge quantity={quantity} min={minThreshold} size={84} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--car-ink)' }}>{name}</div>
        {isLow && <Pill tone="alert">⚠ Estoque Baixo</Pill>}
        <div style={{ fontSize: '10px', color: 'var(--car-ink-soft)' }}>
          Mínimo: {minThreshold} {unit}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
          <div className="car-stepper">
            <button onClick={onDecrement}>−</button>
            <span className="car-stepper__val">{quantity}</span>
            <button onClick={onIncrement}>+</button>
          </div>
          <span style={{ fontSize: '9px', color: 'var(--car-ink-mute)', marginLeft: 'auto' }}>{unit}</span>
          <button className="car-icon-btn" onClick={onEdit} style={{ width: '24px', height: '24px' }}>
            <Edit3 width="12" height="12" />
          </button>
          <button className="car-icon-btn car-icon-btn--danger" onClick={onDelete} style={{ width: '24px', height: '24px' }}>
            <Trash2 width="12" height="12" />
          </button>
        </div>
      </div>
    </div>
  );
};
