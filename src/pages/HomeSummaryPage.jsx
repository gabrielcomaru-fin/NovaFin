import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { useFinance } from '@/contexts/FinanceDataContext';
import { PeriodFilter } from '@/components/PeriodFilter';
import { TrendingUp, TrendingDown, Target, AlertTriangle, PiggyBank, Lightbulb } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/tooltip';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, eachMonthOfInterval, subMonths, parseISO, format } from 'date-fns';

export function HomeSummaryPage() {
  const { expenses, investments, categories, accounts, investmentGoal } = useFinance();

  const [periodType, setPeriodType] = React.useState('monthly');
  const [dateRange, setDateRange] = React.useState(undefined);
  const [month, setMonth] = React.useState(new Date().getMonth());
  const [year, setYear] = React.useState(new Date().getFullYear());

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
      return { label: format(m, 'MMM/yy'), invested: inv, achieved: goal > 0 ? inv >= goal : false };
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Olá! Aqui está seu resumo geral</h1>
        </div>

        <PeriodFilter 
          periodType={periodType}
          setPeriodType={setPeriodType}
          dateRange={dateRange}
          setDateRange={setDateRange}
          month={month}
          setMonth={setMonth}
          year={year}
          setYear={setYear}
        />

        {/* KPIs do período */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Gastos (Período)
                <InfoTooltip content="Somatório de todas as despesas dentro do período do filtro. A linha Pago x Pendente ajuda a priorizar quitação." />
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Pago: R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • Pendente: R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Aportes (Período)
                <InfoTooltip content="Total investido no período selecionado. A taxa de poupança indica a parcela de renda direcionada a investimentos." />
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Taxa de poupança: {Math.round(savingsRate)}%</p>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Progresso da Meta
                <InfoTooltip content="Compara seus aportes com a meta mensal acumulada no período (ex.: ano corrente = metas dos meses passados)." />
              </CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {periodGoal > 0 ? (
                <>
                  <div className="text-2xl font-bold">{Math.round(goalProgress)}%</div>
                  <Progress value={goalProgress} className="h-2 mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {periodGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Defina uma meta mensal para acompanhar seu progresso.</p>
              )}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Pendências
                <InfoTooltip content="Total de despesas ainda não pagas no período. Priorize para liberar fluxo para investir." />
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Priorize quitar pendências para liberar aportes.</p>
            </CardContent>
          </Card>
        </div>

        {/* Evolução 6 meses com destaque de meta batida */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Evolução de Aportes (6 meses)
              <InfoTooltip content="Mostra seus aportes dos últimos 6 meses e destaca quando a meta mensal foi atingida." />
            </CardTitle>
            <CardDescription>Meses com meta batida ficam destacados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {series6.map((m, idx) => (
                <div key={idx} className={`p-3 rounded-md border ${m.achieved ? 'bg-green-50 border-green-200' : 'bg-muted'}`}>
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                  <div className="text-sm font-semibold mt-1">R$ {m.invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <div className={`text-xs mt-1 ${m.achieved ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {m.achieved ? 'Meta batida' : 'Abaixo da meta'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dicas educativas dinâmicas */}
        {educationTips.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-yellow-400"/>Dicas para o seu momento</CardTitle>
              <CardDescription>Mensagens personalizadas com base no seu período atual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {educationTips.map((tip, i) => (
                <div key={i} className="p-3 rounded-md bg-secondary text-sm text-muted-foreground flex items-start gap-2">
                  {tip.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5"/>}
                  {tip.type === 'success' && <TrendingUp className="h-4 w-4 text-green-500 mt-0.5"/>}
                  {tip.type === 'tip' && <Lightbulb className="h-4 w-4 text-primary mt-0.5"/>}
                  <span>{tip.message}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Ações rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PiggyBank className="h-4 w-4 text-green-600"/>Aumente sua constância</CardTitle>
              <CardDescription>Comece o mês com um aporte pequeno e regular.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/investimentos" className="inline-flex items-center px-3 py-1.5 bg-primary text-white rounded-md hover:opacity-90">Registrar aporte</Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Definir/editar meta</CardTitle>
              <CardDescription>Alinhe a meta mensal ao seu momento.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/investimentos" className="inline-flex items-center px-3 py-1.5 bg-secondary rounded-md hover:opacity-90">Abrir metas</Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ver projeção</CardTitle>
              <CardDescription>Explore cenários e probabilidade de bater sua meta.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/projecao-investimentos" className="inline-flex items-center px-3 py-1.5 bg-secondary rounded-md hover:opacity-90">Abrir projeção</Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}


