import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { AnimatePresence } from 'framer-motion';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenseForm } from '@/components/ExpenseForm';
import { TransactionList } from '@/components/TransactionList';
import { Pagination } from '@/components/Pagination';
import { PeriodFilter } from '@/components/PeriodFilter';
import { CategoryChart } from '@/components/CategoryChart';
import { Receipt } from 'lucide-react';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

const ITEMS_PER_PAGE = 10;

export function ExpensesPage() {
  const { expenses, categories, addExpense, updateExpense, deleteExpense } = useFinance();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const expenseCategories = useMemo(() => categories.filter(c => c.tipo === 'gasto'), [categories]);

  const filteredExpenses = useMemo(() => {
    let filtered = expenses;
    if (dateRange && dateRange.from) {
      const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
      toDate.setHours(23, 59, 59, 999);
      filtered = expenses.filter(expense => {
        const expenseDate = new Date(parseISO(expense.data));
        return expenseDate >= dateRange.from && expenseDate <= toDate;
      });
    } else {
       filtered = expenses.filter(expense => {
        const expenseDate = new Date(parseISO(expense.data));
        return expenseDate.getUTCMonth() === month && expenseDate.getUTCFullYear() === year;
      });
    }
    return filtered.sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [expenses, dateRange, month, year]);
  
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

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const handleFormOpenChange = (open) => {
    if (!open) {
      setExpenseToEdit(null);
    } else {
      setExpenseToEdit({ categories: expenseCategories });
    }
    setIsFormOpen(open);
  }

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
          dateRange={dateRange}
          setDateRange={setDateRange}
          month={month}
          setMonth={setMonth}
          year={year}
          setYear={setYear}
        />

        {expensesByCategoryChartData.length > 0 && (
          <CategoryChart 
            data={expensesByCategoryChartData}
            title="Divisão de Despesas por Categoria"
            description="Análise percentual dos seus gastos no período."
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Suas Despesas</CardTitle>
            <CardDescription>
                Lista de todas as despesas no período selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paginatedExpenses.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-semibold">Nenhuma despesa encontrada.</p>
                <p className="text-sm">Tente ajustar o filtro de período ou adicione uma nova despesa.</p>
              </div>
            ) : (
                <AnimatePresence>
                  <TransactionList
                    transactions={paginatedExpenses}
                    categories={expenseCategories}
                    type="expense"
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </AnimatePresence>
            )}
            {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}
          </CardContent>
        </Card>
      </div>
    </>
  );
}