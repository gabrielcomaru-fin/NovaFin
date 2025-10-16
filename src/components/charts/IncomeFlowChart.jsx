import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useIncomeInsights } from '@/hooks/useIncomeInsights';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrencyBRL } from '@/lib/format';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

export function IncomeFlowChart() {
  const { incomes, expenses, investments } = useFinance();
  const incomeInsights = useIncomeInsights();

  const flowData = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    // Filtrar dados do mês atual
    const currentMonthIncomes = incomes.filter(income => {
      const incomeDate = parseISO(income.data);
      return incomeDate >= monthStart && incomeDate <= monthEnd;
    });
    
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = parseISO(expense.data);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });
    
    const currentMonthInvestments = investments.filter(investment => {
      const investmentDate = parseISO(investment.data);
      return investmentDate >= monthStart && investmentDate <= monthEnd;
    });

    const totalIncome = currentMonthIncomes.reduce((sum, income) => sum + income.valor, 0);
    const totalExpenses = currentMonthExpenses.filter(exp => exp.pago).reduce((sum, exp) => sum + exp.valor, 0);
    const totalInvestments = currentMonthInvestments.reduce((sum, inv) => sum + inv.valor_aporte, 0);
    const availableBalance = totalIncome - totalExpenses - totalInvestments;

    return [
      {
        name: 'Receitas',
        value: totalIncome,
        type: 'income',
        color: '#22c55e'
      },
      {
        name: 'Despesas',
        value: -totalExpenses,
        type: 'expense',
        color: '#ef4444'
      },
      {
        name: 'Investimentos',
        value: -totalInvestments,
        type: 'investment',
        color: '#3b82f6'
      },
      {
        name: 'Saldo Disponível',
        value: availableBalance,
        type: 'balance',
        color: availableBalance >= 0 ? '#22c55e' : '#ef4444'
      }
    ];
  }, [incomes, expenses, investments, incomeInsights]);

  const totalIncome = flowData.find(d => d.type === 'income')?.value || 0;
  const totalExpenses = Math.abs(flowData.find(d => d.type === 'expense')?.value || 0);
  const totalInvestments = Math.abs(flowData.find(d => d.type === 'investment')?.value || 0);
  const availableBalance = flowData.find(d => d.type === 'balance')?.value || 0;

  if (totalIncome === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-600" />
            Fluxo de Caixa
          </CardTitle>
          <CardDescription>Entradas e saídas do mês atual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Nenhuma receita registrada</p>
              <p className="text-sm">Adicione receitas para ver o fluxo de caixa</p>
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
          <Wallet className="h-5 w-5 text-blue-600" />
          Fluxo de Caixa
        </CardTitle>
        <CardDescription>
          Entradas e saídas do mês atual • Saldo: {formatCurrencyBRL(availableBalance)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={flowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
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
                  formatCurrencyBRL(Math.abs(value)),
                  name
                ]}
                labelFormatter={(label) => `${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="value">
                {flowData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Resumo do fluxo */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Entradas</span>
            </div>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrencyBRL(totalIncome)}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Saídas</span>
            </div>
            <p className="text-lg font-semibold text-red-600">
              {formatCurrencyBRL(totalExpenses + totalInvestments)}
            </p>
          </div>
        </div>
        
        {/* Breakdown das saídas */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700">Despesas</p>
            <p className="font-semibold text-red-600">{formatCurrencyBRL(totalExpenses)}</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">Investimentos</p>
            <p className="font-semibold text-blue-600">{formatCurrencyBRL(totalInvestments)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

