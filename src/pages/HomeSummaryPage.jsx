import React, { useMemo, memo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { useFinance } from '@/contexts/FinanceDataContext';
import { CompactPeriodFilter } from '@/components/CompactPeriodFilter';
import { CompactHeader } from '@/components/CompactHeader';
import { TrendingUp, TrendingDown, Target, AlertTriangle, PiggyBank, Lightbulb } from 'lucide-react';
// import { InfoTooltip } from '@/components/ui/tooltip';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, eachMonthOfInterval, subMonths, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HomeSummaryPage = memo(function HomeSummaryPage() {
  const { expenses, investments, categories, accounts, investmentGoal, totalPatrimony, totalInvestmentBalance } = useFinance();

  const [periodType, setPeriodType] = React.useState('monthly');
  const [dateRange, setDateRange] = React.useState(undefined);
  const [month, setMonth] = React.useState(new Date().getMonth());
  const [year, setYear] = React.useState(new Date().getFullYear());

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
  const goalProgress = periodGoal > 0 ? Math.min(100, (totalInvested / periodGoal) * 100) : 0;

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
        <title>Resumo Geral - FinanceApp</title>
      </Helmet>
      <div className="space-y-6">
        <CompactHeader 
          title="Olá! 👋"
          subtitle="Aqui está seu resumo financeiro"
        >
          <div className="flex items-center justify-between w-full">
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
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">R$ {totalPatrimony.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-sm text-muted-foreground">Patrimônio Total</p>
            </div>
          </div>
        </CompactHeader>

        {/* KPIs principais - apenas os mais importantes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Gastos no Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>✅ R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <span>⏳ R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-income">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Aportes no Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>Taxa de poupança: {Math.round(savingsRate)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Progresso da Meta
              </CardTitle>
            </CardHeader>
            <CardContent>
              {periodGoal > 0 ? (
                <>
                  <div className="text-3xl font-bold">{Math.round(goalProgress)}%</div>
                  <Progress value={goalProgress} className="h-3 mt-3" />
                  <p className="text-xs text-muted-foreground mt-2">
                    R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {periodGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

        {/* Seção de insights e ações contextuais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dicas educativas */}
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
                {educationTips.map((tip, i) => (
                  <div key={i} className="p-4 rounded-lg bg-secondary/50 text-sm flex items-start gap-3">
                    {tip.type === 'warning' && <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0"/>}
                    {tip.type === 'success' && <TrendingUp className="h-5 w-5 text-success mt-0.5 flex-shrink-0"/>}
                    {tip.type === 'tip' && <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0"/>}
                    <span className="text-foreground">{tip.message}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Ações rápidas contextuais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-income"/>
                Próximos passos
              </CardTitle>
              <CardDescription>Ações sugeridas baseadas no seu progresso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {totalPending > 0 && (
                <Link to="/gastos" className="block p-3 rounded-lg border border-warning bg-warning-muted hover:bg-warning-muted/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Quitar pendências</p>
                      <p className="text-sm text-warning">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em aberto</p>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  </div>
                </Link>
              )}
              
              {goalProgress < 100 && periodGoal > 0 && (
                <Link to="/investimentos" className="block p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Fazer aporte</p>
                      <p className="text-sm text-muted-foreground">
                        Faltam R$ {(periodGoal - totalInvested).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para a meta
                      </p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                </Link>
              )}

              {goalProgress >= 100 && (
                <Link to="/projecao-investimentos" className="block p-3 rounded-lg border border-success bg-success-muted hover:bg-success-muted/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Meta atingida! 🎉</p>
                      <p className="text-sm text-success">Veja projeções para o futuro</p>
                    </div>
                    <Target className="h-5 w-5 text-success" />
                  </div>
                </Link>
              )}

              <Link to="/investimentos" className="block p-3 rounded-lg border border-muted hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Gerenciar metas</p>
                    <p className="text-sm text-muted-foreground">Ajustar objetivos de investimento</p>
                  </div>
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de metas - movido para uma seção mais discreta */}
        {series6.some(m => m.invested > 0) && (
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground"/>
                Evolução dos Aportes
              </CardTitle>
              <CardDescription>Últimos 6 meses de atividade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {series6.map((m, idx) => (
                  <div key={idx} className={`p-3 rounded-lg text-center ${m.achieved ? 'bg-success-muted border border-success' : 'bg-background border border-border'}`}>
                    <div className="text-xs text-muted-foreground mb-1">{m.label}</div>
                    <div className="text-sm font-semibold">R$ {m.invested.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
                    {m.achieved && <div className="text-xs text-success mt-1">✓ Meta</div>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
});

export { HomeSummaryPage };


