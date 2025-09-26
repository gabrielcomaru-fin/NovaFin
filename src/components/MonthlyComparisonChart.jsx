
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, eachMonthOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinance } from '@/contexts/FinanceDataContext';

export const MonthlyComparisonChart = () => {
  const { expenses, investments } = useFinance();
  const data = useMemo(() => {
    const last12Months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date()
    });

    return last12Months.map(month => {
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      // Calcular gastos do mês
      const monthExpenses = expenses.filter(expense => {
        if (!expense.data) return false;
        try {
          const expenseDate = parseISO(expense.data);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        } catch (error) {
          console.warn('Erro ao parsear data do gasto:', expense.data, error);
          return false;
        }
      });
      const totalExpenses = monthExpenses.reduce((sum, exp) => sum + (exp.valor || 0), 0);

      // Calcular aportes do mês
      const monthInvestments = investments.filter(investment => {
        if (!investment.data) return false;
        try {
          const investmentDate = parseISO(investment.data);
          return investmentDate >= monthStart && investmentDate <= monthEnd;
        } catch (error) {
          console.warn('Erro ao parsear data do investimento:', investment.data, error);
          return false;
        }
      });
      const totalInvestments = monthInvestments.reduce((sum, inv) => sum + (inv.valor_aporte || 0), 0);

      return {
        name: format(month, 'MMM/yy', { locale: ptBR }),
        Gastos: totalExpenses,
        Aportes: totalInvestments,
        fullMonth: format(month, 'MMMM yyyy', { locale: ptBR })
      };
    });
  }, [expenses, investments]);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aportes vs. Gastos (Últimos 12 Meses)</CardTitle>
          <CardDescription>Comparativo da sua evolução financeira mensal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Nenhum dado disponível para exibir
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aportes vs. Gastos (Últimos 12 Meses)</CardTitle>
        <CardDescription>Comparativo da sua evolução financeira mensal.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(value) => `R$${value/1000}k`} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--accent))' }}
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
              formatter={(value, name) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, name]}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.fullMonth;
                }
                return label;
              }}
            />
            <Legend />
            <Bar dataKey="Aportes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Gastos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
