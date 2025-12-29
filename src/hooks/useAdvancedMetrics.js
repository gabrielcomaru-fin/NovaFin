import { useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceDataContext';

export const useAdvancedMetrics = () => {
  const { expenses, investments, accounts, totalPatrimony, totalAccountBalance, totalInvestmentBalance } = useFinance();

  // Funções de cálculo puras (não usam useCallback para evitar problemas de dependência)
  
  // Calcular total de investimentos marcados como reserva de emergência
  const calculateEmergencyFundFromInvestments = (investmentList) => {
    return investmentList
      .filter(inv => inv.is_reserva_emergencia === true)
      .reduce((sum, inv) => sum + (inv.valor_aporte || 0), 0);
  };

  // Calcular taxa de crescimento patrimonial
  const calculateWealthGrowthRate = (data) => {
    if (data.investments.length < 2) return 0;
    
    const sortedInvestments = [...data.investments].sort((a, b) => new Date(a.data) - new Date(b.data));
    const firstMonth = sortedInvestments[0];
    const lastMonth = sortedInvestments[sortedInvestments.length - 1];
    
    const timeDiff = (new Date(lastMonth.data) - new Date(firstMonth.data)) / (1000 * 60 * 60 * 24 * 30); // meses
    if (timeDiff <= 0) return 0;
    
    const totalInvested = data.investments.reduce((sum, inv) => sum + inv.valor_aporte, 0);
    const averageMonthlyGrowth = totalInvested / timeDiff;
    
    return averageMonthlyGrowth;
  };

  // Calcular diversificação de investimentos
  const calculateDiversification = (investmentList) => {
    if (investmentList.length === 0) return 0;
    
    const categoryCount = new Set(investmentList.map(inv => inv.categoria_id)).size;
    const totalInvestments = investmentList.length;
    
    // Score de diversificação baseado no número de categorias únicas
    return Math.min((categoryCount / totalInvestments) * 100, 100);
  };

  // Calcular eficiência orçamentária
  const calculateBudgetEfficiency = (data) => {
    const totalExpenses = data.expenses.reduce((sum, expense) => sum + expense.valor, 0);
    const totalInvestments = data.investments.reduce((sum, investment) => sum + investment.valor_aporte, 0);
    
    if (totalExpenses === 0) return 100;
    
    // Eficiência baseada na proporção investimentos/gastos
    const efficiency = (totalInvestments / (totalExpenses + totalInvestments)) * 100;
    return Math.min(efficiency, 100);
  };

  // Calcular consistência nos investimentos
  const calculateConsistency = (data) => {
    if (data.investments.length < 3) return 0;
    
    const monthlyInvestments = {};
    data.investments.forEach(inv => {
      const month = new Date(inv.data).toISOString().slice(0, 7);
      monthlyInvestments[month] = (monthlyInvestments[month] || 0) + inv.valor_aporte;
    });
    
    const months = Object.keys(monthlyInvestments).length;
    const monthsWithInvestments = Object.values(monthlyInvestments).filter(amount => amount > 0).length;
    
    return (monthsWithInvestments / months) * 100;
  };

  // Calcular a média mensal de gastos baseada no histórico
  const calculateAverageMonthlyExpenses = (expenseList) => {
    if (expenseList.length === 0) return 0;
    
    const totalExpenses = expenseList.reduce((sum, expense) => sum + expense.valor, 0);
    
    // Contar meses únicos de gastos
    const expenseMonths = new Set(
      expenseList.map(expense => new Date(expense.data).toISOString().slice(0, 7))
    );
    const monthCount = Math.max(expenseMonths.size, 1); // Evita divisão por zero
    
    return totalExpenses / monthCount;
  };

  // Calcular score geral de saúde financeira
  const calculateFinancialHealthScore = (data, emergencyFundFromInvestments, averageMonthlyExpenses) => {
    const totalExpenses = data.expenses.reduce((sum, expense) => sum + expense.valor, 0);
    const totalInvestments = data.investments.reduce((sum, investment) => sum + investment.valor_aporte, 0);
    
    let score = 0;
    
    // Score por taxa de poupança (0-40 pontos)
    const savingsRate = (totalExpenses + totalInvestments) > 0 
      ? (totalInvestments / (totalExpenses + totalInvestments)) * 100 
      : 0;
    score += Math.min(savingsRate * 0.4, 40);
    
    // Score por liquidez (0-30 pontos) - usa APENAS a reserva de emergência (investimentos marcados)
    // A reserva já está contida no saldo das contas, então não somamos
    const liquidityRatio = emergencyFundFromInvestments > 0 && averageMonthlyExpenses > 0 
      ? emergencyFundFromInvestments / averageMonthlyExpenses 
      : 0;
    score += Math.min(liquidityRatio * 10, 30);
    
    // Score por diversificação (0-20 pontos)
    const diversification = calculateDiversification(data.investments);
    score += diversification * 0.2;
    
    // Score por consistência (0-10 pontos)
    const consistency = calculateConsistency(data);
    score += consistency * 0.1;
    
    return Math.min(Math.round(score), 100);
  };

  // Calcular métricas de saúde financeira
  const calculateFinancialHealth = (data, accountBalance) => {
    const totalExpenses = data.expenses.reduce((sum, expense) => sum + expense.valor, 0);
    const totalInvestments = data.investments.reduce((sum, investment) => sum + investment.valor_aporte, 0);
    
    // Calcular média mensal de gastos (corrigido: usa média, não total)
    const averageMonthlyExpenses = calculateAverageMonthlyExpenses(data.expenses);
    
    // Contar meses únicos de gastos para exibição
    const expenseMonths = new Set(
      data.expenses.map(expense => new Date(expense.data).toISOString().slice(0, 7))
    );
    const monthsOfData = expenseMonths.size;
    
    // CORRIGIDO: Usa APENAS os investimentos marcados como reserva de emergência
    // A reserva já está contida no saldo das contas, então não somamos
    const emergencyFundFromInvestments = calculateEmergencyFundFromInvestments(data.investments);
    
    const metrics = {
      // Indicadores de liquidez - CORRIGIDO: usa APENAS a reserva (investimentos marcados)
      // dividido pela média mensal de gastos
      liquidityRatio: emergencyFundFromInvestments > 0 && averageMonthlyExpenses > 0 
        ? emergencyFundFromInvestments / averageMonthlyExpenses 
        : 0,
      
      // Total da reserva de emergência (apenas investimentos marcados)
      emergencyFundTotal: emergencyFundFromInvestments,
      emergencyFundFromAccounts: accountBalance, // Mantido para referência, mas não usado no cálculo
      emergencyFundFromInvestments: emergencyFundFromInvestments,
      
      // Dados de gastos para exibição
      totalExpenses: totalExpenses,
      averageMonthlyExpenses: averageMonthlyExpenses,
      monthsOfData: monthsOfData,
      
      // Taxa de poupança real
      savingsRate: (totalExpenses + totalInvestments) > 0 
        ? (totalInvestments / (totalExpenses + totalInvestments)) * 100 
        : 0,
      
      // Velocidade de crescimento patrimonial
      wealthGrowthRate: calculateWealthGrowthRate(data),
      
      // Diversificação de investimentos
      investmentDiversification: calculateDiversification(data.investments),
      
      // Eficiência orçamentária
      budgetEfficiency: calculateBudgetEfficiency(data),
      
      // Score de saúde financeira (0-100)
      financialHealthScore: calculateFinancialHealthScore(data, emergencyFundFromInvestments, averageMonthlyExpenses)
    };
    
    return metrics;
  };

  // Calcular inclinação da linha de tendência
  const calculateSlope = (values) => {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return 0;
    
    return (n * sumXY - sumX * sumY) / denominator;
  };

  // Analisar tendência de gastos
  const analyzeSpendingTrend = (expenseList) => {
    if (expenseList.length < 3) return 'insufficient_data';
    
    const monthlySpending = {};
    expenseList.forEach(expense => {
      const month = new Date(expense.data).toISOString().slice(0, 7);
      monthlySpending[month] = (monthlySpending[month] || 0) + expense.valor;
    });
    
    const months = Object.keys(monthlySpending).sort();
    if (months.length < 3) return 'insufficient_data';
    
    const values = months.map(month => monthlySpending[month]);
    const slope = calculateSlope(values);
    
    if (slope > 0.1) return 'increasing';
    if (slope < -0.1) return 'decreasing';
    return 'stable';
  };

  // Analisar tendência de investimentos
  const analyzeInvestmentTrend = (investmentList) => {
    if (investmentList.length < 3) return 'insufficient_data';
    
    const monthlyInvestments = {};
    investmentList.forEach(investment => {
      const month = new Date(investment.data).toISOString().slice(0, 7);
      monthlyInvestments[month] = (monthlyInvestments[month] || 0) + investment.valor_aporte;
    });
    
    const months = Object.keys(monthlyInvestments).sort();
    if (months.length < 3) return 'insufficient_data';
    
    const values = months.map(month => monthlyInvestments[month]);
    const slope = calculateSlope(values);
    
    if (slope > 0.1) return 'increasing';
    if (slope < -0.1) return 'decreasing';
    return 'stable';
  };

  // Análise de tendências
  const analyzeTrends = (data) => {
    const trends = {
      spending: analyzeSpendingTrend(data.expenses),
      investment: analyzeInvestmentTrend(data.investments),
      overall: 'stable'
    };
    
    // Determinar tendência geral
    if (trends.spending === 'increasing' && trends.investment === 'decreasing') {
      trends.overall = 'concerning';
    } else if (trends.spending === 'decreasing' && trends.investment === 'increasing') {
      trends.overall = 'positive';
    } else if (trends.spending === 'increasing' && trends.investment === 'increasing') {
      trends.overall = 'mixed';
    }
    
    return trends;
  };

  // Métricas memoizadas - recalculam automaticamente quando os dados mudam
  const financialHealth = useMemo(() => {
    return calculateFinancialHealth({ expenses, investments, accounts }, totalAccountBalance);
  }, [expenses, investments, accounts, totalAccountBalance]);

  const trends = useMemo(() => {
    return analyzeTrends({ expenses, investments });
  }, [expenses, investments]);

  return {
    financialHealth,
    trends,
    calculateFinancialHealth: (data) => calculateFinancialHealth(data, totalAccountBalance),
    analyzeTrends
  };
};
