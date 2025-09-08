
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvestmentForm } from '@/components/InvestmentForm';
import { TransactionTable } from '@/components/TransactionTable';
import { Pagination } from '@/components/Pagination';
import { PeriodFilter } from '@/components/PeriodFilter';
import { CategoryChart } from '@/components/CategoryChart';
import { TrendingUp, DollarSign, BarChart3, ListChecks } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns';

const ITEMS_PER_PAGE = 10;
const PAGE_ID = 'investmentsPage';

export function InvestmentsPage() {
  const { investments, categories, addInvestment, updateInvestment, deleteInvestment } = useFinance();
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
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Gestão de Investimentos</h1>
            <InvestmentForm
                onSubmit={handleFormSubmit}
                investmentToEdit={investmentToEdit}
                isOpen={isFormOpen}
                onOpenChange={handleFormOpenChange}
            />
        </div>

        <PeriodFilter 
            periodType={filter.periodType}
            setPeriodType={handleSetPeriodType}
            dateRange={filter.dateRange}
            setDateRange={handleSetDateRange}
            month={filter.month}
            setMonth={handleSetMonth}
            year={filter.year}
            setYear={handleSetYear}
          />
        
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
            </div>

            {investmentsByCategoryChartData.length > 0 ? (
              <CategoryChart 
                data={investmentsByCategoryChartData}
                title="Divisão de Aportes por Categoria"
                description="Análise percentual dos seus investimentos no período."
              />
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                    <BarChart3 className="w-10 h-10 opacity-50" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-lg">Nenhum dado de investimento para o dashboard.</p>
                    <p className="text-sm max-w-md">
                      Registre seus aportes para visualizar gráficos e insights detalhados aqui.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
