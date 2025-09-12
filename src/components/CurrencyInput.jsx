import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

const formatCurrency = (value) => {
  if (!value) return '';
  
  // Verifica se é negativo
  const isNegative = value.startsWith('-');
  const cleanValue = isNegative ? value.substring(1) : value;
  
  const numberValue = parseFloat(cleanValue.replace(/\./g, '').replace(',', '.'));
  if (isNaN(numberValue)) return '';
  
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
  
  return isNegative ? '-' + formatted : formatted;
};

const unformatCurrency = (value) => {
  if (!value) return '';
  
  // Verifica se é negativo
  const isNegative = value.startsWith('-');
  const cleanValue = isNegative ? value.substring(1) : value;
  
  const unformatted = cleanValue.replace(/\./g, '').replace(',', '.');
  return isNegative ? '-' + unformatted : unformatted;
};

export const CurrencyInput = ({ value, onChange, ...props }) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    setDisplayValue(formatCurrency(value));
  }, [value]);

  const handleChange = (e) => {
    let inputValue = e.target.value;
    let isNegative = inputValue.startsWith('-');
    
    // Remove tudo exceto números e o sinal negativo no início
    let rawValue = inputValue.replace(/[^0-9-]/g, '');
    
    // Garante que o sinal negativo só aparece no início
    if (rawValue.includes('-')) {
      rawValue = '-' + rawValue.replace(/-/g, '');
    }
    
    // Se não tem sinal negativo mas o input original tinha, adiciona
    if (isNegative && !rawValue.startsWith('-')) {
      rawValue = '-' + rawValue;
    }
    
    // Remove o sinal negativo para processar os números
    let numericValue = rawValue.replace('-', '');
    
    if (numericValue.length > 2) {
      numericValue = numericValue.slice(0, -2) + '.' + numericValue.slice(-2);
    } else if (numericValue.length > 0) {
      numericValue = '0.' + ('00' + numericValue).slice(-2);
    } else {
      numericValue = '';
    }
    
    // Adiciona o sinal negativo de volta se necessário
    const finalValue = isNegative && numericValue ? '-' + numericValue : numericValue;
    
    onChange(finalValue);
    setDisplayValue(formatCurrency(finalValue));
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