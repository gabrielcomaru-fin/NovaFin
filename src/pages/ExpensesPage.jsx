import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenseForm } from '@/components/ExpenseForm';
import { TransactionTable } from '@/components/TransactionTable';
import { Pagination } from '@/components/Pagination';
import { PeriodFilter } from '@/components/PeriodFilter';
import { CategoryChart } from '@/components/CategoryChart';
import { SearchFilter } from '@/components/SearchFilter';
import { Receipt, DollarSign, BarChart3, ListChecks, CheckCircle, Circle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, subMonths } from 'date-fns';
import { Sparklines, SparklinesLine } from 'react-sparklines';

const ITEMS_PER_PAGE = 10;
const PAGE_ID = 'expensesPage';

export function ExpensesPage() {
  const { expenses, categories, addExpense, updateExpense, deleteExpense, toggleExpensePayment } = useFinance();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all'); // 'all', 'paid', 'pending'
  const [sortBy, setSortBy] = useState('date-desc');

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

  const expenseCategories = useMemo(() => categories.filter(c => c.tipo === 'gasto'), [categories]);

  const { filteredExpenses, totalSpent, trendData, paidExpenses, pendingExpenses, totalPaid, totalPending } = useMemo(() => {
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
      filtered = expenses.filter(expense => {
        const expenseDate = parseISO(expense.data);
        return expenseDate >= startDate && expenseDate <= endDate;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(exp =>
        exp.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exp => exp.categoria_id === selectedCategory);
    }

    if (paymentStatus !== 'all') {
      filtered = filtered.filter(exp => {
        if (paymentStatus === 'paid') return exp.is_paid === true;
        if (paymentStatus === 'pending') return exp.is_paid === false;
        return true;
      });
    }

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

    const trendMap = [];
    for (let i = 6; i >= 0; i--) {
      const date = filter.periodType === 'monthly'
        ? new Date(filter.year, filter.month - i, 1)
        : subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthExpenses = filtered.filter(exp => {
        const expDate = parseISO(exp.data);
        return expDate >= monthStart && expDate <= monthEnd;
      });
      trendMap.push(monthExpenses.reduce((sum, exp) => sum + exp.valor, 0));
    }

    const total = filtered.reduce((sum, exp) => sum + exp.valor, 0);

    const paid = filtered.filter(exp => exp.is_paid === true);
    const pending = filtered.filter(exp => exp.is_paid === false);
    const totalPaidAmount = paid.reduce((sum, exp) => sum + exp.valor, 0);
    const totalPendingAmount = pending.reduce((sum, exp) => sum + exp.valor, 0);

    return {
      filteredExpenses: filtered,
      totalSpent: total,
      trendData: trendMap,
      paidExpenses: paid,
      pendingExpenses: pending,
      totalPaid: totalPaidAmount,
      totalPending: totalPendingAmount
    };
  }, [expenses, filter, searchTerm, selectedCategory, paymentStatus, sortBy]);

  const expensesByCategoryChartData = useMemo(() => {
    if (filteredExpenses.length === 0) return [];

    const categoryMap = expenseCategories.reduce((acc, cat) => {
      acc[cat.id] = { categoryName: cat.nome, total: 0 };
      return acc;
    }, {});

    filteredExpenses.forEach(exp => {
      if (categoryMap[exp.categoria_id]) {
        categoryMap[exp.categoria_id].total += exp.valor;
      }
    });

    return Object.values(categoryMap).filter(cat => cat.total > 0).sort((a, b) => b.total - a.total);
  }, [filteredExpenses, expenseCategories]);

  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleFormSubmit = async (formData, id) => {
    try {
      if (id) {
        await updateExpense(id, formData);
        toast({ title: 'Despesa atualizada com sucesso!' });
      } else {
        await addExpense(formData);
        toast({ title: 'Despesa adicionada com sucesso!' });
      }
      setIsFormOpen(false);
      setExpenseToEdit(null);
    } catch (error) {
      toast({ title: 'Erro ao salvar despesa', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (expense) => {
    setExpenseToEdit({ ...expense, categories: expenseCategories });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteExpense(id);
      toast({ title: 'Despesa excluída com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao excluir despesa', description: error.message, variant: 'destructive' });
    }
  };

  const handleTogglePayment = async (id) => {
    try {
      await toggleExpensePayment(id);
      toast({ title: 'Status de pagamento atualizado!' });
    } catch (error) {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    }
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };

  const handleFormOpenChange = (open) => {
    if (!open) setExpenseToEdit(null);
    setIsFormOpen(open);
  };

  const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <>
      <Helmet>
        <title>Controle de Despesas - FinanceApp</title>
        <meta name="description" content="Adicione e gerencie suas despesas." />
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Controle de Despesas</h1>
          <ExpenseForm
            onSubmit={handleFormSubmit}
            expenseToEdit={expenseToEdit}
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList className="grid w-full md:w-auto grid-cols-2">
              <TabsTrigger value="relatorio" className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" /> Relatório
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Dashboard
              </TabsTrigger>
            </TabsList>
            <SearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              categories={expenseCategories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              paymentStatus={paymentStatus}
              onPaymentStatusChange={setPaymentStatus}
              sortBy={sortBy}
              onSortChange={setSortBy}
              placeholder="Buscar por descrição..."
              showPaymentFilter={true}
            />
          </div>

          <TabsContent value="relatorio" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Suas Despesas</CardTitle>
                <CardDescription>Lista de todas as despesas no período selecionado.</CardDescription>
              </CardHeader>
              <CardContent>
                {paginatedExpenses.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                        <Receipt className="w-10 h-10 opacity-50" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-lg">Nenhuma despesa encontrada</p>
                        <p className="text-sm max-w-md">
                          {filteredExpenses.length === 0
                            ? 'Você ainda não registrou nenhuma despesa. Comece adicionando sua primeira despesa!'
                            : 'Não há despesas no período selecionado. Ajuste o filtro de período.'}
                        </p>
                      </div>
                      {filteredExpenses.length === 0 && (
                        <button
                          onClick={() => setIsFormOpen(true)}
                          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                          <Receipt className="w-4 h-4 mr-2" /> Adicionar Primeira Despesa
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <TransactionTable
                      transactions={paginatedExpenses}
                      categories={expenseCategories}
                      type="expense"
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onTogglePayment={handleTogglePayment}
                    />
                    {totalPages > 1 && (
                      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

              {/* Despesas Pagas */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Despesas Pagas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{currencyFormatter.format(totalPaid)}</div>
                  <p className="text-xs text-muted-foreground">
                    {paidExpenses.length} despesa{paidExpenses.length !== 1 ? 's' : ''} quitada{paidExpenses.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              {/* Despesas Pendentes */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Despesas Pendentes</CardTitle>
                  <Circle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{currencyFormatter.format(totalPending)}</div>
                  <p className="text-xs text-muted-foreground">
                    {pendingExpenses.length} despesa{pendingExpenses.length !== 1 ? 's' : ''} pendente{pendingExpenses.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              {/* Gasto Total */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{currencyFormatter.format(totalSpent)}</div>
                  <Sparklines data={trendData}>
                    <SparklinesLine color="#f87171" />
                  </Sparklines>
                  <p className="text-xs text-muted-foreground">Total de despesas no período selecionado.</p>
                </CardContent>
              </Card>

              {/* Número de Despesas */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Número de Despesas</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredExpenses.length}</div>
                  <Sparklines data={trendData.map((t, i) => filteredExpenses.length > 0 ? filteredExpenses.length / 7 : 0)}>
                    <SparklinesLine color="#60a5fa" />
                  </Sparklines>
                  <p className="text-xs text-muted-foreground">Número de despesas registradas no período.</p>
                </CardContent>
              </Card>

            </div>

            <CategoryChart title="Gastos por Categoria" data={expensesByCategoryChartData} />

          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
