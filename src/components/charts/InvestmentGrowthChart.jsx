import React, { memo, useMemo } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Target } from 'lucide-react';
import { format, subMonths, eachMonthOfInterval, parseISO } from 'date-fns';
import { useFinance } from '@/contexts/FinanceDataContext';

const InvestmentGrowthChart = memo(function InvestmentGrowthChart() {
  const { investments, investmentGoal } = useFinance();
  const chartData = useMemo(() => {
    const last12Months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date()
    });

    let runningTotal = 0;
    return last12Months.map(month => {
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const monthInvestments = investments.filter(investment => {
        const investmentDate = parseISO(investment.data);
        return investmentDate >= monthStart && investmentDate <= monthEnd;
      });

      const monthAmount = monthInvestments.reduce((sum, inv) => sum + inv.valor_aporte, 0);
      runningTotal += monthAmount;

      return {
        month: format(month, 'MMM/yy'),
        monthly: monthAmount,
        cumulative: runningTotal,
        goal: investmentGoal || 0,
        fullMonth: format(month, 'MMMM yyyy')
      };
    });
  }, [investments, investmentGoal]);

  const momDelta = useMemo(() => {
    if (chartData.length < 2) return 0;
    const current = chartData[chartData.length - 1].monthly;
    const previous = chartData[chartData.length - 2].monthly;
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
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
          <TrendingUp className="h-5 w-5 text-green-500" />
          Aportes Mensais x Meta
        </CardTitle>
        <CardDescription>
          Últimos 12 meses: comparação dos aportes com a meta mensal
          {momDelta !== 0 && (
            <span className="ml-2 flex items-center gap-1 text-green-600">
              <TrendingUp className="h-3 w-3" />
              {momDelta > 0 ? '+' : ''}{momDelta.toFixed(1)}% vs mês anterior
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorInvestment" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--green-500))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--green-500))" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorGoal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="monthly"
                stroke="hsl(var(--green-500))"
                fillOpacity={1}
                fill="url(#colorInvestment)"
                name="Aporte Mensal"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="#2563eb"
                strokeWidth={2.5}
                name="Aportes Acumulados"
                dot={{ r: 3 }}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
              />
              {investmentGoal > 0 && (
                <ReferenceLine y={investmentGoal} stroke="hsl(var(--primary))" strokeDasharray="5 5" label={{ value: 'Meta', position: 'right', fill: 'hsl(var(--primary))' }} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

export { InvestmentGrowthChart };
