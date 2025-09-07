
import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const PeriodFilter = ({
  periodType,
  setPeriodType,
  dateRange,
  setDateRange,
  month,
  setMonth,
  year,
  setYear,
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }),
  }));

  const handlePeriodTypeChange = (type) => {
    setPeriodType(type);
    setDateRange(undefined);
    if (type === 'monthly') {
      setMonth(new Date().getMonth());
      setYear(new Date().getFullYear());
    } else {
      setMonth(undefined);
      setYear(new Date().getFullYear());
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-card rounded-lg border">
      <div className="flex flex-wrap items-center gap-4">
        <Select value={periodType} onValueChange={handlePeriodTypeChange}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Tipo de Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Mensal</SelectItem>
            <SelectItem value="yearly">Anual</SelectItem>
          </SelectContent>
        </Select>

        {periodType === 'monthly' && (
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={month?.toString()} onValueChange={(value) => setMonth(parseInt(value))}>
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
            <Select value={year?.toString()} onValueChange={(value) => setYear(parseInt(value))}>
              <SelectTrigger className="w-full md:w-[100px]">
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
          </div>
        )}

        {periodType === 'yearly' && (
          <div className="w-full md:w-auto">
            <Select value={year?.toString()} onValueChange={(value) => setYear(parseInt(value))}>
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
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'w-full md:w-auto justify-start text-left font-normal',
                !dateRange && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd/MM/yy')} -{' '}
                    {format(dateRange.to, 'dd/MM/yy')}
                  </>
                ) : (
                  format(dateRange.from, 'dd/MM/yy')
                )
              ) : (
                <span>Data Personalizada</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Button variant="ghost" onClick={() => setDateRange(undefined)} className="w-full md:w-auto">
          Limpar Data
        </Button>
      </div>
    </div>
  );
};
