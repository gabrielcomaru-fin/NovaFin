import { useCallback, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useAdvancedMetrics } from './useAdvancedMetrics';

export const useSmartInsights = () => {
  const { expenses, investments, categories, accounts } = useFinance();
  const { financialHealth, trends } = useAdvancedMetrics();

  // Gerar insights inteligentes
  const generateInsights = useCallback((data) => {
    const insights = [];
    
    // Análise de padrões de gastos
    const spendingPatterns = analyzeSpendingPatterns(data.expenses);
    if (spendingPatterns.trend === 'increasing') {
      insights.push({
        type: 'warning',
        title: 'Tendência de Aumento nos Gastos',
        message: `Seus gastos aumentaram ${spendingPatterns.percentage}% nos últimos 3 meses`,
        recommendation: 'Revise suas categorias de gastos e considere ajustar o orçamento',
        priority: 'high',
        action: 'Revisar orçamento'
      });
    }
    
    // Análise de sazonalidade
    const seasonality = detectSeasonality(data.expenses);
    if (seasonality.detected) {
      insights.push({
        type: 'info',
        title: 'Padrão Sazonal Detectado',
        message: `Seus gastos são ${seasonality.percentage}% maiores em ${seasonality.months.join(', ')}`,
        recommendation: 'Planeje reservas para esses períodos',
        priority: 'medium',
        action: 'Configurar alertas sazonais'
      });
    }
    
    // Análise de oportunidades de investimento
    const investmentOpportunity = findInvestmentOpportunities(data);
    if (investmentOpportunity.found) {
      insights.push({
        type: 'success',
        title: 'Oportunidade de Investimento',
        message: `Você tem R$ ${investmentOpportunity.amount.toLocaleString('pt-BR')} disponível para investir`,
        recommendation: 'Considere aumentar seus aportes mensais',
        priority: 'high',
        action: 'Aumentar aportes'
      });
    }
    
    // Análise de diversificação
    const diversification = analyzeDiversification(data.investments, data.categories);
    if (diversification.score < 30) {
      insights.push({
        type: 'warning',
        title: 'Baixa Diversificação',
        message: `Seus investimentos estão concentrados em ${diversification.topCategories.length} categoria(s)`,
        recommendation: 'Considere diversificar seus investimentos',
        priority: 'medium',
        action: 'Diversificar investimentos'
      });
    }
    
    // Análise de liquidez
    const liquidity = analyzeLiquidity(data);
    if (liquidity.ratio < 3) {
      insights.push({
        type: 'warning',
        title: 'Reserva de Emergência Baixa',
        message: `Sua reserva de emergência cobre apenas ${liquidity.months} mês(es) de gastos`,
        recommendation: 'Construa uma reserva de emergência de 3-6 meses',
        priority: 'high',
        action: 'Construir reserva de emergência'
      });
    }
    
    // Análise de metas
    const goals = analyzeGoals(data);
    if (goals.progress < 50) {
      insights.push({
        type: 'info',
        title: 'Meta de Investimentos',
        message: `Você está ${goals.progress}% do caminho para sua meta mensal`,
        recommendation: goals.progress < 25 ? 'Aumente seus aportes para alcançar a meta' : 'Continue no ritmo atual',
        priority: 'medium',
        action: 'Ajustar meta'
      });
    }
    
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, []);

  // Analisar padrões de gastos
  const analyzeSpendingPatterns = useCallback((expenses) => {
    if (expenses.length < 6) return { trend: 'insufficient_data', percentage: 0 };
    
    const monthlySpending = {};
    expenses.forEach(expense => {
      const month = new Date(expense.data).toISOString().slice(0, 7);
      monthlySpending[month] = (monthlySpending[month] || 0) + expense.valor;
    });
    
    const months = Object.keys(monthlySpending).sort();
    if (months.length < 3) return { trend: 'insufficient_data', percentage: 0 };
    
    const recentMonths = months.slice(-3);
    const olderMonths = months.slice(-6, -3);
    
    const recentAverage = recentMonths.reduce((sum, month) => sum + (monthlySpending[month] || 0), 0) / recentMonths.length;
    const olderAverage = olderMonths.length > 0 
      ? olderMonths.reduce((sum, month) => sum + (monthlySpending[month] || 0), 0) / olderMonths.length 
      : recentAverage;
    
    const percentage = olderAverage > 0 ? ((recentAverage - olderAverage) / olderAverage) * 100 : 0;
    
    return {
      trend: percentage > 10 ? 'increasing' : percentage < -10 ? 'decreasing' : 'stable',
      percentage: Math.abs(percentage)
    };
  }, []);

  // Detectar sazonalidade
  const detectSeasonality = useCallback((expenses) => {
    if (expenses.length < 12) return { detected: false, percentage: 0, months: [] };
    
    const monthlySpending = {};
    expenses.forEach(expense => {
      const month = new Date(expense.data).toISOString().slice(0, 7);
      monthlySpending[month] = (monthlySpending[month] || 0) + expense.valor;
    });
    
    const months = Object.keys(monthlySpending).sort();
    const values = months.map(month => monthlySpending[month]);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    const highMonths = months.filter((month, index) => values[index] > average * 1.2);
    const lowMonths = months.filter((month, index) => values[index] < average * 0.8);
    
    const seasonality = highMonths.length > 0 || lowMonths.length > 0;
    const percentage = seasonality ? Math.max(...values) / average * 100 - 100 : 0;
    
    return {
      detected: seasonality,
      percentage: Math.round(percentage),
      months: highMonths.map(month => {
        const date = new Date(month + '-01');
        return date.toLocaleDateString('pt-BR', { month: 'long' });
      })
    };
  }, []);

  // Encontrar oportunidades de investimento
  const findInvestmentOpportunities = useCallback((data) => {
    const totalExpenses = data.expenses.reduce((sum, expense) => sum + expense.valor, 0);
    const totalInvestments = data.investments.reduce((sum, investment) => sum + investment.valor_aporte, 0);
    const totalAccounts = data.accounts.reduce((sum, account) => sum + (account.saldo || 0), 0);
    
    // Inclui investimentos marcados como reserva de emergência na liquidez
    const emergencyFromInvestments = data.investments
      .filter(inv => inv.is_reserva_emergencia === true)
      .reduce((sum, inv) => sum + (inv.valor_aporte || 0), 0);
    
    const totalLiquidity = totalAccounts + emergencyFromInvestments;
    
    // Calcular quanto poderia ser investido (após garantir reserva de 3 meses)
    const potentialInvestment = Math.max(0, totalLiquidity - (totalExpenses * 3));
    
    return {
      found: potentialInvestment > 100,
      amount: potentialInvestment,
      recommendation: potentialInvestment > 1000 ? 'Considere investir em produtos de longo prazo' : 'Comece com investimentos de baixo valor'
    };
  }, []);

  // Analisar diversificação
  const analyzeDiversification = useCallback((investments, categories) => {
    if (investments.length === 0) return { score: 0, topCategories: [] };
    
    const categoryTotals = {};
    investments.forEach(investment => {
      const category = categories.find(c => c.id === investment.categoria_id);
      if (category) {
        categoryTotals[category.nome] = (categoryTotals[category.nome] || 0) + investment.valor_aporte;
      }
    });
    
    const totalInvested = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    const categoryCount = Object.keys(categoryTotals).length;
    
    // Score baseado no número de categorias e distribuição
    const distributionScore = Object.values(categoryTotals).reduce((score, amount) => {
      const percentage = (amount / totalInvested) * 100;
      return score + (percentage > 50 ? 0 : percentage / 10); // Penaliza concentração
    }, 0);
    
    const score = Math.min((categoryCount * 20) + distributionScore, 100);
    const topCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name);
    
    return { score, topCategories };
  }, []);

  // Analisar liquidez (considera investimentos de reserva de emergência)
  const analyzeLiquidity = useCallback((data) => {
    const totalExpenses = data.expenses.reduce((sum, expense) => sum + expense.valor, 0);
    const totalAccounts = data.accounts.reduce((sum, account) => sum + (account.saldo || 0), 0);
    
    // Inclui investimentos marcados como reserva de emergência
    const emergencyFromInvestments = data.investments
      .filter(inv => inv.is_reserva_emergencia === true)
      .reduce((sum, inv) => sum + (inv.valor_aporte || 0), 0);
    
    const totalLiquidity = totalAccounts + emergencyFromInvestments;
    const ratio = totalExpenses > 0 ? totalLiquidity / totalExpenses : 0;
    const months = Math.round(ratio);
    
    return { ratio, months, emergencyFromInvestments };
  }, []);

  // Analisar metas
  const analyzeGoals = useCallback((data) => {
    // Assumindo que há uma meta mensal de investimento
    const monthlyGoal = 1000; // Valor padrão, pode ser configurável
    const monthlyInvestments = data.investments.reduce((sum, investment) => {
      const month = new Date(investment.data).toISOString().slice(0, 7);
      const currentMonth = new Date().toISOString().slice(0, 7);
      return month === currentMonth ? sum + investment.valor_aporte : sum;
    }, 0);
    
    const progress = monthlyGoal > 0 ? (monthlyInvestments / monthlyGoal) * 100 : 0;
    
    return { progress: Math.round(progress), monthlyGoal, monthlyInvestments };
  }, []);

  // Gerar recomendações personalizadas
  const generateRecommendations = useCallback((data) => {
    const recommendations = [];
    
    // Recomendação baseada na idade (simulada)
    const age = 30; // Pode ser obtido do perfil do usuário
    if (age < 30) {
      recommendations.push({
        title: 'Invista em Educação Financeira',
        description: 'Como jovem, foque em aprender sobre investimentos e construir uma base sólida',
        priority: 'high',
        category: 'education'
      });
    } else if (age > 50) {
      recommendations.push({
        title: 'Foque em Preservação de Capital',
        description: 'Considere investimentos mais conservadores para preservar seu patrimônio',
        priority: 'high',
        category: 'conservation'
      });
    }
    
    // Recomendação baseada no patrimônio
    const totalPatrimony = data.accounts.reduce((sum, account) => sum + (account.saldo || 0), 0);
    if (totalPatrimony < 10000) {
      recommendations.push({
        title: 'Construa uma Reserva de Emergência',
        description: 'Foque em acumular 3-6 meses de gastos em uma conta de fácil acesso',
        priority: 'high',
        category: 'emergency_fund'
      });
    } else if (totalPatrimony > 100000) {
      recommendations.push({
        title: 'Considere Diversificação Internacional',
        description: 'Com maior patrimônio, considere investir em mercados internacionais',
        priority: 'medium',
        category: 'international_diversification'
      });
    }
    
    return recommendations;
  }, []);

  // Insights memoizados
  const insights = useMemo(() => {
    return generateInsights({ expenses, investments, categories, accounts });
  }, [expenses, investments, categories, accounts, generateInsights]);

  const recommendations = useMemo(() => {
    return generateRecommendations({ expenses, investments, categories, accounts });
  }, [expenses, investments, categories, accounts, generateRecommendations]);

  return {
    insights,
    recommendations,
    generateInsights,
    generateRecommendations
  };
};
