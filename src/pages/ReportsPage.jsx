import React, { memo, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/contexts/FinanceDataContext';
// import { useExport } from '@/hooks/useExport';
// import { formatExpensesForExport, formatInvestmentsForExport } from '@/lib/exportUtils';
import { PeriodFilter } from '@/components/PeriodFilter';
import { ExpenseTrendChart } from '@/components/charts/ExpenseTrendChart';
import { InvestmentGrowthChart } from '@/components/charts/InvestmentGrowthChart';
import { CategoryBreakdownChart } from '@/components/charts/CategoryBreakdownChart';
import { MonthlyComparisonChart } from '@/components/MonthlyComparisonChart';
import { CategoryChart } from '@/components/CategoryChart';
import { Download, FileText, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, eachMonthOfInterval, subMonths, parseISO, format } from 'date-fns';

const ReportsPage = memo(function ReportsPage() {
  const { expenses, investments, categories, investmentGoal, loading } = useFinance();
  // const { isExporting, exportFullReport, exportFilteredData } = useExport();
  
  const [periodType, setPeriodType] = useState('monthly');
  const [dateRange, setDateRange] = useState(undefined);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const { startDate, endDate } = useMemo(() => {
    let s, e;
    if (dateRange && dateRange.from) {
      s = dateRange.from; e = dateRange.to || dateRange.from;
    } else if (periodType === 'yearly' && year) {
      s = startOfYear(new Date(year, 0, 1)); e = endOfYear(new Date(year, 11, 31));
    } else if (periodType === 'monthly' && month !== undefined && year) {
      s = startOfMonth(new Date(year, month, 1)); e = endOfMonth(new Date(year, month, 1));
    } else {
      const now = new Date(); s = startOfMonth(now); e = endOfMonth(now);
    }
    e.setHours(23,59,59,999);
    return { startDate: s, endDate: e };
  }, [dateRange, periodType, month, year]);

  const filteredExpenses = useMemo(() => expenses.filter(exp => {
    const d = parseISO(exp.data); return d >= startDate && d <= endDate;
  }), [expenses, startDate, endDate]);

  const filteredInvestments = useMemo(() => investments.filter(inv => {
    const d = parseISO(inv.data); return d >= startDate && d <= endDate;
  }), [investments, startDate, endDate]);

  const summaryStats = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.valor, 0);
    const totalPaid = filteredExpenses.filter(exp => exp.pago).reduce((sum, exp) => sum + exp.valor, 0);
    const totalPending = totalExpenses - totalPaid;
    const totalInvestments = filteredInvestments.reduce((sum, inv) => sum + inv.valor_aporte, 0);
    const savingsRate = (totalInvestments + totalPaid) > 0 ? (totalInvestments / (totalInvestments + totalPaid)) * 100 : 0;

    return {
      totalExpenses,
      totalPaid,
      totalPending,
      totalInvestments,
      savingsRate
    };
  }, [filteredExpenses, filteredInvestments]);

  const handleExportReport = () => {
    console.log('Export button clicked - funcionalidade temporariamente desabilitada');
    alert('Funcionalidade de exportação temporariamente desabilitada para correção');
  };

  const handleExportFilteredData = () => {
    console.log('Export filtered data clicked - funcionalidade temporariamente desabilitada');
    alert('Funcionalidade de exportação temporariamente desabilitada para correção');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Relatórios - FinanceApp</title>
      </Helmet>
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground mt-1">
              Análises detalhadas dos seus dados financeiros
            </p>
          </div>
          <Button 
            onClick={handleExportReport} 
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Filtros do Relatório
            </CardTitle>
            <CardDescription>
              Selecione o período para análise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <PeriodFilter 
                periodType={periodType}
                setPeriodType={setPeriodType}
                dateRange={dateRange}
                setDateRange={setDateRange}
                month={month}
                setMonth={setMonth}
                year={year}
                setYear={setYear}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleExportFilteredData} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Exportar Dados Filtrados
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo do Período */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Gastos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {summaryStats.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Investido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {summaryStats.totalInvestments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Poupança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(summaryStats.savingsRate)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                R$ {summaryStats.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs com diferentes tipos de relatórios */}
        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tendências
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Comparação
            </TabsTrigger>
            <TabsTrigger value="growth" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Crescimento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            <ExpenseTrendChart expenses={expenses} categories={categories} />
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryBreakdownChart expenses={filteredExpenses} categories={categories} />
              <CategoryChart expenses={filteredExpenses} categories={categories} />
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <MonthlyComparisonChart expenses={expenses} investments={investments} />
          </TabsContent>

          <TabsContent value="growth" className="space-y-4">
            <InvestmentGrowthChart investments={investments} investmentGoal={investmentGoal} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
});

export { ReportsPage };
