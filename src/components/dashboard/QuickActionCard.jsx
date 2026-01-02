import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useIncomeInsights } from '@/hooks/useIncomeInsights';
import { 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  PiggyBank, 
  Target,
  ArrowRight,
  Sparkles,
  Clock
} from 'lucide-react';
import { startOfMonth, endOfMonth, parseISO, differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const QuickActionCard = memo(function QuickActionCard() {
  const { expenses, investments, investmentGoal, totalPatrimony } = useFinance();
  const incomeInsights = useIncomeInsights();

  // Calcular ações contextuais inteligentes
  const smartActions = useMemo(() => {
    const actions = [];
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    const daysRemaining = differenceInDays(currentMonthEnd, today);
    const dayOfMonth = today.getDate();

    // Filtrar dados do mês atual
    const currentMonthInvestments = investments.filter(inv => {
      const d = parseISO(inv.data);
      return d >= currentMonthStart && d <= currentMonthEnd;
    });

    const currentMonthExpenses = expenses.filter(exp => {
      const d = parseISO(exp.data);
      return d >= currentMonthStart && d <= currentMonthEnd;
    });

    const totalMonthlyInvestments = currentMonthInvestments.reduce((s, i) => s + i.valor_aporte, 0);
    const totalPending = currentMonthExpenses.filter(e => !e.pago).reduce((s, e) => s + e.valor, 0);
    const monthlyGoal = Number(investmentGoal) || 0;

    // Ação 1: Meta de investimento
    if (monthlyGoal > 0) {
      const remaining = monthlyGoal - totalMonthlyInvestments;
      const progress = (totalMonthlyInvestments / monthlyGoal) * 100;

      if (remaining > 0) {
        // Calcular valor diário sugerido para atingir a meta
        const dailySuggestion = daysRemaining > 0 ? remaining / daysRemaining : remaining;
        
        // Determinar melhor dia baseado em padrões (simplificado: fim de semana ou após dia 15)
        let bestDay = 'hoje';
        let urgency = 'medium';
        
        if (daysRemaining <= 3) {
          urgency = 'high';
          bestDay = 'hoje';
        } else if (dayOfMonth < 15 && daysRemaining > 10) {
          urgency = 'low';
          bestDay = `dia ${Math.min(dayOfMonth + 5, 28)}`;
        }

        actions.push({
          id: 'invest',
          priority: progress < 50 ? 'high' : 'medium',
          urgency,
          icon: TrendingUp,
          iconColor: 'text-income',
          bgColor: 'bg-income/10 border-income/20',
          title: 'Fazer Aporte',
          context: progress >= 100 
            ? 'Meta batida! Quer ir além?' 
            : `Faltam R$ ${remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para a meta`,
          suggestion: `Dia ideal: ${bestDay}`,
          suggestedAmount: Math.ceil(remaining / 10) * 10, // Arredonda para cima
          impact: progress < 100 
            ? `Você atingiria ${Math.min(100, Math.round(progress + (dailySuggestion / monthlyGoal * 100)))}% da meta!`
            : 'Continue construindo seu patrimônio!',
          href: '/investimentos',
          cta: 'Investir agora'
        });
      } else {
        // Meta já batida
        actions.push({
          id: 'invest-extra',
          priority: 'low',
          urgency: 'low',
          icon: Sparkles,
          iconColor: 'text-success',
          bgColor: 'bg-success/10 border-success/20',
          title: 'Meta Atingida! 🎉',
          context: `Você investiu R$ ${totalMonthlyInvestments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} este mês`,
          suggestion: 'Que tal ver suas projeções futuras?',
          impact: 'Veja o impacto dos seus aportes no longo prazo',
          href: '/projecao-investimentos',
          cta: 'Ver projeções'
        });
      }
    } else {
      // Sem meta definida
      actions.push({
        id: 'set-goal',
        priority: 'medium',
        urgency: 'medium',
        icon: Target,
        iconColor: 'text-primary',
        bgColor: 'bg-primary/10 border-primary/20',
        title: 'Definir Meta',
        context: 'Você ainda não tem uma meta de investimento mensal',
        suggestion: 'Metas ajudam a manter o foco!',
        impact: 'Defina uma meta e acompanhe seu progresso',
        href: '/configuracoes',
        cta: 'Definir meta'
      });
    }

    // Ação 2: Pendências
    if (totalPending > 0) {
      const pendingCount = currentMonthExpenses.filter(e => !e.pago).length;
      
      actions.push({
        id: 'pending',
        priority: totalPending > incomeInsights.availableBalance ? 'high' : 'medium',
        urgency: daysRemaining <= 5 ? 'high' : 'medium',
        icon: AlertTriangle,
        iconColor: 'text-warning',
        bgColor: 'bg-warning/10 border-warning/20',
        title: 'Quitar Pendências',
        context: `R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${pendingCount} conta(s) pendente(s)`,
        suggestion: daysRemaining <= 5 ? 'Faltam poucos dias!' : 'Organize suas contas',
        impact: 'Evite juros e mantenha o controle',
        href: '/gastos',
        cta: 'Ver pendências'
      });
    }

    // Ação 3: Saldo disponível alto (oportunidade)
    if (incomeInsights.availableBalance > monthlyGoal * 0.5 && monthlyGoal > 0) {
      const extraAmount = Math.floor(incomeInsights.availableBalance * 0.3 / 100) * 100; // 30% do saldo disponível
      
      if (extraAmount >= 100) {
        actions.push({
          id: 'extra-invest',
          priority: 'low',
          urgency: 'low',
          icon: PiggyBank,
          iconColor: 'text-primary',
          bgColor: 'bg-primary/10 border-primary/20',
          title: 'Oportunidade de Aporte Extra',
          context: `Você tem saldo disponível de R$ ${incomeInsights.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          suggestion: `Que tal investir R$ ${extraAmount.toLocaleString('pt-BR')}?`,
          suggestedAmount: extraAmount,
          impact: 'Acelere a construção do seu patrimônio',
          href: '/investimentos',
          cta: 'Investir extra'
        });
      }
    }

    // Ordenar por prioridade
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return actions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }, [expenses, investments, investmentGoal, incomeInsights]);

  // Pegar a ação principal e as secundárias
  const primaryAction = smartActions[0];
  const secondaryActions = smartActions.slice(1, 3);

  if (!primaryAction) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-primary" />
          Próxima Ação Sugerida
        </CardTitle>
        <CardDescription>
          Baseado na sua situação atual
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Ação Principal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link to={primaryAction.href} className="block">
            <div className={`p-4 rounded-xl border-2 ${primaryAction.bgColor} hover:shadow-md transition-all duration-200`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <primaryAction.icon className={`h-5 w-5 ${primaryAction.iconColor}`} />
                    <span className="font-semibold">{primaryAction.title}</span>
                    {primaryAction.priority === 'high' && (
                      <Badge variant="destructive" className="text-xs">Urgente</Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-card-foreground">
                    {primaryAction.context}
                  </p>
                  
                  {primaryAction.suggestion && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{primaryAction.suggestion}</span>
                    </div>
                  )}
                  
                  {primaryAction.impact && (
                    <p className="text-xs text-primary font-medium">
                      💡 {primaryAction.impact}
                    </p>
                  )}
                </div>
                
                <Button size="sm" className="flex-shrink-0">
                  {primaryAction.cta}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              {primaryAction.suggestedAmount && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Valor sugerido:</span>
                    <span className="font-bold text-lg">
                      R$ {primaryAction.suggestedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Link>
        </motion.div>

        {/* Ações Secundárias */}
        {secondaryActions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {secondaryActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
              >
                <Link to={action.href} className="block">
                  <div className={`p-3 rounded-lg border ${action.bgColor} hover:shadow-sm transition-all duration-200`}>
                    <div className="flex items-center gap-2 mb-1">
                      <action.icon className={`h-4 w-4 ${action.iconColor}`} />
                      <span className="text-sm font-medium">{action.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {action.context}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export { QuickActionCard };




