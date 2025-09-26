import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  AlertCircle,
  Plus,
  BarChart3,
  Wallet,
  PiggyBank
} from 'lucide-react';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useAdvancedMetrics } from '@/hooks/useAdvancedMetrics';
import { useSmartInsights } from '@/hooks/useSmartInsights';

export const SimplifiedDashboard = () => {
  const { expenses, investments, accounts, categories } = useFinance();
  const { financialHealth, trends } = useAdvancedMetrics();
  const { insights, recommendations } = useSmartInsights();
  const [activeTab, setActiveTab] = useState('overview');

  // Métricas principais simplificadas
  const mainMetrics = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.valor, 0);
    const totalInvestments = investments.reduce((sum, inv) => sum + inv.valor_aporte, 0);
    const totalAccounts = accounts.reduce((sum, acc) => sum + (acc.saldo || 0), 0);
    
    return {
      totalExpenses,
      totalInvestments,
      totalAccounts,
      netWorth: totalAccounts + totalInvestments,
      savingsRate: totalExpenses > 0 ? (totalInvestments / (totalExpenses + totalInvestments)) * 100 : 0
    };
  }, [expenses, investments, accounts]);

  // Ações rápidas
  const quickActions = [
    { label: 'Adicionar Despesa', icon: TrendingDown, color: 'text-red-600', action: 'add-expense' },
    { label: 'Adicionar Investimento', icon: TrendingUp, color: 'text-green-600', action: 'add-investment' },
    { label: 'Ver Relatórios', icon: BarChart3, color: 'text-blue-600', action: 'view-reports' },
    { label: 'Configurar Contas', icon: Wallet, color: 'text-purple-600', action: 'setup-accounts' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Simplificado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua situação financeira</p>
        </div>
        <div className="flex gap-2">
          {quickActions.slice(0, 2).map((action, index) => (
            <Button key={index} variant="outline" size="sm" className="flex items-center gap-2">
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Patrimônio Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {mainMetrics.netWorth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Contas + Investimentos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Poupança</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mainMetrics.savingsRate.toFixed(1)}%
            </div>
            <Progress value={mainMetrics.savingsRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Score Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {financialHealth?.financialHealthScore || 0}/100
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Saúde financeira
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {insights?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Atenção necessária
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal com Abas Simplificadas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Resumo de Gastos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Gastos Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expenses.slice(0, 5).map((expense, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{expense.descricao}</p>
                        <p className="text-sm text-muted-foreground">{expense.data}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">
                          R$ {expense.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <Badge variant={expense.pago ? "default" : "secondary"}>
                          {expense.pago ? "Pago" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resumo de Investimentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Investimentos Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {investments.slice(0, 5).map((investment, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{investment.descricao || 'Investimento'}</p>
                        <p className="text-sm text-muted-foreground">{investment.data}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          R$ {investment.valor_aporte.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Insights Inteligentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Insights Importantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights?.slice(0, 3).map((insight, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
                      {insight.recommendation && (
                        <p className="text-sm text-blue-600 mt-2">{insight.recommendation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recomendações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations?.slice(0, 3).map((rec, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <action.icon className={`h-8 w-8 ${action.color}`} />
                    <div>
                      <h3 className="font-medium">{action.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        Clique para {action.label.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
