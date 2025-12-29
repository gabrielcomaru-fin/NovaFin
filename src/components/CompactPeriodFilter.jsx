import React, { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Trash2, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

export function CompactPeriodFilter({
  periodType,
  setPeriodType,
  dateRange,
  setDateRange,
  month,
  setMonth,
  year,
  setYear,
}) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [tempRange, setTempRange] = useState(dateRange);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 10 }, (_, i) => currentYear - i), [currentYear]);
  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label: new Date(0, i).toLocaleString('pt-BR', { month: 'short' }),
      })),
    []
  );

  const displayPeriodType = useMemo(() => (dateRange?.from ? 'custom' : periodType), [dateRange, periodType]);

  // Função auxiliar para garantir que o valor seja um objeto Date válido
  const ensureDate = (value) => {
    if (!value) return null;
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  useEffect(() => {
    if (isPopoverOpen) {
      // Garantir que as datas sejam objetos Date válidos ao abrir o popover
      if (dateRange?.from) {
        const fromDate = ensureDate(dateRange.from);
        const toDate = ensureDate(dateRange.to);
        setTempRange({
          from: fromDate,
          to: toDate
        });
      } else {
        setTempRange(dateRange);
      }
    }
  }, [isPopoverOpen, dateRange]);

  const handleConfirmRange = () => {
    if (tempRange?.from) {
      setDateRange(tempRange);
    }
    setIsPopoverOpen(false);
  };

  const getDisplayText = () => {
    if (dateRange?.from) {
      const fromDate = ensureDate(dateRange.from);
      const toDate = ensureDate(dateRange.to);
      
      if (!fromDate) return 'Período';
      
      return toDate
        ? `${format(fromDate, 'dd/MM')} - ${format(toDate, 'dd/MM')}`
        : format(fromDate, 'dd/MM/yy');
    }
    
    if (periodType === 'monthly' && month !== undefined && year) {
      return `${months[month]?.label} ${year}`;
    }
    
    if (periodType === 'yearly' && year) {
      return year.toString();
    }
    
    return 'Período';
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border">
      <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      
      {/* Seletor de tipo de período */}
      <Select value={displayPeriodType} onValueChange={setPeriodType}>
        <SelectTrigger className="w-[130px] h-8 text-xs border-0 bg-transparent shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="monthly">Mensal</SelectItem>
          <SelectItem value="yearly">Anual</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {/* Controles específicos */}
      {displayPeriodType === 'monthly' && (
        <>
          <Select value={month?.toString()} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-[80px] h-8 text-xs border-0 bg-transparent shadow-none">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={year?.toString()} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[70px] h-8 text-xs border-0 bg-transparent shadow-none">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {displayPeriodType === 'yearly' && (
        <Select value={year?.toString()} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-[80px] h-8 text-xs border-0 bg-transparent shadow-none">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {displayPeriodType === 'custom' && (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
            >
              <CalendarIcon className="mr-1 h-3 w-3" />
              {getDisplayText()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <Calendar mode="range" selected={tempRange} onSelect={setTempRange} numberOfMonths={2} />
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsPopoverOpen(false)}>
                Cancelar
              </Button>
              <Button variant="default" size="sm" onClick={handleConfirmRange}>
                Confirmar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Botão limpar */}
      {(dateRange?.from || (periodType !== 'monthly' && periodType !== 'yearly')) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setDateRange(undefined);
            setTempRange(undefined);
            setPeriodType('monthly');
            setMonth(new Date().getMonth());
            setYear(new Date().getFullYear());
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
