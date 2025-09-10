import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, Lightbulb } from 'lucide-react';

export function Dashboard({
  totalMonthlyExpenses,
  totalMonthlyInvestments,
  totalAccountBalance,
  totalInvestmentBalance,
  expensesByCategory,
  investmentGoal,
  categories,
}) {
  const netWorth = totalAccountBalance + totalInvestmentBalance;
  const investmentProgress = investmentGoal > 0 ? (totalMonthlyInvestments / investmentGoal) * 100 : 0;
  
  const expenseCategories = categories.filter(c => c.tipo === 'gasto');
  const totalExpenseLimit = expenseCategories.reduce((acc, cat) => acc + (cat.limite || 0), 0);
  const expenseLimitProgress = totalExpenseLimit > 0 ? (totalMonthlyExpenses / totalExpenseLimit) * 100 : 0;

  const getFinancialTips = () => {
    const tips = [];
    
    expenseCategories.forEach(category => {
      const amount = expensesByCategory[category.id] || 0;
      if (category.limite && amount > category.limite * 0.8) {
        const percentage = Math.round((amount / category.limite) * 100);
        tips.push({
          type: 'warning',
          message: `Seu gasto em ${category.nome} já chegou a ${percentage}% do limite. Considere ajustar para sobrar mais para investimentos!`
        });
      }
    });

    if (totalMonthlyInvestments < investmentGoal * 0.5 && investmentGoal > 0) {
      tips.push({
        type: 'tip',
        message: 'Que tal aumentar seus aportes? Mesmo pequenos valores fazem diferença no longo prazo!'
      });
    }

    if (totalMonthlyExpenses > 0 && totalMonthlyInvestments === 0) {
      tips.push({
        type: 'tip',
        message: 'Tente aplicar a regra 50/30/20: 50% para necessidades, 30% para desejos e 20% para poupança e investimentos.'
      });
    }

    if (tips.length === 0) {
      tips.push({
        type: 'success',
        message: 'Parabéns! Você está no caminho certo para uma vida financeira saudável! 🎉'
      });
    }

    return tips;
  };

  const tips = getFinancialTips();

  return (
    <div className="space-y-6">
      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gastos no Período</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totalMonthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aportes no Período</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totalMonthlyInvestments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo em Contas</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totalAccountBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Patrimônio Líquido</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {netWorth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Meta de aportes e teto de gastos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Meta de Aportes Mensais
              </CardTitle>
              <CardDescription>
                {investmentGoal > 0
                  ? `Progresso: R$ ${totalMonthlyInvestments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ ${investmentGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : 'Defina uma meta de aportes nos investimentos.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Progress 
                  value={Math.min(investmentProgress, 100)} 
                  className="h-4 [&>*]:bg-gradient-to-r [&>*]:from-green-500 [&>*]:to-green-600 [&>*]:transition-all [&>*]:duration-500" 
                />
                {investmentGoal > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {investmentProgress >= 100 
                        ? '🎉 Meta atingida! Parabéns!'
                        : `${Math.round(investmentProgress)}% da meta alcançada`}
                    </p>
                    {investmentProgress < 100 && (
                      <p className="text-xs text-muted-foreground">
                        Faltam R$ {(investmentGoal - totalMonthlyInvestments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
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
                      ? '[&>*]:bg-gradient-to-r [&>*]:from-red-500 [&>*]:to-red-600' 
                      : expenseLimitProgress > 70 
                      ? '[&>*]:bg-gradient-to-r [&>*]:from-yellow-500 [&>*]:to-orange-500' 
                      : '[&>*]:bg-gradient-to-r [&>*]:from-blue-500 [&>*]:to-blue-600'
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

      {/* Gastos por categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.keys(expensesByCategory).some(catId => expensesByCategory[catId] > 0) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <Card>
              <CardHeader>
                <CardTitle>Gastos por Categoria</CardTitle>
                <CardDescription>Distribuição dos seus gastos no período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex w-full h-3 rounded-full overflow-hidden">
                    {expenseCategories
                      .filter(c => (expensesByCategory[c.id] || 0) > 0)
                      .map(category => {
                        const percentage = (expensesByCategory[category.id] / totalMonthlyExpenses) * 100;
                        return (
                          <div
                            key={category.id}
                            className="bg-primary"
                            style={{ width: `${percentage}%`, backgroundColor: `hsl(213, 77%, ${60 - (percentage/5)}%)` }}
                          ></div>
                        );
                      })}
                  </div>
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
        )}

        {/* Dicas financeiras */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-400" />
                Dicas Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="p-3 rounded-lg flex items-start gap-3 bg-secondary"
                >
                  {tip.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />}
                  {tip.type === 'success' && <TrendingUp className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />}
                  {tip.type === 'tip' && <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />}
                  <p className="text-sm text-muted-foreground">{tip.message}</p>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
