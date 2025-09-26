import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

// Dados de benchmark (simulados - em produção viriam de uma API)
const BENCHMARK_DATA = {
  savingsRate: {
    average: 12,
    good: 20,
    excellent: 30
  },
  diversification: {
    average: 3.5,
    good: 4.5,
    excellent: 6.0
  },
  liquidity: {
    average: 2.0,
    good: 3.0,
    excellent: 6.0
  },
  investmentConsistency: {
    average: 60,
    good: 80,
    excellent: 95
  },
  debtToIncome: {
    average: 0.4,
    good: 0.3,
    excellent: 0.2
  }
};

export const BenchmarkingReports = ({ userMetrics, userProfile }) => {
  const getBenchmarkCategory = (userValue, benchmark) => {
    if (userValue >= benchmark.excellent) return 'excellent';
    if (userValue >= benchmark.good) return 'good';
    if (userValue >= benchmark.average) return 'average';
    return 'below_average';
  };

  const benchmarkComparison = useMemo(() => {
    if (!userMetrics) return null;

    const comparisons = {
      savingsRate: {
        user: userMetrics.savingsRate,
        benchmark: BENCHMARK_DATA.savingsRate,
        category: getBenchmarkCategory(userMetrics.savingsRate, BENCHMARK_DATA.savingsRate)
      },
      diversification: {
        user: userMetrics.investmentDiversification,
        benchmark: BENCHMARK_DATA.diversification,
        category: getBenchmarkCategory(userMetrics.investmentDiversification, BENCHMARK_DATA.diversification)
      },
      liquidity: {
        user: userMetrics.liquidityRatio,
        benchmark: BENCHMARK_DATA.liquidity,
        category: getBenchmarkCategory(userMetrics.liquidityRatio, BENCHMARK_DATA.liquidity)
      },
      consistency: {
        user: userMetrics.budgetEfficiency,
        benchmark: BENCHMARK_DATA.investmentConsistency,
        category: getBenchmarkCategory(userMetrics.budgetEfficiency, BENCHMARK_DATA.investmentConsistency)
      }
    };

    return comparisons;
  }, [userMetrics]);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'excellent': return <Award className="h-4 w-4 text-green-600" />;
      case 'good': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'average': return <Info className="h-4 w-4 text-yellow-600" />;
      case 'below_average': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'average': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'below_average': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bom';
      case 'average': return 'Médio';
      case 'below_average': return 'Abaixo da Média';
      default: return 'Não Classificado';
    }
  };

  const getRecommendations = (metric, comparison) => {
    const recommendations = [];
    
    switch (metric) {
      case 'savingsRate':
        if (comparison.category === 'below_average') {
          recommendations.push('Aumente sua taxa de poupança reduzindo gastos desnecessários');
          recommendations.push('Considere automatizar seus investimentos');
        } else if (comparison.category === 'average') {
          recommendations.push('Você está na média - tente aumentar para 20%');
        } else {
          recommendations.push('Parabéns! Continue mantendo essa excelente taxa de poupança');
        }
        break;
        
      case 'diversification':
        if (comparison.category === 'below_average') {
          recommendations.push('Diversifique seus investimentos em diferentes categorias');
          recommendations.push('Considere investir em renda fixa e variável');
        } else if (comparison.category === 'average') {
          recommendations.push('Adicione mais categorias de investimento');
        } else {
          recommendations.push('Excelente diversificação! Continue assim');
        }
        break;
        
      case 'liquidity':
        if (comparison.category === 'below_average') {
          recommendations.push('Construa uma reserva de emergência de 3-6 meses');
          recommendations.push('Mantenha mais dinheiro em conta corrente');
        } else if (comparison.category === 'average') {
          recommendations.push('Tente aumentar sua reserva para 3 meses de gastos');
        } else {
          recommendations.push('Ótima liquidez! Você está bem preparado para emergências');
        }
        break;
        
      case 'consistency':
        if (comparison.category === 'below_average') {
          recommendations.push('Seja mais consistente com seus investimentos mensais');
          recommendations.push('Configure aportes automáticos');
        } else if (comparison.category === 'average') {
          recommendations.push('Tente ser mais regular com seus investimentos');
        } else {
          recommendations.push('Excelente consistência! Continue investindo regularmente');
        }
        break;
    }
    
    return recommendations;
  };

  if (!benchmarkComparison) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparação com Benchmarks</CardTitle>
          <CardDescription>Dados insuficientes para comparação</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Complete mais dados financeiros para ver sua comparação com benchmarks.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Comparação com Benchmarks
          </CardTitle>
          <CardDescription>
            Como você se compara com outros usuários similares
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Taxa de Poupança */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Taxa de Poupança</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{benchmarkComparison.savingsRate.user.toFixed(1)}%</span>
                  <Badge className={getCategoryColor(benchmarkComparison.savingsRate.category)}>
                    {getCategoryIcon(benchmarkComparison.savingsRate.category)}
                    <span className="ml-1">{getCategoryLabel(benchmarkComparison.savingsRate.category)}</span>
                  </Badge>
                </div>
              </div>
              <Progress 
                value={Math.min(benchmarkComparison.savingsRate.user, 50)} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                Média: {benchmarkComparison.savingsRate.benchmark.average}% | 
                Bom: {benchmarkComparison.savingsRate.benchmark.good}% | 
                Excelente: {benchmarkComparison.savingsRate.benchmark.excellent}%
              </div>
            </div>

            {/* Diversificação */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Diversificação</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{benchmarkComparison.diversification.user.toFixed(1)}</span>
                  <Badge className={getCategoryColor(benchmarkComparison.diversification.category)}>
                    {getCategoryIcon(benchmarkComparison.diversification.category)}
                    <span className="ml-1">{getCategoryLabel(benchmarkComparison.diversification.category)}</span>
                  </Badge>
                </div>
              </div>
              <Progress 
                value={Math.min(benchmarkComparison.diversification.user, 100)} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                Média: {benchmarkComparison.diversification.benchmark.average} | 
                Bom: {benchmarkComparison.diversification.benchmark.good} | 
                Excelente: {benchmarkComparison.diversification.benchmark.excellent}
              </div>
            </div>

            {/* Liquidez */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Reserva de Emergência</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{benchmarkComparison.liquidity.user.toFixed(1)} meses</span>
                  <Badge className={getCategoryColor(benchmarkComparison.liquidity.category)}>
                    {getCategoryIcon(benchmarkComparison.liquidity.category)}
                    <span className="ml-1">{getCategoryLabel(benchmarkComparison.liquidity.category)}</span>
                  </Badge>
                </div>
              </div>
              <Progress 
                value={Math.min(benchmarkComparison.liquidity.user * 20, 100)} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                Média: {benchmarkComparison.liquidity.benchmark.average} meses | 
                Bom: {benchmarkComparison.liquidity.benchmark.good} meses | 
                Excelente: {benchmarkComparison.liquidity.benchmark.excellent} meses
              </div>
            </div>

            {/* Consistência */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Consistência</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{benchmarkComparison.consistency.user.toFixed(1)}%</span>
                  <Badge className={getCategoryColor(benchmarkComparison.consistency.category)}>
                    {getCategoryIcon(benchmarkComparison.consistency.category)}
                    <span className="ml-1">{getCategoryLabel(benchmarkComparison.consistency.category)}</span>
                  </Badge>
                </div>
              </div>
              <Progress 
                value={benchmarkComparison.consistency.user} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                Média: {benchmarkComparison.consistency.benchmark.average}% | 
                Bom: {benchmarkComparison.consistency.benchmark.good}% | 
                Excelente: {benchmarkComparison.consistency.benchmark.excellent}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendações Personalizadas</CardTitle>
          <CardDescription>Baseadas na sua comparação com benchmarks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(benchmarkComparison).map(([metric, comparison]) => (
              <div key={metric} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryIcon(comparison.category)}
                  <span className="font-medium capitalize">
                    {metric === 'savingsRate' ? 'Taxa de Poupança' :
                     metric === 'diversification' ? 'Diversificação' :
                     metric === 'liquidity' ? 'Liquidez' :
                     metric === 'consistency' ? 'Consistência' : metric}
                  </span>
                  <Badge className={getCategoryColor(comparison.category)}>
                    {getCategoryLabel(comparison.category)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {getRecommendations(metric, comparison).map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Score Geral */}
      <Card>
        <CardHeader>
          <CardTitle>Score Geral de Saúde Financeira</CardTitle>
          <CardDescription>Baseado na comparação com benchmarks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-primary">
              {userMetrics?.financialHealthScore || 0}
            </div>
            <div className="text-lg text-muted-foreground">
              de 100 pontos
            </div>
            <Progress value={userMetrics?.financialHealthScore || 0} className="h-3" />
            <div className="text-sm text-muted-foreground">
              {userMetrics?.financialHealthScore >= 80 ? 'Excelente saúde financeira!' :
               userMetrics?.financialHealthScore >= 60 ? 'Boa saúde financeira' :
               userMetrics?.financialHealthScore >= 40 ? 'Saúde financeira moderada' :
               'Saúde financeira precisa de atenção'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
