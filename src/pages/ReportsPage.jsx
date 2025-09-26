import React, { memo, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useExport } from '@/hooks/useExport';
import { CompactPeriodFilter } from '@/components/CompactPeriodFilter';
import { CompactHeader } from '@/components/CompactHeader';
import { ExpenseTrendChart } from '@/components/charts/ExpenseTrendChart';
import { InvestmentGrowthChart } from '@/components/charts/InvestmentGrowthChart';
import { CategoryBreakdownChart } from '@/components/charts/CategoryBreakdownChart';
import { CategoryChart } from '@/components/CategoryChart';
import { InvestmentByInstitutionChart } from '@/components/charts/InvestmentByInstitutionChart';
import { FileDown } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, format } from 'date-fns';
import { formatCurrencyBRL, formatPercent } from '@/lib/format';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ReportsPage = memo(function ReportsPage() {
  const { expenses, investments, categories, accounts, investmentGoal, loading } = useFinance();
  const { isExporting, exportFullReport, exportExpenses, exportInvestments, exportAccounts } = useExport();
  
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

  const hasExpenses = filteredExpenses && filteredExpenses.length > 0;
  const hasInvestments = filteredInvestments && filteredInvestments.length > 0;

  // Insights removidos da UI

  const summaryStats = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.valor, 0);
    const totalPaid = filteredExpenses.filter(exp => exp.pago).reduce((sum, exp) => sum + exp.valor, 0);
    const totalPending = totalExpenses - totalPaid;
    const totalInvestments = filteredInvestments.reduce((sum, inv) => sum + inv.valor_aporte, 0);

    // deltas na janela anterior equivalente
    const previousStart = periodType === 'yearly'
      ? startOfYear(new Date(year - 1, 0, 1))
      : startOfMonth(new Date(year, (month ?? 0) - 1, 1));
    const previousEnd = periodType === 'yearly'
      ? endOfYear(new Date(year - 1, 11, 31))
      : endOfMonth(new Date(year, (month ?? 0) - 1, 1));

    const prevExpenses = expenses.filter(exp => {
      const d = parseISO(exp.data); return d >= previousStart && d <= previousEnd;
    }).reduce((sum, exp) => sum + exp.valor, 0);

    const prevInvestments = investments.filter(inv => {
      const d = parseISO(inv.data); return d >= previousStart && d <= previousEnd;
    }).reduce((sum, inv) => sum + inv.valor_aporte, 0);

    const expenseDelta = totalExpenses - prevExpenses;
    const investmentDelta = totalInvestments - prevInvestments;
    const savingsRate = (totalInvestments + totalPaid) > 0 ? (totalInvestments / (totalInvestments + totalPaid)) * 100 : 0;

    return {
      totalExpenses,
      totalPaid,
      totalPending,
      totalInvestments,
      savingsRate,
      expenseDelta,
      investmentDelta,
    };
  }, [filteredExpenses, filteredInvestments, expenses, investments, periodType, month, year]);

  const handleExportReport = () => {
    const periodLabel = `${format(startDate, 'yyyy-MM-dd')}_a_${format(endDate, 'yyyy-MM-dd')}`;
    exportFullReport(filteredExpenses, filteredInvestments, accounts, categories, periodLabel, 'PDF');
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
          <p aria-live="polite" className="text-muted-foreground">Carregando relatórios…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Relatórios - Lumify</title>
      </Helmet>
      
      <div className="space-y-4 md:space-y-5 page-top">
        <CompactHeader 
          title="Relatórios"
          subtitle={`Período: ${format(startDate, 'dd/MM/yyyy')} — ${format(endDate, 'dd/MM/yyyy')}`}
        >
          <div className="flex items-center justify-between gap-4">
            <CompactPeriodFilter 
              periodType={periodType}
              setPeriodType={setPeriodType}
              dateRange={dateRange}
              setDateRange={setDateRange}
              month={month}
              setMonth={setMonth}
              year={year}
              setYear={setYear}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
            <Button 
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={isExporting}
              title={isExporting ? 'Exportando…' : undefined}
            >
                  <FileDown className="h-4 w-4" />
                  {isExporting ? 'Exportando…' : 'Exportar'}
            </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportReport}>Relatório completo (PDF)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportExpenses(filteredExpenses, categories, `gastos_${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}`)}>Gastos do período (CSV)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportInvestments(filteredInvestments, categories, accounts, `investimentos_${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}`)}>Investimentos do período (CSV)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAccounts(accounts, `contas_${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}`)}>Contas (CSV)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CompactHeader>

        {/* Resumo do Período com deltas */
        }
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Gastos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrencyBRL(summaryStats.totalExpenses)}</div>
              <CardDescription className={summaryStats.expenseDelta >= 0 ? 'text-red-600' : 'text-green-600'}>
                {summaryStats.expenseDelta >= 0 ? '+' : ''}{formatCurrencyBRL(summaryStats.expenseDelta)} vs período anterior
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Investido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrencyBRL(summaryStats.totalInvestments)}</div>
              <CardDescription className={summaryStats.investmentDelta >= 0 ? 'text-green-600' : 'text-yellow-600'}>
                {summaryStats.investmentDelta >= 0 ? '+' : ''}{formatCurrencyBRL(summaryStats.investmentDelta)} vs período anterior
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Uso do Limite de Gastos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const expenseCategories = categories.filter(c => c.tipo === 'gasto');
                const totalLimit = expenseCategories.reduce((acc, cat) => acc + (cat.limite || 0), 0);
                const usage = totalLimit > 0 ? (summaryStats.totalExpenses / totalLimit) * 100 : 0;
                return (
                  <>
                    <div className="text-2xl font-bold">{formatPercent(Math.round(usage))}</div>
                    <CardDescription>{totalLimit > 0 ? `${formatCurrencyBRL(summaryStats.totalExpenses)} de ${formatCurrencyBRL(totalLimit)}` : 'Defina limites nas categorias para acompanhar o uso.'}</CardDescription>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrencyBRL(summaryStats.totalPending)}</div>
              <CardDescription>Gastos não pagos no período</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Visualizações centrais (somente relatórios) */}
        <div className="space-y-4 md:space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {hasExpenses ? (
              <CategoryBreakdownChart expenses={filteredExpenses} categories={categories} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Sem dados de categorias</CardTitle>
                  <CardDescription>Não há gastos no período para quebrar por categoria.</CardDescription>
                </CardHeader>
              </Card>
            )}
            <InvestmentByInstitutionChart investments={filteredInvestments} accounts={accounts} />
          </div>

          <ExpenseTrendChart />
          <InvestmentGrowthChart />
        </div>
      </div>
    </>
  );
});

export { ReportsPage };
