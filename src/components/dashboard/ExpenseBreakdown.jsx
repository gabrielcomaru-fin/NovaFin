import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/enhanced-card';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';

const ExpenseBreakdown = memo(function ExpenseBreakdown({
  expensesByCategory,
  totalMonthlyExpenses,
  expenseCategories,
}) {
  const { createStaggerAnimation } = useMicroInteractions();
  
  // Verificar se há gastos para exibir
  const hasExpenses = Object.keys(expensesByCategory).some(catId => expensesByCategory[catId] > 0);

  if (!hasExpenses) {
    return null;
  }

  return (
    <motion.div
      {...createStaggerAnimation(0.8)}
    >
      <Card hover={true} animation="subtle">
        <CardHeader>
          <CardTitle>Gastos por Categoria</CardTitle>
          <CardDescription>Distribuição dos seus gastos no período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Barra de progresso visual */}
            <div className="flex w-full h-3 rounded-full overflow-hidden">
              {expenseCategories
                .filter(c => (expensesByCategory[c.id] || 0) > 0)
                .map(category => {
                  const percentage = (expensesByCategory[category.id] / totalMonthlyExpenses) * 100;
                  return (
                    <div
                      key={category.id}
                      className="bg-primary"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: `hsl(213, 77%, ${60 - (percentage / 5)}%)`
                      }}
                    />
                  );
                })}
            </div>

            {/* Lista de categorias */}
            {expenseCategories
              .filter(c => (expensesByCategory[c.id] || 0) > 0)
              .sort((a, b) => (expensesByCategory[b.id] || 0) - (expensesByCategory[a.id] || 0))
              .map(category => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{category.nome}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    R$ {(expensesByCategory[category.id] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

export { ExpenseBreakdown };
