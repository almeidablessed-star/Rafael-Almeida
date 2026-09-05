import React, { useState } from 'react';
import { Transaction, CostCategory } from '../types';
import { formatCurrency, formatDateBr, getCostCategoryLabel, getLaborPeriodLabel } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import { Receipt, Sparkles, Search, Calendar, Trash2, Edit3, Tag, Users, PlusCircle } from 'lucide-react';
import { AdminCostsCard } from './AdminCostsCard';

interface CostsModuleProps {
  transactions: Transaction[];
  onOpenAddModal: (type?: any) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

export const CostsModule: React.FC<CostsModuleProps> = ({
  transactions,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const { formatCurrency: formatMoney } = useCurrency();
  const [activeTab, setActiveTab] = useState<'todos' | 'custos' | 'investimentos' | 'maodeobra'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter costs, investments, and labor
  const costAndInvTxs = transactions.filter(
    (t) => t.type === 'custo' || t.type === 'investimento'
  );
  const laborTxs = transactions.filter((t) => t.type === 'maodeobra');

  const totalCustos = costAndInvTxs
    .filter((t) => t.type === 'custo' || t.category === 'fixo' || t.category === 'variavel')
    .reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

  const totalInvestimentos = costAndInvTxs
    .filter((t) => t.type === 'investimento' || t.category === 'investimento')
    .reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

  const totalLabor = laborTxs.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

  const filteredItems = (() => {
    if (activeTab === 'maodeobra') {
      return laborTxs.filter((item) =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getLaborPeriodLabel(item.laborPeriod).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const filtered = costAndInvTxs.filter((item) => {
      const matchesSearch =
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCostCategoryLabel(item.category).toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'custos') {
        return item.type === 'custo' || item.category === 'fixo' || item.category === 'variavel';
      }
      if (activeTab === 'investimentos') {
        return item.type === 'investimento' || item.category === 'investimento';
      }

      return true;
    });
    return filtered;
  })();

  return (
    <div className="pb-12 animate-fadeIn" style={{ background: '#F6F2F5' }}>
      {/* Header Card — Flutuante com cabeçalho roxo, mesmo padrao das outras
          abas (Pedidos, Clientes, Fichas, Estoque, Compras). Antes esta aba
          tinha seu proprio layout de altura fixa (height:100%, overflow
          interno), cabecalho baixinho (12px de padding) e titulo pequeno
          (18px) — a unica que nao seguia o padrao "folha flutuante" com
          cabecalho de 40/120px de padding, titulo de 31px e cantos
          arredondados no card abaixo. */}
      <div
        className="overflow-hidden shadow-card"
        style={{
          boxShadow: '0 30px 70px rgba(58,35,80,.26)',
        }}
      >
        {/* Header with Title only */}
        <div
          className="px-5 flex items-center justify-between gap-4"
          style={{
            background: 'linear-gradient(155deg, #3A2350 0%, #6E3F72 60%, #A85E86 100%)',
            borderRadius: '0px 0px 0px 0px',
            paddingTop: '40px',
            paddingBottom: '120px',
          }}
        >
          {/* Title */}
          <span
            className="text-white leading-tight flex-1"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: '31px',
              lineHeight: '1.1',
            }}
          >
            Custos
          </span>
        </div>

        {/* Content Section */}
        <div style={{
          marginTop: '-70px',
          background: '#F6F2F5',
          borderRadius: '28px 28px 0 0',
          position: 'relative',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          paddingLeft: 'calc(20px + max(0px, env(safe-area-inset-left)))',
          paddingRight: 'calc(20px + max(0px, env(safe-area-inset-right)))',
        }}>

        {/* Custos Administrativos Section */}
        <div style={{
          background: 'white',
          borderRadius: '4px',
          padding: '10px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          border: '1px solid #E6E1DB',
        }}>
          <AdminCostsCard />
        </div>

        {/* Summary Cards - 3 columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '4px',
            padding: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            border: '1px solid #E6E1DB',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <Receipt style={{ width: '12px', height: '12px', color: 'var(--color-brand-700)' }} />
              <span style={{
                fontSize: '8px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: 'var(--color-brand-700)',
              }}>
                Custos
              </span>
            </div>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-brand-900)', margin: 0 }}>
              {formatMoney(totalCustos)}
            </p>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '4px',
            padding: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            border: '1px solid #E6E1DB',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <Sparkles style={{ width: '12px', height: '12px', color: 'var(--color-brand-700)' }} />
              <span style={{
                fontSize: '8px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: 'var(--color-brand-700)',
              }}>
                Investimentos
              </span>
            </div>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-brand-900)', margin: 0 }}>
              {formatMoney(totalInvestimentos)}
            </p>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '4px',
            padding: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            border: '1px solid #E6E1DB',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <Users style={{ width: '12px', height: '12px', color: 'var(--color-brand-700)' }} />
              <span style={{
                fontSize: '8px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: 'var(--color-brand-700)',
              }}>
                Mão de Obra
              </span>
            </div>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-brand-900)', margin: 0 }}>
              {formatMoney(totalLabor)}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onOpenAddModal(activeTab === 'maodeobra' ? 'maodeobra' : 'custo')}
          style={{
            width: '100%',
            background: 'white',
            border: '1px solid #E6E1DB',
            borderRadius: '4px',
            padding: '8px 10px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-brand-700)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#E6E1DB';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PlusCircle style={{ width: '14px', height: '14px', color: 'var(--color-brand-900)' }} />
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-brand-900)' }}>
              {activeTab === 'maodeobra' ? 'Nova Mão de Obra' : 'Novo Custo / Investimento'}
            </span>
          </div>
          <span style={{ color: 'var(--color-brand-700)', fontSize: '12px' }}>→</span>
        </button>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '3px',
          background: 'white',
          borderRadius: '4px',
          padding: '3px',
          border: '1px solid #E6E1DB',
          overflowX: 'auto',
        }}>
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'custos', label: 'Custos' },
            { id: 'investimentos', label: 'Investimentos' },
            { id: 'maodeobra', label: 'Mão de Obra' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '4px 8px',
                fontSize: '9px',
                fontWeight: 'bold',
                borderRadius: '3px',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab.id ? 'var(--color-brand-900)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--color-brand-700)',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search style={{
            width: '11px',
            height: '11px',
            position: 'absolute',
            left: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-brand-700)',
          }} />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '26px',
              paddingRight: '10px',
              paddingTop: '6px',
              paddingBottom: '6px',
              background: 'white',
              border: '1px solid #E6E1DB',
              borderRadius: '4px',
              fontSize: '10px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredItems.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '6px',
              padding: '20px',
              textAlign: 'center',
              border: '1px solid #E6E1DB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <Receipt style={{ width: '20px', height: '20px', color: '#E6E1DB', margin: '0 auto 8px' }} />
              <p style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-brand-900)', margin: 0 }}>
                Nenhum registro
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #E6E1DB',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '9px',
                    fontWeight: 'bold',
                    color: 'var(--color-brand-900)',
                    margin: '0 0 3px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.description}
                  </p>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{
                      fontSize: '7px',
                      color: 'var(--color-brand-700)',
                      background: '#F6F2F5',
                      padding: '1px 4px',
                      borderRadius: '2px',
                    }}>
                      {getCostCategoryLabel(item.category)}
                    </span>
                    <span style={{ fontSize: '7px', color: 'var(--color-brand-700)' }}>
                      {formatDateBr(item.date)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--color-brand-900)' }}>
                    -{formatMoney(item.totalValue)}
                  </span>
                  <button
                    onClick={() => onEditTransaction(item)}
                    style={{
                      padding: '3px',
                      borderRadius: '3px',
                      color: 'var(--color-brand-700)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F6F2F5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Edit3 style={{ width: '11px', height: '11px' }} />
                  </button>
                  <button
                    onClick={() => onDeleteTransaction(item)}
                    style={{
                      padding: '3px',
                      borderRadius: '3px',
                      color: 'var(--color-brand-700)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#dc2626';
                      e.currentTarget.style.background = '#F6F2F5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-brand-700)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Trash2 style={{ width: '11px', height: '11px' }} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        </div>
      </div>
    </div>
  );
};
