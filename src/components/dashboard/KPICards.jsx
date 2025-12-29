import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/enhanced-card';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { Link } from 'react-router-dom';
import { formatCurrencyBRL, formatPercent } from '@/lib/format';

const KPICards = memo(function KPICards({
  totalMonthlyExpenses,
  totalMonthlyInvestments,
  totalPaidExpenses,
  totalPendingExpenses,
  savingsRate,
  periodInvestmentGoal,
  investmentProgress,
  previousMonthExpenses = 0,
  previousMonthInvestments = 0,
  isLoading = false,
}) {
  const { createStaggerAnimation } = useMicroInteractions();
  const expenseDelta = totalMonthlyExpenses - previousMonthExpenses;
  const investmentDelta = totalMonthlyInvestments - previousMonthInvestments;
  const kpiData = [
    {
      title: 'Gastos no Período',
      value: totalMonthlyExpenses,
      icon: TrendingDown,
      iconColor: 'text-expense',
      subtitle: `Pago: ${formatCurrencyBRL(totalPaidExpenses)} • Pendente: ${formatCurrencyBRL(totalPendingExpenses)}`,
      href: '/gastos',
      delta: expenseDelta,
      delay: 0.1
    },
    {
      title: 'Aportes no Período',
      value: totalMonthlyInvestments,
      icon: TrendingUp,
      iconColor: 'text-income',
      subtitle: null,
      href: '/investimentos',
      delta: investmentDelta,
      delay: 0.2
    },
    {
      title: 'Taxa de Poupança',
      value: `${Math.round(savingsRate)}%`,
      icon: DollarSign,
      iconColor: 'text-primary',
      subtitle: 'Aportes / (Aportes + Gastos pagos)',
      href: '/resumo',
      delay: 0.3
    },
    {
      title: 'Progresso da Meta',
      value: periodInvestmentGoal > 0 ? `${Math.round(investmentProgress)}%` : '-',
      icon: Target,
      iconColor: 'text-primary',
      subtitle: periodInvestmentGoal > 0
        ? `${formatCurrencyBRL(totalMonthlyInvestments)} de ${formatCurrencyBRL(periodInvestmentGoal)}`
        : 'Defina uma meta mensal para acompanhar o progresso.',
      href: '/projecao-investimentos',
      delay: 0.4
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-fr">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <motion.div
            key={kpi.title}
            {...createStaggerAnimation(kpi.delay)}
          >
            <Link to={kpi.href} className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg transition-all">
            <Card className="h-full shadow-sm hover:shadow-md transition-shadow duration-200" hover={true} animation="subtle">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-body-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-h3 md:text-h2 font-bold text-card-foreground">
                  {isLoading ? (
                    <div className="h-8 w-32 bg-muted rounded animate-pulse border border-border" />
                  ) : (
                    typeof kpi.value === 'number' 
                      ? formatCurrencyBRL(kpi.value)
                      : kpi.value
                  )}
                </div>
                {kpi.subtitle && (
                  <p className="text-caption text-muted-foreground mt-2">
                    {kpi.subtitle}
                  </p>
                )}
                {typeof kpi.delta === 'number' && (kpi.title === 'Gastos no Período' || kpi.title === 'Aportes no Período') && (
                  <p className={`text-caption font-medium mt-2 ${kpi.delta >= 0 ? 'text-warning' : 'text-success'}`}>
                    {kpi.title === 'Gastos no Período' ? (kpi.delta >= 0 ? '▲' : '▼') : (kpi.delta >= 0 ? '▲' : '▼')} {formatCurrencyBRL(Math.abs(kpi.delta))} vs mês anterior
                  </p>
                )}
              </CardContent>
            </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
});

export { KPICards };
