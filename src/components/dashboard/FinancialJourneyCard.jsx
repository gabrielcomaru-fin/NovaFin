import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useGamification } from '@/contexts/GamificationContext';
import { 
  Flag, 
  TrendingUp, 
  PiggyBank, 
  Trophy, 
  Target, 
  Star,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { 
  parseISO, 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachMonthOfInterval, 
  subMonths,
  differenceInMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FinancialJourneyCard = memo(function FinancialJourneyCard() {
  const { expenses, investments, investmentGoal, totalPatrimony, totalInvestmentBalance } = useFinance();
  const { achievements } = useGamification();

  // Detectar marcos automaticamente baseado nos dados
  const milestones = useMemo(() => {
    const detected = [];
    const today = new Date();
    
    if (investments.length === 0 && expenses.length === 0) {
      return [];
    }

    // Ordenar investimentos por data
    const sortedInvestments = [...investments].sort((a, b) => 
      new Date(a.data).getTime() - new Date(b.data).getTime()
    );

    // Marco 1: Primeiro investimento
    if (sortedInvestments.length > 0) {
      const firstInvestment = sortedInvestments[0];
      detected.push({
        id: 'first-investment',
        date: parseISO(firstInvestment.data),
        dateLabel: format(parseISO(firstInvestment.data), 'MMM/yy', { locale: ptBR }),
        title: 'Primeiro Passo',
        description: 'Você fez seu primeiro investimento!',
        amount: firstInvestment.valor_aporte,
        icon: Flag,
        iconColor: 'text-primary',
        bgColor: 'bg-primary/10',
        type: 'start'
      });
    }

    // Marco 2: Primeiro mês batendo a meta
    const goal = Number(investmentGoal) || 0;
    if (goal > 0 && sortedInvestments.length > 0) {
      const last12Months = eachMonthOfInterval({
        start: subMonths(today, 11),
        end: today
      });

      for (const month of last12Months) {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthlyTotal = investments.filter(inv => {
          const d = parseISO(inv.data);
          return d >= monthStart && d <= monthEnd;
        }).reduce((s, i) => s + i.valor_aporte, 0);

        if (monthlyTotal >= goal) {
          detected.push({
            id: `goal-achieved-${format(month, 'yyyy-MM')}`,
            date: month,
            dateLabel: format(month, 'MMM/yy', { locale: ptBR }),
            title: 'Meta Atingida!',
            description: `Você bateu a meta de R$ ${goal.toLocaleString('pt-BR')}`,
            amount: monthlyTotal,
            icon: Target,
            iconColor: 'text-success',
            bgColor: 'bg-success/10',
            type: 'goal'
          });
          break; // Apenas primeiro mês
        }
      }
    }

    // Marco 3: Marcos de patrimônio (10k, 50k, 100k, etc.)
    const patrimonyMilestones = [10000, 50000, 100000, 500000, 1000000];
    const currentPatrimony = totalPatrimony || totalInvestmentBalance || 0;
    
    for (const milestone of patrimonyMilestones) {
      if (currentPatrimony >= milestone) {
        detected.push({
          id: `patrimony-${milestone}`,
          date: today, // Aproximação - idealmente teríamos histórico de patrimônio
          dateLabel: 'Atual',
          title: `R$ ${(milestone / 1000).toFixed(0)}k Alcançados!`,
          description: 'Seu patrimônio chegou a um novo patamar',
          amount: milestone,
          icon: TrendingUp,
          iconColor: 'text-income',
          bgColor: 'bg-income/10',
          type: 'patrimony'
        });
      }
    }

    // Marco 4: Conquistas do sistema de gamificação
    const recentAchievements = achievements
      .filter(a => a.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
      .slice(0, 2);

    recentAchievements.forEach(achievement => {
      detected.push({
        id: `achievement-${achievement.id}`,
        date: new Date(achievement.unlockedAt),
        dateLabel: format(new Date(achievement.unlockedAt), 'MMM/yy', { locale: ptBR }),
        title: achievement.title,
        description: achievement.description,
        icon: Trophy,
        iconColor: 'text-warning',
        bgColor: 'bg-warning/10',
        type: 'achievement'
      });
    });

    // Ordenar por data (mais recentes primeiro) e limitar
    return detected
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }, [investments, expenses, investmentGoal, totalPatrimony, totalInvestmentBalance, achievements]);

  // Determinar fase atual e próximo marco
  const currentPhase = useMemo(() => {
    const patrimony = totalPatrimony || totalInvestmentBalance || 0;
    
    if (patrimony === 0) {
      return {
        phase: 'Começando a Jornada',
        description: 'Faça seu primeiro investimento para iniciar!',
        icon: Sparkles
      };
    } else if (patrimony < 10000) {
      return {
        phase: 'Construindo a Base',
        description: 'Foque em criar o hábito de investir regularmente.',
        icon: PiggyBank
      };
    } else if (patrimony < 50000) {
      return {
        phase: 'Reserva de Emergência',
        description: 'Fortaleça sua reserva e explore novas opções.',
        icon: Target
      };
    } else if (patrimony < 100000) {
      return {
        phase: 'Crescimento Acelerado',
        description: 'Os juros compostos começam a trabalhar por você!',
        icon: TrendingUp
      };
    } else {
      return {
        phase: 'Independência Financeira',
        description: 'Você está construindo liberdade financeira!',
        icon: Star
      };
    }
  }, [totalPatrimony, totalInvestmentBalance]);

  // Próximo marco sugerido
  const nextMilestone = useMemo(() => {
    const patrimony = totalPatrimony || totalInvestmentBalance || 0;
    const goal = Number(investmentGoal) || 0;
    
    const patrimonyTargets = [10000, 50000, 100000, 500000, 1000000];
    const nextPatrimonyTarget = patrimonyTargets.find(t => t > patrimony);
    
    if (nextPatrimonyTarget) {
      const remaining = nextPatrimonyTarget - patrimony;
      const monthsNeeded = goal > 0 ? Math.ceil(remaining / goal) : 0;
      
      return {
        target: `R$ ${(nextPatrimonyTarget / 1000).toFixed(0)}k`,
        remaining: `Faltam R$ ${remaining.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`,
        estimate: monthsNeeded > 0 ? `~${monthsNeeded} meses` : null
      };
    }
    
    return null;
  }, [totalPatrimony, totalInvestmentBalance, investmentGoal]);

  if (milestones.length === 0 && investments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flag className="h-5 w-5 text-primary" />
            Sua Jornada Financeira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Comece sua jornada!</h3>
            <p className="text-sm text-muted-foreground">
              Faça seu primeiro investimento para começar a acompanhar sua evolução.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flag className="h-5 w-5 text-primary" />
          Sua Jornada Financeira
        </CardTitle>
        <CardDescription>
          Marcos importantes da sua evolução
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fase Atual */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-primary/5 border border-primary/20"
        >
          <div className="flex items-center gap-2 mb-1">
            <currentPhase.icon className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">{currentPhase.phase}</span>
          </div>
          <p className="text-sm text-muted-foreground">{currentPhase.description}</p>
          
          {nextMilestone && (
            <div className="mt-2 pt-2 border-t border-primary/10 text-xs">
              <span className="text-muted-foreground">Próximo marco: </span>
              <span className="font-medium">{nextMilestone.target}</span>
              {nextMilestone.estimate && (
                <span className="text-muted-foreground"> • {nextMilestone.estimate}</span>
              )}
            </div>
          )}
        </motion.div>

        {/* Timeline de Marcos */}
        <div className="relative">
          {/* Linha vertical */}
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-muted to-transparent" />
          
          <div className="space-y-3">
            {milestones.map((milestone, index) => {
              const Icon = milestone.icon;
              
              return (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-10"
                >
                  {/* Ícone na timeline */}
                  <div className={`absolute left-0 w-8 h-8 rounded-full ${milestone.bgColor} flex items-center justify-center border-2 border-background shadow-sm`}>
                    <Icon className={`h-4 w-4 ${milestone.iconColor}`} />
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{milestone.title}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {milestone.dateLabel}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {milestone.description}
                        </p>
                      </div>
                      {milestone.amount && (
                        <span className="text-sm font-semibold text-right flex-shrink-0">
                          R$ {milestone.amount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Indicador de progresso */}
        {nextMilestone && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso para {nextMilestone.target}</span>
              <span>{nextMilestone.remaining}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-income"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min(100, ((totalPatrimony || 0) / parseInt(nextMilestone.target.replace(/\D/g, '')) / 1000) * 100)}%` 
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export { FinancialJourneyCard };


