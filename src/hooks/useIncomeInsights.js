import { useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceDataContext';
import { endOfMonth, differenceInDays, startOfMonth, parseISO } from 'date-fns';

export const useIncomeInsights = () => {
  const { incomes, expenses, investments, totalIncome, availableBalance } = useFinance();

  const insights = useMemo(() => {
    const today = new Date();
    const endOfCurrentMonth = endOfMonth(today);
    const daysRemaining = Math.max(1, differenceInDays(endOfCurrentMonth, today));
    
    // Filtrar dados do mês atual
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    
    const currentMonthIncomes = incomes.filter(income => {
      const incomeDate = parseISO(income.data);
      return incomeDate >= currentMonthStart && incomeDate <= currentMonthEnd;
    });
    
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = parseISO(expense.data);
      return expenseDate >= currentMonthStart && expenseDate <= currentMonthEnd;
    });
    
    const currentMonthInvestments = investments.filter(investment => {
      const investmentDate = parseISO(investment.data);
      return investmentDate >= currentMonthStart && investmentDate <= currentMonthEnd;
    });

    // Cálculos básicos
    const totalCurrentMonthIncome = currentMonthIncomes.reduce((sum, income) => sum + income.valor, 0);
    const totalCurrentMonthExpenses = currentMonthExpenses.filter(exp => exp.pago).reduce((sum, exp) => sum + exp.valor, 0);
    const totalCurrentMonthInvestments = currentMonthInvestments.reduce((sum, inv) => sum + inv.valor_aporte, 0);
    
    // Saldo disponível do mês atual
    const currentMonthAvailableBalance = totalCurrentMonthIncome - totalCurrentMonthExpenses - totalCurrentMonthInvestments;
    
    // Capacidade de gasto diário
    const dailySpendingCapacity = currentMonthAvailableBalance / daysRemaining;
    
    // Taxa de poupança (investimentos / receitas)
    const savingsRate = totalCurrentMonthIncome > 0 
      ? (totalCurrentMonthInvestments / totalCurrentMonthIncome) * 100 
      : 0;
    
    // Relação receitas vs despesas
    const incomeVsExpensesRatio = totalCurrentMonthExpenses > 0 
      ? (totalCurrentMonthIncome / totalCurrentMonthExpenses) * 100 
      : totalCurrentMonthIncome > 0 ? 100 : 0;
    
    // Gasto médio diário do mês
    const daysPassed = differenceInDays(today, currentMonthStart) + 1;
    const averageDailySpending = daysPassed > 0 ? totalCurrentMonthExpenses / daysPassed : 0;
    
    // Dias até zerar o saldo (se continuar gastando na média)
    const daysUntilBalanceZero = averageDailySpending > 0 
      ? Math.ceil(currentMonthAvailableBalance / averageDailySpending) 
      : Infinity;
    
    // Status de saúde financeira
    const isBalanceHealthy = currentMonthAvailableBalance > (totalCurrentMonthIncome * 0.2); // 20% das receitas
    const needsMoreIncome = totalCurrentMonthIncome < (totalCurrentMonthExpenses + totalCurrentMonthInvestments);
    const isSpendingTooMuch = incomeVsExpensesRatio > 100; // Gastando mais que recebe
    
    // Recomendações baseadas nos dados
    const recommendations = [];
    
    if (needsMoreIncome) {
      recommendations.push({
        type: 'warning',
        message: 'Suas receitas não cobrem seus gastos e investimentos. Considere aumentar a renda ou reduzir gastos.',
        action: 'Revisar orçamento'
      });
    } else if (isSpendingTooMuch) {
      recommendations.push({
        type: 'warning',
        message: 'Você está gastando mais do que recebe. Atenção ao orçamento!',
        action: 'Controlar gastos'
      });
    } else if (savingsRate < 10) {
      recommendations.push({
        type: 'tip',
        message: 'Sua taxa de poupança está baixa. Tente investir pelo menos 10% da sua renda.',
        action: 'Aumentar investimentos'
      });
    } else if (savingsRate >= 20) {
      recommendations.push({
        type: 'success',
        message: 'Excelente taxa de poupança! Você está no caminho certo para a independência financeira.',
        action: 'Manter disciplina'
      });
    }
    
    if (currentMonthAvailableBalance < 0) {
      recommendations.push({
        type: 'warning',
        message: 'Saldo negativo! Você está gastando mais do que tem disponível.',
        action: 'Revisar gastos urgentemente'
      });
    } else if (currentMonthAvailableBalance > 0 && daysUntilBalanceZero < 7) {
      recommendations.push({
        type: 'tip',
        message: 'Seu saldo pode se esgotar em breve. Planeje suas próximas receitas.',
        action: 'Planejar receitas'
      });
    }
    
    if (dailySpendingCapacity > 0 && dailySpendingCapacity < 50) {
      recommendations.push({
        type: 'tip',
        message: 'Sua capacidade de gasto diário está baixa. Considere otimizar seu orçamento.',
        action: 'Otimizar orçamento'
      });
    }

    return {
      // Saldo e capacidade
      availableBalance: currentMonthAvailableBalance,
      dailySpendingCapacity,
      
      // Comparações
      incomeVsExpensesRatio,
      savingsRate,
      
      // Previsões
      daysUntilBalanceZero: daysUntilBalanceZero === Infinity ? null : daysUntilBalanceZero,
      averageDailySpending,
      
      // Status
      isBalanceHealthy,
      needsMoreIncome,
      isSpendingTooMuch,
      
      // Dados do mês
      totalCurrentMonthIncome,
      totalCurrentMonthExpenses,
      totalCurrentMonthInvestments,
      daysRemaining,
      
      // Recomendações
      recommendations
    };
  }, [incomes, expenses, investments, totalIncome, availableBalance]);

  return insights;
};

