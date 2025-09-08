
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Dashboard } from '@/components/Dashboard';
import { PeriodFilter } from '@/components/PeriodFilter';
import { startOfYear, endOfYear, startOfMonth, endOfMonth, parseISO, subMonths, eachMonthOfInterval, format } from 'date-fns';
import { useFinance } from '@/contexts/FinanceDataContext';
import { MonthlyComparisonChart } from '@/components/MonthlyComparisonChart';

export function DashboardPage() {
  const { expenses, investments, accounts, categories, investmentGoal } = useFinance();
  
  const [periodType, setPeriodType] = useState('monthly');
  const [dateRange, setDateRange] = useState(undefined);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    // Quando dateRange for selecionado, limpa os outros filtros
    if (dateRange) {
      setPeriodType('monthly'); // ou um tipo 'custom' se preferir
      setMonth(undefined);
      // O ano pode ser mantido ou limpo, dependendo da lógica desejada
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
    const totalMonthlyInvestments = filteredInvestments.reduce((sum, investment) => sum + investment.valor_aporte, 0);

    const expensesByCategory = categories
        .filter(c => c.tipo === 'gasto')
        .reduce((acc, category) => {
            acc[category.id] = filteredExpenses
                .filter(expense => expense.categoria_id === category.id)
                .reduce((sum, expense) => sum + expense.valor, 0);
            return acc;
    }, {});

    return {
      totalMonthlyExpenses,
      totalMonthlyInvestments,
      expensesByCategory
    };
  }, [expenses, investments, categories, periodType, dateRange, month, year]);

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
          expensesByCategory={filteredData.expensesByCategory}
          totalAccountBalance={totalAccountBalance}
          totalInvestmentBalance={totalInvestmentBalance}
          investmentGoal={investmentGoal}
          categories={categories}
        />
        <MonthlyComparisonChart data={monthlyComparisonData} />
      </div>
    </>
  );
}
