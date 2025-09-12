import React, { memo, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { format, subMonths, eachMonthOfInterval, parseISO } from 'date-fns';

const ExpenseTrendChart = memo(function ExpenseTrendChart({ expenses, categories }) {
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
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                name="Total"
                dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="paid" 
                stroke="hsl(var(--green-500))" 
                strokeWidth={2}
                name="Pago"
                dot={{ fill: 'hsl(var(--green-500))', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="pending" 
                stroke="hsl(var(--yellow-500))" 
                strokeWidth={2}
                name="Pendente"
                dot={{ fill: 'hsl(var(--yellow-500))', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

export { ExpenseTrendChart };
