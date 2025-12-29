
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useToast } from '@/components/ui/use-toast';
import { usePersistentState } from '@/hooks/usePersistentState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CategoryChart } from '@/components/CategoryChart';
import { InvestmentForm } from '@/components/InvestmentForm';
import { TransactionTable } from '@/components/TransactionTable';
import { Pagination } from '@/components/Pagination';
import { CompactPeriodFilter } from '@/components/CompactPeriodFilter';
import { CompactSearchFilter } from '@/components/CompactSearchFilter';
import { CompactHeader } from '@/components/CompactHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { parseOfxFile } from '@/lib/ofx';

import { TrendingUp, DollarSign, BarChart3, ListChecks, AlertCircle, Flame, Target, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, eachMonthOfInterval, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useGamification } from '@/contexts/GamificationContext';

const ITEMS_PER_PAGE = 10;
const PAGE_ID = 'investmentsPage';

export function InvestmentsPage() {
  const { investments, categories, accounts, addInvestment, updateInvestment, deleteInvestment, investmentGoal } = useFinance();
  const { toast } = useToast();
  const { addPoints, registerAction, evaluateAchievements, setMetaMonthHit } = useGamification();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [investmentToEdit, setInvestmentToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('relatorio');

  // Estados para busca e filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  // Importação OFX para investimentos
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [ofxTransactions, setOfxTransactions] = useState([]);
  const [perTxCategories, setPerTxCategories] = useState({});
  const [perTxDescriptions, setPerTxDescriptions] = useState({});
  const [perTxInstitutions, setPerTxInstitutions] = useState({});
  const [duplicatesFound, setDuplicatesFound] = useState([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateDecisions, setDuplicateDecisions] = useState({});
  const investmentCategories = useMemo(() => categories.filter(c => c.tipo === 'investimento'), [categories]);
  const defaultCategoryId = investmentCategories[0]?.id || '';
  const defaultInstitutionId = accounts[0]?.id || '';
  const [importCategoryId, setImportCategoryId] = useState(defaultCategoryId);
  const [importInstitutionId, setImportInstitutionId] = useState(defaultInstitutionId);
  const fileInputId = 'ofx-investments-file-input';

  // Filtro persistente, alinhado ao ExpensesPage
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

  // Reset de página ao alterar filtros/busca/ordenação/aba
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy, filter, activeTab]);

  useEffect(() => {
    if (!importCategoryId && defaultCategoryId) setImportCategoryId(defaultCategoryId);
  }, [defaultCategoryId, importCategoryId]);

  useEffect(() => {
    if (!importInstitutionId && defaultInstitutionId) setImportInstitutionId(defaultInstitutionId);
  }, [defaultInstitutionId, importInstitutionId]);

  const checkForInvestmentDuplicates = (ofxTxs) => {
    const duplicates = [];

    ofxTxs.forEach((ofxTx, ofxIndex) => {
      const ofxDate = ofxTx.data;
      const ofxDescription = ofxTx.descricao?.toLowerCase().trim() || '';
      const ofxValue = Number(ofxTx.valor) || 0;

      const duplicate = investments.find(investment => {
        const invDate = investment.data;
        const invDescription = investment.descricao?.toLowerCase().trim() || '';
        const invValue = Number(investment.valor_aporte) || 0;

        return invDate === ofxDate &&
          invDescription === ofxDescription &&
          Math.abs(invValue - ofxValue) < 0.01;
      });

      if (duplicate) {
        duplicates.push({
          ofxIndex,
          ofxTransaction: ofxTx,
          existingInvestment: duplicate,
        });
      }
    });

    return duplicates;
  };

  const handleOfxSelectClick = () => {
    const el = document.getElementById(fileInputId);
    if (el) el.click();
  };

  const handleOfxFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const txs = await parseOfxFile(file);
      // Considera como aportes: saídas (valores negativos) ou tipo DEBIT
      const investmentTxs = txs
        .filter(t => (t.valor < 0) || (String(t.tipo).toUpperCase() === 'DEBIT'))
        .map(t => ({ ...t, valor: Math.abs(t.valor) }));

      if (investmentTxs.length === 0) {
        toast({
          title: 'Nenhum aporte encontrado no OFX',
          description: 'Verifique se o arquivo contém lançamentos de saída relacionados a investimentos.',
          variant: 'destructive',
        });
        e.target.value = '';
        return;
      }

      const duplicates = checkForInvestmentDuplicates(investmentTxs);
      setDuplicatesFound(duplicates);
      setDuplicateDecisions({});

      setOfxTransactions(investmentTxs);
      setPerTxCategories({});
      setPerTxDescriptions(
        investmentTxs.reduce((acc, t, idx) => {
          acc[idx] = t.descricao || 'Aporte OFX';
          return acc;
        }, {})
      );
      setPerTxInstitutions({});

      if (duplicates.length > 0) {
        setShowDuplicateDialog(true);
      } else {
        setIsImportOpen(true);
      }
    } catch (err) {
      toast({
        title: 'Falha ao ler OFX',
        description: err?.message || 'Formato inválido.',
        variant: 'destructive',
      });
    } finally {
      // permite selecionar o mesmo arquivo novamente, se necessário
      e.target.value = '';
    }
  };

  const handleConfirmImport = async () => {
    // Necessário ter pelo menos uma categoria e instituição (global ou por linha)
    const hasAnyCategory = ofxTransactions.some((_, idx) => perTxCategories[idx]) || !!importCategoryId;
    const hasAnyInstitution = ofxTransactions.some((_, idx) => perTxInstitutions[idx]) || !!importInstitutionId;

    if (!hasAnyCategory || !hasAnyInstitution) {
      toast({
        title: 'Selecione categoria e instituição',
        description: 'Defina ao menos a categoria e a instituição padrão ou por item.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    try {
      let success = 0;
      let skipped = 0;

      for (let i = 0; i < ofxTransactions.length; i++) {
        const t = ofxTransactions[i];

        const duplicate = duplicatesFound.find(d => d.ofxIndex === i);
        if (duplicate && duplicateDecisions[i] === 'skip') {
          skipped++;
          continue;
        }

        const categoria_id = perTxCategories[i] || importCategoryId;
        const instituicao_id = perTxInstitutions[i] || importInstitutionId;
        if (!categoria_id || !instituicao_id) continue;

        const payload = {
          descricao: perTxDescriptions[i] ?? t.descricao ?? 'Aporte OFX',
          valor_aporte: Number(t.valor) || 0,
          categoria_id,
          instituicao_id,
          data: t.data || new Date().toISOString().split('T')[0],
        };

        try {
          await addInvestment(payload);
          success++;
        } catch (e) {
          // continua para o próximo
        }
      }

      let message = `${success} aportes adicionados`;
      if (skipped > 0) {
        message += `, ${skipped} duplicatas ignoradas`;
      }

      toast({ title: 'Importação concluída', description: message });
      setIsImportOpen(false);
      setOfxTransactions([]);
      setPerTxCategories({});
      setPerTxDescriptions({});
      setPerTxInstitutions({});
      setDuplicatesFound([]);
      setDuplicateDecisions({});
    } catch (e) {
      toast({
        title: 'Erro na importação',
        description: e?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDuplicateDecision = (ofxIndex, decision) => {
    setDuplicateDecisions(prev => ({
      ...prev,
      [ofxIndex]: decision,
    }));
  };

  const handleProceedWithDuplicates = () => {
    const keptTransactions = [];
    const keptDescriptions = {};
    const keptCategories = {};
    const keptInstitutions = {};

    ofxTransactions.forEach((tx, idx) => {
      const isDuplicate = duplicatesFound.some(d => d.ofxIndex === idx);
      const decision = duplicateDecisions[idx];
      if (isDuplicate && decision === 'skip') {
        return;
      }
      const newIndex = keptTransactions.length;
      keptTransactions.push(tx);
      if (perTxDescriptions[idx] != null) keptDescriptions[newIndex] = perTxDescriptions[idx];
      if (perTxCategories[idx] != null) keptCategories[newIndex] = perTxCategories[idx];
      if (perTxInstitutions[idx] != null) keptInstitutions[newIndex] = perTxInstitutions[idx];
    });

    setOfxTransactions(keptTransactions);
    setPerTxDescriptions(keptDescriptions);
    setPerTxCategories(keptCategories);
    setPerTxInstitutions(keptInstitutions);

    setDuplicatesFound([]);
    setDuplicateDecisions({});
    setShowDuplicateDialog(false);
    setIsImportOpen(true);
  };

  const handleSkipAllDuplicates = () => {
    const skipDecisions = {};
    duplicatesFound.forEach(dup => {
      skipDecisions[dup.ofxIndex] = 'skip';
    });
    setDuplicateDecisions(skipDecisions);
  };

  const handleImportAllDuplicates = () => {
    const importDecisions = {};
    duplicatesFound.forEach(dup => {
      importDecisions[dup.ofxIndex] = 'import';
    });
    setDuplicateDecisions(importDecisions);
  };

  const { filteredInvestments, totalInvested } = useMemo(() => {
    let filtered = [];
    let startDate, endDate;

    if (filter.dateRange && filter.dateRange.from) {
      // Garantir que as datas sejam objetos Date (podem vir como string do localStorage)
      startDate = filter.dateRange.from instanceof Date 
        ? filter.dateRange.from 
        : new Date(filter.dateRange.from);
      const toDate = filter.dateRange.to || filter.dateRange.from;
      endDate = toDate instanceof Date 
        ? new Date(toDate) // Criar cópia para não modificar o original
        : new Date(toDate);
    } else if (filter.periodType === 'yearly' && filter.year) {
      startDate = startOfYear(new Date(filter.year, 0, 1));
      endDate = endOfYear(new Date(filter.year, 11, 31));
    } else if (filter.periodType === 'monthly' && filter.month !== undefined && filter.year) {
      startDate = startOfMonth(new Date(filter.year, filter.month, 1));
      endDate = endOfMonth(new Date(filter.year, filter.month, 1));
    }

    if (startDate && endDate) {
        // Criar cópia para não modificar o original
        endDate = new Date(endDate);
        endDate.setHours(23, 59, 59, 999);
        filtered = investments.filter(inv => {
            const invDate = parseISO(inv.data);
            return invDate >= startDate && invDate <= endDate;
        });
    }

    // Aplicar busca por descrição (apenas no Relatório)
    if (activeTab === 'relatorio' && searchTerm) {
      filtered = filtered.filter(inv =>
        inv.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(inv => inv.categoria_id === selectedCategory);
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc': return new Date(a.data) - new Date(b.data);
        case 'date-desc': return new Date(b.data) - new Date(a.data);
        case 'value-asc': return a.valor_aporte - b.valor_aporte;
        case 'value-desc': return b.valor_aporte - a.valor_aporte;
        case 'description': return a.descricao.localeCompare(b.descricao);
        default: return new Date(b.data) - new Date(a.data);
      }
    });

    const total = filtered.reduce((sum, inv) => sum + inv.valor_aporte, 0);

    return { 
      filteredInvestments: filtered,
      totalInvested: total 
    };
  }, [investments, filter, searchTerm, selectedCategory, sortBy, activeTab]);

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
        // Gamificação: pontos por novo aporte
        const aporteValor = Number(dataToSave.valor_aporte) || 0;
        const base = 10;
        const bonus = Math.min(40, Math.floor(aporteValor / 100)); // +1 ponto a cada R$100 até +40
        addPoints(base + bonus, 'novo_aporte');
        registerAction('deposit', { amount: aporteValor });
        // Atualiza badge de meta do mês
        const newTotal = totalInvested + aporteValor;
        const hit = periodGoal > 0 && newTotal >= periodGoal;
        setMetaMonthHit(hit);
        // Para conquistas de streak mensal, deixamos para o painel calcular via dados financeiros
        evaluateAchievements({ monthlyStreak: undefined });
        if (hit) {
          toast({ title: 'Meta do período alcançada! 🎯', description: 'Conquista liberada e pontos adicionados.' });
        }
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
  };

  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <>
      <Helmet>
        <title>Gestão de Investimentos - Lumify</title>
        <meta name="description" content="Acompanhe seus aportes e metas de investimento." />
      </Helmet>
      <div className="space-y-4 md:space-y-5 page-top">
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
        </CompactHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              <input
                id={fileInputId}
                type="file"
                accept=".ofx,.qfx,.ofc,.xml,.txt"
                className="hidden"
                onChange={handleOfxFileChange}
              />
              <Button
                variant="outline"
                onClick={handleOfxSelectClick}
                className="flex items-center gap-2"
              >
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
                <CardTitle>Seus Aportes</CardTitle>
                <CardDescription>
                    Lista de todos os aportes no período selecionado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionTable
                  transactions={paginatedInvestments}
                  categories={investmentCategories}
                  accounts={accounts}
                  type="investment"
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
                {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="dashboard" className="mt-4 md:mt-5 space-y-4 md:space-y-5">
            {showStartOfMonthAlert && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning" />
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
            <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Aportado</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-income">{totalInvested.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
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
                      <div className="text-2xl font-bold">{Math.round((totalInvested / periodGoal) * 100)}%</div>
                      <p className="text-xs text-muted-foreground">
                        R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {periodGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        {totalInvested > periodGoal && (
                          <span className="block text-green-600 font-medium">
                            R$ {(totalInvested - periodGoal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} além da meta! 🎉
                          </span>
                        )}
                      </p>
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
                    <div className={`text-2xl font-bold ${momDelta >= 0 ? 'text-income' : 'text-expense'}`}>{momDelta.toFixed(1)}%</div>
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
                    <div key={idx} className={`p-3 rounded-md border ${m.achieved ? 'bg-success-muted border-success' : 'bg-muted'}`}>
                      <div className="text-xs text-muted-foreground">{m.label}</div>
                      <div className="text-sm font-semibold mt-1">R$ {m.invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      {Number(investmentGoal) > 0 && (
                        <div className={`text-xs mt-1 ${m.achieved ? 'text-success' : 'text-muted-foreground'}`}>
                          {m.achieved ? 'Meta batida' : 'Abaixo da meta'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
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

        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Importar aportes do OFX</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                  {ofxTransactions.length} lançamento{ofxTransactions.length !== 1 ? 's' : ''} de aporte
                  encontrados.
                </div>
                <div className="text-sm font-medium">
                  Total a importar:{' '}
                  {currencyFormatter.format(
                    ofxTransactions.reduce(
                      (s, t) => s + (Number(t.valor) || 0),
                      0
                    )
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Categoria para os aportes</label>
                  <Select
                    value={importCategoryId || undefined}
                    onValueChange={setImportCategoryId}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {investmentCategories.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Instituição financeira</label>
                  <Select
                    value={importInstitutionId || undefined}
                    onValueChange={setImportInstitutionId}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione a instituição" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={String(acc.id)}>
                          {acc.nome_banco}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Revise as descrições, categorias e instituições. Valores negativos são tratados como
                aportes (saídas da conta corrente).
              </div>
              <div className="max-h-[60vh] overflow-auto border rounded-md">
                <div className="grid grid-cols-12 gap-2 p-2 text-xs text-muted-foreground border-b">
                  <div className="col-span-4">Descrição</div>
                  <div className="col-span-2">Data</div>
                  <div className="col-span-2 text-right">Valor</div>
                  <div className="col-span-2">Categoria</div>
                  <div className="col-span-2">Instituição</div>
                </div>
                {ofxTransactions.map((t, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 p-2 items-center border-b last:border-b-0"
                  >
                    <div className="col-span-4">
                      <input
                        className="w-full px-2 py-1 border rounded text-sm"
                        value={perTxDescriptions[idx] ?? t.descricao ?? 'Aporte OFX'}
                        onChange={e =>
                          setPerTxDescriptions(prev => ({
                            ...prev,
                            [idx]: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-span-2 text-xs">{t.data}</div>
                    <div className="col-span-2 text-right font-medium">
                      {currencyFormatter.format(Number(t.valor) || 0)}
                    </div>
                    <div className="col-span-2">
                      <Select
                        value={perTxCategories[idx] || importCategoryId || undefined}
                        onValueChange={val =>
                          setPerTxCategories(prev => ({
                            ...prev,
                            [idx]: val,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {investmentCategories.map(c => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Select
                        value={perTxInstitutions[idx] || importInstitutionId || undefined}
                        onValueChange={val =>
                          setPerTxInstitutions(prev => ({
                            ...prev,
                            [idx]: val,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Instituição" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map(acc => (
                            <SelectItem key={acc.id} value={String(acc.id)}>
                              {acc.nome_banco}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setIsImportOpen(false)}
                disabled={isImporting}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmImport} disabled={isImporting}>
                {isImporting ? 'Importando...' : 'Confirmar importação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Duplicatas encontradas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Foram encontradas {duplicatesFound.length} transação(ões) que podem ser duplicatas de
                aportes já cadastrados. Você pode escolher importar ou ignorar cada uma delas.
              </div>

              <div className="max-h-[50vh] overflow-auto border rounded-md">
                <div className="grid grid-cols-12 gap-2 p-2 text-xs text-muted-foreground border-b">
                  <div className="col-span-3">Descrição</div>
                  <div className="col-span-2">Data</div>
                  <div className="col-span-2 text-right">Valor</div>
                  <div className="col-span-3">Aporte existente</div>
                  <div className="col-span-2">Ação</div>
                </div>
                {duplicatesFound.map(dup => (
                  <div
                    key={dup.ofxIndex}
                    className="grid grid-cols-12 gap-2 p-2 items-center border-b last:border-b-0"
                  >
                    <div className="col-span-3 text-sm">
                      {dup.ofxTransaction.descricao}
                    </div>
                    <div className="col-span-2 text-xs">
                      {dup.ofxTransaction.data}
                    </div>
                    <div className="col-span-2 text-right font-medium">
                      {currencyFormatter.format(Number(dup.ofxTransaction.valor) || 0)}
                    </div>
                    <div className="col-span-3 text-xs text-muted-foreground">
                      {dup.existingInvestment.descricao}
                    </div>
                    <div className="col-span-2">
                      <Select
                        value={duplicateDecisions[dup.ofxIndex] || undefined}
                        onValueChange={val => handleDuplicateDecision(dup.ofxIndex, val)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Escolher" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="import">Importar</SelectItem>
                          <SelectItem value="skip">Ignorar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSkipAllDuplicates}>
                  Ignorar todas
                </Button>
                <Button variant="outline" onClick={handleImportAllDuplicates}>
                  Importar todas
                </Button>
                <Button onClick={handleProceedWithDuplicates}>
                  Prosseguir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
