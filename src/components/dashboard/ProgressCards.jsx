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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Meta de Aportes */}
      <motion.div
        {...createStaggerAnimation(0.5)}
      >
        <Card hover={true} animation="subtle" className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-h5 font-semibold">
              <Target className="h-5 w-5 text-primary flex-shrink-0" />
              Meta de Aportes (período)
            </CardTitle>
            <CardDescription className="text-body-sm mt-2">
              {periodInvestmentGoal > 0
                ? `Progresso: R$ ${totalMonthlyInvestments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ ${periodInvestmentGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : 'Defina uma meta de aportes nos investimentos.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress
                value={Math.min(investmentProgress, 100)}
                className="h-4 [&>*]:bg-gradient-to-r [&>*]:from-income [&>*]:to-income [&>*]:transition-all [&>*]:duration-500"
              />
              {periodInvestmentGoal > 0 && (
                <div className="flex items-center justify-between pt-1">
                  <p className="text-body-sm text-muted-foreground">
                    {investmentProgress >= 100
                      ? `🎉 Meta superada! ${Math.round(investmentProgress)}% alcançado!`
                      : `${Math.round(investmentProgress)}% da meta alcançada`}
                  </p>
                  {investmentProgress < 100 ? (
                    <p className="text-caption text-muted-foreground font-medium">
                      Faltam R$ {(periodInvestmentGoal - totalMonthlyInvestments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  ) : (
                    <p className="text-caption text-muted-foreground font-medium">
                      R$ {(totalMonthlyInvestments - periodInvestmentGoal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} além da meta!
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
        <Card hover={true} animation="subtle" className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-h5 font-semibold">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
              Teto de Gastos Mensal
            </CardTitle>
            <CardDescription className="text-body-sm mt-2">
              {totalExpenseLimit > 0
                ? `Utilizado: R$ ${totalMonthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ ${totalExpenseLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : 'Defina tetos de gastos nas configurações.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                <div className="flex items-center justify-between pt-1">
                  <p className="text-body-sm text-muted-foreground">
                    {expenseLimitProgress >= 100
                      ? '⚠️ Limite de gastos atingido!'
                      : `${Math.round(expenseLimitProgress)}% do limite utilizado`}
                  </p>
                  {expenseLimitProgress < 100 && (
                    <p className="text-caption text-muted-foreground font-medium">
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
