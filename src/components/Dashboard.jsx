import React, { memo, useMemo } from 'react';
import { KPICards } from '@/components/dashboard/KPICards';
import { ProgressCards } from '@/components/dashboard/ProgressCards';
import { ProjectionCard } from '@/components/dashboard/ProjectionCard';
import { ExpenseBreakdown } from '@/components/dashboard/ExpenseBreakdown';
import { TipsSection } from '@/components/dashboard/TipsSection';
import { GamificationPanel } from '@/components/GamificationPanel';

const Dashboard = memo(function Dashboard({
  totalMonthlyExpenses,
  totalMonthlyInvestments,
  totalPaidExpenses,
  totalPendingExpenses,
  expensesByCategory,
  investmentGoal,
  periodInvestmentGoal,
  savingsRate,
  projection12m,
  categories,
}) {
  // Memoizar cálculos pesados
  const investmentProgress = useMemo(() => 
    periodInvestmentGoal > 0 ? (totalMonthlyInvestments / periodInvestmentGoal) * 100 : 0,
    [totalMonthlyInvestments, periodInvestmentGoal]
  );
  
  const expenseCategories = useMemo(() => 
    categories.filter(c => c.tipo === 'gasto'),
    [categories]
  );
  
  const totalExpenseLimit = useMemo(() => 
    expenseCategories.reduce((acc, cat) => acc + (cat.limite || 0), 0),
    [expenseCategories]
  );
  
  const expenseLimitProgress = useMemo(() => 
    totalExpenseLimit > 0 ? (totalMonthlyExpenses / totalExpenseLimit) * 100 : 0,
    [totalMonthlyExpenses, totalExpenseLimit]
  );

  const tips = useMemo(() => {
    const tipsArray = [];
    
    expenseCategories.forEach(category => {
      const amount = expensesByCategory[category.id] || 0;
      if (category.limite && amount > category.limite * 0.8) {
        const percentage = Math.round((amount / category.limite) * 100);
        tipsArray.push({
          type: 'warning',
          message: `Seu gasto em ${category.nome} já chegou a ${percentage}% do limite. Considere ajustar para sobrar mais para investimentos!`
        });
      }
    });

    if (totalMonthlyInvestments < investmentGoal * 0.5 && investmentGoal > 0) {
      tipsArray.push({
        type: 'tip',
        message: 'Que tal aumentar seus aportes? Mesmo pequenos valores fazem diferença no longo prazo!'
      });
    }

    if (totalMonthlyExpenses > 0 && totalMonthlyInvestments === 0) {
      tipsArray.push({
        type: 'tip',
        message: 'Tente aplicar a regra 50/30/20: 50% para necessidades, 30% para desejos e 20% para poupança e investimentos.'
      });
    }

    if (tipsArray.length === 0) {
      tipsArray.push({
        type: 'success',
        message: 'Parabéns! Você está no caminho certo para uma vida financeira saudável! 🎉'
      });
    }

    return tipsArray;
  }, [expenseCategories, expensesByCategory, totalMonthlyInvestments, investmentGoal, totalMonthlyExpenses]);

  return (
    <div className="space-y-6">
      {/* KPIs principais */}
      <KPICards
        totalMonthlyExpenses={totalMonthlyExpenses}
        totalMonthlyInvestments={totalMonthlyInvestments}
        totalPaidExpenses={totalPaidExpenses}
        totalPendingExpenses={totalPendingExpenses}
        savingsRate={savingsRate}
        periodInvestmentGoal={periodInvestmentGoal}
        investmentProgress={investmentProgress}
      />

      {/* Gamificação */}
      <GamificationPanel />

      {/* Cards de progresso */}
      <ProgressCards
        totalMonthlyInvestments={totalMonthlyInvestments}
        periodInvestmentGoal={periodInvestmentGoal}
        investmentProgress={investmentProgress}
        totalMonthlyExpenses={totalMonthlyExpenses}
        totalExpenseLimit={totalExpenseLimit}
        expenseLimitProgress={expenseLimitProgress}
      />

      {/* Projeção */}
      <ProjectionCard projection12m={projection12m} />

      {/* Gastos por categoria e dicas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ExpenseBreakdown
          expensesByCategory={expensesByCategory}
          totalMonthlyExpenses={totalMonthlyExpenses}
          expenseCategories={expenseCategories}
        />
        <TipsSection tips={tips} />
      </div>
    </div>
  );
});

export { Dashboard };