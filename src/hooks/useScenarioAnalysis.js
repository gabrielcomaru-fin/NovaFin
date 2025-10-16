import { useCallback, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceDataContext';

export const useScenarioAnalysis = () => {
  const { expenses, investments, accounts, totalPatrimony } = useFinance();

  // Calcula a média mensal de aportes a partir do histórico (evita somar todo o histórico como se fosse mensal)
  const computeAverageMonthlyInvestment = useCallback((investmentList) => {
    if (!investmentList || investmentList.length === 0) return 0;
    const totalsByMonthKey = investmentList.reduce((acc, inv) => {
      const d = new Date(inv.data);
      // chave yyyy-mm
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[key]) acc[key] = 0;
      acc[key] += inv.valor_aporte || 0;
      return acc;
    }, {});
    const monthKeys = Object.keys(totalsByMonthKey);
    if (monthKeys.length === 0) return 0;
    const sumOfMonthlyTotals = monthKeys.reduce((s, k) => s + totalsByMonthKey[k], 0);
    return sumOfMonthlyTotals / monthKeys.length;
  }, []);

  // Gerar cenários de investimento
  const generateScenarios = useCallback((data) => {
    const currentMonthlyInvestment = computeAverageMonthlyInvestment(data.investments);
    const currentPatrimony = data.accounts.reduce((sum, account) => sum + (account.saldo || 0), 0);
    
    const scenarios = {
      conservative: {
        name: 'Cenário Conservador',
        description: 'Crescimento de 6% ao ano (CDB, Tesouro Direto)',
        annualReturn: 0.06,
        monthlyReturn: Math.pow(1 + 0.06, 1/12) - 1,
        projection: calculateProjection(currentPatrimony, currentMonthlyInvestment, 0.06, 10),
        riskLevel: 'Baixo',
        color: '#10b981'
      },
      moderate: {
        name: 'Cenário Moderado',
        description: 'Crescimento de 8% ao ano (Misto: Renda Fixa + Variável)',
        annualReturn: 0.08,
        monthlyReturn: Math.pow(1 + 0.08, 1/12) - 1,
        projection: calculateProjection(currentPatrimony, currentMonthlyInvestment, 0.08, 10),
        riskLevel: 'Médio',
        color: '#3b82f6'
      },
      optimistic: {
        name: 'Cenário Otimista',
        description: 'Crescimento de 10% ao ano (Mais exposição em Renda Variável)',
        annualReturn: 0.10,
        monthlyReturn: Math.pow(1 + 0.10, 1/12) - 1,
        projection: calculateProjection(currentPatrimony, currentMonthlyInvestment, 0.10, 10),
        riskLevel: 'Alto',
        color: '#f59e0b'
      },
      aggressive: {
        name: 'Cenário Agressivo',
        description: 'Crescimento de 12% ao ano (Alta exposição em Renda Variável)',
        annualReturn: 0.12,
        monthlyReturn: Math.pow(1 + 0.12, 1/12) - 1,
        projection: calculateProjection(currentPatrimony, currentMonthlyInvestment, 0.12, 10),
        riskLevel: 'Muito Alto',
        color: '#ef4444'
      }
    };
    
    return scenarios;
  }, []);

  // Calcular projeção de patrimônio
  const calculateProjection = useCallback((initialValue, monthlyContribution, annualReturn, years) => {
    const monthlyReturn = Math.pow(1 + annualReturn, 1/12) - 1;
    const months = years * 12;
    
    // Fórmula de valor futuro com contribuições mensais
    const futureValue = initialValue * Math.pow(1 + monthlyReturn, months) + 
                       monthlyContribution * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);
    
    return {
      totalValue: futureValue,
      totalInvested: initialValue + (monthlyContribution * months),
      totalGains: futureValue - (initialValue + (monthlyContribution * months)),
      monthlyBreakdown: generateMonthlyBreakdown(initialValue, monthlyContribution, monthlyReturn, months)
    };
  }, []);

  // Gerar breakdown mensal
  const generateMonthlyBreakdown = useCallback((initialValue, monthlyContribution, monthlyReturn, months) => {
    const breakdown = [];
    let currentValue = initialValue;
    
    for (let month = 1; month <= months; month++) {
      currentValue = currentValue * (1 + monthlyReturn) + monthlyContribution;
      breakdown.push({
        month,
        value: currentValue,
        invested: initialValue + (monthlyContribution * month),
        gains: currentValue - (initialValue + (monthlyContribution * month))
      });
    }
    
    return breakdown;
  }, []);

  // Análise de cenários de gastos
  const generateSpendingScenarios = useCallback((data) => {
    const currentMonthlyExpenses = data.expenses.reduce((sum, expense) => sum + expense.valor, 0);
    
    const scenarios = {
      current: {
        name: 'Gastos Atuais',
        description: 'Manter o nível atual de gastos',
        monthlyExpenses: currentMonthlyExpenses,
        annualExpenses: currentMonthlyExpenses * 12,
        impact: 'Neutro'
      },
      reduced: {
        name: 'Redução de 10%',
        description: 'Reduzir gastos em 10% através de otimizações',
        monthlyExpenses: currentMonthlyExpenses * 0.9,
        annualExpenses: currentMonthlyExpenses * 0.9 * 12,
        impact: 'Positivo - Mais dinheiro para investimentos'
      },
      increased: {
        name: 'Aumento de 10%',
        description: 'Cenário de aumento de gastos (inflação, mudanças de vida)',
        monthlyExpenses: currentMonthlyExpenses * 1.1,
        annualExpenses: currentMonthlyExpenses * 1.1 * 12,
        impact: 'Negativo - Menos dinheiro disponível'
      }
    };
    
    return scenarios;
  }, []);

  // Análise de cenários de renda
  const generateIncomeScenarios = useCallback((data) => {
    const currentMonthlyInvestment = data.investments.reduce((sum, investment) => sum + investment.valor_aporte, 0);
    
    const scenarios = {
      current: {
        name: 'Renda Atual',
        description: 'Manter o nível atual de investimentos',
        monthlyInvestment: currentMonthlyInvestment,
        annualInvestment: currentMonthlyInvestment * 12
      },
      increased: {
        name: 'Aumento de 20%',
        description: 'Aumentar investimentos em 20% (promoção, renda extra)',
        monthlyInvestment: currentMonthlyInvestment * 1.2,
        annualInvestment: currentMonthlyInvestment * 1.2 * 12
      },
      decreased: {
        name: 'Redução de 20%',
        description: 'Reduzir investimentos em 20% (emergência, mudanças)',
        monthlyInvestment: currentMonthlyInvestment * 0.8,
        annualInvestment: currentMonthlyInvestment * 0.8 * 12
      }
    };
    
    return scenarios;
  }, []);

  // Análise de cenários de inflação
  const generateInflationScenarios = useCallback((data) => {
    const scenarios = {
      low: {
        name: 'Inflação Baixa (3%)',
        description: 'Cenário de inflação controlada',
        inflationRate: 0.03,
        impact: 'Positivo para investimentos de renda fixa'
      },
      moderate: {
        name: 'Inflação Moderada (6%)',
        description: 'Cenário de inflação normal',
        inflationRate: 0.06,
        impact: 'Neutro - Requer diversificação'
      },
      high: {
        name: 'Inflação Alta (10%)',
        description: 'Cenário de inflação elevada',
        inflationRate: 0.10,
        impact: 'Negativo - Requer investimentos em renda variável'
      }
    };
    
    return scenarios;
  }, []);

  // Análise de cenários de aposentadoria
  const generateRetirementScenarios = useCallback((data, currentAge = 30, retirementAge = 65) => {
    const yearsToRetirement = retirementAge - currentAge;
    const currentPatrimony = data.accounts.reduce((sum, account) => sum + (account.saldo || 0), 0);
    const currentMonthlyInvestment = data.investments.reduce((sum, investment) => sum + investment.valor_aporte, 0);
    
    const scenarios = {
      early: {
        name: 'Aposentadoria Antecipada (55 anos)',
        description: 'Aposentar-se aos 55 anos',
        retirementAge: 55,
        yearsToRetirement: 55 - currentAge,
        requiredMonthlyInvestment: calculateRequiredMonthlyInvestment(currentPatrimony, 0.08, 55 - currentAge, 1000000),
        projectedValue: calculateProjection(currentPatrimony, currentMonthlyInvestment, 0.08, 55 - currentAge).totalValue
      },
      normal: {
        name: 'Aposentadoria Normal (65 anos)',
        description: 'Aposentar-se aos 65 anos',
        retirementAge: 65,
        yearsToRetirement: 65 - currentAge,
        requiredMonthlyInvestment: calculateRequiredMonthlyInvestment(currentPatrimony, 0.08, 65 - currentAge, 1000000),
        projectedValue: calculateProjection(currentPatrimony, currentMonthlyInvestment, 0.08, 65 - currentAge).totalValue
      },
      late: {
        name: 'Aposentadoria Tardia (70 anos)',
        description: 'Aposentar-se aos 70 anos',
        retirementAge: 70,
        yearsToRetirement: 70 - currentAge,
        requiredMonthlyInvestment: calculateRequiredMonthlyInvestment(currentPatrimony, 0.08, 70 - currentAge, 1000000),
        projectedValue: calculateProjection(currentPatrimony, currentMonthlyInvestment, 0.08, 70 - currentAge).totalValue
      }
    };
    
    return scenarios;
  }, []);

  // Calcular investimento mensal necessário
  const calculateRequiredMonthlyInvestment = useCallback((currentValue, annualReturn, years, targetValue) => {
    const monthlyReturn = annualReturn / 12;
    const months = years * 12;
    
    // Fórmula para calcular contribuição mensal necessária
    const futureValueOfCurrent = currentValue * Math.pow(1 + monthlyReturn, months);
    const remainingValue = targetValue - futureValueOfCurrent;
    
    if (remainingValue <= 0) return 0;
    
    const monthlyContribution = remainingValue / ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);
    
    return Math.max(monthlyContribution, 0);
  }, []);

  // Análise de cenários de emergência
  const generateEmergencyScenarios = useCallback((data) => {
    const currentPatrimony = data.accounts.reduce((sum, account) => sum + (account.saldo || 0), 0);
    const monthlyExpenses = data.expenses.reduce((sum, expense) => sum + expense.valor, 0);
    
    const scenarios = {
      jobLoss: {
        name: 'Perda de Emprego',
        description: 'Cenário de desemprego por 6 meses',
        duration: 6,
        requiredReserve: monthlyExpenses * 6,
        currentReserve: currentPatrimony,
        coverage: Math.min((currentPatrimony / (monthlyExpenses * 6)) * 100, 100)
      },
      medical: {
        name: 'Emergência Médica',
        description: 'Gastos médicos inesperados',
        estimatedCost: 50000,
        currentReserve: currentPatrimony,
        coverage: Math.min((currentPatrimony / 50000) * 100, 100)
      },
      home: {
        name: 'Emergência Residencial',
        description: 'Reparos ou mudanças inesperadas',
        estimatedCost: 20000,
        currentReserve: currentPatrimony,
        coverage: Math.min((currentPatrimony / 20000) * 100, 100)
      }
    };
    
    return scenarios;
  }, []);

  // Cenários memoizados
  const investmentScenarios = useMemo(() => {
    return generateScenarios({ expenses, investments, accounts, totalPatrimony });
  }, [expenses, investments, accounts, totalPatrimony, generateScenarios]);

  const spendingScenarios = useMemo(() => {
    return generateSpendingScenarios({ expenses, investments, accounts });
  }, [expenses, investments, accounts, generateSpendingScenarios]);

  const incomeScenarios = useMemo(() => {
    return generateIncomeScenarios({ expenses, investments, accounts });
  }, [expenses, investments, accounts, generateIncomeScenarios]);

  const inflationScenarios = useMemo(() => {
    return generateInflationScenarios({ expenses, investments, accounts });
  }, [expenses, investments, accounts, generateInflationScenarios]);

  const retirementScenarios = useMemo(() => {
    return generateRetirementScenarios({ expenses, investments, accounts, totalPatrimony });
  }, [expenses, investments, accounts, totalPatrimony, generateRetirementScenarios]);

  const emergencyScenarios = useMemo(() => {
    return generateEmergencyScenarios({ expenses, investments, accounts });
  }, [expenses, investments, accounts, generateEmergencyScenarios]);

  return {
    investmentScenarios,
    spendingScenarios,
    incomeScenarios,
    inflationScenarios,
    retirementScenarios,
    emergencyScenarios,
    generateScenarios,
    generateSpendingScenarios,
    generateIncomeScenarios,
    generateInflationScenarios,
    generateRetirementScenarios,
    generateEmergencyScenarios
  };
};
