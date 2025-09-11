import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { PeriodFilter } from '@/components/PeriodFilter';
import { Dashboard } from '@/components/Dashboard';
import { MonthlyComparisonChart } from '@/components/MonthlyComparisonChart';
import { startOfYear, endOfYear, startOfMonth, endOfMonth, parseISO, subMonths, eachMonthOfInterval, format } from 'date-fns';
import { useFinance } from '@/contexts/FinanceDataContext';

export function DashboardPage() {
  const { expenses, investments, accounts, categories, investmentGoal } = useFinance();

  const [periodType, setPeriodType] = useState('monthly');
  const [dateRange, setDateRange] = useState(undefined);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (dateRange) {
      setPeriodType('monthly'); 
      setMonth(undefined);
    }
  }, [dateRange]);

  const filteredData = useMemo(() => {
    let startDate, endDate;

    if (dateRange && dateRange.from) {
      startDate = dateRange.from;
      endDate = dateRange.to ? dateRange.to : dateRange.from;
    } else if (periodType === 'yearly' && year) {
      startDate = startOfYear(new Date(year, 0, 1));
      endDate = endOfYear(new Date(year, 11, 31));
    } else if (periodType === 'monthly' && month !== undefined && year) {
      startDate = startOfMonth(new Date(year, month, 1));
      endDate = endOfMonth(new Date(year, month, 1));
    } else {
      const now = new Date();
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    endDate.setHours(23, 59, 59, 999);

    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(parseISO(expense.data));
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    const filteredInvestments = investments.filter(investment => {
      const investmentDate = new Date(parseISO(investment.data));
      return investmentDate >= startDate && investmentDate <= endDate;
    });

    const totalMonthlyExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.valor, 0);
    const totalPaidExpenses = filteredExpenses.filter(e => e.pago).reduce((s, e) => s + e.valor, 0);
    const totalPendingExpenses = filteredExpenses.filter(e => !e.pago).reduce((s, e) => s + e.valor, 0);
    const totalMonthlyInvestments = filteredInvestments.reduce((sum, investment) => sum + investment.valor_aporte, 0);

    const expensesByCategory = categories
      .filter(c => c.tipo === 'gasto')
      .reduce((acc, category) => {
        acc[category.id] = filteredExpenses
          .filter(expense => expense.categoria_id === category.id)
          .reduce((sum, expense) => sum + expense.valor, 0);
        return acc;
      }, {});

    // Meta de aportes mensal acumulada coerente ao período
    let periodMonths = 1;
    if (dateRange && dateRange.from) {
      const monthsRange = eachMonthOfInterval({ start: startOfMonth(dateRange.from), end: endOfMonth(dateRange.to || dateRange.from) });
      periodMonths = monthsRange.length;
    } else if (periodType === 'yearly' && year) {
      const now = new Date();
      if (year < now.getFullYear()) periodMonths = 12; else if (year > now.getFullYear()) periodMonths = 0; else periodMonths = now.getMonth() + 1;
    } else if (periodType === 'monthly' && month !== undefined && year) {
      periodMonths = 1;
    }

    const monthlyGoal = Number(investmentGoal) || 0;
    const periodInvestmentGoal = monthlyGoal * periodMonths;
    const investmentProgress = periodInvestmentGoal > 0 
      ? Math.min((totalMonthlyInvestments / periodInvestmentGoal) * 100, 100)
      : 0;

    const expenseCeiling = accounts.reduce((sum, acc) => sum + (acc.teto_gasto || Infinity), Infinity); // teto de gastos definido por conta
    const expenseProgress = expenseCeiling < Infinity 
      ? Math.min((totalMonthlyExpenses / expenseCeiling) * 100, 100)
      : 0;

    // Taxa de poupança (aproximação): aportes / (aportes + gastos pagos)
    const savingsRate = (totalMonthlyInvestments + totalPaidExpenses) > 0 
      ? (totalMonthlyInvestments / (totalMonthlyInvestments + totalPaidExpenses)) * 100
      : 0;

    // Projeção simples 12m mantendo aporte médio dos últimos 3 meses
    const last3Months = eachMonthOfInterval({ start: subMonths(new Date(), 2), end: new Date() });
    const avgLast3 = last3Months.reduce((acc, m) => {
      const ms = startOfMonth(m); const me = endOfMonth(m);
      const invested = investments.filter(i => { const d = parseISO(i.data); return d >= ms && d <= me; }).reduce((s, i) => s + i.valor_aporte, 0);
      return acc + invested;
    }, 0) / (last3Months.length || 1);
    const projection12m = avgLast3 * 12;

    return {
      filteredExpenses,
      filteredInvestments,
      totalMonthlyExpenses,
      totalPaidExpenses,
      totalPendingExpenses,
      totalMonthlyInvestments,
      expensesByCategory,
      investmentProgress,
      expenseProgress,
      periodInvestmentGoal,
      savingsRate,
      projection12m,
    };
  }, [expenses, investments, categories, periodType, dateRange, month, year, accounts, investmentGoal]);

  const monthlyComparisonData = useMemo(() => {
    const last12Months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date()
    });

    return last12Months.map(monthDate => {
      const monthName = format(monthDate, 'MMM/yy');
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthlyExpenses = expenses
        .filter(e => {
          const d = parseISO(e.data);
          return d >= monthStart && d <= monthEnd;
        })
        .reduce((sum, e) => sum + e.valor, 0);

      const monthlyInvestments = investments
        .filter(i => {
          const d = parseISO(i.data);
          return d >= monthStart && d <= monthEnd;
        })
        .reduce((sum, i) => sum + i.valor_aporte, 0);

      return {
        name: monthName,
        Gastos: monthlyExpenses,
        Aportes: monthlyInvestments,
      };
    });
  }, [expenses, investments]);

  const totalAccountBalance = accounts.reduce((sum, account) => sum + account.saldo, 0);
  const totalInvestmentBalance = investments.reduce((sum, investment) => sum + investment.valor_aporte, 0);

  // Dicas educacionais
  const educationTips = useMemo(() => {
    const tips = [];

    if (filteredData.expenseProgress > 90) {
      tips.push("Você está próximo do teto de gastos. Evite despesas extras!");
    } else if (filteredData.expenseProgress > 70) {
      tips.push("Atenção: seus gastos estão aumentando, revise suas categorias.");
    } else {
      tips.push("Gastos dentro do limite. Continue assim!");
    }

    if (filteredData.investmentProgress < 50) {
      tips.push("Meta de investimentos baixa. Considere aumentar aportes!");
    } else if (filteredData.investmentProgress >= 100) {
      tips.push("Parabéns! Meta de investimentos atingida.");
    } else {
      tips.push("Você está progredindo bem na meta de investimentos.");
    }

    return tips;
  }, [filteredData.expenseProgress, filteredData.investmentProgress]);

  return (
    <>
      <Helmet>
        <title>Dashboard - FinanceApp</title>
        <meta name="description" content="Seu controle financeiro." />
      </Helmet>

      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Financeiro</h1>

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

        <Dashboard
          totalMonthlyExpenses={filteredData.totalMonthlyExpenses}
          totalMonthlyInvestments={filteredData.totalMonthlyInvestments}
          totalPaidExpenses={filteredData.totalPaidExpenses}
          totalPendingExpenses={filteredData.totalPendingExpenses}
          expensesByCategory={filteredData.expensesByCategory}
          totalAccountBalance={totalAccountBalance}
          totalInvestmentBalance={totalInvestmentBalance}
          investmentGoal={Number(investmentGoal) || 0}
          periodInvestmentGoal={filteredData.periodInvestmentGoal}
          savingsRate={filteredData.savingsRate}
          projection12m={filteredData.projection12m}
          categories={categories}
          expenseProgress={filteredData.expenseProgress}
          investmentProgress={filteredData.investmentProgress}
          educationTips={educationTips}
        />

        <MonthlyComparisonChart data={monthlyComparisonData} />
      </div>
    </>
  );
}
