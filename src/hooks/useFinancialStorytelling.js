import { useMemo, useCallback } from 'react';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useGamification } from '@/contexts/GamificationContext';
import { useAdvancedMetrics } from './useAdvancedMetrics';
import { 
  parseISO, 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachMonthOfInterval, 
  subMonths,
  differenceInMonths,
  differenceInDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Hook para gerar narrativas e storytelling financeiro
 * Centraliza a lógica de geração de mensagens humanizadas,
 * marcos e fase atual da jornada financeira do usuário
 */
export const useFinancialStorytelling = () => {
  const { expenses, investments, investmentGoal, totalPatrimony, totalInvestmentBalance, incomes } = useFinance();
  const { achievements, points } = useGamification();
  const { financialHealth, trends } = useAdvancedMetrics();

  // Calcular o primeiro investimento
  const firstInvestment = useMemo(() => {
    if (!investments || investments.length === 0) return null;
    
    const sorted = [...investments].sort((a, b) => 
      new Date(a.data).getTime() - new Date(b.data).getTime()
    );
    
    return sorted[0];
  }, [investments]);

  // Calcular tempo desde o primeiro investimento
  const journeyDuration = useMemo(() => {
    if (!firstInvestment) return { months: 0, days: 0 };
    
    const firstDate = parseISO(firstInvestment.data);
    const today = new Date();
    
    return {
      months: differenceInMonths(today, firstDate),
      days: differenceInDays(today, firstDate)
    };
  }, [firstInvestment]);

  // Calcular streak de metas
  const goalStreak = useMemo(() => {
    const goal = Number(investmentGoal) || 0;
    if (!goal || !investments.length) return 0;

    const today = new Date();
    let streak = 0;

    for (let i = 0; i < 12; i++) {
      const month = subMonths(today, i);
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      
      const monthlyTotal = investments
        .filter(inv => {
          const d = parseISO(inv.data);
          return d >= start && d <= end;
        })
        .reduce((sum, inv) => sum + inv.valor_aporte, 0);

      if (monthlyTotal >= goal) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }, [investments, investmentGoal]);

  // Determinar fase atual da jornada
  const currentPhase = useMemo(() => {
    const patrimony = totalPatrimony || totalInvestmentBalance || 0;
    const monthlyGoal = Number(investmentGoal) || 0;
    
    // Fases baseadas em patrimônio e comportamento
    if (patrimony === 0 && investments.length === 0) {
      return {
        id: 'starting',
        name: 'Começando a Jornada',
        description: 'Dê o primeiro passo! Qualquer valor conta.',
        color: 'text-blue-500',
        emoji: '🌱',
        tips: [
          'Comece pequeno, mas comece hoje',
          'O hábito é mais importante que o valor',
          'Cada R$ 10 é um passo na direção certa'
        ]
      };
    } else if (patrimony < 1000) {
      return {
        id: 'first_steps',
        name: 'Primeiros Passos',
        description: 'Você já começou! Continue construindo o hábito.',
        color: 'text-green-500',
        emoji: '🚶',
        tips: [
          'Parabéns pelo primeiro passo!',
          'Defina um valor mensal que você consiga manter',
          'Automatize seus aportes se possível'
        ]
      };
    } else if (patrimony < 10000) {
      return {
        id: 'building_base',
        name: 'Construindo a Base',
        description: 'Você está criando uma base sólida para o futuro.',
        color: 'text-emerald-500',
        emoji: '🏗️',
        tips: [
          'Foque em consistência',
          'Comece a diversificar aos poucos',
          'Mantenha uma reserva de emergência'
        ]
      };
    } else if (patrimony < 50000) {
      return {
        id: 'growing',
        name: 'Fase de Crescimento',
        description: 'Seu patrimônio está crescendo de forma consistente!',
        color: 'text-teal-500',
        emoji: '📈',
        tips: [
          'Os juros compostos estão trabalhando por você',
          'Considere diversificar entre diferentes tipos de ativos',
          'Mantenha o ritmo!'
        ]
      };
    } else if (patrimony < 100000) {
      return {
        id: 'accelerating',
        name: 'Aceleração',
        description: 'Você está no caminho da liberdade financeira!',
        color: 'text-cyan-500',
        emoji: '🚀',
        tips: [
          'Seu patrimônio já gera rendimentos significativos',
          'Revise sua estratégia de investimentos',
          'Continue disciplinado!'
        ]
      };
    } else {
      return {
        id: 'independence',
        name: 'Rumo à Independência',
        description: 'Você está construindo verdadeira liberdade financeira!',
        color: 'text-purple-500',
        emoji: '🌟',
        tips: [
          'Considere assessoria profissional',
          'Pense em renda passiva',
          'Planeje o longo prazo'
        ]
      };
    }
  }, [totalPatrimony, totalInvestmentBalance, investments, investmentGoal]);

  // Gerar mensagem motivacional personalizada
  const motivationalMessage = useMemo(() => {
    const messages = [];
    const today = new Date();
    const dayOfMonth = today.getDate();
    const patrimony = totalPatrimony || 0;
    const healthScore = financialHealth?.financialHealthScore || 0;

    // Baseado no streak
    if (goalStreak >= 6) {
      messages.push({
        type: 'achievement',
        emoji: '🏆',
        text: `Incrível! Você bateu a meta por ${goalStreak} meses seguidos. Isso é disciplina de verdade!`
      });
    } else if (goalStreak >= 3) {
      messages.push({
        type: 'encouragement',
        emoji: '🔥',
        text: `${goalStreak} meses de meta batida! Você está criando um hábito poderoso.`
      });
    } else if (goalStreak === 1) {
      messages.push({
        type: 'start',
        emoji: '🌟',
        text: 'Primeiro mês com meta batida! Este é o começo de algo grande.'
      });
    }

    // Baseado no dia do mês
    if (dayOfMonth <= 5) {
      messages.push({
        type: 'timing',
        emoji: '📅',
        text: 'Início do mês: ótimo momento para planejar seu aporte!'
      });
    } else if (dayOfMonth >= 25) {
      messages.push({
        type: 'timing',
        emoji: '⏰',
        text: 'Final do mês chegando. Já fez seu aporte?'
      });
    }

    // Baseado na saúde financeira
    if (healthScore >= 80) {
      messages.push({
        type: 'health',
        emoji: '💚',
        text: 'Sua saúde financeira está excelente! Continue assim.'
      });
    } else if (healthScore >= 50) {
      messages.push({
        type: 'health',
        emoji: '💛',
        text: 'Você está no caminho certo. Pequenos ajustes podem te levar mais longe.'
      });
    }

    // Baseado em conquistas
    if (achievements.length > 0) {
      const recentAchievement = achievements
        .filter(a => a.unlockedAt)
        .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))[0];
      
      if (recentAchievement) {
        const daysSince = differenceInDays(today, new Date(recentAchievement.unlockedAt));
        if (daysSince <= 7) {
          messages.push({
            type: 'achievement',
            emoji: '🎖️',
            text: `Conquista recente: "${recentAchievement.title}"! Continue desbloqueando!`
          });
        }
      }
    }

    // Baseado na tendência
    if (trends?.overall === 'positive') {
      messages.push({
        type: 'trend',
        emoji: '📊',
        text: 'Sua tendência financeira é positiva. Excelente trabalho!'
      });
    }

    // Retornar mensagem principal (primeira mais relevante)
    return messages.length > 0 ? messages[0] : {
      type: 'default',
      emoji: '💪',
      text: 'Continue acompanhando suas finanças. Conhecimento é poder!'
    };
  }, [goalStreak, totalPatrimony, financialHealth, achievements, trends]);

  // Detectar marcos automaticamente
  const detectedMilestones = useMemo(() => {
    const milestones = [];
    const patrimony = totalPatrimony || totalInvestmentBalance || 0;

    // Primeiro investimento
    if (firstInvestment) {
      milestones.push({
        id: 'first-investment',
        type: 'start',
        date: parseISO(firstInvestment.data),
        title: 'Primeiro Investimento',
        description: `Você deu o primeiro passo com R$ ${firstInvestment.valor_aporte.toLocaleString('pt-BR')}`,
        achieved: true
      });
    }

    // Marcos de patrimônio
    const patrimonyMilestones = [
      { value: 1000, title: 'R$ 1.000', description: 'Primeiro mil acumulado!' },
      { value: 5000, title: 'R$ 5.000', description: 'Cinco mil reais!' },
      { value: 10000, title: 'R$ 10.000', description: 'Patrimônio de 5 dígitos!' },
      { value: 25000, title: 'R$ 25.000', description: 'Um quarto de 100k!' },
      { value: 50000, title: 'R$ 50.000', description: 'Metade de 100k!' },
      { value: 100000, title: 'R$ 100.000', description: 'Seis dígitos alcançados!' }
    ];

    patrimonyMilestones.forEach(m => {
      milestones.push({
        id: `patrimony-${m.value}`,
        type: 'patrimony',
        value: m.value,
        title: m.title,
        description: m.description,
        achieved: patrimony >= m.value,
        progress: Math.min(100, (patrimony / m.value) * 100)
      });
    });

    // Marcos de streak
    [1, 3, 6, 12].forEach(months => {
      milestones.push({
        id: `streak-${months}`,
        type: 'streak',
        value: months,
        title: `${months} ${months === 1 ? 'mês' : 'meses'} de meta`,
        description: `Bater a meta por ${months} ${months === 1 ? 'mês' : 'meses'} consecutivo(s)`,
        achieved: goalStreak >= months
      });
    });

    return milestones;
  }, [firstInvestment, totalPatrimony, totalInvestmentBalance, goalStreak]);

  // Próximo marco a ser alcançado
  const nextMilestone = useMemo(() => {
    const pending = detectedMilestones
      .filter(m => !m.achieved && m.type === 'patrimony')
      .sort((a, b) => (a.value || 0) - (b.value || 0));
    
    return pending[0] || null;
  }, [detectedMilestones]);

  // Gerar saudação personalizada baseada na hora e situação
  const personalizedGreeting = useCallback(() => {
    const hour = new Date().getHours();
    const patrimony = totalPatrimony || 0;
    
    let timeGreeting = '';
    if (hour < 12) timeGreeting = 'Bom dia';
    else if (hour < 18) timeGreeting = 'Boa tarde';
    else timeGreeting = 'Boa noite';

    if (goalStreak >= 3) {
      return `${timeGreeting}! Você está arrasando! 🔥`;
    } else if (patrimony > 0) {
      return `${timeGreeting}! Vamos ver seu progresso? 📊`;
    } else {
      return `${timeGreeting}! Pronto para começar sua jornada? 🌱`;
    }
  }, [goalStreak, totalPatrimony]);

  return {
    // Dados da jornada
    firstInvestment,
    journeyDuration,
    goalStreak,
    currentPhase,
    
    // Mensagens e narrativas
    motivationalMessage,
    personalizedGreeting,
    
    // Marcos
    detectedMilestones,
    nextMilestone,
    
    // Métricas para storytelling
    totalMilestoneProgress: detectedMilestones.filter(m => m.achieved).length,
    totalMilestones: detectedMilestones.length,
    achievementsCount: achievements?.length || 0,
    totalPoints: points || 0
  };
};






