
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryChart } from '@/components/CategoryChart';
import { InvestmentForm } from '@/components/InvestmentForm';
import { TransactionTable } from '@/components/TransactionTable';
import { Pagination } from '@/components/Pagination';
import { CompactPeriodFilter } from '@/components/CompactPeriodFilter';
import { CompactHeader } from '@/components/CompactHeader';
 
import { TrendingUp, DollarSign, BarChart3, ListChecks, AlertCircle, Flame, Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, eachMonthOfInterval, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ITEMS_PER_PAGE = 10;
const PAGE_ID = 'investmentsPage';

export function InvestmentsPage() {
  const { investments, categories, accounts, addInvestment, updateInvestment, deleteInvestment, investmentGoal } = useFinance();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [investmentToEdit, setInvestmentToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const getInitialFilter = () => {
    const savedFilter = localStorage.getItem(`filter_${PAGE_ID}`);
    if (savedFilter) {
      const { periodType, dateRange, month, year } = JSON.parse(savedFilter);
      return {
        periodType: periodType || 'monthly',
        dateRange: dateRange ? { from: new Date(dateRange.from), to: dateRange.to ? new Date(dateRange.to) : undefined } : undefined,
        month: month !== undefined ? month : new Date().getMonth(),
        year: year !== undefined ? year : new Date().getFullYear(),
      };
    }
    return {
      periodType: 'monthly',
      dateRange: undefined,
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
    };
  };

  const [filter, setFilter] = useState(getInitialFilter);

  useEffect(() => {
    if(filter.dateRange) {
       setFilter(f => ({ ...f, periodType: 'monthly', month: undefined, year: undefined }));
    }
  }, [filter.dateRange]);

  useEffect(() => {
    localStorage.setItem(`filter_${PAGE_ID}`, JSON.stringify(filter));
  }, [filter]);

  const handleSetDateRange = (range) => {
    setFilter({ ...filter, dateRange: range });
  };
  
  const handleSetMonth = (month) => {
      setFilter({ dateRange: undefined, periodType: 'monthly', month, year: filter.year || new Date().getFullYear() });
  };

  const handleSetYear = (year) => {
      setFilter(f => ({ ...f, dateRange: undefined, year }));
  };

  const handleSetPeriodType = (type) => {
    setFilter(f => ({ ...f, periodType: type, dateRange: undefined }));
  };

  const investmentCategories = useMemo(() => categories.filter(c => c.tipo === 'investimento'), [categories]);

  const { filteredInvestments, totalInvested } = useMemo(() => {
    let filtered = [];
    let startDate, endDate;

    if (filter.dateRange && filter.dateRange.from) {
      startDate = filter.dateRange.from;
      endDate = filter.dateRange.to || filter.dateRange.from;
    } else if (filter.periodType === 'yearly' && filter.year) {
      startDate = startOfYear(new Date(filter.year, 0, 1));
      endDate = endOfYear(new Date(filter.year, 11, 31));
    } else if (filter.periodType === 'monthly' && filter.month !== undefined && filter.year) {
      startDate = startOfMonth(new Date(filter.year, filter.month, 1));
      endDate = endOfMonth(new Date(filter.year, filter.month, 1));
    }

    if (startDate && endDate) {
        endDate.setHours(23, 59, 59, 999);
        filtered = investments.filter(inv => {
            const invDate = parseISO(inv.data);
            return invDate >= startDate && invDate <= endDate;
        });
    }

    const total = filtered.reduce((sum, inv) => sum + inv.valor_aporte, 0);

    return { 
      filteredInvestments: filtered.sort((a, b) => new Date(b.data) - new Date(a.data)),
      totalInvested: total 
    };
  }, [investments, filter]);

  // Alerta no começo do mês quando há meta definida e ainda não houve aportes
  const showStartOfMonthAlert = useMemo(() => {
    const goal = Number(investmentGoal) || 0;
    if (!goal) return false;
    if (filter.periodType !== 'monthly') return false;
    const now = new Date();
    const isCurrentMonth = filter.year === now.getFullYear() && filter.month === now.getMonth();
    if (!isCurrentMonth) return false;
    return totalInvested === 0;
  }, [investmentGoal, filter, totalInvested]);

  // Streak de meses consecutivos batendo a meta (últimos 12 meses)
  const monthlyGoalStreak = useMemo(() => {
    const goal = Number(investmentGoal) || 0;
    if (!goal) return { streak: 0, series: [] };
    const last12 = eachMonthOfInterval({ start: subMonths(new Date(), 11), end: new Date() });
    const series = last12.map((monthDate) => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const invested = investments
        .filter((i) => {
          const d = parseISO(i.data);
          return d >= monthStart && d <= monthEnd;
        })
        .reduce((sum, i) => sum + i.valor_aporte, 0);
      return { label: format(monthDate, 'MMM/yy'), invested, achieved: invested >= goal };
    });
    let streak = 0;
    for (let i = series.length - 1; i >= 0; i--) {
      if (series[i].achieved) streak++; else break;
    }
    return { streak, series };
  }, [investments, investmentGoal]);

  const investmentsByCategoryChartData = useMemo(() => {
    if (filteredInvestments.length === 0) return [];

    const categoryMap = investmentCategories.reduce((acc, cat) => {
        acc[cat.id] = { categoryName: cat.nome, total: 0 };
        return acc;
    }, {});
    
    filteredInvestments.forEach(inv => {
        if (categoryMap[inv.categoria_id]) {
            categoryMap[inv.categoria_id].total += inv.valor_aporte;
        }
    });

    return Object.values(categoryMap).filter(cat => cat.total > 0).sort((a, b) => b.total - a.total);
  }, [filteredInvestments, investmentCategories]);

  const totalPages = Math.ceil(filteredInvestments.length / ITEMS_PER_PAGE);
  const paginatedInvestments = filteredInvestments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
 
  // Séries coerentes e KPIs simplificados
  const monthlySeries = useMemo(() => {
    const goal = Number(investmentGoal) || 0;
    const last6 = eachMonthOfInterval({ start: subMonths(new Date(), 5), end: new Date() });
    return last6.map((monthDate) => {
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);
      const invested = investments
        .filter((i) => {
          const d = parseISO(i.data);
          return d >= mStart && d <= mEnd;
        })
        .reduce((sum, i) => sum + i.valor_aporte, 0);
      return { label: format(monthDate, 'MMM/yy', { locale: ptBR }), invested, achieved: goal > 0 ? invested >= goal : false };
    });
  }, [investments, investmentGoal]);

  const momDelta = useMemo(() => {
    if (filter.periodType !== 'monthly' || filter.month === undefined || !filter.year) return null;
    const currentStart = startOfMonth(new Date(filter.year, filter.month, 1));
    const currentEnd = endOfMonth(new Date(filter.year, filter.month, 1));
    const prevDate = subMonths(currentStart, 1);
    const prevStart = startOfMonth(prevDate);
    const prevEnd = endOfMonth(prevDate);
    const current = investments.filter(i => {
      const d = parseISO(i.data);
      return d >= currentStart && d <= currentEnd;
    }).reduce((s, i) => s + i.valor_aporte, 0);
    const prev = investments.filter(i => {
      const d = parseISO(i.data);
      return d >= prevStart && d <= prevEnd;
    }).reduce((s, i) => s + i.valor_aporte, 0);
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  }, [investments, filter]);

  // Quantidade de meses no período selecionado (para meta acumulada e médias coerentes)
  const periodMonths = useMemo(() => {
    if (filter.dateRange && filter.dateRange.from) {
      const rangeMonths = eachMonthOfInterval({ start: startOfMonth(filter.dateRange.from), end: endOfMonth(filter.dateRange.to || filter.dateRange.from) });
      return rangeMonths.length;
    }
    if (filter.periodType === 'yearly' && filter.year) {
      const now = new Date();
      if (filter.year < now.getFullYear()) return 12;
      if (filter.year > now.getFullYear()) return 0;
      return now.getMonth() + 1; // meses já passados no ano corrente (jan=0)
    }
    if (filter.periodType === 'monthly' && filter.month !== undefined && filter.year) {
      return 1;
    }
    return 1;
  }, [filter]);

  // Meta acumulada no período
  const periodGoal = useMemo(() => {
    const monthlyGoal = Number(investmentGoal) || 0;
    return monthlyGoal > 0 ? monthlyGoal * periodMonths : 0;
  }, [investmentGoal, periodMonths]);
  
  const handleFormSubmit = async (formData, id) => {
    try {
      const category = investmentCategories.find(c => c.id === formData.categoria_id);
      const dataToSave = {
        ...formData,
        descricao: formData.descricao || `Aporte em ${category?.nome}`
      };

      if (id) {
        await updateInvestment(id, dataToSave);
        toast({ title: 'Aporte atualizado com sucesso!' });
      } else {
        await addInvestment(dataToSave);
        toast({ title: 'Aporte adicionado com sucesso!' });
      }
      setIsFormOpen(false);
      setInvestmentToEdit(null);
    } catch (error) {
      toast({ title: 'Erro ao salvar aporte', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (investment) => {
    setInvestmentToEdit({ ...investment, categories: investmentCategories });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteInvestment(id);
      toast({ title: 'Aporte excluído com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao excluir aporte', description: error.message, variant: 'destructive' });
    }
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleFormOpenChange = (open) => {
    if (!open) {
      setInvestmentToEdit(null);
    }
    setIsFormOpen(open);
  }

  return (
    <>
      <Helmet>
        <title>Gestão de Investimentos - FinanceApp</title>
        <meta name="description" content="Acompanhe seus aportes e metas de investimento." />
      </Helmet>
      <div className="space-y-4">
        <CompactHeader 
          title="Gestão de Investimentos"
          subtitle="Acompanhe seus aportes e metas de investimento"
          actionButton={
            <InvestmentForm
              onSubmit={handleFormSubmit}
              investmentToEdit={investmentToEdit}
              isOpen={isFormOpen}
              onOpenChange={handleFormOpenChange}
            />
          }
        >
          <CompactPeriodFilter 
            periodType={filter.periodType}
            setPeriodType={handleSetPeriodType}
            dateRange={filter.dateRange}
            setDateRange={handleSetDateRange}
            month={filter.month}
            setMonth={handleSetMonth}
            year={filter.year}
            setYear={handleSetYear}
          />
        </CompactHeader>
        
        <Tabs defaultValue="relatorio" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="relatorio" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" /> Relatório
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </TabsTrigger>
          </TabsList>
          <TabsContent value="relatorio" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seus Aportes</CardTitle>
                <CardDescription>
                    Lista de todos os aportes no período selecionado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paginatedInvestments.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                        <TrendingUp className="w-10 h-10 opacity-50" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-lg">Nenhum aporte encontrado</p>
                        <p className="text-sm max-w-md">
                          {filteredInvestments.length === 0 
                            ? "Você ainda não registrou nenhum aporte. Comece investindo hoje mesmo para construir seu patrimônio e alcançar a independência financeira!"
                            : "Não há aportes no período selecionado. Tente ajustar o filtro de período."
                          }
                        </p>
                      </div>
                      {filteredInvestments.length === 0 && (
                        <button
                          onClick={() => setIsFormOpen(true)}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Fazer Primeiro Aporte
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                    <TransactionTable
                      transactions={paginatedInvestments}
                      categories={investmentCategories}
                      accounts={accounts}
                      type="investment"
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                )}
                {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="dashboard" className="mt-6 space-y-6">
            {showStartOfMonthAlert && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    Começo de mês: ainda sem aportes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <p className="text-sm text-muted-foreground">
                      Faça um pequeno aporte agora para manter o ritmo e alcançar sua meta.
                    </p>
                    <button
                      onClick={() => setIsFormOpen(true)}
                      className="inline-flex items-center px-3 py-1.5 bg-primary text-white rounded-md hover:opacity-90"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" /> Registrar Aporte
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Aportado</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{totalInvested.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                  <p className="text-xs text-muted-foreground">Total de aportes no período selecionado.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Número de Aportes</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredInvestments.length}</div>
                  <p className="text-xs text-muted-foreground">Quantidade de aportes realizados.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aporte Médio</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredInvestments.length > 0 
                      ? (totalInvested / filteredInvestments.length).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      : "R$ 0,00"
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Valor médio por aporte.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Maior Aporte</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredInvestments.length > 0 
                      ? Math.max(...filteredInvestments.map(i => i.valor_aporte)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      : "R$ 0,00"
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Maior aporte do período.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" /> Progresso da Meta (período)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {periodGoal > 0 ? (
                    <>
                      <div className="text-2xl font-bold">{Math.min(100, Math.round((totalInvested / periodGoal) * 100))}%</div>
                      <p className="text-xs text-muted-foreground">R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {periodGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Defina uma meta mensal para acompanhar o progresso.</p>
                  )}
                </CardContent>
              </Card>
              {momDelta !== null && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Variação m/m</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${momDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>{momDelta.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">Comparado ao mês anterior.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Evolução de Aportes (12 meses)</CardTitle>
                <CardDescription>Meses com meta batida ficam destacados.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {monthlySeries.map((m, idx) => (
                    <div key={idx} className={`p-3 rounded-md border ${m.achieved ? 'bg-green-50 border-green-200' : 'bg-muted'}`}>
                      <div className="text-xs text-muted-foreground">{m.label}</div>
                      <div className="text-sm font-semibold mt-1">R$ {m.invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      {Number(investmentGoal) > 0 && (
                        <div className={`text-xs mt-1 ${m.achieved ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {m.achieved ? 'Meta batida' : 'Abaixo da meta'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {investmentsByCategoryChartData.length > 0 ? (
                <CategoryChart 
                  data={investmentsByCategoryChartData}
                  title="Divisão de Aportes por Categoria"
                  description="Análise percentual dos seus investimentos no período."
                />
              ) : (
                <div className="text-center text-muted-foreground py-12 bg-card border rounded-lg">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                      <BarChart3 className="w-10 h-10 opacity-50" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-lg">Nenhum dado de investimento por categoria.</p>
                      <p className="text-sm max-w-md">Registre seus aportes para ver a divisão por categoria.</p>
                    </div>
                  </div>
                </div>
              )}

              {accounts.length > 0 ? (
                <CategoryChart
                  data={accounts.map(acc => ({ 
                    categoryName: acc.nome_banco, 
                    total: Number(acc.saldo) || 0 
                  }))}
                  title="Patrimônio por Instituição"
                  description="Distribuição dos saldos nas suas instituições financeiras (incluindo dívidas)"
                />
              ) : (
                <div className="text-center text-muted-foreground py-12 bg-card border rounded-lg">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                      <BarChart3 className="w-10 h-10 opacity-50" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-lg">Nenhuma instituição registrada.</p>
                      <p className="text-sm max-w-md">Adicione suas instituições financeiras para visualizar a distribuição do patrimônio.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
