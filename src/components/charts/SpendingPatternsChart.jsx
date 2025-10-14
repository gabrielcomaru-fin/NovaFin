import React, { memo, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SpendingPatternsChart = memo(function SpendingPatternsChart({ expenses, periodType = 'monthly' }) {
  const chartData = useMemo(() => {
    if (!expenses.length) return [];

    // Agrupar despesas por dia da semana
    const dayOfWeekTotals = {
      'Segunda': 0,
      'Terça': 0,
      'Quarta': 0,
      'Quinta': 0,
      'Sexta': 0,
      'Sábado': 0,
      'Domingo': 0
    };

    const dayOfWeekCounts = {
      'Segunda': 0,
      'Terça': 0,
      'Quarta': 0,
      'Quinta': 0,
      'Sexta': 0,
      'Sábado': 0,
      'Domingo': 0
    };

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.data);
      const dayName = format(expenseDate, 'EEEE', { locale: ptBR });
      const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      
      if (dayOfWeekTotals.hasOwnProperty(capitalizedDay)) {
        dayOfWeekTotals[capitalizedDay] += expense.valor;
        dayOfWeekCounts[capitalizedDay] += 1;
      }
    });

    return Object.entries(dayOfWeekTotals).map(([day, total]) => ({
      day,
      total,
      count: dayOfWeekCounts[day],
      average: dayOfWeekCounts[day] > 0 ? total / dayOfWeekCounts[day] : 0
    }));
  }, [expenses]);

  const insights = useMemo(() => {
    if (chartData.length === 0) return [];

    const insights = [];
    const sortedByTotal = [...chartData].sort((a, b) => b.total - a.total);
    const sortedByAverage = [...chartData].sort((a, b) => b.average - a.average);
    
    // Dia com maior gasto
    if (sortedByTotal[0] && sortedByTotal[0].total > 0) {
      insights.push({
        type: 'info',
        icon: '📊',
        title: 'Dia com Maior Gasto',
        message: `${sortedByTotal[0].day} é o dia que você mais gasta (R$ ${sortedByTotal[0].total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`
      });
    }

    // Dia com maior gasto médio
    if (sortedByAverage[0] && sortedByAverage[0].average > 0) {
      insights.push({
        type: 'tip',
        icon: '💡',
        title: 'Dia com Maior Gasto Médio',
        message: `${sortedByAverage[0].day} tem o maior gasto médio por transação (R$ ${sortedByAverage[0].average.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`
      });
    }

    // Padrão de fim de semana vs semana
    const weekdays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    const weekends = ['Sábado', 'Domingo'];
    
    const weekdayTotal = weekdays.reduce((sum, day) => {
      const dayData = chartData.find(d => d.day === day);
      return sum + (dayData?.total || 0);
    }, 0);
    
    const weekendTotal = weekends.reduce((sum, day) => {
      const dayData = chartData.find(d => d.day === day);
      return sum + (dayData?.total || 0);
    }, 0);

    if (weekdayTotal > 0 && weekendTotal > 0) {
      const weekendPercentage = (weekendTotal / (weekdayTotal + weekendTotal)) * 100;
      if (weekendPercentage > 40) {
        insights.push({
          type: 'warning',
          icon: '⚠️',
          title: 'Gastos de Fim de Semana',
          message: `${weekendPercentage.toFixed(1)}% dos seus gastos acontecem nos fins de semana. Considere planejar melhor essas despesas.`
        });
      }
    }

    return insights;
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Total: R$ {data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">
            Transações: {data.count}
          </p>
          <p className="text-sm text-muted-foreground">
            Média: R$ {data.average.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0 || chartData.every(d => d.total === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Padrões de Gastos por Dia da Semana
          </CardTitle>
          <CardDescription>Nenhuma despesa encontrada para análise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Calendar className="w-12 h-12 mx-auto opacity-50 mb-2" />
            <p>Nenhuma despesa registrada para análise de padrões</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Padrões de Gastos por Dia da Semana
        </CardTitle>
        <CardDescription>Como você distribui seus gastos ao longo da semana</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.day === 'Sábado' || entry.day === 'Domingo' ? '#f59e0b' : '#3b82f6'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="mt-4 space-y-2">
            {insights.map((insight, index) => (
              <div key={index} className={`p-3 rounded-lg border ${
                insight.type === 'warning' ? 'bg-orange-50 border-orange-200' :
                insight.type === 'tip' ? 'bg-blue-50 border-blue-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-start gap-2">
                  <span className="text-lg">{insight.icon}</span>
                  <div>
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground">{insight.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export { SpendingPatternsChart };
