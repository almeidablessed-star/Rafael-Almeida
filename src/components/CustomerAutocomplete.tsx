import React, { useState, useRef, useEffect } from 'react';
import { Customer } from '../types';
import { ChevronDown } from 'lucide-react';

interface CustomerAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  customers: Customer[];
  placeholder?: string;
  disabled?: boolean;
}

export const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({
  value,
  onChange,
  customers,
  placeholder = 'Nome do cliente...',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter customers based on input value
  useEffect(() => {
    if (!value.trim()) {
      setFilteredCustomers([]);
      setIsOpen(false);
      return;
    }

    const filtered = customers.filter((c) =>
      c.name.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredCustomers(filtered);
    setIsOpen(filtered.length > 0);
  }, [value, customers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCustomer = (customer: Customer) => {
    onChange(customer.name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleInputFocus = () => {
    if (value.trim() && filteredCustomers.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onClick={handleInputFocus}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-lg text-xs font-bold text-[var(--color-neutral-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: disabled
            ? '#f0f0f0'
            : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(245,185,198,0.06) 100%)',
          border: '1.5px solid rgba(201,168,120,0.3)',
        }}
      />

      {isOpen && filteredCustomers.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto"
          style={{
            boxShadow: '0 8px 16px rgba(58, 35, 80, 0.15)',
          }}
        >
          {filteredCustomers.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => handleSelectCustomer(customer)}
              className="w-full text-left px-4 py-2.5 hover:bg-[#F5F5F5] border-b border-gray-100 last:border-b-0 transition-colors active:bg-[#EFEFEF]"
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[var(--color-neutral-charcoal)]">
                  {customer.name}
                </span>
                {customer.phone && (
                  <span className="text-xs text-gray-500">
                    {customer.phone}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Indicator icon */}
      {filteredCustomers.length > 0 && isOpen && (
        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
      )}
    </div>
  );
};
