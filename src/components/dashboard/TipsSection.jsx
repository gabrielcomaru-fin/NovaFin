import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/enhanced-card';
import { AlertTriangle, TrendingUp, Lightbulb, Heart, Sparkles, Target } from 'lucide-react';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';

// Humaniza as mensagens para serem mais empáticas e conversacionais
const humanizeMessage = (tip) => {
  const { type, message, originalMessage } = tip;
  
  // Se já tem mensagem humanizada, usar ela
  if (tip.humanized) return tip;
  
  // Padrões de humanização
  const humanizedPatterns = {
    // Taxa de poupança baixa
    lowSavings: {
      pattern: /taxa de poupança.*(baixa|abaixo)/i,
      humanized: (msg) => ({
        message: 'Ei, percebi que este mês está mais apertado. Que tal começar com apenas R$ 50? Pequenos passos contam muito!',
        emoji: '💪',
        encouragement: 'Cada real economizado é uma vitória.'
      })
    },
    // Meta não atingida
    goalNotReached: {
      pattern: /(abaixo|falta|meta.*não)/i,
      humanized: (msg) => ({
        message: 'A meta ainda não foi batida, mas você está no caminho! Que tal um pequeno aporte extra?',
        emoji: '🎯',
        encouragement: 'Consistência é mais importante que perfeição.'
      })
    },
    // Gastos altos em categoria
    highSpending: {
      pattern: /(gasto.*chegou|limite|ultrapassou)/i,
      humanized: (msg) => ({
        message: msg.replace(/Seu gasto em (\w+)/, 'Opa! Os gastos em $1').replace('Considere ajustar', 'Que tal revisar'),
        emoji: '👀',
        encouragement: 'Identificar é o primeiro passo para ajustar.'
      })
    },
    // Sucesso
    success: {
      pattern: /(parabéns|excelente|ótimo|caminho certo)/i,
      humanized: (msg) => ({
        message: msg,
        emoji: '🎉',
        encouragement: 'Continue assim!'
      })
    },
    // Investir mais
    investMore: {
      pattern: /(aumentar.*aporte|investir mais|pequenos valores)/i,
      humanized: (msg) => ({
        message: 'Que tal fazer um pequeno aporte extra? Mesmo R$ 20 fazem diferença no longo prazo!',
        emoji: '🌱',
        encouragement: 'Juros compostos são mágicos.'
      })
    },
    // Regra 50/30/20
    budgetRule: {
      pattern: /regra 50\/30\/20/i,
      humanized: (msg) => ({
        message: 'Uma dica: tente a regra 50/30/20! É uma forma simples de organizar seu dinheiro entre necessidades, desejos e futuro.',
        emoji: '📊',
        encouragement: 'Organização traz tranquilidade.'
      })
    },
    // Pendências
    pendingPayments: {
      pattern: /(pendência|não pago|em aberto)/i,
      humanized: (msg) => ({
        message: 'Tem algumas contas pendentes. Que tal dar uma olhada? Evitar juros é como ganhar dinheiro!',
        emoji: '📋',
        encouragement: 'Organizar as contas traz paz de espírito.'
      })
    }
  };

  // Tentar encontrar um padrão que corresponda
  for (const [key, pattern] of Object.entries(humanizedPatterns)) {
    if (pattern.pattern.test(message)) {
      const humanized = pattern.humanized(message);
      return {
        ...tip,
        message: humanized.message,
        emoji: humanized.emoji,
        encouragement: humanized.encouragement,
        humanized: true
      };
    }
  }

  // Fallback: adicionar apenas emoji baseado no tipo
  const typeEmojis = {
    warning: '⚠️',
    success: '✨',
    tip: '💡'
  };

  return {
    ...tip,
    emoji: typeEmojis[type] || '💡',
    humanized: true
  };
};

const TipsSection = memo(function TipsSection({ tips }) {
  const { createStaggerAnimation } = useMicroInteractions();
  
  // Humanizar todas as dicas
  const humanizedTips = useMemo(() => {
    return tips.map(tip => humanizeMessage(tip));
  }, [tips]);
  
  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />;
      case 'success':
        return <Sparkles className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />;
      case 'tip':
        return <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />;
      default:
        return <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />;
    }
  };

  const getBgStyle = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-warning/10 border-warning/30';
      case 'success':
        return 'bg-success/10 border-success/30';
      case 'tip':
        return 'bg-primary/10 border-primary/30';
      default:
        return 'bg-muted/60 border-border/60';
    }
  };

  if (!humanizedTips || humanizedTips.length === 0) {
    return null;
  }

  return (
    <motion.div
      {...createStaggerAnimation(0.9)}
    >
      <Card hover={true} animation="subtle" className="shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-h5 font-semibold">
            <Heart className="h-5 w-5 text-pink-500 flex-shrink-0" />
            Insights Personalizados
          </CardTitle>
          <CardDescription>
            Dicas pensadas especialmente para você
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {humanizedTips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`p-4 rounded-lg border ${getBgStyle(tip.type)} hover:shadow-sm transition-all duration-200`}
            >
              <div className="flex items-start gap-3">
                {tip.emoji ? (
                  <span className="text-xl flex-shrink-0">{tip.emoji}</span>
                ) : (
                  getIcon(tip.type)
                )}
                <div className="flex-1 space-y-1">
                  <p className="text-body-sm text-card-foreground leading-relaxed">
                    {tip.message}
                  </p>
                  {tip.encouragement && (
                    <p className="text-xs text-muted-foreground italic">
                      {tip.encouragement}
                    </p>
                  )}
                  {tip.action && (
                    <p className="text-xs font-medium text-primary mt-2">
                      💡 Ação sugerida: {tip.action}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
});

export { TipsSection };
