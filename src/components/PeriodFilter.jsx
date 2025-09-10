import React, { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

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

  const displayPeriodType = useMemo(() => (dateRange?.from ? 'custom' : periodType), [dateRange, periodType]);

  const renderYearSelect = () => (
    <Select value={year?.toString()} onValueChange={(v) => setYear(Number(v))}>
      <SelectTrigger
        className={cn(
          'w-full md:w-[150px] border shadow-sm rounded-lg transition-colors duration-200',
          year
            ? 'border-gray-400 bg-gray-100 dark:bg-gray-700 dark:border-gray-600'
            : 'border-gray-200 bg-white hover:border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500'
        )}
        aria-label="Selecione o ano"
      >
        <SelectValue placeholder="Ano" className="dark:text-gray-200" />
      </SelectTrigger>
      <SelectContent className="shadow-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800">
        {years.map((y) => (
          <SelectItem key={y} value={y.toString()} className="dark:text-gray-200">
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const renderMonthSelect = () => (
    <Select value={month?.toString()} onValueChange={(v) => setMonth(Number(v))}>
      <SelectTrigger
        className={cn(
          'w-full md:w-[150px] border shadow-sm rounded-lg transition-colors duration-200',
          month !== undefined
            ? 'border-gray-400 bg-gray-100 dark:bg-gray-700 dark:border-gray-600'
            : 'border-gray-200 bg-white hover:border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500'
        )}
        aria-label="Selecione o mês"
      >
        <SelectValue placeholder="Mês" className="dark:text-gray-200" />
      </SelectTrigger>
      <SelectContent className="shadow-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800">
        {months.map((m) => (
          <SelectItem key={m.value} value={m.value.toString()} className="dark:text-gray-200">
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
    <div className="flex flex-wrap items-center gap-4 p-4 mb-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-md">
      {/* Tipo de Período */}
      <Select value={displayPeriodType} onValueChange={setPeriodType}>
        <SelectTrigger
          className={cn(
            'w-full md:w-[150px] border shadow-sm rounded-lg transition-colors duration-200',
            'border-gray-200 bg-white hover:border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500'
          )}
          aria-label="Selecione o tipo de período"
        >
          <SelectValue placeholder="Tipo de Período" className="dark:text-gray-200" />
        </SelectTrigger>
        <SelectContent className="shadow-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800">
          <SelectItem value="monthly" className="dark:text-gray-200">Mensal</SelectItem>
          <SelectItem value="yearly" className="dark:text-gray-200">Anual</SelectItem>
          <SelectItem value="custom" className="dark:text-gray-200">Personalizado</SelectItem>
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
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full md:w-auto justify-start text-left font-medium border rounded-lg shadow-sm transition-colors duration-200',
                    dateRange?.from
                      ? 'border-gray-400 bg-gray-100 dark:bg-gray-700 dark:border-gray-600'
                      : 'border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600'
                  )}
                  aria-label="Selecionar período personalizado"
                >
                  <CalendarIcon className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-300" />
                  {dateRange?.from
                    ? dateRange.to
                      ? `${format(dateRange.from, 'dd/MM/yy')} - ${format(dateRange.to, 'dd/MM/yy')}`
                      : format(dateRange.from, 'dd/MM/yy')
                    : 'Data Personalizada'}
                </Button>
              </motion.div>
            </PopoverTrigger>

            <PopoverContent
              className="w-auto p-4 shadow-xl border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-600"
              align="start"
              asChild
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Calendar mode="range" selected={tempRange} onSelect={setTempRange} numberOfMonths={2} />
                <div className="mt-2 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsPopoverOpen(false)}>
                    Cancelar
                  </Button>
                  <Button variant="default" size="sm" onClick={handleConfirmRange}>
                    Confirmar
                  </Button>
                </div>
              </motion.div>
            </PopoverContent>
          </Popover>

          {/* Limpar */}
          <Button
            variant="ghost"
            className={cn(
              'w-full md:w-auto flex items-center gap-1 transition-colors duration-200',
              dateRange?.from
                ? 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200'
            )}
            onClick={() => {
              setDateRange(undefined);
              setTempRange(undefined);
            }}
            aria-label="Limpar período selecionado"
          >
            <Trash2 className="h-4 w-4" />
            Limpar
          </Button>
        </div>
      )}
    </div>
  );
}
