import React, { useState, useEffect, useRef } from 'react';
import { StockItem } from '../types';
import { normalizeName } from '../utils/fichaMatcher';

interface StockItemAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: StockItem) => void;
  stockItems: StockItem[];
  isEnabled: boolean;
  placeholder: string;
}

export const StockItemAutocomplete: React.FC<StockItemAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  stockItems,
  isEnabled,
  placeholder,
}) => {
  const [showItemList, setShowItemList] = useState(false);
  const [highlightedItem, setHighlightedItem] = useState(-1);
  const itemBoxRef = useRef<HTMLDivElement>(null);
  const itemListRef = useRef<HTMLUListElement>(null);
  const [hasMoreItemsBelow, setHasMoreItemsBelow] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');

  const updateItemScrollHint = () => {
    const el = itemListRef.current;
    if (!el) {
      setHasMoreItemsBelow(false);
      return;
    }
    setHasMoreItemsBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 1);
  };

  const matchingItems = React.useMemo(() => {
    const q = normalizeName(value);
    if (!q) return stockItems;
    return stockItems.filter((item) => normalizeName(item.name).includes(q));
  }, [value, stockItems]);

  const applyStockItem = (item: StockItem) => {
    onChange(item.name);
    onSelect(item);
    setShowItemList(false);
    setHighlightedItem(-1);
  };

  const handleItemKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showItemList || matchingItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedItem((i) => (i + 1) % matchingItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedItem((i) => (i <= 0 ? matchingItems.length - 1 : i - 1));
    } else if (e.key === 'Enter' && highlightedItem >= 0) {
      e.preventDefault();
      applyStockItem(matchingItems[highlightedItem]);
    } else if (e.key === 'Escape') {
      setShowItemList(false);
      setHighlightedItem(-1);
    }
  };

  useEffect(() => {
    if (!showItemList) {
      setHasMoreItemsBelow(false);
      return;
    }

    // Detectar posição do dropdown e scroll para ficar visível
    setTimeout(() => {
      const inputBox = itemBoxRef.current;
      if (!inputBox) return;

      const rect = inputBox.getBoundingClientRect();
      const dropdownHeight = 188 + 8; // maxHeight + marginTop
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Se há mais espaço acima ou espaço abaixo é insuficiente, abre para cima
      if (spaceAbove > spaceBelow && spaceAbove > dropdownHeight) {
        setDropdownPosition('above');
      } else {
        setDropdownPosition('below');
      }

      // Auto-scroll o container pai para colocar o dropdown visível
      inputBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);

    const id = requestAnimationFrame(updateItemScrollHint);
    return () => cancelAnimationFrame(id);
  }, [showItemList, matchingItems]);

  useEffect(() => {
    if (highlightedItem < 0) return;
    const item = itemListRef.current?.children[highlightedItem] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightedItem]);

  useEffect(() => {
    if (!showItemList) return;
    const onDocClick = (e: Event) => {
      if (itemBoxRef.current && !itemBoxRef.current.contains(e.target as Node)) {
        setShowItemList(false);
        setHighlightedItem(-1);
      }
    };
    document.addEventListener('pointerdown', onDocClick);
    return () => document.removeEventListener('pointerdown', onDocClick);
  }, [showItemList]);

  return (
    <div ref={itemBoxRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowItemList(true);
        }}
        onInput={(e) => {
          const target = e.target as HTMLInputElement;
          onChange(target.value);
          setShowItemList(true);
        }}
        onFocus={() => setShowItemList(true)}
        onKeyDown={handleItemKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          width: '100%',
          padding: window.innerWidth < 768 ? '12px 13px' : '11px 13px',
          minHeight: window.innerWidth < 768 ? '44px' : 'auto',
          background: '#FAF7FA',
          border: '1px solid rgba(36,27,43,.08)',
          borderRadius: '14px',
          fontSize: window.innerWidth < 768 ? '16px' : '11px',
          color: '#241B2B',
          fontFamily: "'Manrope', sans-serif",
          boxSizing: 'border-box',
        }}
      />

      {showItemList && matchingItems.length > 0 && (
        <div style={{
          position: 'absolute',
          zIndex: 9999,
          left: 0,
          right: 0,
          ...(dropdownPosition === 'above' ? { bottom: '100%', marginBottom: '4px' } : { top: '100%', marginTop: '4px' })
        }}>
          <div style={{ position: 'relative' }}>
            <ul
              ref={itemListRef}
              onScroll={updateItemScrollHint}
              style={{
                maxHeight: '188px',
                overflowY: 'auto',
                background: '#FFFFFF',
                border: '1px solid rgba(36,27,43,.12)',
                borderRadius: '12px',
                boxShadow: '0 8px 20px rgba(58,35,80,.15)',
                listStyle: 'none',
                margin: 0,
                padding: 0,
              }}
            >
              {matchingItems.map((item, i) => (
                <li key={item.id} role="option" aria-selected={i === highlightedItem}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyStockItem(item);
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      applyStockItem(item);
                    }}
                    onClick={() => applyStockItem(item)}
                    onMouseEnter={() => setHighlightedItem(i)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '11px 13px',
                      background: i === highlightedItem ? '#F3E9F3' : '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: '#241B2B',
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: i === highlightedItem ? 600 : 500,
                      transition: 'background .15s ease',
                      borderBottom: i < matchingItems.length - 1 ? '1px solid rgba(36,27,43,.04)' : 'none',
                    }}
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
            {hasMoreItemsBelow && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '24px',
                  background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,.8))',
                  borderBottomLeftRadius: '11px',
                  borderBottomRightRadius: '11px',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
