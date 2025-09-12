import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';

const KPICards = memo(function KPICards({
  totalMonthlyExpenses,
  totalMonthlyInvestments,
  totalPaidExpenses,
  totalPendingExpenses,
  savingsRate,
  periodInvestmentGoal,
  investmentProgress,
}) {
  const kpiData = [
    {
      title: 'Gastos no Período',
      value: totalMonthlyExpenses,
      icon: TrendingDown,
      iconColor: 'text-expense',
      subtitle: `Pago: R$ ${totalPaidExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • Pendente: R$ ${totalPendingExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      delay: 0.1
    },
    {
      title: 'Aportes no Período',
      value: totalMonthlyInvestments,
      icon: TrendingUp,
      iconColor: 'text-income',
      subtitle: null,
      delay: 0.2
    },
    {
      title: 'Taxa de Poupança',
      value: `${Math.round(savingsRate)}%`,
      icon: DollarSign,
      iconColor: 'text-primary',
      subtitle: 'Aportes / (Aportes + Gastos pagos)',
      delay: 0.3
    },
    {
      title: 'Progresso da Meta',
      value: periodInvestmentGoal > 0 ? `${Math.min(100, Math.round(investmentProgress))}%` : '-',
      icon: Target,
      iconColor: 'text-primary',
      subtitle: periodInvestmentGoal > 0
        ? `R$ ${totalMonthlyInvestments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ ${periodInvestmentGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : 'Defina uma meta mensal para acompanhar o progresso.',
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: kpi.delay }}
          >
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {typeof kpi.value === 'number' 
                    ? `R$ ${kpi.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : kpi.value
                  }
                </div>
                {kpi.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {kpi.subtitle}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
});

export { KPICards };
