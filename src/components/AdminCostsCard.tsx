import React, { useState } from 'react';
import { useCosts } from '../context/CostsContext';
import { useCurrency } from '../context/CurrencyContext';
import { Edit3, Save, X, AlertCircle, Droplet, Home, Zap, Flame, Wifi, Sparkles, Fuel, Clock } from 'lucide-react';

export const AdminCostsCard: React.FC = () => {
  const { administrativeCosts, saveCosts, error } = useCosts();
  const { formatCurrency: formatMoney } = useCurrency();
  const [isEditing, setIsEditing] = useState(false);
  const [localCosts, setLocalCosts] = useState(administrativeCosts);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!administrativeCosts) return null;

  const handleSave = async () => {
    if (!localCosts) return;
    try {
      setIsSaving(true);
      setSaveError(null);
      await saveCosts(localCosts);
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err.message || 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof administrativeCosts, value: number) => {
    setLocalCosts((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  // Só despesas MENSAIS. A hora de trabalho saiu daqui: e uma tarifa por hora,
  // nao um gasto do mes, e somada junto produzia um total sem sentido — que e
  // exatamente o numero usado para calcular a meta de faturamento semanal.
  const costFields = [
    { key: 'agua', label: 'Água', icon: Droplet },
    { key: 'aluguel', label: 'Aluguel', icon: Home },
    { key: 'energia', label: 'Energia', icon: Zap },
    { key: 'gas', label: 'Gás', icon: Flame },
    { key: 'gasolina', label: 'Gasolina', icon: Fuel },
    { key: 'internet', label: 'Internet', icon: Wifi },
    { key: 'limpeza', label: 'Limpeza', icon: Sparkles },
  ] as const;

  const totalMensal = (localCosts?.agua || 0) + (localCosts?.aluguel || 0) +
    (localCosts?.energia || 0) + (localCosts?.gas || 0) + (localCosts?.gasolina || 0) +
    (localCosts?.internet || 0) + (localCosts?.limpeza || 0);

  return (
    <div className="space-y-2">
      {/* Header Row */}
      <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
        <h3 style={{
          fontSize: '10px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--color-brand-900)',
        }}>
          Custos Administrativos (Mensais)
        </h3>
        {!isEditing && (
          <button
            onClick={() => {
              setLocalCosts(administrativeCosts);
              setIsEditing(true);
            }}
            style={{
              padding: '4px',
              borderRadius: '4px',
              color: 'var(--color-brand-700)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-brand-900)';
              e.currentTarget.style.background = '#E6E1DB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-brand-700)';
              e.currentTarget.style.background = 'transparent';
            }}
            title="Editar"
          >
            <Edit3 style={{ width: '14px', height: '14px' }} />
          </button>
        )}
      </div>

      {/* Error Messages */}
      {(error || saveError) && (
        <div style={{
          padding: '6px',
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '4px',
          display: 'flex',
          gap: '6px',
          fontSize: '9px',
          color: '#dc2626',
        }}>
          <AlertCircle style={{ width: '12px', height: '12px', flexShrink: 0, marginTop: '2px' }} />
          <span>{error || saveError}</span>
        </div>
      )}

      {/* Display/Edit Mode */}
      {!isEditing ? (
        // Display Mode - Grid de 2 colunas
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
        }}>
          {costFields.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              style={{
                background: 'white',
                border: '1px solid #E6E1DB',
                borderRadius: '4px',
                padding: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Icon style={{ width: '12px', height: '12px', color: 'var(--color-brand-700)' }} />
                <span style={{
                  fontSize: '9px',
                  fontWeight: 'bold',
                  color: 'var(--color-brand-700)',
                  textTransform: 'uppercase',
                }}>
                  {label}
                </span>
              </div>
              <p style={{
                fontSize: '11px',
                fontWeight: 'bold',
                color: 'var(--color-brand-900)',
                margin: 0,
              }}>
                {formatMoney(administrativeCosts[key as keyof typeof administrativeCosts])}
              </p>
            </div>
          ))}

          {/* Tarifa por hora: ocupa a linha inteira e nao soma com as de cima,
              para a leitura nao sugerir que e mais uma despesa do mes. */}
          <div
            style={{
              gridColumn: '1 / -1',
              background: '#FAF7FA',
              border: '1px dashed #E6E1DB',
              borderRadius: '4px',
              padding: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <Clock style={{ width: '12px', height: '12px', color: 'var(--color-brand-700)' }} />
              <span style={{
                fontSize: '9px',
                fontWeight: 'bold',
                color: 'var(--color-brand-700)',
                textTransform: 'uppercase',
              }}>
                Sua hora de trabalho
              </span>
            </div>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-brand-900)', margin: 0 }}>
              {formatMoney(administrativeCosts.horaTrabalho)}
              <span style={{ fontSize: '9px', fontWeight: 'normal', color: '#7A6E80' }}> / hora</span>
            </p>
          </div>
        </div>
      ) : (
        // Edit Mode - Simples
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          padding: '8px',
          background: 'white',
          border: '1px solid #E6E1DB',
          borderRadius: '4px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}>
          {costFields.map(({ key, label, icon: Icon }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon style={{ width: '12px', height: '12px', color: 'var(--color-brand-700)', flexShrink: 0 }} />
              <label style={{
                fontSize: '9px',
                fontWeight: '500',
                color: 'var(--color-brand-900)',
                minWidth: '60px',
              }}>
                {label}
              </label>
              <input
                type="number"
                step="0.01"
                value={localCosts?.[key as keyof typeof administrativeCosts] || 0}
                onChange={(e) =>
                  handleInputChange(key as keyof typeof administrativeCosts, parseFloat(e.target.value) || 0)
                }
                style={{
                  flex: 1,
                  padding: '4px',
                  border: '1px solid #E6E1DB',
                  borderRadius: '3px',
                  textAlign: 'right',
                  fontFamily: 'monospace',
                  fontSize: '9px',
                }}
              />
            </div>
          ))}

          {/* Total */}
          <div style={{
            paddingTop: '6px',
            borderTop: '1px solid #E6E1DB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '9px',
          }}>
            <span style={{ fontWeight: 'bold', color: 'var(--color-brand-900)' }}>Total Mensal</span>
            <span style={{ fontWeight: 'bold', color: 'var(--color-brand-900)' }}>
              {formatMoney(totalMensal)}
            </span>
          </div>

          {/* Tarifa por hora — separada das despesas de propósito. */}
          <div style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px dashed #E6E1DB',
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '9px',
              fontWeight: 'bold',
              color: 'var(--color-brand-900)',
              marginBottom: '4px',
            }}>
              <Clock size={11} />
              Sua hora de trabalho (R$/hora)
            </label>
            <input
              type="number"
              step="0.01"
              value={localCosts?.horaTrabalho || 0}
              onChange={(e) => handleInputChange('horaTrabalho', parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '11px',
                border: '1px solid #E6E1DB',
                borderRadius: '4px',
              }}
            />
            <p style={{ fontSize: '9px', color: '#7A6E80', marginTop: '4px', lineHeight: 1.4 }}>
              Não entra no total mensal. Serve como sugestão: vem preenchida nas
              fichas técnicas novas, onde você pode ajustar bolo a bolo — um
              decorado pode valer mais por hora que um simples.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '6px', paddingTop: '6px' }}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '6px',
                background: 'var(--color-brand-900)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '9px',
                fontWeight: 'bold',
                opacity: isSaving ? 0.5 : 1,
              }}
            >
              <Save style={{ width: '12px', height: '12px' }} />
              {isSaving ? 'Salvando' : 'Salvar'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '6px',
                border: '1px solid #E6E1DB',
                background: 'white',
                color: 'var(--color-brand-900)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '9px',
                fontWeight: 'bold',
                opacity: isSaving ? 0.5 : 1,
              }}
            >
              <X style={{ width: '12px', height: '12px' }} />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Total Summary Card */}
      {!isEditing && (
        <div style={{
          background: 'white',
          border: '1px solid #E6E1DB',
          borderRadius: '4px',
          padding: '8px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}>
          <p style={{
            fontSize: '9px',
            color: 'var(--color-brand-700)',
            fontWeight: '500',
            margin: '0 0 4px 0',
            textTransform: 'uppercase',
          }}>
            Total Custos Administrativos
          </p>
          <p style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'var(--color-brand-900)',
            margin: 0,
          }}>
            {formatMoney(administrativeCosts.total)}
            <span style={{
              fontSize: '9px',
              color: 'var(--color-brand-700)',
              marginLeft: '4px',
            }}>
              /mês
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
