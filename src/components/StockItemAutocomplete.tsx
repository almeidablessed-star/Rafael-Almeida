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
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    console.log(`[StockItemAutocomplete] ${msg}`);
    setDebugLogs((prev) => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const updateItemScrollHint = () => {
    const el = itemListRef.current;
    if (!el) {
      setHasMoreItemsBelow(false);
      return;
    }
    setHasMoreItemsBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 1);
  };

  const matchingItems = React.useMemo(() => {
    if (!isEnabled) {
      addLog(`matchingItems: isEnabled=false, retornando []`);
      return [];
    }
    const q = normalizeName(value);
    addLog(`matchingItems: value="${value}", normalized="${q}", stockItems.length=${stockItems.length}`);
    if (!q) {
      addLog(`matchingItems: q vazio, retornando todos ${stockItems.length} itens`);
      return stockItems;
    }
    const filtered = stockItems.filter((item) => normalizeName(item.name).includes(q));
    addLog(`matchingItems: filtrado=${filtered.length} itens`);
    return filtered;
  }, [value, stockItems, isEnabled]);

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

  React.useEffect(() => {
    addLog(`render: value="${value}", showItemList=${showItemList}, matchingItems=${matchingItems.length}, isEnabled=${isEnabled}`);
  }, [value, showItemList, matchingItems.length, isEnabled]);

  React.useEffect(() => {
    addLog(`showItemList mudou para: ${showItemList}`);
  }, [showItemList]);

  return (
    <div ref={itemBoxRef} style={{ position: 'relative' }}>
      <div style={{ fontSize: '9px', color: '#999', marginBottom: '4px', padding: '4px', background: '#f5f5f5', borderRadius: '4px', maxHeight: '80px', overflow: 'auto' }}>
        {debugLogs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          addLog(`onChange: value="${e.target.value}", isEnabled=${isEnabled}`);
          onChange(e.target.value);
          if (isEnabled) {
            addLog(`onChange: setShowItemList(true) chamado`);
            setShowItemList(true);
          }
        }}
        onInput={(e) => {
          const target = e.target as HTMLInputElement;
          addLog(`onInput: value="${target.value}", isEnabled=${isEnabled}`);
          onChange(target.value);
          if (isEnabled) {
            addLog(`onInput: setShowItemList(true) chamado`);
            setShowItemList(true);
          }
        }}
        onFocus={() => {
          addLog(`onFocus: isEnabled=${isEnabled}`);
          if (isEnabled) {
            addLog(`onFocus: setShowItemList(true) chamado`);
            setShowItemList(true);
          }
        }}
        onKeyDown={handleItemKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          width: '100%',
          padding: '11px 13px',
          background: '#FAF7FA',
          border: '1px solid rgba(36,27,43,.08)',
          borderRadius: '14px',
          fontSize: '11px',
          color: '#241B2B',
          fontFamily: "'Manrope', sans-serif",
          boxSizing: 'border-box',
        }}
      />

      {showItemList && matchingItems.length > 0 && (
        <div style={{ position: 'absolute', zIndex: 30, left: 0, right: 0, marginTop: '4px' }}>
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
