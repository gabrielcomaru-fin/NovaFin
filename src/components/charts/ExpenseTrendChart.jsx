import React, { memo, useMemo } from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { format, subMonths, eachMonthOfInterval, parseISO } from 'date-fns';
import { useFinance } from '@/contexts/FinanceDataContext';

const ExpenseTrendChart = memo(function ExpenseTrendChart() {
  const { expenses } = useFinance();
  const chartData = useMemo(() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return last6Months.map(month => {
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = parseISO(expense.data);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });

      const totalExpenses = monthExpenses.reduce((sum, exp) => sum + exp.valor, 0);
      const paidExpenses = monthExpenses.filter(exp => exp.pago).reduce((sum, exp) => sum + exp.valor, 0);
      const pendingExpenses = totalExpenses - paidExpenses;

      return {
        month: format(month, 'MMM/yy'),
        total: totalExpenses,
        paid: paidExpenses,
        pending: pendingExpenses,
        fullMonth: format(month, 'MMMM yyyy')
      };
    });
  }, [expenses]);

  const totalTrend = useMemo(() => {
    if (chartData.length < 2) return 0;
    const current = chartData[chartData.length - 1].total;
    const previous = chartData[chartData.length - 2].total;
    return ((current - previous) / previous) * 100;
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Cores explícitas para evitar "bolas pretas" em temas sem vars CSS
  const COLOR_TOTAL = '#ef4444';   // red-500
  const COLOR_PAID = '#16a34a';    // green-600
  const COLOR_PENDING = '#f59e0b'; // amber-500

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-destructive" />
          Tendência de Gastos
        </CardTitle>
        <CardDescription>
          Evolução dos gastos nos últimos 6 meses
          {totalTrend !== 0 && (
            <span className={`ml-2 flex items-center gap-1 ${
              totalTrend > 0 ? 'text-destructive' : 'text-green-600'
            }`}>
              {totalTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(totalTrend).toFixed(1)}% vs mês anterior
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {/* Áreas semitransparentes para comparação */}
              <Area
                type="monotone"
                dataKey="paid"
                name="Pago"
                stroke={COLOR_PAID}
                fill={COLOR_PAID}
                fillOpacity={0.2}
                strokeOpacity={0.7}
                dot={false}
                activeDot={{ r: 5, fill: COLOR_PAID, stroke: '#ffffff', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="pending"
                name="Pendente"
                stroke={COLOR_PENDING}
                fill={COLOR_PENDING}
                fillOpacity={0.18}
                strokeOpacity={0.6}
                dot={false}
                activeDot={{ r: 5, fill: COLOR_PENDING, stroke: '#ffffff', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke={COLOR_TOTAL}
                strokeWidth={2.5}
                name="Total"
                dot={{ fill: COLOR_TOTAL, stroke: COLOR_TOTAL, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: COLOR_TOTAL, stroke: '#ffffff', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

export { ExpenseTrendChart };
