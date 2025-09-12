import React, { useEffect, useCallback } from 'react';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useResponsive } from '@/hooks/useResponsive';

export const NotificationManager = () => {
  const { expenses, investments, categories, investmentGoal } = useFinance();
  const { sendFinancialReminder, permission } = useNotifications();
  const { isMobile } = useResponsive();

  // Verificar limites de gastos
  const checkExpenseLimits = useCallback(() => {
    if (!expenses.length || !categories.length) return;

    const expenseCategories = categories.filter(c => c.tipo === 'gasto');
    const currentMonth = new Date();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    expenseCategories.forEach(category => {
      if (!category.limite) return;

      const categoryExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.data);
        return expense.categoria_id === category.id && 
               expenseDate >= monthStart && 
               expenseDate <= monthEnd;
      });

      const totalSpent = categoryExpenses.reduce((sum, exp) => sum + exp.valor, 0);
      const percentage = (totalSpent / category.limite) * 100;

      // Notificar se atingiu 80% do limite
      if (percentage >= 80 && percentage < 100) {
        sendFinancialReminder('expenseLimit', {
          category: category.nome,
          percentage: Math.round(percentage)
        });
      }
    });
  }, [expenses, categories, sendFinancialReminder]);

  // Verificar meta de investimento
  const checkInvestmentGoal = useCallback(() => {
    if (!investments.length || !investmentGoal) return;

    const currentMonth = new Date();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthInvestments = investments.filter(investment => {
      const investmentDate = new Date(investment.data);
      return investmentDate >= monthStart && investmentDate <= monthEnd;
    });

    const totalInvested = monthInvestments.reduce((sum, inv) => sum + inv.valor_aporte, 0);
    const percentage = (totalInvested / investmentGoal) * 100;

    // Notificar se atingiu a meta ou se está próximo
    if (percentage >= 100) {
      sendFinancialReminder('investmentGoal', {
        achieved: true,
        percentage: Math.round(percentage)
      });
    } else if (percentage >= 80) {
      sendFinancialReminder('investmentGoal', {
        achieved: false,
        percentage: Math.round(percentage)
      });
    }
  }, [investments, investmentGoal, sendFinancialReminder]);

  // Verificar contas pendentes
  const checkPendingBills = useCallback(() => {
    if (!expenses.length) return;

    const pendingExpenses = expenses.filter(expense => !expense.pago);
    
    if (pendingExpenses.length > 0) {
      sendFinancialReminder('billReminder', {
        count: pendingExpenses.length
      });
    }
  }, [expenses, sendFinancialReminder]);

  // Enviar dicas financeiras
  const sendFinancialTips = useCallback(() => {
    const tips = [
      "Lembre-se de revisar seus gastos mensais regularmente",
      "Considere automatizar seus investimentos para manter a consistência",
      "A regra 50/30/20 pode ajudar a organizar suas finanças",
      "Mantenha uma reserva de emergência equivalente a 6 meses de gastos",
      "Revise suas metas financeiras trimestralmente"
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    
    sendFinancialReminder('savingsTip', {
      tip: randomTip
    });
  }, [sendFinancialReminder]);

  // Verificações periódicas
  useEffect(() => {
    if (permission !== 'granted') return;

    // Verificar limites de gastos a cada 30 minutos
    const expenseInterval = setInterval(checkExpenseLimits, 30 * 60 * 1000);
    
    // Verificar meta de investimento a cada hora
    const investmentInterval = setInterval(checkInvestmentGoal, 60 * 60 * 1000);
    
    // Verificar contas pendentes a cada 2 horas
    const billsInterval = setInterval(checkPendingBills, 2 * 60 * 60 * 1000);
    
    // Enviar dicas financeiras uma vez por dia
    const tipsInterval = setInterval(sendFinancialTips, 24 * 60 * 60 * 1000);

    // Verificações iniciais
    checkExpenseLimits();
    checkInvestmentGoal();
    checkPendingBills();

    return () => {
      clearInterval(expenseInterval);
      clearInterval(investmentInterval);
      clearInterval(billsInterval);
      clearInterval(tipsInterval);
    };
  }, [
    permission,
    checkExpenseLimits,
    checkInvestmentGoal,
    checkPendingBills,
    sendFinancialTips
  ]);

  // Verificações quando os dados mudam
  useEffect(() => {
    if (permission !== 'granted') return;

    // Debounce para evitar muitas notificações
    const timeoutId = setTimeout(() => {
      checkExpenseLimits();
      checkInvestmentGoal();
      checkPendingBills();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [expenses, investments, permission, checkExpenseLimits, checkInvestmentGoal, checkPendingBills]);

  // Este componente não renderiza nada, apenas gerencia notificações
  return null;
};
