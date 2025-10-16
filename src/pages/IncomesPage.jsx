import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useToast } from '@/components/ui/use-toast';
import { usePersistentState } from '@/hooks/usePersistentState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IncomeForm } from '@/components/IncomeForm';
import { TransactionTable } from '@/components/TransactionTable';
import { Pagination } from '@/components/Pagination';
import { CompactPeriodFilter } from '@/components/CompactPeriodFilter';
import { CompactSearchFilter } from '@/components/CompactSearchFilter';
import { CompactHeader } from '@/components/CompactHeader';
import { DollarSign, BarChart3, ListChecks, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, subMonths } from 'date-fns';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import { Button } from '@/components/ui/button';
import { formatCurrencyBRL } from '@/lib/format';

const ITEMS_PER_PAGE = 10;
const PAGE_ID = 'incomesPage';

export function IncomesPage() {
  const { incomes, addIncome, updateIncome, deleteIncome, categories, accounts, paymentMethods } = useFinance();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [incomeToEdit, setIncomeToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Estados para busca e filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  const [filter, setFilter] = usePersistentState(`filter_${PAGE_ID}`, () => ({
    periodType: 'monthly',
    dateRange: undefined,
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  }));

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

  const { filteredIncomes, totalIncome, trendData, averageIncome, maxIncome } = useMemo(() => {
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
      filtered = incomes.filter(income => {
        const incomeDate = parseISO(income.data);
        return incomeDate >= startDate && incomeDate <= endDate;
      });
    }

    // Aplicar busca por descrição
    if (searchTerm) {
      filtered = filtered.filter(income =>
        income.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc': return new Date(a.data) - new Date(b.data);
        case 'date-desc': return new Date(b.data) - new Date(a.data);
        case 'value-asc': return a.valor - b.valor;
        case 'value-desc': return b.valor - a.valor;
        case 'description': return a.descricao.localeCompare(b.descricao);
        default: return new Date(b.data) - new Date(a.data);
      }
    });

    // Trend data (últimos 7 períodos)
    const trendMap = [];
    for (let i = 6; i >= 0; i--) {
      const date = filter.periodType === 'monthly'
        ? new Date(filter.year, filter.month - i, 1)
        : subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthIncomes = filtered.filter(income => {
        const incomeDate = parseISO(income.data);
        return incomeDate >= monthStart && incomeDate <= monthEnd;
      });
      trendMap.push(monthIncomes.reduce((sum, income) => sum + income.valor, 0));
    }

    const total = filtered.reduce((sum, income) => sum + income.valor, 0);
    const average = filtered.length > 0 ? total / filtered.length : 0;
    const max = filtered.length > 0 ? Math.max(...filtered.map(income => income.valor)) : 0;

    return {
      filteredIncomes: filtered,
      totalIncome: total,
      trendData: trendMap,
      averageIncome: average,
      maxIncome: max
    };
  }, [incomes, filter, searchTerm, sortBy]);

  const totalPages = Math.ceil(filteredIncomes.length / ITEMS_PER_PAGE);
  const paginatedIncomes = filteredIncomes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleFormSubmit = async (formData, id) => {
    try {
      if (id) {
        await updateIncome(id, formData);
        toast({ title: 'Receita atualizada com sucesso!' });
      } else {
        await addIncome(formData);
        toast({ title: 'Receita adicionada com sucesso!' });
      }
      setIsFormOpen(false);
      setIncomeToEdit(null);
    } catch (error) {
      toast({ title: 'Erro ao salvar receita', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (income) => {
    setIncomeToEdit(income);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteIncome(id);
      toast({ title: 'Receita excluída com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao excluir receita', description: error.message, variant: 'destructive' });
    }
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };

  const handleFormOpenChange = (open) => {
    if (!open) setIncomeToEdit(null);
    setIsFormOpen(open);
  };

  return (
    <>
      <Helmet>
        <title>Controle de Receitas - Lumify</title>
        <meta name="description" content="Adicione e gerencie suas receitas." />
      </Helmet>
      <div className="space-y-3 md:space-y-4 page-top">
        <CompactHeader 
          title="Controle de Receitas"
          subtitle="Gerencie suas receitas e acompanhe suas entradas financeiras"
          actionButton={
            <IncomeForm
              onSubmit={handleFormSubmit}
              incomeToEdit={incomeToEdit}
              isOpen={isFormOpen}
              onOpenChange={handleFormOpenChange}
            />
          }
        />

        <Tabs defaultValue="relatorio" className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList className="grid w-full md:w-auto grid-cols-2">
              <TabsTrigger value="relatorio" className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" /> Relatório
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Dashboard
              </TabsTrigger>
            </TabsList>
            <div className="w-full md:w-auto flex items-center gap-2">
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
            </div>
          </div>

          <TabsContent value="relatorio" className="mt-4 md:mt-5 space-y-4 md:space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Suas Receitas</CardTitle>
                <CardDescription>Lista de todas as receitas no período selecionado.</CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionTable
                  transactions={paginatedIncomes}
                  categories={categories}
                  accounts={accounts}
                  paymentMethods={paymentMethods}
                  type="income"
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
                {totalPages > 1 && (
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-4 md:mt-5 space-y-4 md:space-y-5">
            <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">

              {/* Total de Receitas */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrencyBRL(totalIncome)}</div>
                  <Sparklines data={trendData}>
                    <SparklinesLine color="#22c55e" />
                  </Sparklines>
                  <p className="text-xs text-muted-foreground">Total de receitas no período selecionado.</p>
                </CardContent>
              </Card>

              {/* Número de Receitas */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Número de Receitas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredIncomes.length}</div>
                  <Sparklines data={trendData.map((t, i) => filteredIncomes.length > 0 ? filteredIncomes.length / trendData.length : 0)}>
                    <SparklinesLine color="#3b82f6" />
                  </Sparklines>
                  <p className="text-xs text-muted-foreground">Quantidade de receitas registradas.</p>
                </CardContent>
              </Card>

              {/* Receita Média */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Média</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredIncomes.length > 0 ? formatCurrencyBRL(averageIncome) : "R$ 0,00"}
                  </div>
                  <Sparklines data={trendData.map(t => t / (filteredIncomes.length || 1))}>
                    <SparklinesLine color="#fbbf24" />
                  </Sparklines>
                  <p className="text-xs text-muted-foreground">Valor médio por receita.</p>
                </CardContent>
              </Card>

              {/* Maior Receita */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Maior Receita</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {filteredIncomes.length > 0 ? formatCurrencyBRL(maxIncome) : "R$ 0,00"}
                  </div>
                  <p className="text-xs text-muted-foreground">Maior valor recebido no período.</p>
                </CardContent>
              </Card>

            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
