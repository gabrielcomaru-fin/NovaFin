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
import { PaymentMethodChart } from '@/components/charts/PaymentMethodChart';
import { SpendingPatternsChart } from '@/components/charts/SpendingPatternsChart';
import { CompactSearchFilter } from '@/components/CompactSearchFilter';
import { CompactHeader } from '@/components/CompactHeader';
import { OFXImportDialog } from '@/components/OFXImportDialog';
import { Receipt, DollarSign, BarChart3, ListChecks, ArrowUp, ArrowDown, CheckCircle2, Clock, Upload, CheckSquare, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, subMonths } from 'date-fns';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import { Button } from '@/components/ui/button';

const ITEMS_PER_PAGE = 10;
const PAGE_ID = 'expensesPage';

export function ExpensesPage() {
  const { expenses, categories, paymentMethods, addExpense, updateExpense, deleteExpense, toggleExpensePayment } = useFinance();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Estados para busca e filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all'); // 'all', 'paid', 'pending'
  const [sortBy, setSortBy] = useState('date-desc');

  // Importação OFX
  const [isImportOpen, setIsImportOpen] = useState(false);
  const expenseCategories = useMemo(() => categories.filter(c => c.tipo === 'gasto'), [categories]);

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

  // Handler para importação OFX
  const handleImportOFX = async (transactions) => {
    const results = [];
    for (const tx of transactions) {
      const result = await addExpense(tx);
      if (result?.id) {
        results.push(result);
      }
    }
    return results;
  };

  // Handler para desfazer importação OFX
  const handleUndoImportOFX = async (ids) => {
    for (const id of ids) {
      await deleteExpense(id);
    }
  };

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
    } else {
      // Se não há filtro de período, usar todas as despesas
      filtered = expenses;
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

    // Trend data (últimos 7 períodos) - sempre baseado em TODAS as despesas, não apenas as filtradas
    const trendMap = [];
    for (let i = 6; i >= 0; i--) {
      const date = filter.periodType === 'monthly'
        ? new Date(filter.year, filter.month - i, 1)
        : subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthExpenses = expenses.filter(exp => {
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

  // Seleção em lote na lista paginada
  const [selectedIds, setSelectedIds] = useState([]);
  const selectedCount = selectedIds.length;
  const handleSelectOne = (id, checked) => {
    setSelectedIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id));
  };
  const handleSelectAll = (ids, checked) => {
    setSelectedIds(checked ? Array.from(new Set([...selectedIds, ...ids])) : selectedIds.filter(id => !ids.includes(id)));
  };

  const handleBulkMarkPaid = async () => {
    if (selectedCount === 0) return;
    try {
      for (const id of selectedIds) {
        await toggleExpensePayment(id);
      }
      toast({ title: 'Atualização concluída', description: `${selectedCount} lançamento(s) atualizados` });
      setSelectedIds([]);
    } catch (error) {
      toast({ title: 'Erro ao atualizar em lote', description: error.message, variant: 'destructive' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;
    try {
      for (const id of selectedIds) {
        await deleteExpense(id);
      }
      toast({ title: 'Exclusão concluída', description: `${selectedCount} lançamento(s) excluídos` });
      setSelectedIds([]);
    } catch (error) {
      toast({ title: 'Erro ao excluir em lote', description: error.message, variant: 'destructive' });
    }
  };

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
            <div className="w-full md:w-auto flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsImportOpen(true)} className="flex items-center gap-2">
                <Upload className="h-4 w-4" /> Importar OFX
              </Button>
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
                {selectedCount > 0 && (
                  <div className="mb-2 flex items-center gap-2 text-sm">
                    <div className="text-muted-foreground">Selecionados: {selectedCount}</div>
                    <Button variant="outline" size="sm" onClick={handleBulkMarkPaid} className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4" /> Marcar como pago
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" /> Excluir
                    </Button>
                  </div>
                )}
                <TransactionTable
                  transactions={paginatedExpenses}
                  categories={expenseCategories}
                  paymentMethods={paymentMethods}
                  type="expense"
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTogglePayment={handleTogglePayment}
                  onUpdatePaymentMethod={updateExpense}
                  selectable
                  selectedIds={selectedIds}
                  onSelectOne={handleSelectOne}
                  onSelectAll={handleSelectAll}
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
            {filteredExpenses.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma despesa encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || selectedCategory !== 'all' || paymentStatus !== 'all' 
                      ? 'Tente ajustar os filtros para ver suas despesas.'
                      : 'Adicione algumas despesas para ver o dashboard completo.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* KPIs Principais - Visão Geral */}
                <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Gasto Total com Tendência */}
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
                  <p className="text-xs text-muted-foreground">
                    {trendData.length > 1 && trendData[trendData.length - 1] > trendData[trendData.length - 2] 
                      ? `+${((trendData[trendData.length - 1] - trendData[trendData.length - 2]) / trendData[trendData.length - 2] * 100).toFixed(1)}% vs anterior`
                      : trendData.length > 1 && trendData[trendData.length - 1] < trendData[trendData.length - 2]
                      ? `${((trendData[trendData.length - 1] - trendData[trendData.length - 2]) / trendData[trendData.length - 2] * 100).toFixed(1)}% vs anterior`
                      : 'Primeiro período'
                    }
                  </p>
                </CardContent>
              </Card>

              {/* Status de Pagamento */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status de Pagamento</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{currencyFormatter.format(totalPaid)}</div>
                  <div className="text-sm text-orange-600 font-medium">{currencyFormatter.format(totalPending)} pendente</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: totalSpent > 0 
                          ? `${(totalPaid / totalSpent) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totalSpent > 0 ? `${Math.round((totalPaid / totalSpent) * 100)}%` : '0%'} quitado
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    {filteredExpenses.length} transação{filteredExpenses.length !== 1 ? 'ões' : ''} registrada{filteredExpenses.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              {/* Maior Gasto */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Maior Gasto</CardTitle>
                  <ArrowUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {filteredExpenses.length > 0 
                      ? currencyFormatter.format(Math.max(...filteredExpenses.map(e => e.valor)))
                      : "R$ 0,00"
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {filteredExpenses.length > 0 
                      ? (() => {
                          const maxValue = Math.max(...filteredExpenses.map(exp => exp.valor));
                          const maxExpense = filteredExpenses.find(e => e.valor === maxValue);
                          return maxExpense?.descricao?.substring(0, 20) + (maxExpense?.descricao?.length > 20 ? '...' : '');
                        })()
                      : 'Nenhuma despesa'
                    }
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Análise por Meio de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Análise por Meio de Pagamento
                </CardTitle>
                <CardDescription>Como você está gastando seu dinheiro</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paymentMethods.map(paymentMethod => {
                    const expensesByPayment = filteredExpenses.filter(exp => exp.meio_pagamento_id === paymentMethod.id);
                    const totalByPayment = expensesByPayment.reduce((sum, exp) => sum + exp.valor, 0);
                    const percentage = totalSpent > 0 ? (totalByPayment / totalSpent) * 100 : 0;
                    
                    if (totalByPayment === 0) return null;

                    const getPaymentIcon = (tipo) => {
                      const iconMap = {
                        cartao_credito: '💳',
                        cartao_debito: '💳',
                        dinheiro: '💵',
                        pix: '📱',
                        transferencia: '🏦',
                        boleto: '📄',
                        outros: '💼',
                      };
                      return iconMap[tipo] || '💼';
                    };

                    return (
                      <div key={paymentMethod.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getPaymentIcon(paymentMethod.tipo)}</span>
                            <span className="font-medium">{paymentMethod.nome}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="text-2xl font-bold text-primary">{currencyFormatter.format(totalByPayment)}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                            className="h-2 rounded-full transition-all duration-300" 
                      style={{ 
                              width: `${percentage}%`,
                              backgroundColor: paymentMethod.cor || '#3b82f6'
                      }}
                    ></div>
                  </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {expensesByPayment.length} transação{expensesByPayment.length !== 1 ? 'ões' : ''}
                        </p>
                      </div>
                    );
                  })}
                </div>
                </CardContent>
              </Card>

            {/* Análise Temporal - Comparação de Períodos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Comparação Temporal
                </CardTitle>
                <CardDescription>Evolução dos seus gastos ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {trendData.slice(-3).map((period, index) => {
                    const isCurrent = index === trendData.slice(-3).length - 1;
                    const previousPeriod = trendData[trendData.length - 3 + index - 1];
                    const change = previousPeriod && previousPeriod > 0 ? ((period - previousPeriod) / previousPeriod) * 100 : 0;
                    
                    // Gerar nomes mais descritivos baseados na posição
                    const getPeriodName = (index, totalLength) => {
                      if (isCurrent) return 'Período Atual';
                      if (index === totalLength - 2) return 'Mês Anterior';
                      if (index === totalLength - 3) return 'Antepenúltimo Mês';
                      return `Mês ${totalLength - index}`;
                    };
                    
                    const maxValue = Math.max(...trendData.filter(v => v > 0));
                    const percentage = maxValue > 0 ? (period / maxValue) * 100 : 0;
                    
                    return (
                      <div key={index} className={`p-4 border rounded-lg ${isCurrent ? 'border-primary bg-primary/5' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {getPeriodName(index, trendData.slice(-3).length)}
                          </span>
                          {change !== 0 && !isNaN(change) && (
                            <span className={`text-xs ${change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {change > 0 ? '↗' : '↘'} {Math.abs(change).toFixed(1)}%
                            </span>
                          )}
            </div>
                        <div className="text-2xl font-bold">{currencyFormatter.format(period)}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: isCurrent ? '#3b82f6' : '#94a3b8'
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Insights e Recomendações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUp className="h-5 w-5 text-primary" />
                  Insights Financeiros
                </CardTitle>
                <CardDescription>Análises personalizadas dos seus gastos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Insight sobre meio de pagamento mais usado */}
                  {(() => {
                    const paymentTotals = paymentMethods.map(pm => ({
                      method: pm,
                      total: filteredExpenses.filter(exp => exp.meio_pagamento_id === pm.id).reduce((sum, exp) => sum + exp.valor, 0)
                    })).filter(pt => pt.total > 0).sort((a, b) => b.total - a.total);
                    
                    if (paymentTotals.length > 0) {
                      const mostUsed = paymentTotals[0];
                      const percentage = (mostUsed.total / totalSpent) * 100;
                      
                      return (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">💳</div>
                            <div>
                              <h4 className="font-medium text-blue-900">Meio de Pagamento Preferido</h4>
                              <p className="text-sm text-blue-700">
                                Você usa <strong>{mostUsed.method.nome}</strong> para {percentage.toFixed(1)}% dos seus gastos ({currencyFormatter.format(mostUsed.total)}).
                                {percentage > 70 && ' Considere diversificar seus meios de pagamento para melhor controle.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Insight sobre categoria com maior gasto */}
                  {(() => {
                    const categoryTotals = expenseCategories.map(cat => ({
                      category: cat,
                      total: filteredExpenses.filter(exp => exp.categoria_id === cat.id).reduce((sum, exp) => sum + exp.valor, 0)
                    })).filter(ct => ct.total > 0).sort((a, b) => b.total - a.total);
                    
                    if (categoryTotals.length > 0) {
                      const topCategory = categoryTotals[0];
                      const percentage = (topCategory.total / totalSpent) * 100;
                      
                      return (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">📊</div>
                            <div>
                              <h4 className="font-medium text-orange-900">Categoria com Maior Gasto</h4>
                              <p className="text-sm text-orange-700">
                                <strong>{topCategory.category.nome}</strong> representa {percentage.toFixed(1)}% dos seus gastos ({currencyFormatter.format(topCategory.total)}).
                                {percentage > 50 && ' Esta categoria está consumindo mais da metade do seu orçamento.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Insight sobre tendência */}
                  {trendData.length > 1 && (
                    <div className={`p-4 border rounded-lg ${
                      trendData[trendData.length - 1] > trendData[trendData.length - 2] 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {trendData[trendData.length - 1] > trendData[trendData.length - 2] ? '📈' : '📉'}
                        </div>
                        <div>
                          <h4 className={`font-medium ${
                            trendData[trendData.length - 1] > trendData[trendData.length - 2] 
                              ? 'text-red-900' 
                              : 'text-green-900'
                          }`}>
                            Tendência de Gastos
                          </h4>
                          <p className={`text-sm ${
                            trendData[trendData.length - 1] > trendData[trendData.length - 2] 
                              ? 'text-red-700' 
                              : 'text-green-700'
                          }`}>
                            {trendData[trendData.length - 1] > trendData[trendData.length - 2] 
                              ? `Seus gastos aumentaram ${((trendData[trendData.length - 1] - trendData[trendData.length - 2]) / trendData[trendData.length - 2] * 100).toFixed(1)}% em relação ao período anterior.`
                              : `Seus gastos diminuíram ${Math.abs((trendData[trendData.length - 1] - trendData[trendData.length - 2]) / trendData[trendData.length - 2] * 100).toFixed(1)}% em relação ao período anterior.`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gráficos de Análise */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
            {/* Gráfico por categoria (pizza) */}
            <CategoryBreakdownChart expenses={filteredExpenses} categories={categories} />
              
              {/* Gráfico por meio de pagamento */}
              <PaymentMethodChart expenses={filteredExpenses} paymentMethods={paymentMethods} />
            </div>

            {/* Análise de Padrões de Gastos */}
            <SpendingPatternsChart expenses={filteredExpenses} />

                {/* Tendência de Gastos (últimos meses - ignora filtros) */}
                <ExpenseTrendChart />
              </>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Modal de Importação OFX */}
        <OFXImportDialog
          isOpen={isImportOpen}
          onOpenChange={setIsImportOpen}
          type="expense"
          categories={expenseCategories}
          paymentMethods={paymentMethods}
          existingTransactions={expenses}
          onImport={handleImportOFX}
          onUndoImport={handleUndoImportOFX}
          onClose={() => setIsImportOpen(false)}
        />
      </div>
    </>
  );
}
