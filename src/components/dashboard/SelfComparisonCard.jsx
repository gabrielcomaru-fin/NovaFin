import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useGamification } from '@/contexts/GamificationContext';
import { TrendingUp, TrendingDown, Minus, Award, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { subMonths, startOfMonth, endOfMonth, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SelfComparisonCard = memo(function SelfComparisonCard({ monthsAgo = 6 }) {
  const { expenses, investments, investmentGoal, totalPatrimony } = useFinance();
  const { achievements } = useGamification();

  // Calcular métricas históricas
  const comparison = useMemo(() => {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    
    // Data de referência passada
    const pastDate = subMonths(today, monthsAgo);
    const pastMonthStart = startOfMonth(pastDate);
    const pastMonthEnd = endOfMonth(pastDate);

    // Filtrar dados do mês atual
    const currentMonthExpenses = expenses.filter(exp => {
      const d = parseISO(exp.data);
      return d >= currentMonthStart && d <= currentMonthEnd;
    });
    const currentMonthInvestments = investments.filter(inv => {
      const d = parseISO(inv.data);
      return d >= currentMonthStart && d <= currentMonthEnd;
    });

    // Filtrar dados do mês passado de referência
    const pastMonthExpenses = expenses.filter(exp => {
      const d = parseISO(exp.data);
      return d >= pastMonthStart && d <= pastMonthEnd;
    });
    const pastMonthInvestments = investments.filter(inv => {
      const d = parseISO(inv.data);
      return d >= pastMonthStart && d <= pastMonthEnd;
    });

    // Totais
    const currentExpenses = currentMonthExpenses.reduce((s, e) => s + e.valor, 0);
    const pastExpenses = pastMonthExpenses.reduce((s, e) => s + e.valor, 0);
    const currentInvestments = currentMonthInvestments.reduce((s, i) => s + i.valor_aporte, 0);
    const pastInvestments = pastMonthInvestments.reduce((s, i) => s + i.valor_aporte, 0);

    // Taxa de poupança
    const currentSavingsRate = (currentExpenses + currentInvestments) > 0
      ? (currentInvestments / (currentExpenses + currentInvestments)) * 100
      : 0;
    const pastSavingsRate = (pastExpenses + pastInvestments) > 0
      ? (pastInvestments / (pastExpenses + pastInvestments)) * 100
      : 0;

    // Calcular streak atual (meses consecutivos batendo meta)
    const goal = Number(investmentGoal) || 0;
    let streak = 0;
    if (goal > 0) {
      for (let i = 0; i < 12; i++) {
        const m = subMonths(today, i);
        const start = startOfMonth(m);
        const end = endOfMonth(m);
        const inv = investments.filter(i => {
          const d = parseISO(i.data);
          return d >= start && d <= end;
        }).reduce((s, i) => s + i.valor_aporte, 0);
        if (inv >= goal) streak++;
        else break;
      }
    }

    // Conquistas ganhas desde a data de referência
    const newAchievements = achievements.filter(a => {
      if (!a.unlockedAt) return false;
      const unlockedDate = new Date(a.unlockedAt);
      return unlockedDate >= pastDate;
    });

    // Calcular variações percentuais
    const savingsRateChange = pastSavingsRate > 0 
      ? ((currentSavingsRate - pastSavingsRate) / pastSavingsRate) * 100 
      : currentSavingsRate > 0 ? 100 : 0;

    const investmentChange = pastInvestments > 0 
      ? ((currentInvestments - pastInvestments) / pastInvestments) * 100 
      : currentInvestments > 0 ? 100 : 0;

    const expenseChange = pastExpenses > 0 
      ? ((currentExpenses - pastExpenses) / pastExpenses) * 100 
      : currentExpenses > 0 ? 100 : 0;

    return {
      current: {
        savingsRate: currentSavingsRate,
        investments: currentInvestments,
        expenses: currentExpenses,
        streak
      },
      past: {
        savingsRate: pastSavingsRate,
        investments: pastInvestments,
        expenses: pastExpenses,
        month: format(pastDate, 'MMM/yy', { locale: ptBR })
      },
      changes: {
        savingsRate: savingsRateChange,
        investments: investmentChange,
        expenses: expenseChange
      },
      newAchievements: newAchievements.length,
      monthsAgo
    };
  }, [expenses, investments, investmentGoal, achievements, monthsAgo]);

  // Gerar mensagem de motivação
  const motivationalMessage = useMemo(() => {
    const { current, past, changes } = comparison;

    if (changes.savingsRate > 50) {
      return {
        type: 'success',
        emoji: '🚀',
        message: `Incrível! Você mais que dobrou sua taxa de poupança desde ${past.month}!`
      };
    } else if (changes.savingsRate > 0) {
      return {
        type: 'success',
        emoji: '📈',
        message: `Há ${comparison.monthsAgo} meses você poupava ${Math.round(past.savingsRate)}%. Hoje são ${Math.round(current.savingsRate)}%! +${Math.round(changes.savingsRate)}% de evolução!`
      };
    } else if (changes.savingsRate < -20) {
      return {
        type: 'warning',
        emoji: '💪',
        message: `Sua taxa de poupança caiu um pouco, mas isso é normal! Você já conseguiu ${Math.round(past.savingsRate)}% antes, pode alcançar de novo.`
      };
    } else if (current.streak > 0) {
      return {
        type: 'success',
        emoji: '🔥',
        message: `Você está em uma sequência de ${current.streak} mês(es) batendo a meta! Continue assim!`
      };
    } else {
      return {
        type: 'neutral',
        emoji: '🌱',
        message: `Continue acompanhando sua evolução. Cada passo conta na jornada financeira!`
      };
    }
  }, [comparison]);

  // Determinar cores das mudanças
  const getChangeColor = (value, inverted = false) => {
    if (value > 0) return inverted ? 'text-red-500' : 'text-green-500';
    if (value < 0) return inverted ? 'text-green-500' : 'text-red-500';
    return 'text-muted-foreground';
  };

  const getChangeBg = (value, inverted = false) => {
    if (value > 0) return inverted ? 'bg-red-500/10' : 'bg-green-500/10';
    if (value < 0) return inverted ? 'bg-green-500/10' : 'bg-red-500/10';
    return 'bg-muted';
  };

  const getChangeIcon = (value) => {
    if (value > 0) return ArrowUpRight;
    if (value < 0) return ArrowDownRight;
    return Minus;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Sua Evolução
        </CardTitle>
        <CardDescription>
          Comparando com você de {comparison.monthsAgo} meses atrás
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mensagem motivacional */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg ${
            motivationalMessage.type === 'success' ? 'bg-success/10 border border-success/20' :
            motivationalMessage.type === 'warning' ? 'bg-warning/10 border border-warning/20' :
            'bg-muted/50 border border-border'
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-xl flex-shrink-0">{motivationalMessage.emoji}</span>
            <p className="text-sm font-medium text-foreground">
              {motivationalMessage.message}
            </p>
          </div>
        </motion.div>

        {/* Métricas de evolução */}
        <div className="grid grid-cols-3 gap-2">
          {/* Taxa de Poupança */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-3 rounded-lg text-center ${getChangeBg(comparison.changes.savingsRate)}`}
          >
            <div className="text-xs text-muted-foreground mb-1">Taxa de Poupança</div>
            <div className="text-lg font-bold">
              {Math.round(comparison.current.savingsRate)}%
            </div>
            <div className={`flex items-center justify-center gap-0.5 text-xs ${getChangeColor(comparison.changes.savingsRate)}`}>
              {React.createElement(getChangeIcon(comparison.changes.savingsRate), { className: 'h-3 w-3' })}
              <span>{comparison.changes.savingsRate > 0 ? '+' : ''}{Math.round(comparison.changes.savingsRate)}%</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Era {Math.round(comparison.past.savingsRate)}%
            </div>
          </motion.div>

          {/* Investimentos */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-3 rounded-lg text-center ${getChangeBg(comparison.changes.investments)}`}
          >
            <div className="text-xs text-muted-foreground mb-1">Aportes/mês</div>
            <div className="text-lg font-bold">
              R$ {(comparison.current.investments / 1000).toFixed(1)}k
            </div>
            <div className={`flex items-center justify-center gap-0.5 text-xs ${getChangeColor(comparison.changes.investments)}`}>
              {React.createElement(getChangeIcon(comparison.changes.investments), { className: 'h-3 w-3' })}
              <span>{comparison.changes.investments > 0 ? '+' : ''}{Math.round(comparison.changes.investments)}%</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Era R$ {(comparison.past.investments / 1000).toFixed(1)}k
            </div>
          </motion.div>

          {/* Gastos (invertido - menor é melhor) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-3 rounded-lg text-center ${getChangeBg(comparison.changes.expenses, true)}`}
          >
            <div className="text-xs text-muted-foreground mb-1">Gastos/mês</div>
            <div className="text-lg font-bold">
              R$ {(comparison.current.expenses / 1000).toFixed(1)}k
            </div>
            <div className={`flex items-center justify-center gap-0.5 text-xs ${getChangeColor(comparison.changes.expenses, true)}`}>
              {React.createElement(getChangeIcon(comparison.changes.expenses), { className: 'h-3 w-3' })}
              <span>{comparison.changes.expenses > 0 ? '+' : ''}{Math.round(comparison.changes.expenses)}%</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Era R$ {(comparison.past.expenses / 1000).toFixed(1)}k
            </div>
          </motion.div>
        </div>

        {/* Conquistas e Streak */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          {comparison.current.streak > 0 && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Streak de metas</div>
                <div className="text-sm font-semibold">{comparison.current.streak} mês(es)</div>
              </div>
            </div>
          )}
          
          {comparison.newAchievements > 0 && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-success/10">
                <Award className="h-4 w-4 text-success" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Novas conquistas</div>
                <div className="text-sm font-semibold">+{comparison.newAchievements}</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export { SelfComparisonCard };




