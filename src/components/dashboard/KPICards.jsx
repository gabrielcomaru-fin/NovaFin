import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/enhanced-card';
import { TrendingUp, TrendingDown, DollarSign, Target, HelpCircle, X } from 'lucide-react';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { Link } from 'react-router-dom';
import { formatCurrencyBRL, formatPercent } from '@/lib/format';

// Dados educativos para cada KPI
const educationalTips = {
  'Gastos no Período': {
    title: 'O que são Gastos?',
    content: 'São todas as suas despesas no período selecionado. Acompanhar os gastos ajuda a identificar onde seu dinheiro está indo e onde você pode economizar.',
    tips: [
      'Categorize seus gastos para entender melhor seu padrão de consumo',
      'Gastos "pendentes" são contas que ainda não foram pagas',
      'Compare com meses anteriores para identificar tendências'
    ]
  },
  'Aportes no Período': {
    title: 'O que são Aportes?',
    content: 'São os valores que você investiu no período. Aportes regulares são a base para construir patrimônio no longo prazo.',
    tips: [
      'Tente investir logo que receber seu salário (pague-se primeiro)',
      'Mesmo pequenos valores fazem diferença com juros compostos',
      'A consistência é mais importante que o valor absoluto'
    ]
  },
  'Taxa de Poupança': {
    title: 'O que é Taxa de Poupança?',
    content: 'É a porcentagem da sua renda que você consegue poupar ou investir. Especialistas recomendam pelo menos 20%.',
    tips: [
      'Menos de 10%: Precisa de atenção urgente',
      '10-20%: Bom, mas tente aumentar gradualmente',
      'Acima de 20%: Excelente! Você está no caminho certo'
    ]
  },
  'Progresso da Meta': {
    title: 'Por que ter Metas?',
    content: 'Metas de investimento ajudam a manter o foco e a disciplina. Com uma meta definida, você sabe exatamente quanto precisa investir por mês.',
    tips: [
      'Defina metas realistas baseadas na sua renda',
      'Ajuste suas metas conforme sua situação muda',
      'Comemore quando atingir suas metas! 🎉'
    ]
  }
};

const KPICards = memo(function KPICards({
  totalMonthlyExpenses,
  totalMonthlyInvestments,
  totalPaidExpenses,
  totalPendingExpenses,
  savingsRate,
  periodInvestmentGoal,
  investmentProgress,
  previousMonthExpenses = 0,
  previousMonthInvestments = 0,
  isLoading = false,
}) {
  const { createStaggerAnimation } = useMicroInteractions();
  const [openTip, setOpenTip] = useState(null);
  
  const expenseDelta = totalMonthlyExpenses - previousMonthExpenses;
  const investmentDelta = totalMonthlyInvestments - previousMonthInvestments;
  const kpiData = [
    {
      title: 'Gastos no Período',
      value: totalMonthlyExpenses,
      icon: TrendingDown,
      iconColor: 'text-expense',
      subtitle: `Pago: ${formatCurrencyBRL(totalPaidExpenses)} • Pendente: ${formatCurrencyBRL(totalPendingExpenses)}`,
      href: '/gastos',
      delta: expenseDelta,
      delay: 0.1,
      hasEducationalTip: true
    },
    {
      title: 'Aportes no Período',
      value: totalMonthlyInvestments,
      icon: TrendingUp,
      iconColor: 'text-income',
      subtitle: null,
      href: '/investimentos',
      delta: investmentDelta,
      delay: 0.2,
      hasEducationalTip: true
    },
    {
      title: 'Taxa de Poupança',
      value: `${Math.round(savingsRate)}%`,
      icon: DollarSign,
      iconColor: 'text-primary',
      subtitle: 'Aportes / (Aportes + Gastos pagos)',
      href: '/resumo',
      delay: 0.3,
      hasEducationalTip: true
    },
    {
      title: 'Progresso da Meta',
      value: periodInvestmentGoal > 0 ? `${Math.round(investmentProgress)}%` : '-',
      icon: Target,
      iconColor: 'text-primary',
      subtitle: periodInvestmentGoal > 0
        ? `${formatCurrencyBRL(totalMonthlyInvestments)} de ${formatCurrencyBRL(periodInvestmentGoal)}`
        : 'Defina uma meta mensal para acompanhar o progresso.',
      href: '/projecao-investimentos',
      delay: 0.4,
      hasEducationalTip: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-fr">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon;
        const tipData = educationalTips[kpi.title];
        const isOpen = openTip === kpi.title;
        
        return (
          <motion.div
            key={kpi.title}
            {...createStaggerAnimation(kpi.delay)}
            className="relative"
          >
            <Link to={kpi.href} className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg transition-all">
            <Card className="h-full shadow-sm hover:shadow-md transition-shadow duration-200" hover={true} animation="subtle">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-body-sm font-medium text-muted-foreground flex items-center gap-1">
                  {kpi.title}
                  {kpi.hasEducationalTip && tipData && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenTip(isOpen ? null : kpi.title);
                      }}
                      className="p-0.5 hover:bg-muted rounded-full transition-colors"
                      aria-label={`Saiba mais sobre ${kpi.title}`}
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
                    </button>
                  )}
                </CardTitle>
                <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-h3 md:text-h2 font-bold text-card-foreground">
                  {isLoading ? (
                    <div className="h-8 w-32 bg-muted rounded animate-pulse border border-border" />
                  ) : (
                    typeof kpi.value === 'number' 
                      ? formatCurrencyBRL(kpi.value)
                      : kpi.value
                  )}
                </div>
                {kpi.subtitle && (
                  <p className="text-caption text-muted-foreground mt-2">
                    {kpi.subtitle}
                  </p>
                )}
                {typeof kpi.delta === 'number' && (kpi.title === 'Gastos no Período' || kpi.title === 'Aportes no Período') && (
                  <p className={`text-caption font-medium mt-2 ${kpi.delta >= 0 ? 'text-warning' : 'text-success'}`}>
                    {kpi.title === 'Gastos no Período' ? (kpi.delta >= 0 ? '▲' : '▼') : (kpi.delta >= 0 ? '▲' : '▼')} {formatCurrencyBRL(Math.abs(kpi.delta))} vs mês anterior
                  </p>
                )}
              </CardContent>
            </Card>
            </Link>
            
            {/* Educational Tooltip Popup */}
            <AnimatePresence>
              {isOpen && tipData && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-50 top-full left-0 right-0 mt-2 p-4 bg-popover border border-border rounded-lg shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm text-popover-foreground">
                      {tipData.title}
                    </h4>
                    <button
                      onClick={() => setOpenTip(null)}
                      className="p-1 hover:bg-muted rounded-full transition-colors"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {tipData.content}
                  </p>
                  <div className="space-y-1.5">
                    {tipData.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="text-primary mt-0.5">💡</span>
                        <span className="text-popover-foreground">{tip}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
});

export { KPICards };
