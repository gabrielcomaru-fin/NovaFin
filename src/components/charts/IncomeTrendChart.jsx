import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinance } from '@/contexts/FinanceDataContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';
import { formatCurrencyBRL } from '@/lib/format';
import { subMonths, startOfMonth, endOfMonth, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function IncomeTrendChart() {
  const { incomes } = useFinance();

  const chartData = useMemo(() => {
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthIncomes = incomes.filter(income => {
        const incomeDate = parseISO(income.data);
        return incomeDate >= monthStart && incomeDate <= monthEnd;
      });
      
      const totalIncome = monthIncomes.reduce((sum, income) => sum + income.valor, 0);
      
      last6Months.push({
        month: format(monthDate, 'MMM/yy', { locale: ptBR }),
        receitas: totalIncome,
        count: monthIncomes.length
      });
    }
    
    return last6Months;
  }, [incomes]);

  const totalIncome = chartData.reduce((sum, item) => sum + item.receitas, 0);
  const averageIncome = chartData.length > 0 ? totalIncome / chartData.length : 0;

  if (chartData.length === 0 || totalIncome === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Evolução das Receitas
          </CardTitle>
          <CardDescription>Últimos 6 meses de receitas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Nenhuma receita registrada</p>
              <p className="text-sm">Adicione receitas para ver a evolução</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Evolução das Receitas
        </CardTitle>
        <CardDescription>
          Últimos 6 meses • Total: {formatCurrencyBRL(totalIncome)} • Média: {formatCurrencyBRL(averageIncome)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrencyBRL(value),
                  name === 'receitas' ? 'Receitas' : 'Quantidade'
                ]}
                labelFormatter={(label) => `Mês: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="receitas"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Estatísticas adicionais */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Maior Receita</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrencyBRL(Math.max(...chartData.map(d => d.receitas)))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total de Entradas</p>
            <p className="text-lg font-semibold">
              {chartData.reduce((sum, item) => sum + item.count, 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

