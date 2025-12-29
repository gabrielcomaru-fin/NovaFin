import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useFinance } from '@/contexts/FinanceDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompactHeader } from '@/components/CompactHeader';
import { CategoryChart } from '@/components/CategoryChart';
import { FinancialHealthMeter } from '@/components/dashboard/FinancialHealthMeter';
import { 
  Wallet, 
  Building2, 
  PiggyBank, 
  TrendingUp, 
  Shield, 
  AlertCircle,
  ChevronRight,
  DollarSign,
  Landmark,
  BarChart3,
  Info,
  CheckCircle2,
  Target,
  Coins
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Palavras-chave que indicam investimentos de reserva de emergência
const EMERGENCY_RESERVE_KEYWORDS = [
  'reserva',
  'emergência',
  'emergencia',
  'tesouro selic',
  'selic',
  'cdb',
  'liquidez',
  'renda fixa',
  'poupança',
  'poupanca',
  'fundo di',
  'curto prazo',
  'segurança',
  'seguranca',
  'colchão',
  'colchao'
];

// Verifica se uma categoria é considerada reserva de emergência
const isEmergencyReserveCategory = (categoryName) => {
  if (!categoryName) return false;
  const lowerName = categoryName.toLowerCase();
  return EMERGENCY_RESERVE_KEYWORDS.some(keyword => lowerName.includes(keyword));
};

// Formata valores em moeda brasileira
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
};

