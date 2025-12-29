import React, { useMemo, memo, useCallback, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useIncomeInsights } from '@/hooks/useIncomeInsights';
import { CompactPeriodFilter } from '@/components/CompactPeriodFilter';
import { CompactHeader } from '@/components/CompactHeader';
import { FinancialHealthMeter } from '@/components/dashboard/FinancialHealthMeter';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { SelfComparisonCard } from '@/components/dashboard/SelfComparisonCard';
import { FinancialJourneyCard } from '@/components/dashboard/FinancialJourneyCard';
import { TrendingUp, TrendingDown, Target, AlertTriangle, PiggyBank, Lightbulb, Trophy, DollarSign, Settings, Eye, EyeOff, LayoutGrid, Minimize2 } from 'lucide-react';
import { useGamification } from '@/contexts/GamificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, eachMonthOfInterval, subMonths, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HomeSummaryPage = memo(function HomeSummaryPage() {
  const { expenses, investments, categories, accounts, investmentGoal, totalPatrimony, totalInvestmentBalance } = useFinance();
  const incomeInsights = useIncomeInsights();
  const { evaluateAchievements } = useGamification();

  const [periodType, setPeriodType] = useState('monthly');
  const [dateRange, setDateRange] = useState(undefined);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  
  // Focus Mode - modo simplificado
  const [focusMode, setFocusMode] = useState(false);

  // Memoizar callbacks para evitar re-renders desnecessários
  const handlePeriodTypeChange = useCallback((type) => setPeriodType(type), []);
  const handleDateRangeChange = useCallback((range) => setDateRange(range), []);
  const handleMonthChange = useCallback((m) => setMonth(m), []);
  const handleYearChange = useCallback((y) => setYear(y), []);

  const { startDate, endDate } = useMemo(() => {
    let s, e;
    if (dateRange && dateRange.from) {
      s = dateRange.from; e = dateRange.to || dateRange.from;
    } else if (periodType === 'yearly' && year) {
      s = startOfYear(new Date(year, 0, 1)); e = endOfYear(new Date(year, 11, 31));
    } else if (periodType === 'monthly' && month !== undefined && year) {
      s = startOfMonth(new Date(year, month, 1)); e = endOfMonth(new Date(year, month, 1));
    } else {
      const now = new Date(); s = startOfMonth(now); e = endOfMonth(now);
    }
    e.setHours(23,59,59,999);
    return { startDate: s, endDate: e };
  }, [dateRange, periodType, month, year]);

  const filteredExpenses = useMemo(() => expenses.filter(exp => {
    const d = parseISO(exp.data); return d >= startDate && d <= endDate;
  }), [expenses, startDate, endDate]);

  const filteredInvestments = useMemo(() => investments.filter(inv => {
    const d = parseISO(inv.data); return d >= startDate && d <= endDate;
  }), [investments, startDate, endDate]);

  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.valor, 0);
  const totalPaid = filteredExpenses.filter(e => e.pago).reduce((s, e) => s + e.valor, 0);
  const totalPending = filteredExpenses.filter(e => !e.pago).reduce((s, e) => s + e.valor, 0);
  const totalInvested = filteredInvestments.reduce((s, i) => s + i.valor_aporte, 0);

  // Meta mensal acumulada para o período
  const periodMonths = useMemo(() => {
    if (dateRange && dateRange.from) {
      return eachMonthOfInterval({ start: startOfMonth(dateRange.from), end: endOfMonth(dateRange.to || dateRange.from) }).length;
    }
    if (periodType === 'yearly' && year) {
      const now = new Date();
      if (year < now.getFullYear()) return 12;
      if (year > now.getFullYear()) return 0;
      return now.getMonth() + 1;
    }
    return 1;
  }, [dateRange, periodType, year]);

  const periodGoal = (Number(investmentGoal) || 0) * periodMonths;
  const goalProgress = periodGoal > 0 ? (totalInvested / periodGoal) * 100 : 0;

  // Taxa de poupança do período
  const savingsRate = (totalInvested + totalPaid) > 0 ? (totalInvested / (totalInvested + totalPaid)) * 100 : 0;

  // Últimos 6 meses com meta batida
  const series6 = useMemo(() => {
    const goal = Number(investmentGoal) || 0;
    const last6 = eachMonthOfInterval({ start: subMonths(new Date(), 5), end: new Date() });
    return last6.map(m => {
      const s = startOfMonth(m), e = endOfMonth(m);
      const inv = investments.filter(i => { const d = parseISO(i.data); return d >= s && d <= e; }).reduce((sum, i) => sum + i.valor_aporte, 0);
      return { label: format(m, 'MMM/yy', { locale: ptBR }), invested: inv, achieved: goal > 0 ? inv >= goal : false };
    });
  }, [investments, investmentGoal]);

  // Fração do período decorrido (0-1)
  const periodElapsed = useMemo(() => {
    const now = new Date();
    const total = endDate.getTime() - startDate.getTime();
    const elapsed = Math.min(Math.max(now.getTime() - startDate.getTime(), 0), total);
    return total > 0 ? elapsed / total : 1;
  }, [startDate, endDate]);

  // Streak de metas batidas (dos últimos para trás)
  const investStreak = useMemo(() => {
    let s = 0;
    for (let i = series6.length - 1; i >= 0; i--) {
      if (series6[i].achieved) s++; else break;
    }
    return s;
  }, [series6]);

  React.useEffect(() => {
    evaluateAchievements({ monthlyStreak: investStreak });
  }, [investStreak, evaluateAchievements]);

  // Dicas educativas dinâmicas
  const educationTips = useMemo(() => {
    const tips = [];

    // Meta vs período decorrido
    if (periodGoal > 0) {
      const expected = periodElapsed * 100;
      if (goalProgress >= 100) {
        tips.push({ type: 'success', message: 'Parabéns! Você bateu a meta do período. Mantenha a consistência com pequenos aportes recorrentes.' });
      } else if (goalProgress < expected * 0.9) {
        tips.push({ type: 'tip', message: 'Você está abaixo do ritmo esperado para a meta. Antecipe um aporte menor hoje para aliviar o fim do período.' });
      } else {
        tips.push({ type: 'tip', message: 'Bom ritmo! Um pequeno aporte extra pode garantir que você bata a meta antes do fim do período.' });
      }
    }

    // Pendências
    if (totalPending > 0 && totalPending >= totalPaid * 0.5) {
      tips.push({ type: 'warning', message: 'Pendências elevadas neste período. Priorize quitar para liberar fluxo para os aportes.' });
    }

    // Taxa de poupança
    if (savingsRate < 15) {
      tips.push({ type: 'tip', message: 'Sua taxa de poupança está baixa. Avalie reduzir uma categoria de gasto e redirecionar a diferença para aportes.' });
    } else if (savingsRate >= 25) {
      tips.push({ type: 'success', message: 'Excelente taxa de poupança! Considere automatizar aportes para manter esse padrão.' });
    }

    // Hábito (streak)
    if (investStreak >= 2) {
      tips.push({ type: 'success', message: `Ótimo hábito! Você bateu a meta por ${investStreak} meses seguidos.` });
    }

    return tips.slice(0, 3);
  }, [goalProgress, periodElapsed, periodGoal, totalPending, totalPaid, savingsRate, investStreak]);

  return (
    <>
      <Helmet>
        <title>Resumo Geral - Lumify</title>
      </Helmet>
      <div className="space-y-4 md:space-y-5 page-top">
        <CompactHeader 
          title="Olá! 👋"
          subtitle="Aqui está seu resumo financeiro"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <CompactPeriodFilter 
                periodType={periodType}
                setPeriodType={handlePeriodTypeChange}
                dateRange={dateRange}
                setDateRange={handleDateRangeChange}
                month={month}
                setMonth={handleMonthChange}
                year={year}
                setYear={handleYearChange}
              />
              {/* Toggle Focus Mode */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFocusMode(!focusMode)}
                className="h-8 gap-1.5 text-xs"
                title={focusMode ? 'Modo completo' : 'Modo foco'}
              >
                {focusMode ? (
                  <>
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Completo</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Foco</span>
                  </>
                )}
              </Button>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <div>
                  <div className="text-2xl font-bold text-primary">R$ {totalPatrimony.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <p className="text-sm text-muted-foreground">Patrimônio Total</p>
                </div>
                <Link to="/configuracoes">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CompactHeader>

        {/* FOCUS MODE - Versão simplificada */}
        <AnimatePresence mode="wait">
          {focusMode ? (
            <motion.div
              key="focus-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Termômetro de Saúde Financeira */}
              <FinancialHealthMeter />
              
              {/* Próxima Ação Sugerida */}
              <QuickActionCard />
              
              {/* Progresso da Meta Principal */}
              <Card className="border-2 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Meta do Mês</h3>
                      <p className="text-sm text-muted-foreground">
                        {periodGoal > 0 
                          ? `R$ ${totalInvested.toLocaleString('pt-BR')} de R$ ${periodGoal.toLocaleString('pt-BR')}`
                          : 'Defina uma meta para acompanhar'}
                      </p>
                    </div>
                    <div className="text-3xl font-bold text-primary">
                      {periodGoal > 0 ? `${Math.round(goalProgress)}%` : '-'}
                    </div>
                  </div>
                  {periodGoal > 0 && (
                    <Progress value={Math.min(goalProgress, 100)} className="h-4" />
                  )}
                  {goalProgress >= 100 && (
                    <p className="text-sm text-success mt-2 font-medium text-center">
                      🎉 Parabéns! Meta atingida!
                    </p>
                  )}
                </CardContent>
              </Card>

              <p className="text-center text-xs text-muted-foreground">
                Clique em "Completo" para ver mais detalhes
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="full-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 md:space-y-5"
            >
              {/* Termômetro de Saúde Financeira - Novo componente principal */}
              <FinancialHealthMeter />

        {/* KPIs principais - apenas os mais importantes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Gastos no Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-card-foreground">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>✅ R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <span>⏳ R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${incomeInsights.availableBalance >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Saldo Disponível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${incomeInsights.availableBalance >= 0 ? 'text-success' : 'text-error'}`}>
                R$ {incomeInsights.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>Pode gastar: R$ {incomeInsights.dailySpendingCapacity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/dia</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-income">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Aportes no Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-card-foreground">R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>Taxa de poupança: {Math.round(savingsRate)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Progresso da Meta
              </CardTitle>
            </CardHeader>
            <CardContent>
              {periodGoal > 0 ? (
                <>
                  <div className="text-3xl font-bold text-card-foreground">{Math.round(goalProgress)}%</div>
                  <Progress value={Math.min(goalProgress, 100)} className="h-3 mt-3" />
                  <p className="text-xs text-muted-foreground mt-2">
                    R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {periodGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {goalProgress > 100 && (
                      <span className="block text-success font-medium">
                        R$ {(totalInvested - periodGoal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} além da meta! 🎉
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Defina uma meta mensal</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Seção de ações rápidas e evolução */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {/* Próxima Ação Sugerida - Novo componente inteligente */}
          <QuickActionCard />

          {/* Comparação com você do passado - Novo componente */}
          <SelfComparisonCard monthsAgo={6} />
        </div>

        {/* Seção de insights e jornada */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {/* Insights de Receitas */}
          {incomeInsights.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary"/>
                  Insights Financeiros
                </CardTitle>
                <CardDescription>Recomendações baseadas na sua situação atual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {incomeInsights.recommendations.slice(0, 3).map((rec, i) => (
                  <div key={i} className={`p-4 rounded-lg text-sm flex items-start gap-3 ${
                    rec.type === 'warning' ? 'bg-error-muted border border-error' :
                    rec.type === 'success' ? 'bg-success-muted border border-success' :
                    'bg-info-muted border border-info'
                  }`}>
                    {rec.type === 'warning' && <AlertTriangle className="h-5 w-5 text-error mt-0.5 flex-shrink-0"/>}
                    {rec.type === 'success' && <Trophy className="h-5 w-5 text-success mt-0.5 flex-shrink-0"/>}
                    {rec.type === 'tip' && <Lightbulb className="h-5 w-5 text-info mt-0.5 flex-shrink-0"/>}
                    <div>
                      <p className="font-medium text-card-foreground">{rec.message}</p>
                      {rec.action && (
                        <p className="text-xs text-muted-foreground mt-1">💡 {rec.action}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Jornada Financeira - Novo componente de storytelling */}
          <FinancialJourneyCard />
        </div>

        {/* Dicas educativas humanizadas */}
        {educationTips.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-warning"/>
                Insights para você
              </CardTitle>
              <CardDescription>Dicas personalizadas baseadas no seu momento atual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {investStreak > 0 && (
                <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full border bg-card text-xs">
                  <Trophy className="h-3.5 w-3.5 text-primary" />
                  Streak mensal: {investStreak}m 🔥
                </div>
              )}
              {educationTips.map((tip, i) => (
                <div key={i} className={`p-4 rounded-lg text-sm flex items-start gap-3 transition-colors duration-200 ${
                  tip.type === 'warning' ? 'bg-warning/10 border border-warning/30 hover:bg-warning/20' :
                  tip.type === 'success' ? 'bg-success/10 border border-success/30 hover:bg-success/20' :
                  'bg-primary/10 border border-primary/30 hover:bg-primary/20'
                }`}>
                  {tip.type === 'warning' && <span className="text-lg">⚠️</span>}
                  {tip.type === 'success' && <span className="text-lg">✨</span>}
                  {tip.type === 'tip' && <span className="text-lg">💡</span>}
                  <div className="flex-1">
                    <span className="text-card-foreground">{tip.message}</span>
                    {tip.type === 'tip' && (
                      <p className="text-xs text-muted-foreground italic mt-1">
                        Pequenos passos levam a grandes conquistas.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

export { HomeSummaryPage };


