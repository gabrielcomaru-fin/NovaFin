import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { AnimatePresence } from 'framer-motion';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvestmentForm } from '@/components/InvestmentForm';
import { TransactionList } from '@/components/TransactionList';
import { Pagination } from '@/components/Pagination';
import { PeriodFilter } from '@/components/PeriodFilter';
import { CategoryChart } from '@/components/CategoryChart';
import { TrendingUp } from 'lucide-react';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

const ITEMS_PER_PAGE = 10;

export function InvestmentsPage() {
  const { investments, categories, addInvestment, updateInvestment, deleteInvestment } = useFinance();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [investmentToEdit, setInvestmentToEdit] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const investmentCategories = useMemo(() => categories.filter(c => c.tipo === 'investimento'), [categories]);

  const filteredInvestments = useMemo(() => {
    let filtered = investments;
     if (dateRange && dateRange.from) {
      const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
      toDate.setHours(23, 59, 59, 999);
      filtered = investments.filter(investment => {
        const investmentDate = new Date(parseISO(investment.data));
        return investmentDate >= dateRange.from && investmentDate <= toDate;
      });
    } else {
       filtered = investments.filter(investment => {
        const investmentDate = new Date(parseISO(investment.data));
        return investmentDate.getUTCMonth() === month && investmentDate.getUTCFullYear() === year;
      });
    }
    return filtered.sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [investments, dateRange, month, year]);

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
    } else {
        setInvestmentToEdit({ categories: investmentCategories });
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
          dateRange={dateRange}
          setDateRange={setDateRange}
          month={month}
          setMonth={setMonth}
          year={year}
          setYear={setYear}
        />
        
        {investmentsByCategoryChartData.length > 0 && (
          <CategoryChart 
            data={investmentsByCategoryChartData}
            title="Divisão de Aportes por Categoria"
            description="Análise percentual dos seus investimentos no período."
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Seus Aportes</CardTitle>
            <CardDescription>
                Lista de todos os aportes no período selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paginatedInvestments.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-semibold">Nenhum aporte encontrado.</p>
                  <p className="text-sm">Tente ajustar o filtro de período ou adicione um novo aporte.</p>
              </div>
            ) : (
                <AnimatePresence>
                  <TransactionList
                    transactions={paginatedInvestments}
                    categories={investmentCategories}
                    type="investment"
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