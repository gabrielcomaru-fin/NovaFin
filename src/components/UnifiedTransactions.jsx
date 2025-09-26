import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useFinance } from '@/contexts/FinanceDataContext';
import { ExpenseForm } from '@/components/ExpenseForm';
import { InvestmentForm } from '@/components/InvestmentForm';

export const UnifiedTransactions = () => {
  const { expenses, investments, categories, accounts } = useFinance();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);

  // Combinar todas as transações em uma lista unificada
  const allTransactions = useMemo(() => {
    const expenseList = expenses.map(exp => ({
      ...exp,
      type: 'expense',
      amount: exp.valor,
      category: categories.find(c => c.id === exp.categoria_id)?.nome || 'Sem categoria',
      icon: TrendingDown,
      color: 'text-red-600'
    }));

    const investmentList = investments.map(inv => ({
      ...inv,
      type: 'investment',
      amount: inv.valor_aporte,
      category: categories.find(c => c.id === inv.categoria_id)?.nome || 'Sem categoria',
      icon: TrendingUp,
      color: 'text-green-600'
    }));

    return [...expenseList, ...investmentList]
      .sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [expenses, investments, categories]);

  // Filtrar transações baseado na aba ativa e termo de busca
  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;

    // Filtrar por tipo
    if (activeTab === 'expenses') {
      filtered = filtered.filter(t => t.type === 'expense');
    } else if (activeTab === 'investments') {
      filtered = filtered.filter(t => t.type === 'investment');
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [allTransactions, activeTab, searchTerm]);

  // Estatísticas rápidas
  const stats = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.valor, 0);
    const totalInvestments = investments.reduce((sum, inv) => sum + inv.valor_aporte, 0);
    const pendingExpenses = expenses.filter(exp => !exp.pago).length;
    
    return {
      totalExpenses,
      totalInvestments,
      pendingExpenses,
      netFlow: totalInvestments - totalExpenses
    };
  }, [expenses, investments]);

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Gastos</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              R$ {stats.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Investimentos</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.totalInvestments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Saldo</span>
            </div>
            <div className={`text-2xl font-bold ${stats.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {stats.netFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Pendências</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingExpenses}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles e Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button onClick={() => setShowExpenseForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
          <Button onClick={() => setShowInvestmentForm(true)} variant="outline" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Investimento
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Abas de Transações */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="investments">Investimentos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <TransactionList transactions={filteredTransactions} />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <TransactionList transactions={filteredTransactions} />
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <TransactionList transactions={filteredTransactions} />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <TransactionList transactions={filteredTransactions.filter(t => t.type === 'expense' && !t.pago)} />
        </TabsContent>
      </Tabs>

      {/* Modais de Formulário */}
      {showExpenseForm && (
        <ExpenseForm 
          onClose={() => setShowExpenseForm(false)}
          onSuccess={() => setShowExpenseForm(false)}
        />
      )}

      {showInvestmentForm && (
        <InvestmentForm 
          onClose={() => setShowInvestmentForm(false)}
          onSuccess={() => setShowInvestmentForm(false)}
        />
      )}
    </div>
  );
};

// Componente para listar transações
const TransactionList = ({ transactions }) => {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Nenhuma transação encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <transaction.icon className={`h-5 w-5 ${transaction.color}`} />
                <div>
                  <p className="font-medium">{transaction.descricao || 'Transação'}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{transaction.category}</span>
                    <span>•</span>
                    <span>{transaction.data}</span>
                    {transaction.type === 'expense' && (
                      <>
                        <span>•</span>
                        <Badge variant={transaction.pago ? "default" : "secondary"}>
                          {transaction.pago ? "Pago" : "Pendente"}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${transaction.color}`}>
                  {transaction.type === 'expense' ? '-' : '+'}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {transaction.type === 'expense' ? 'Despesa' : 'Investimento'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