// Card animado para exibir valores
const ValueCard = ({ title, value, subtitle, icon: Icon, colorClass, trend, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: 'easeOut' }}
  >
    <Card className={`relative overflow-hidden border-l-4 ${colorClass}`}>
      <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-5">
        {Icon && <Icon className="w-full h-full" />}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl md:text-3xl font-bold">{formatCurrency(value)}</div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend !== undefined && (
          <div className={`text-xs mt-2 font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% do patrimônio
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

// Item de lista para exibir detalhes
const DetailItem = ({ name, value, percentage, icon: Icon, isNegative, badge }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${isNegative ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary/10'}`}>
        {Icon && <Icon className={`h-5 w-5 ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-primary'}`} />}
      </div>
      <div>
        <p className="font-medium text-foreground">{name}</p>
        {badge && (
          <Badge variant="secondary" className="text-xs mt-1">
            <Shield className="h-3 w-3 mr-1" />
            {badge}
          </Badge>
        )}
      </div>
    </div>
    <div className="text-right">
      <p className={`font-bold text-lg ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
        {formatCurrency(value)}
      </p>
      {percentage !== undefined && (
        <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</p>
      )}
    </div>
  </motion.div>
);

export function PatrimonyDetailPage() {
  const { accounts, investments, categories, totalPatrimony, totalAccountBalance, incomes } = useFinance();
  const [activeTab, setActiveTab] = useState('visao-geral');

  // Categorias de investimento
  const investmentCategories = useMemo(() => 
    categories.filter(c => c.tipo === 'investimento'), 
    [categories]
  );

  // Mapa de categorias por ID
  const categoryMap = useMemo(() => {
    const map = {};
    investmentCategories.forEach(cat => {
      map[cat.id] = cat;
    });
    return map;
  }, [investmentCategories]);

  // Mapa de instituições por ID
  const accountMap = useMemo(() => {
    const map = {};
    accounts.forEach(acc => {
      map[acc.id] = acc;
    });
    return map;
  }, [accounts]);

  // Dados de patrimônio por instituição
  const patrimonyByInstitution = useMemo(() => {
    return accounts.map(account => ({
      id: account.id,
      name: account.nome_banco,
      value: Number(account.saldo) || 0,
      isNegative: (Number(account.saldo) || 0) < 0
    })).sort((a, b) => b.value - a.value);
  }, [accounts]);

  // Dados de investimentos por categoria
  const investmentsByCategory = useMemo(() => {
    const categoryTotals = {};
    
    investments.forEach(inv => {
      const catId = inv.categoria_id;
      const category = categoryMap[catId];
      const catName = category?.nome || 'Sem Categoria';
      
      if (!categoryTotals[catId]) {
        categoryTotals[catId] = {
          id: catId,
          name: catName,
          value: 0,
          isEmergencyReserve: isEmergencyReserveCategory(catName)
        };
      }
      categoryTotals[catId].value += Number(inv.valor_aporte) || 0;
    });
    
    return Object.values(categoryTotals).sort((a, b) => b.value - a.value);
  }, [investments, categoryMap]);

  // Dados de investimentos por instituição
  const investmentsByInstitution = useMemo(() => {
    const instTotals = {};
    
    investments.forEach(inv => {
      const instId = inv.instituicao_id;
      const institution = accountMap[instId];
      const instName = institution?.nome_banco || 'Sem Instituição';
      
      if (!instTotals[instId]) {
        instTotals[instId] = {
          id: instId,
          name: instName,
          value: 0
        };
      }
      instTotals[instId].value += Number(inv.valor_aporte) || 0;
    });
    
    return Object.values(instTotals).sort((a, b) => b.value - a.value);
  }, [investments, accountMap]);

  // Cálculo da Reserva de Emergência
  const emergencyReserveData = useMemo(() => {
    const reserveCategories = investmentsByCategory.filter(cat => cat.isEmergencyReserve);
    const totalReserve = reserveCategories.reduce((sum, cat) => sum + cat.value, 0);
    
    // Detalhes dos investimentos que compõem a reserva
    const reserveDetails = investments
      .filter(inv => {
        const category = categoryMap[inv.categoria_id];
        return isEmergencyReserveCategory(category?.nome);
      })
      .map(inv => ({
        id: inv.id,
        description: inv.descricao,
        value: Number(inv.valor_aporte) || 0,
        date: inv.data,
        category: categoryMap[inv.categoria_id]?.nome || 'Sem Categoria',
        institution: accountMap[inv.instituicao_id]?.nome_banco || 'Sem Instituição'
      }))
      .sort((a, b) => b.value - a.value);
    
    return {
      total: totalReserve,
      categories: reserveCategories,
      details: reserveDetails,
      percentOfPatrimony: totalPatrimony > 0 ? (totalReserve / totalPatrimony) * 100 : 0
    };
  }, [investmentsByCategory, investments, categoryMap, accountMap, totalPatrimony]);

  // Cálculo de meses de despesas cobertas pela reserva
  const monthsCovered = useMemo(() => {
    // Calcular média de gastos mensais (simplificado - usar total de gastos do contexto seria mais preciso)
    const totalMonthlyIncome = incomes.reduce((sum, inc) => sum + (Number(inc.valor) || 0), 0);
    // Estimativa: gastos mensais = 70% da renda (regra comum de planejamento)
    const estimatedMonthlyExpenses = totalMonthlyIncome * 0.7 || 5000; // fallback de R$ 5.000
    
    return emergencyReserveData.total > 0 
      ? emergencyReserveData.total / (estimatedMonthlyExpenses / 12 * 12) * 12 
      : 0;
  }, [emergencyReserveData.total, incomes]);

  // Dados para gráficos
  const institutionChartData = useMemo(() => 
    patrimonyByInstitution
      .filter(p => p.value > 0)
      .map(p => ({
        categoryName: p.name,
        total: p.value
      })),
    [patrimonyByInstitution]
  );

  const categoryChartData = useMemo(() => 
    investmentsByCategory.map(cat => ({
      categoryName: cat.name,
      total: cat.value
    })),
    [investmentsByCategory]
  );

  // Total de investimentos
  const totalInvestments = useMemo(() => 
    investments.reduce((sum, inv) => sum + (Number(inv.valor_aporte) || 0), 0),
    [investments]
  );

  // Valores positivos e negativos
  const positiveBalance = useMemo(() => 
    accounts.reduce((sum, acc) => {
      const value = Number(acc.saldo) || 0;
      return value > 0 ? sum + value : sum;
    }, 0),
    [accounts]
  );

  const negativeBalance = useMemo(() => 
    accounts.reduce((sum, acc) => {
      const value = Number(acc.saldo) || 0;
      return value < 0 ? sum + Math.abs(value) : sum;
    }, 0),
    [accounts]
  );

  return (
    <>
      <Helmet>
        <title>Detalhamento do Patrimônio - Lumify</title>
        <meta name="description" content="Visualize a composição completa do seu patrimônio e reserva de emergência." />
      </Helmet>

      <div className="space-y-4 md:space-y-6 page-top">
        <CompactHeader 
          title="Detalhamento do Patrimônio"
          subtitle="Composição e análise detalhada dos seus ativos"
        >
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl md:text-3xl font-bold text-primary">
                {formatCurrency(totalPatrimony)}
              </div>
              <p className="text-sm text-muted-foreground">Patrimônio Total</p>
            </div>
          </div>
        </CompactHeader>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ValueCard
            title="Patrimônio Líquido"
            value={totalPatrimony}
            subtitle="Saldo de instituições + investimentos"
            icon={Wallet}
            colorClass="border-l-primary"
            delay={0}
          />
          <ValueCard
            title="Saldo em Instituições"
            value={totalAccountBalance}
            subtitle={`${accounts.length} instituição(ões) cadastrada(s)`}
            icon={Building2}
            colorClass="border-l-blue-500"
            delay={0.1}
          />
          <ValueCard
            title="Total Investido"
            value={totalInvestments}
            subtitle={`${investments.length} aporte(s) registrado(s)`}
            icon={TrendingUp}
            colorClass="border-l-green-500"
            delay={0.2}
          />
          <ValueCard
            title="Reserva de Emergência"
            value={emergencyReserveData.total}
            subtitle={emergencyReserveData.total > 0 
              ? `${emergencyReserveData.percentOfPatrimony.toFixed(1)}% do patrimônio`
              : 'Nenhuma reserva identificada'
            }
            icon={Shield}
            colorClass="border-l-amber-500"
            delay={0.3}
          />
        </div>

        {/* Saúde Financeira - Composição do cálculo */}
        <FinancialHealthMeter showBreakdownOption={true} />

        {/* Tabs de Navegação */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3 md:grid-cols-3">
            <TabsTrigger value="visao-geral" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="instituicoes" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Instituições</span>
              <span className="sm:hidden">Inst.</span>
            </TabsTrigger>
            <TabsTrigger value="reserva" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Reserva</span>
              <span className="sm:hidden">Reserva</span>
            </TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="visao-geral" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Distribuição por Instituição */}
              {institutionChartData.length > 0 ? (
                <CategoryChart
                  data={institutionChartData}
                  title="Patrimônio por Instituição"
                  description="Distribuição do saldo entre suas instituições financeiras"
                  icon={Building2}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Patrimônio por Instituição
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Landmark className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Nenhuma instituição com saldo positivo</p>
                    <Link to="/contas">
                      <Button variant="outline" className="mt-4">
                        Adicionar Instituição
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Gráfico de Distribuição por Categoria */}
              {categoryChartData.length > 0 ? (
                <CategoryChart
                  data={categoryChartData}
                  title="Investimentos por Categoria"
                  description="Distribuição dos aportes por tipo de investimento"
                  icon={TrendingUp}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Investimentos por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Coins className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Nenhum investimento registrado</p>
                    <Link to="/investimentos">
                      <Button variant="outline" className="mt-4">
                        Registrar Investimento
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Análise de Dívidas */}
            {negativeBalance > 0 && (
              <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    Análise de Dívidas
                  </CardTitle>
                  <CardDescription>
                    Você possui {formatCurrency(negativeBalance)} em saldos negativos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {patrimonyByInstitution.filter(p => p.isNegative).map((item, index) => (
                      <DetailItem
                        key={item.id || index}
                        name={item.name}
                        value={item.value}
                        percentage={(Math.abs(item.value) / negativeBalance) * 100}
                        icon={Building2}
                        isNegative
                      />
                    ))}
                  </div>
                  <div className="mt-4 p-4 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      💡 <strong>Dica:</strong> Priorize quitar dívidas com juros altos antes de investir. 
                      Isso pode representar um "rendimento" maior do que muitos investimentos.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Composição Detalhada */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Composição do Patrimônio
                </CardTitle>
                <CardDescription>
                  Detalhamento de todos os seus ativos e passivos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Ativos Positivos */}
                  {positiveBalance > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                        Ativos ({formatCurrency(positiveBalance)})
                      </h4>
                      <div className="space-y-2">
                        {patrimonyByInstitution.filter(p => !p.isNegative && p.value > 0).map((item, index) => (
                          <DetailItem
                            key={item.id || index}
                            name={item.name}
                            value={item.value}
                            percentage={totalPatrimony > 0 ? (item.value / totalPatrimony) * 100 : 0}
                            icon={Landmark}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Investimentos por Categoria */}
                  {investmentsByCategory.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                        Investimentos por Categoria
                      </h4>
                      <div className="space-y-2">
                        {investmentsByCategory.map((cat, index) => (
                          <DetailItem
                            key={cat.id || index}
                            name={cat.name}
                            value={cat.value}
                            percentage={totalInvestments > 0 ? (cat.value / totalInvestments) * 100 : 0}
                            icon={cat.isEmergencyReserve ? Shield : TrendingUp}
                            badge={cat.isEmergencyReserve ? 'Reserva' : undefined}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Instituições */}
          <TabsContent value="instituicoes" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lista de Instituições */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Suas Instituições
                  </CardTitle>
                  <CardDescription>
                    Saldo atual em cada instituição financeira
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {accounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground mb-4">Nenhuma instituição cadastrada</p>
                      <Link to="/contas">
                        <Button>
                          Adicionar Instituição
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patrimonyByInstitution.map((item, index) => (
                        <DetailItem
                          key={item.id || index}
                          name={item.name}
                          value={item.value}
                          percentage={totalAccountBalance !== 0 
                            ? (Math.abs(item.value) / Math.abs(totalAccountBalance)) * 100 
                            : 0
                          }
                          icon={Landmark}
                          isNegative={item.isNegative}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Investimentos por Instituição */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Aportes por Instituição
                  </CardTitle>
                  <CardDescription>
                    Total investido em cada instituição
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {investmentsByInstitution.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Coins className="h-16 w-16 text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground mb-4">Nenhum investimento registrado</p>
                      <Link to="/investimentos">
                        <Button>
                          Registrar Aporte
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {investmentsByInstitution.map((item, index) => (
                        <DetailItem
                          key={item.id || index}
                          name={item.name}
                          value={item.value}
                          percentage={totalInvestments > 0 
                            ? (item.value / totalInvestments) * 100 
                            : 0
                          }
                          icon={TrendingUp}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Link para gerenciamento */}
            <Card className="bg-muted/30">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">Gerenciar Instituições</p>
                      <p className="text-sm text-muted-foreground">
                        Adicione, edite ou remova suas instituições financeiras
                      </p>
                    </div>
                  </div>
                  <Link to="/contas">
                    <Button variant="outline" className="gap-2">
                      Gerenciar <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reserva de Emergência */}
          <TabsContent value="reserva" className="mt-6 space-y-6">
            {/* Status da Reserva */}
            <Card className={`border-2 ${
              emergencyReserveData.total > 0 
                ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20' 
                : 'border-muted'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className={`h-6 w-6 ${emergencyReserveData.total > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
                  Reserva de Emergência
                </CardTitle>
                <CardDescription>
                  Proteção financeira para imprevistos e emergências
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Valor Total */}
                  <div className="text-center md:text-left">
                    <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(emergencyReserveData.total)}
                    </p>
                  </div>

                  {/* Percentual do Patrimônio */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Do Patrimônio</p>
                    <p className="text-3xl font-bold">
                      {emergencyReserveData.percentOfPatrimony.toFixed(1)}%
                    </p>
                    <Progress 
                      value={Math.min(emergencyReserveData.percentOfPatrimony, 100)} 
                      className="h-2 mt-2" 
                    />
                  </div>

                  {/* Status de Cobertura */}
                  <div className="text-center md:text-right">
                    <p className="text-sm text-muted-foreground mb-1">Meta Recomendada</p>
                    <div className="flex items-center justify-center md:justify-end gap-2">
                      {emergencyReserveData.percentOfPatrimony >= 15 ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-lg font-medium text-green-600">Adequada</span>
                        </>
                      ) : emergencyReserveData.percentOfPatrimony >= 5 ? (
                        <>
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                          <span className="text-lg font-medium text-amber-600">Em construção</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <span className="text-lg font-medium text-red-600">Insuficiente</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dica Educativa */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                    <Info className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                      O que é Reserva de Emergência?
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                      A reserva de emergência é um fundo de segurança para cobrir despesas imprevistas 
                      (emergências médicas, perda de emprego, reparos urgentes). Recomenda-se ter de 
                      <strong> 3 a 12 meses de despesas</strong> em investimentos de alta liquidez.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Alta liquidez (Tesouro Selic, CDB)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Baixo risco</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Fácil acesso</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Composição da Reserva */}
            {emergencyReserveData.categories.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-amber-600" />
                    Composição da Sua Reserva
                  </CardTitle>
                  <CardDescription>
                    Investimentos identificados como parte da reserva de emergência
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {emergencyReserveData.categories.map((cat, index) => (
                      <DetailItem
                        key={cat.id || index}
                        name={cat.name}
                        value={cat.value}
                        percentage={emergencyReserveData.total > 0 
                          ? (cat.value / emergencyReserveData.total) * 100 
                          : 0
                        }
                        icon={Shield}
                        badge="Reserva"
                      />
                    ))}
                  </div>

                  {/* Lista detalhada de aportes */}
                  {emergencyReserveData.details.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                        Detalhes dos Aportes ({emergencyReserveData.details.length})
                      </h4>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {emergencyReserveData.details.map((detail, index) => (
                          <div 
                            key={detail.id || index}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm"
                          >
                            <div>
                              <p className="font-medium">{detail.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {detail.category} • {detail.institution} • {new Date(detail.date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <p className="font-semibold">{formatCurrency(detail.value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="p-4 bg-muted rounded-full mb-4">
                      <Shield className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Nenhuma Reserva Identificada</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      Não encontramos investimentos categorizados como reserva de emergência. 
                      Crie categorias com nomes como "Reserva de Emergência", "Tesouro Selic" ou 
                      "CDB Liquidez" para que seus aportes sejam identificados automaticamente.
                    </p>
                    <div className="flex gap-3">
                      <Link to="/investimentos">
                        <Button>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Registrar Aporte
                        </Button>
                      </Link>
                      <Link to="/configuracoes">
                        <Button variant="outline">
                          Gerenciar Categorias
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Categorias que são consideradas reserva */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Categorias Consideradas Reserva
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Investimentos nas seguintes categorias são automaticamente identificados como reserva de emergência:
                </p>
                <div className="flex flex-wrap gap-2">
                  {EMERGENCY_RESERVE_KEYWORDS.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="capitalize">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

