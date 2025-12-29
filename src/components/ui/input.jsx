import React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  const inputClassName = cn(
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary/50 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
    'dark:[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none', // Remove spinners for number inputs
    className
  );
  return (
    <input
      type={type}
      className={inputClassName}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

const CurrencyInput = React.forwardRef(({ className, value, onChange, ...props }, ref) => {
  const handleInputChange = (event) => {
    const rawValue = event.target.value;
    const numericValue = rawValue.replace(/[^0-9]/g, '');

    if (numericValue === '') {
      onChange('');
      return;
    }

    const numberValue = Number(numericValue) / 100;
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numberValue);

    onChange(formattedValue);
  };
  
  const getRawValueForInput = (val) => {
    if(typeof val === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
    }
    if(typeof val === 'string' && val.trim() === '') return '';
    if(typeof val === 'string') {
        // Se já está formatado corretamente, retorna como está
        if(val.includes(',') && val.match(/^\d{1,3}(\.\d{3})*,\d{2}$/)) {
          return val;
        }
        // Se é um número simples (sem formatação), converte e formata
        if(val.match(/^\d+(\.\d{1,2})?$/)) {
          const numberVal = parseFloat(val);
          if(!isNaN(numberVal)) {
            return new Intl.NumberFormat('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(numberVal);
          }
        }
        // Se não está formatado, converte e formata
        const numericString = val.replace(/\./g, '').replace(',', '.');
        const numberVal = parseFloat(numericString);
        if(!isNaN(numberVal)) {
          return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(numberVal);
        }
    }
    return val;
  }

  return (
    <Input
      type="text"
      inputMode="decimal"
      className={className}
      value={getRawValueForInput(value)}
      onChange={handleInputChange}
      ref={ref}
      {...props}
    />
  );
});
CurrencyInput.displayName = 'CurrencyInput';


export { Input, CurrencyInput };