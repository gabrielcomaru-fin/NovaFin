import { useCallback, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceDataContext';

export const useAdvancedMetrics = () => {
  const { expenses, investments, accounts, totalPatrimony, totalAccountBalance, totalInvestmentBalance } = useFinance();

  // Calcular métricas de saúde financeira
  const calculateFinancialHealth = useCallback((data) => {
    const totalMonthlyExpenses = data.expenses.reduce((sum, expense) => sum + expense.valor, 0);
    const totalMonthlyInvestments = data.investments.reduce((sum, investment) => sum + investment.valor_aporte, 0);
    
    const metrics = {
      // Indicadores de liquidez
      liquidityRatio: totalAccountBalance > 0 && totalMonthlyExpenses > 0 
        ? totalAccountBalance / totalMonthlyExpenses 
        : 0,
      
      // Taxa de poupança real
      savingsRate: (totalMonthlyExpenses + totalMonthlyInvestments) > 0 
        ? (totalMonthlyInvestments / (totalMonthlyExpenses + totalMonthlyInvestments)) * 100 
        : 0,
      
      // Velocidade de crescimento patrimonial
      wealthGrowthRate: calculateWealthGrowthRate(data),
      
      // Diversificação de investimentos
      investmentDiversification: calculateDiversification(data.investments),
      
      // Eficiência orçamentária
      budgetEfficiency: calculateBudgetEfficiency(data),
      
      // Score de saúde financeira (0-100)
      financialHealthScore: calculateFinancialHealthScore(data)
    };
    
    return metrics;
  }, [totalAccountBalance]);

  // Calcular taxa de crescimento patrimonial
  const calculateWealthGrowthRate = useCallback((data) => {
    if (data.investments.length < 2) return 0;
    
    const sortedInvestments = data.investments.sort((a, b) => new Date(a.data) - new Date(b.data));
    const firstMonth = sortedInvestments[0];
    const lastMonth = sortedInvestments[sortedInvestments.length - 1];
    
    const timeDiff = (new Date(lastMonth.data) - new Date(firstMonth.data)) / (1000 * 60 * 60 * 24 * 30); // meses
    if (timeDiff <= 0) return 0;
    
    const totalInvested = data.investments.reduce((sum, inv) => sum + inv.valor_aporte, 0);
    const averageMonthlyGrowth = totalInvested / timeDiff;
    
    return averageMonthlyGrowth;
  }, []);

  // Calcular diversificação de investimentos
  const calculateDiversification = useCallback((investments) => {
    if (investments.length === 0) return 0;
    
    const categoryCount = new Set(investments.map(inv => inv.categoria_id)).size;
    const totalInvestments = investments.length;
    
    // Score de diversificação baseado no número de categorias únicas
    return Math.min((categoryCount / totalInvestments) * 100, 100);
  }, []);

  // Calcular eficiência orçamentária
  const calculateBudgetEfficiency = useCallback((data) => {
    const totalExpenses = data.expenses.reduce((sum, expense) => sum + expense.valor, 0);
    const totalInvestments = data.investments.reduce((sum, investment) => sum + investment.valor_aporte, 0);
    
    if (totalExpenses === 0) return 100;
    
    // Eficiência baseada na proporção investimentos/gastos
    const efficiency = (totalInvestments / (totalExpenses + totalInvestments)) * 100;
    return Math.min(efficiency, 100);
  }, []);

  // Calcular score geral de saúde financeira
  const calculateFinancialHealthScore = useCallback((data) => {
    const totalMonthlyExpenses = data.expenses.reduce((sum, expense) => sum + expense.valor, 0);
    const totalMonthlyInvestments = data.investments.reduce((sum, investment) => sum + investment.valor_aporte, 0);
    
    let score = 0;
    
    // Score por taxa de poupança (0-40 pontos)
    const savingsRate = (totalMonthlyExpenses + totalMonthlyInvestments) > 0 
      ? (totalMonthlyInvestments / (totalMonthlyExpenses + totalMonthlyInvestments)) * 100 
      : 0;
    score += Math.min(savingsRate * 0.4, 40);
    
    // Score por liquidez (0-30 pontos)
    const liquidityRatio = totalAccountBalance > 0 && totalMonthlyExpenses > 0 
      ? totalAccountBalance / totalMonthlyExpenses 
      : 0;
    score += Math.min(liquidityRatio * 10, 30);
    
    // Score por diversificação (0-20 pontos)
    const diversification = calculateDiversification(data.investments);
    score += diversification * 0.2;
    
    // Score por consistência (0-10 pontos)
    const consistency = calculateConsistency(data);
    score += consistency * 0.1;
    
    return Math.min(Math.round(score), 100);
  }, [totalAccountBalance]);

  // Calcular consistência nos investimentos
  const calculateConsistency = useCallback((data) => {
    if (data.investments.length < 3) return 0;
    
    const monthlyInvestments = {};
    data.investments.forEach(inv => {
      const month = new Date(inv.data).toISOString().slice(0, 7);
      monthlyInvestments[month] = (monthlyInvestments[month] || 0) + inv.valor_aporte;
    });
    
    const months = Object.keys(monthlyInvestments).length;
    const monthsWithInvestments = Object.values(monthlyInvestments).filter(amount => amount > 0).length;
    
    return (monthsWithInvestments / months) * 100;
  }, []);

  // Análise de tendências
  const analyzeTrends = useCallback((data) => {
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
  }, []);

  // Analisar tendência de gastos
  const analyzeSpendingTrend = useCallback((expenses) => {
    if (expenses.length < 3) return 'insufficient_data';
    
    const monthlySpending = {};
    expenses.forEach(expense => {
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
  }, []);

  // Analisar tendência de investimentos
  const analyzeInvestmentTrend = useCallback((investments) => {
    if (investments.length < 3) return 'insufficient_data';
    
    const monthlyInvestments = {};
    investments.forEach(investment => {
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
  }, []);

  // Calcular inclinação da linha de tendência
  const calculateSlope = useCallback((values) => {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }, []);

  // Métricas memoizadas
  const financialHealth = useMemo(() => {
    return calculateFinancialHealth({ expenses, investments, accounts });
  }, [expenses, investments, accounts, calculateFinancialHealth]);

  const trends = useMemo(() => {
    return analyzeTrends({ expenses, investments });
  }, [expenses, investments, analyzeTrends]);

  return {
    financialHealth,
    trends,
    calculateFinancialHealth,
    analyzeTrends
  };
};
