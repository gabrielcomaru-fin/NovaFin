import React, { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function PeriodFilter({
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
        label: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }),
      })),
    []
  );

  // SE dateRange ESTIVER DEFINIDO, MOSTRAR sempre 'custom'
  const displayPeriodType = dateRange?.from ? 'custom' : periodType;

  const renderYearSelect = () => (
    <Select value={year?.toString()} onValueChange={(v) => setYear(Number(v))}>
      <SelectTrigger className="w-full md:w-[150px]">
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
  );

  const renderMonthSelect = () => (
    <Select value={month?.toString()} onValueChange={(v) => setMonth(Number(v))}>
      <SelectTrigger className="w-full md:w-[150px]">
        <SelectValue placeholder="Mês" />
      </SelectTrigger>
      <SelectContent>
        {months.map((m) => (
          <SelectItem key={m.value} value={m.value.toString()}>
            {m.label.charAt(0).toUpperCase() + m.label.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  useEffect(() => {
    if (isPopoverOpen) {
      setTempRange(dateRange);
    }
  }, [isPopoverOpen, dateRange]);

  const handleConfirmRange = () => {
    if (tempRange?.from) {
      setDateRange(tempRange);
    }
    setIsPopoverOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 mb-6 bg-card rounded-lg border">
      {/* Tipo de Período */}
      <Select value={displayPeriodType} onValueChange={setPeriodType}>
        <SelectTrigger className="w-full md:w-[150px]">
          <SelectValue placeholder="Tipo de Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="monthly">Mensal</SelectItem>
          <SelectItem value="yearly">Anual</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {/* Mensal */}
      {displayPeriodType === 'monthly' && (
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {renderMonthSelect()}
          {renderYearSelect()}
        </div>
      )}

      {/* Anual */}
      {displayPeriodType === 'yearly' && <div className="w-full md:w-auto">{renderYearSelect()}</div>}

      {/* Personalizado */}
      {displayPeriodType === 'custom' && (
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full md:w-auto justify-start text-left font-normal',
                  !dateRange && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from
                  ? dateRange.to
                    ? `${format(dateRange.from, 'dd/MM/yy')} - ${format(dateRange.to, 'dd/MM/yy')}`
                    : format(dateRange.from, 'dd/MM/yy')
                  : 'Data Personalizada'}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-4" align="start">
              <Calendar
                mode="range"
                selected={tempRange}
                onSelect={setTempRange}
                numberOfMonths={2}
              />
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

          <Button
            variant="ghost"
            onClick={() => {
              setDateRange(undefined);
              setTempRange(undefined);
            }}
            className="w-full md:w-auto"
          >
            Limpar Data
          </Button>
        </div>
      )}
    </div>
  );
}
