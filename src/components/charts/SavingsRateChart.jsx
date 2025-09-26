import React, { memo, useMemo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subMonths, eachMonthOfInterval, parseISO } from 'date-fns';

// Exibe a taxa de poupança mensal: investimentos / (investimentos + gastos pagos)
const SavingsRateChart = memo(function SavingsRateChart({ expenses, investments }) {
  const data = useMemo(() => {
    const last12Months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date()
    });

    return last12Months.map(month => {
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const monthExpensesPaid = expenses.filter(expense => {
        if (!expense.data) return false;
        try {
          const d = parseISO(expense.data);
          return expense.pago === true && d >= monthStart && d <= monthEnd;
        } catch { return false; }
      }).reduce((s, e) => s + (e.valor || 0), 0);

      const monthInvestments = investments.filter(inv => {
        if (!inv.data) return false;
        try {
          const d = parseISO(inv.data);
          return d >= monthStart && d <= monthEnd;
        } catch { return false; }
      }).reduce((s, inv) => s + (inv.valor_aporte || 0), 0);

      const denom = monthInvestments + monthExpensesPaid;
      const savingsRate = denom > 0 ? (monthInvestments / denom) * 100 : 0;

      return {
        name: format(month, 'MMM/yy'),
        savingsRate,
        investments: monthInvestments,
        expensesPaid: monthExpensesPaid,
      };
    });
  }, [expenses, investments]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.dataKey === 'savingsRate' ? `${entry.value.toFixed(1)}%` : `R$ ${Number(entry.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
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
        <CardTitle>Taxa de Poupança (12 meses)</CardTitle>
        <CardDescription>Percentual do que foi investido sobre (investido + gastos pagos)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={{ stroke: 'hsl(var(--muted-foreground))' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickLine={{ stroke: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v.toFixed(0)}%`} domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickLine={{ stroke: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="right" dataKey="investments" name="Aportes" fill="#16a34a" radius={[4,4,0,0]} />
              <Bar yAxisId="right" dataKey="expensesPaid" name="Gastos pagos" fill="#ef4444" radius={[4,4,0,0]} />
              <Line yAxisId="left" type="monotone" dataKey="savingsRate" name="Taxa de poupança" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

export { SavingsRateChart };



