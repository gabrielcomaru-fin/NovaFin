import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/enhanced-card';
import { Progress } from '@/components/ui/progress';
import { Target, AlertTriangle } from 'lucide-react';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';

const ProgressCards = memo(function ProgressCards({
  totalMonthlyInvestments,
  periodInvestmentGoal,
  investmentProgress,
  totalMonthlyExpenses,
  totalExpenseLimit,
  expenseLimitProgress,
}) {
  const { createStaggerAnimation } = useMicroInteractions();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Meta de Aportes */}
      <motion.div
        {...createStaggerAnimation(0.5)}
      >
        <Card hover={true} animation="subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Meta de Aportes (período)
            </CardTitle>
            <CardDescription>
              {periodInvestmentGoal > 0
                ? `Progresso: R$ ${totalMonthlyInvestments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ ${periodInvestmentGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : 'Defina uma meta de aportes nos investimentos.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Progress
                value={Math.min(investmentProgress, 100)}
                className="h-4 [&>*]:bg-gradient-to-r [&>*]:from-income [&>*]:to-income [&>*]:transition-all [&>*]:duration-500"
              />
              {periodInvestmentGoal > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {investmentProgress >= 100
                      ? '🎉 Meta atingida! Parabéns!'
                      : `${Math.round(investmentProgress)}% da meta alcançada`}
                  </p>
                  {investmentProgress < 100 && (
                    <p className="text-xs text-muted-foreground">
                      Faltam R$ {(periodInvestmentGoal - totalMonthlyInvestments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Teto de Gastos */}
      <motion.div
        {...createStaggerAnimation(0.6)}
      >
        <Card hover={true} animation="subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Teto de Gastos Mensal
            </CardTitle>
            <CardDescription>
              {totalExpenseLimit > 0
                ? `Utilizado: R$ ${totalMonthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ ${totalExpenseLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : 'Defina tetos de gastos nas configurações.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Progress
                value={Math.min(expenseLimitProgress, 100)}
                className={`h-4 transition-all duration-500 ${
                  expenseLimitProgress > 90
                    ? '[&>*]:bg-gradient-to-r [&>*]:from-error [&>*]:to-error'
                    : expenseLimitProgress > 70
                    ? '[&>*]:bg-gradient-to-r [&>*]:from-warning [&>*]:to-warning'
                    : '[&>*]:bg-gradient-to-r [&>*]:from-info [&>*]:to-info'
                }`}
              />
              {totalExpenseLimit > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {expenseLimitProgress >= 100
                      ? '⚠️ Limite de gastos atingido!'
                      : `${Math.round(expenseLimitProgress)}% do limite utilizado`}
                  </p>
                  {expenseLimitProgress < 100 && (
                    <p className="text-xs text-muted-foreground">
                      Restam R$ {(totalExpenseLimit - totalMonthlyExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
});

export { ProgressCards };
