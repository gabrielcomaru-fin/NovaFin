import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useToast } from '@/components/ui/use-toast';
import { usePersistentState } from '@/hooks/usePersistentState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenseForm } from '@/components/ExpenseForm';
import { TransactionTable } from '@/components/TransactionTable';
import { Pagination } from '@/components/Pagination';
import { CompactPeriodFilter } from '@/components/CompactPeriodFilter';
import { CategoryBreakdownChart } from '@/components/charts/CategoryBreakdownChart';
import { ExpenseTrendChart } from '@/components/charts/ExpenseTrendChart';
import { CompactSearchFilter } from '@/components/CompactSearchFilter';
import { CompactHeader } from '@/components/CompactHeader';
import { Receipt, DollarSign, BarChart3, ListChecks, ArrowUp, ArrowDown, CheckCircle2, Clock } from 'lucide-react';
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

  // Estados para busca e filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all'); // 'all', 'paid', 'pending'
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

    // Aplicar busca por descrição
    if (searchTerm) {
      filtered = filtered.filter(exp =>
        exp.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exp => exp.categoria_id === selectedCategory);
    }

    // Aplicar filtro por status de pagamento
    if (paymentStatus !== 'all') {
      filtered = filtered.filter(exp => {
        if (paymentStatus === 'paid') return exp.pago === true;
        if (paymentStatus === 'pending') return exp.pago === false;
        return true;
      });
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
      const monthExpenses = filtered.filter(exp => {
        const expDate = parseISO(exp.data);
        return expDate >= monthStart && expDate <= monthEnd;
      });
      trendMap.push(monthExpenses.reduce((sum, exp) => sum + exp.valor, 0));
    }

    const total = filtered.reduce((sum, exp) => sum + exp.valor, 0);
    
    // Separar despesas pagas e pendentes
    const paid = filtered.filter(exp => exp.pago === true);
    const pending = filtered.filter(exp => exp.pago === false);
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
        <title>Controle de Despesas - Lumify</title>
        <meta name="description" content="Adicione e gerencie suas despesas." />
      </Helmet>
      <div className="space-y-3 md:space-y-4 page-top">
        <CompactHeader 
          title="Controle de Despesas"
          subtitle="Gerencie suas despesas e acompanhe seus gastos"
          actionButton={
            <ExpenseForm
              onSubmit={handleFormSubmit}
              expenseToEdit={expenseToEdit}
              isOpen={isFormOpen}
              onOpenChange={handleFormOpenChange}
            />
          }
        >
        </CompactHeader>

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
            <div className="w-full md:w-auto">
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
                <CardTitle>Suas Despesas</CardTitle>
                <CardDescription>Lista de todas as despesas no período selecionado.</CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionTable
                  transactions={paginatedExpenses}
                  categories={expenseCategories}
                  type="expense"
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTogglePayment={handleTogglePayment}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  paymentStatus={paymentStatus}
                  onPaymentStatusChange={setPaymentStatus}
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

              {/* Despesas Pagas */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Despesas Pagas</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
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
                  <Clock className="h-4 w-4 text-orange-600" />
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
                  <Sparklines data={trendData.map((t, i) => filteredExpenses.length > 0 ? filteredExpenses.length / trendData.length : 0)}>
                    <SparklinesLine color="#3b82f6" />
                  </Sparklines>
                  <p className="text-xs text-muted-foreground">Quantidade de despesas registradas.</p>
                </CardContent>
              </Card>

              {/* Despesa Média */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Despesa Média</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredExpenses.length > 0 ? currencyFormatter.format(totalSpent / filteredExpenses.length) : "R$ 0,00"}
                  </div>
                  <Sparklines data={trendData.map(t => t / (filteredExpenses.length || 1))}>
                    <SparklinesLine color="#fbbf24" />
                  </Sparklines>
                  <p className="text-xs text-muted-foreground">Valor médio por despesa.</p>
                </CardContent>
              </Card>

              {/* Taxa de Quitação */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Quitação</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredExpenses.length > 0 
                      ? `${Math.round((paidExpenses.length / filteredExpenses.length) * 100)}%`
                      : "0%"}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: filteredExpenses.length > 0 
                          ? `${(paidExpenses.length / filteredExpenses.length) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">Percentual de despesas quitadas.</p>
                </CardContent>
              </Card>

            </div>

            {/* Tendência de Gastos (últimos meses) */}
            <ExpenseTrendChart expenses={filteredExpenses} categories={expenseCategories} />

            {/* Gráfico por categoria (pizza) */}
            <CategoryBreakdownChart expenses={filteredExpenses} categories={categories} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
