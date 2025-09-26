import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ComposedChart, 
  LineChart, 
  BarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { format, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Cores para gráficos
const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1'
};

const COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.info,
  CHART_COLORS.purple,
  CHART_COLORS.pink,
  CHART_COLORS.indigo
];

// Gráfico de Sankey para fluxo de dinheiro
export const MoneyFlowChart = ({ data }) => {
  const flowData = useMemo(() => {
    if (!data) return [];
    
    const totalIncome = data.totalMonthlyInvestments + data.totalAccountBalance;
    const totalExpenses = data.totalMonthlyExpenses;
    const totalInvestments = data.totalMonthlyInvestments;
    
    return [
      { from: 'Receitas', to: 'Gastos', value: totalExpenses },
      { from: 'Receitas', to: 'Investimentos', value: totalInvestments },
      { from: 'Receitas', to: 'Reserva', value: totalIncome - totalExpenses - totalInvestments }
    ];
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo de Dinheiro</CardTitle>
        <CardDescription>Visualização do fluxo entre receitas, gastos e investimentos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {flowData.map((flow, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="font-medium">{flow.from} → {flow.to}</span>
              </div>
              <span className="font-bold">
                R$ {flow.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Gráfico de calor para padrões temporais
export const SpendingHeatmapChart = ({ expenses }) => {
  const heatmapData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    
    const data = [];
    const last12Months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date()
    });
    
    last12Months.forEach(monthDate => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = parseISO(expense.data);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });
      
      const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.valor, 0);
      
      data.push({
        month: format(monthDate, 'MMM/yy', { locale: ptBR }),
        value: totalSpent,
        intensity: Math.min(totalSpent / 1000, 1) // Normalizar para 0-1
      });
    });
    
    return data;
  }, [expenses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Padrões de Gastos</CardTitle>
        <CardDescription>Heatmap mostrando gastos por mês</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-2">
          {heatmapData.map((item, index) => (
            <div key={index} className="text-center">
              <div 
                className="w-full h-8 rounded"
                style={{ 
                  backgroundColor: `rgba(59, 130, 246, ${item.intensity})`,
                  opacity: item.intensity > 0 ? 0.3 + (item.intensity * 0.7) : 0.1
                }}
              />
              <div className="text-xs mt-1">{item.month}</div>
              <div className="text-xs text-muted-foreground">
                R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Gráfico de radar para saúde financeira
export const FinancialHealthRadarChart = ({ financialHealth }) => {
  const radarData = useMemo(() => {
    if (!financialHealth) return [];
    
    return [
      {
        metric: 'Liquidez',
        value: Math.min(financialHealth.liquidityRatio * 20, 100),
        fullMark: 100
      },
      {
        metric: 'Poupança',
        value: financialHealth.savingsRate,
        fullMark: 100
      },
      {
        metric: 'Diversificação',
        value: financialHealth.investmentDiversification,
        fullMark: 100
      },
      {
        metric: 'Eficiência',
        value: financialHealth.budgetEfficiency,
        fullMark: 100
      },
      {
        metric: 'Crescimento',
        value: Math.min(financialHealth.wealthGrowthRate * 10, 100),
        fullMark: 100
      }
    ];
  }, [financialHealth]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saúde Financeira</CardTitle>
        <CardDescription>Indicadores multidimensionais da sua situação financeira</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar
              name="Seu Score"
              dataKey="value"
              stroke={CHART_COLORS.primary}
              fill={CHART_COLORS.primary}
              fillOpacity={0.3}
            />
            <Tooltip 
              formatter={(value) => [`${value.toFixed(1)}%`, 'Score']}
              labelFormatter={(label) => `Métrica: ${label}`}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Gráfico de composição para análise detalhada
export const DetailedAnalysisChart = ({ expenses, investments }) => {
  const chartData = useMemo(() => {
    if (!expenses || !investments) return [];
    
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });
    
    return last6Months.map(monthDate => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = parseISO(expense.data);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });
      
      const monthlyInvestments = investments.filter(investment => {
        const investmentDate = parseISO(investment.data);
        return investmentDate >= monthStart && investmentDate <= monthEnd;
      });
      
      const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.valor, 0);
      const totalInvestments = monthlyInvestments.reduce((sum, investment) => sum + investment.valor_aporte, 0);
      
      return {
        month: format(monthDate, 'MMM/yy', { locale: ptBR }),
        gastos: totalExpenses,
        investimentos: totalInvestments,
        saldo: totalInvestments - totalExpenses,
        poupanca: totalInvestments
      };
    });
  }, [expenses, investments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise Detalhada</CardTitle>
        <CardDescription>Evolução de gastos, investimentos e saldo nos últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                name === 'gastos' ? 'Gastos' : 
                name === 'investimentos' ? 'Investimentos' :
                name === 'saldo' ? 'Saldo' : 'Poupança'
              ]}
            />
            <Legend />
            <Bar dataKey="gastos" fill={CHART_COLORS.danger} name="Gastos" />
            <Bar dataKey="investimentos" fill={CHART_COLORS.success} name="Investimentos" />
            <Line type="monotone" dataKey="saldo" stroke={CHART_COLORS.primary} strokeWidth={3} name="Saldo" />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Gráfico de distribuição de investimentos
export const InvestmentDistributionChart = ({ investments, categories }) => {
  const pieData = useMemo(() => {
    if (!investments || !categories) return [];
    
    const categoryTotals = {};
    investments.forEach(investment => {
      const category = categories.find(c => c.id === investment.categoria_id);
      if (category) {
        categoryTotals[category.nome] = (categoryTotals[category.nome] || 0) + investment.valor_aporte;
      }
    });
    
    return Object.entries(categoryTotals).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
  }, [investments, categories]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Investimentos</CardTitle>
        <CardDescription>Divisão dos seus investimentos por categoria</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-3">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((item.value / pieData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente principal que combina todos os gráficos
export const AdvancedCharts = ({ data, expenses, investments, categories }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <MoneyFlowChart data={data} />
      <SpendingHeatmapChart expenses={expenses} />
      <FinancialHealthRadarChart financialHealth={data?.financialHealth} />
      <InvestmentDistributionChart investments={investments} categories={categories} />
      <div className="lg:col-span-2">
        <DetailedAnalysisChart expenses={expenses} investments={investments} />
      </div>
    </div>
  );
};
