import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

const formatCurrency = (value) => {
  if (!value) return '';
  const numberValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
  if (isNaN(numberValue)) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
};

const unformatCurrency = (value) => {
  if (!value) return '';
  return value.replace(/\./g, '').replace(',', '.');
};

export const CurrencyInput = ({ value, onChange, ...props }) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    setDisplayValue(formatCurrency(value));
  }, [value]);

  const handleChange = (e) => {
    let rawValue = e.target.value.replace(/[^0-9]/g, '');
    
    if (rawValue.length > 2) {
      rawValue = rawValue.slice(0, -2) + '.' + rawValue.slice(-2);
    } else if (rawValue.length > 0) {
      rawValue = '0.' + ('00' + rawValue).slice(-2);
    } else {
        rawValue = '';
    }
    
    onChange(rawValue);
    setDisplayValue(formatCurrency(rawValue));
  };
  
  const handleBlur = (e) => {
    const formatted = formatCurrency(unformatCurrency(e.target.value));
    setDisplayValue(formatted);
  };

  return (
    <Input
      {...props}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      type="text"
      inputMode="decimal"
    />
  );
};