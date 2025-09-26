import { useCallback, useMemo, useState } from 'react';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useAdvancedMetrics } from './useAdvancedMetrics';
import { useSmartInsights } from './useSmartInsights';

export const usePersonalizedReports = () => {
  const { expenses, investments, accounts, categories } = useFinance();
  const { financialHealth, trends } = useAdvancedMetrics();
  const { insights, recommendations } = useSmartInsights();
  const [userProfile, setUserProfile] = useState({
    experience: 'beginner', // 'beginner', 'intermediate', 'advanced'
    age: 30,
    familySize: 1,
    income: 'medium', // 'low', 'medium', 'high'
    goals: ['savings', 'investment'], // 'savings', 'investment', 'debt_payoff', 'retirement'
    riskTolerance: 'moderate' // 'conservative', 'moderate', 'aggressive'
  });

  // Gerar relatório personalizado
  const generatePersonalizedReport = useCallback((profile, data) => {
    const report = {
      profile: profile,
      generatedAt: new Date().toISOString(),
      sections: []
    };
    
    // Seção para iniciantes
    if (profile.experience === 'beginner') {
      report.sections.push({
        title: 'Fundamentos Financeiros',
        content: generateBasicFinancialEducation(data),
        priority: 'high',
        type: 'education'
      });
    }
    
    // Seção para investidores experientes
    if (profile.experience === 'advanced') {
      report.sections.push({
        title: 'Análise de Performance',
        content: generateAdvancedPerformanceAnalysis(data),
        priority: 'high',
        type: 'analysis'
      });
    }
    
    // Seção para famílias
    if (profile.familySize > 1) {
      report.sections.push({
        title: 'Análise Familiar',
        content: generateFamilyFinancialAnalysis(data),
        priority: 'medium',
        type: 'family'
      });
    }
    
    // Seção baseada na idade
    if (profile.age < 30) {
      report.sections.push({
        title: 'Planejamento de Longo Prazo',
        content: generateLongTermPlanning(data),
        priority: 'high',
        type: 'planning'
      });
    } else if (profile.age > 50) {
      report.sections.push({
        title: 'Preparação para Aposentadoria',
        content: generateRetirementPlanning(data),
        priority: 'high',
        type: 'retirement'
      });
    }
    
    // Seção baseada na renda
    if (profile.income === 'high') {
      report.sections.push({
        title: 'Otimização Fiscal',
        content: generateTaxOptimization(data),
        priority: 'medium',
        type: 'tax'
      });
    }
    
    // Seção baseada nos objetivos
    if (profile.goals.includes('debt_payoff')) {
      report.sections.push({
        title: 'Estratégia de Quitação de Dívidas',
        content: generateDebtPayoffStrategy(data),
        priority: 'high',
        type: 'debt'
      });
    }
    
    if (profile.goals.includes('investment')) {
      report.sections.push({
        title: 'Estratégia de Investimentos',
        content: generateInvestmentStrategy(data, profile),
        priority: 'high',
        type: 'investment'
      });
    }
    
    return report;
  }, []);

  // Gerar educação financeira básica
  const generateBasicFinancialEducation = useCallback((data) => {
    const totalExpenses = data.expenses.reduce((sum, expense) => sum + expense.valor, 0);
    const totalInvestments = data.investments.reduce((sum, investment) => sum + investment.valor_aporte, 0);
    const savingsRate = totalExpenses > 0 ? (totalInvestments / (totalExpenses + totalInvestments)) * 100 : 0;
    
    return {
      concepts: [
        {
          title: 'Regra 50/30/20',
          description: '50% para necessidades, 30% para desejos, 20% para poupança e investimentos',
          yourPercentage: {
            needs: Math.min((totalExpenses * 0.7) / (totalExpenses + totalInvestments) * 100, 100),
            wants: Math.min((totalExpenses * 0.3) / (totalExpenses + totalInvestments) * 100, 100),
            savings: savingsRate
          }
        },
        {
          title: 'Reserva de Emergência',
          description: 'Mantenha 3-6 meses de gastos em uma conta de fácil acesso',
          yourStatus: data.accounts.reduce((sum, account) => sum + (account.saldo || 0), 0) / (totalExpenses || 1),
          recommendation: totalExpenses > 0 ? 'Construa uma reserva de emergência' : 'Você já tem uma boa reserva'
        }
      ],
      tips: [
        'Comece investindo pequenas quantias regularmente',
        'Evite gastos por impulso - espere 24h antes de comprar',
        'Use a regra do envelope para categorizar seus gastos',
        'Revise seus gastos mensalmente e ajuste conforme necessário'
      ]
    };
  }, []);

  // Gerar análise de performance avançada
  const generateAdvancedPerformanceAnalysis = useCallback((data) => {
    const performance = {
      roi: calculateROI(data.investments),
      volatility: calculateVolatility(data.investments),
      sharpeRatio: calculateSharpeRatio(data.investments),
      maxDrawdown: calculateMaxDrawdown(data.investments)
    };
    
    return {
      metrics: performance,
      analysis: generatePerformanceAnalysis(performance),
      recommendations: generatePerformanceRecommendations(performance)
    };
  }, []);

  // Gerar análise familiar
  const generateFamilyFinancialAnalysis = useCallback((data) => {
    const familyMetrics = {
      totalHouseholdIncome: data.accounts.reduce((sum, account) => sum + (account.saldo || 0), 0),
      totalHouseholdExpenses: data.expenses.reduce((sum, expense) => sum + expense.valor, 0),
      perCapitaExpenses: data.expenses.reduce((sum, expense) => sum + expense.valor, 0) / userProfile.familySize,
      familySavingsRate: calculateFamilySavingsRate(data)
    };
    
    return {
      metrics: familyMetrics,
      recommendations: [
        'Considere um orçamento familiar compartilhado',
        'Planeje para despesas educacionais futuras',
        'Revise seguros de vida e saúde da família',
        'Considere investimentos em nome dos filhos'
      ]
    };
  }, [userProfile.familySize]);

  // Gerar planejamento de longo prazo
  const generateLongTermPlanning = useCallback((data) => {
    const currentAge = userProfile.age;
    const retirementAge = 65;
    const yearsToRetirement = retirementAge - currentAge;
    
    const projections = {
      currentSavings: data.accounts.reduce((sum, account) => sum + (account.saldo || 0), 0),
      monthlyInvestment: data.investments.reduce((sum, investment) => sum + investment.valor_aporte, 0),
      projectedRetirement: calculateRetirementProjection(data, yearsToRetirement)
    };
    
    return {
      projections,
      recommendations: [
        'Comece a investir em produtos de longo prazo',
        'Considere aumentar seus aportes anualmente',
        'Diversifique entre renda fixa e variável',
        'Planeje para grandes despesas futuras (casa, carro)'
      ]
    };
  }, [userProfile.age]);

  // Gerar planejamento para aposentadoria
  const generateRetirementPlanning = useCallback((data) => {
    const currentAge = userProfile.age;
    const retirementAge = 65;
    const yearsToRetirement = Math.max(retirementAge - currentAge, 0);
    
    const retirementAnalysis = {
      currentRetirementSavings: data.accounts.reduce((sum, account) => sum + (account.saldo || 0), 0),
      monthlyRetirementContribution: data.investments.reduce((sum, investment) => sum + investment.valor_aporte, 0),
      projectedRetirementIncome: calculateRetirementIncome(data, yearsToRetirement),
      retirementGap: calculateRetirementGap(data, yearsToRetirement)
    };
    
    return {
      analysis: retirementAnalysis,
      recommendations: [
        'Considere aumentar suas contribuições para aposentadoria',
        'Revise sua alocação de ativos para ser mais conservadora',
        'Planeje para despesas médicas futuras',
        'Considere produtos de renda vitalícia'
      ]
    };
  }, [userProfile.age]);

  // Gerar otimização fiscal
  const generateTaxOptimization = useCallback((data) => {
    const taxOptimization = {
      currentTaxableInvestments: data.investments.reduce((sum, investment) => sum + investment.valor_aporte, 0),
      potentialTaxSavings: calculatePotentialTaxSavings(data),
      recommendedProducts: ['LCI', 'LCA', 'Tesouro Direto', 'Fundos Imobiliários']
    };
    
    return {
      analysis: taxOptimization,
      recommendations: [
        'Considere investir em produtos isentos de IR',
        'Maximize suas contribuições para previdência privada',
        'Revise sua estratégia de rebalanceamento',
        'Considere a diversificação internacional'
      ]
    };
  }, []);

  // Gerar estratégia de quitação de dívidas
  const generateDebtPayoffStrategy = useCallback((data) => {
    const debtAnalysis = {
      totalDebt: data.accounts.filter(account => (account.saldo || 0) < 0).reduce((sum, account) => sum + Math.abs(account.saldo), 0),
      monthlyDebtPayment: calculateMonthlyDebtPayment(data),
      payoffStrategy: 'snowball', // ou 'avalanche'
      estimatedPayoffTime: calculatePayoffTime(data)
    };
    
    return {
      analysis: debtAnalysis,
      recommendations: [
        'Priorize dívidas com maior taxa de juros',
        'Considere consolidar dívidas com menor taxa',
        'Evite novas dívidas durante o pagamento',
        'Celebre pequenas vitórias no caminho'
      ]
    };
  }, []);

  // Gerar estratégia de investimentos
  const generateInvestmentStrategy = useCallback((data, profile) => {
    const strategy = {
      riskProfile: profile.riskTolerance,
      currentAllocation: analyzeCurrentAllocation(data.investments, data.categories),
      recommendedAllocation: getRecommendedAllocation(profile.riskTolerance, profile.age),
      rebalancingSchedule: 'trimestral'
    };
    
    return {
      strategy,
      recommendations: [
        'Mantenha uma alocação equilibrada entre renda fixa e variável',
        'Rebalanceie sua carteira regularmente',
        'Considere investimentos em diferentes setores',
        'Revise sua estratégia anualmente'
      ]
    };
  }, []);

  // Funções auxiliares
  const calculateROI = (investments) => {
    if (investments.length < 2) return 0;
    const totalInvested = investments.reduce((sum, inv) => sum + inv.valor_aporte, 0);
    const currentValue = investments.reduce((sum, inv) => sum + (inv.saldo_total || inv.valor_aporte), 0);
    return totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;
  };

  const calculateVolatility = (investments) => {
    // Implementação simplificada
    return Math.random() * 20; // Simulado
  };

  const calculateSharpeRatio = (investments) => {
    // Implementação simplificada
    return Math.random() * 2; // Simulado
  };

  const calculateMaxDrawdown = (investments) => {
    // Implementação simplificada
    return Math.random() * 10; // Simulado
  };

  const calculateFamilySavingsRate = (data) => {
    const totalIncome = data.accounts.reduce((sum, account) => sum + (account.saldo || 0), 0);
    const totalExpenses = data.expenses.reduce((sum, expense) => sum + expense.valor, 0);
    return totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  };

  const calculateRetirementProjection = (data, years) => {
    const monthlyInvestment = data.investments.reduce((sum, investment) => sum + investment.valor_aporte, 0);
    const annualReturn = 0.08; // 8% ao ano
    const monthlyReturn = annualReturn / 12;
    const months = years * 12;
    
    return monthlyInvestment * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);
  };

  const calculateRetirementIncome = (data, years) => {
    const projection = calculateRetirementProjection(data, years);
    return projection * 0.04; // Regra dos 4%
  };

  const calculateRetirementGap = (data, years) => {
    const targetIncome = data.expenses.reduce((sum, expense) => sum + expense.valor, 0) * 12; // Gastos anuais
    const projectedIncome = calculateRetirementIncome(data, years);
    return Math.max(targetIncome - projectedIncome, 0);
  };

  const calculatePotentialTaxSavings = (data) => {
    const taxableInvestments = data.investments.reduce((sum, investment) => sum + investment.valor_aporte, 0);
    return taxableInvestments * 0.15; // 15% de IR
  };

  const calculateMonthlyDebtPayment = (data) => {
    return data.accounts
      .filter(account => (account.saldo || 0) < 0)
      .reduce((sum, account) => sum + Math.abs(account.saldo) * 0.05, 0); // 5% do saldo devedor
  };

  const calculatePayoffTime = (data) => {
    const totalDebt = data.accounts.filter(account => (account.saldo || 0) < 0).reduce((sum, account) => sum + Math.abs(account.saldo), 0);
    const monthlyPayment = calculateMonthlyDebtPayment(data);
    return monthlyPayment > 0 ? Math.ceil(totalDebt / monthlyPayment) : 0;
  };

  const analyzeCurrentAllocation = (investments, categories) => {
    const allocation = {};
    investments.forEach(investment => {
      const category = categories.find(c => c.id === investment.categoria_id);
      if (category) {
        allocation[category.nome] = (allocation[category.nome] || 0) + investment.valor_aporte;
      }
    });
    return allocation;
  };

  const getRecommendedAllocation = (riskTolerance, age) => {
    const baseAllocation = {
      conservative: { stocks: 30, bonds: 60, cash: 10 },
      moderate: { stocks: 60, bonds: 30, cash: 10 },
      aggressive: { stocks: 80, bonds: 15, cash: 5 }
    };
    
    return baseAllocation[riskTolerance] || baseAllocation.moderate;
  };

  const generatePerformanceAnalysis = (performance) => {
    if (performance.roi > 10) return 'Excelente performance';
    if (performance.roi > 5) return 'Boa performance';
    if (performance.roi > 0) return 'Performance positiva';
    return 'Performance negativa - revise sua estratégia';
  };

  const generatePerformanceRecommendations = (performance) => {
    const recommendations = [];
    
    if (performance.roi < 5) {
      recommendations.push('Considere diversificar seus investimentos');
    }
    
    if (performance.volatility > 15) {
      recommendations.push('Reduza a volatilidade com mais renda fixa');
    }
    
    if (performance.sharpeRatio < 1) {
      recommendations.push('Melhore o retorno ajustado ao risco');
    }
    
    return recommendations;
  };

  // Relatório personalizado memoizado
  const personalizedReport = useMemo(() => {
    return generatePersonalizedReport(userProfile, { expenses, investments, accounts, categories });
  }, [userProfile, expenses, investments, accounts, categories, generatePersonalizedReport]);

  return {
    userProfile,
    setUserProfile,
    personalizedReport,
    generatePersonalizedReport
  };
};
