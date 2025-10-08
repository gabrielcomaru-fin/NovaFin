import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Wallet, 
  Smartphone, 
  Banknote, 
  Building2, 
  FileText,
  TrendingDown,
  PieChart
} from 'lucide-react';

const paymentMethodIcons = {
  cartao_credito: CreditCard,
  cartao_debito: CreditCard,
  dinheiro: Banknote,
  pix: Smartphone,
  transferencia: Building2,
  boleto: FileText,
  outros: Wallet
};

export function PaymentMethodAnalysis({ expenses, paymentMethods, period = '30d' }) {
  const analysis = useMemo(() => {
    if (!expenses.length || !paymentMethods.length) {
      return {
        totalByMethod: [],
        totalAmount: 0,
        methodStats: []
      };
    }

    // Calcular gastos por meio de pagamento
    const methodTotals = {};
    let totalAmount = 0;

    expenses.forEach(expense => {
      if (expense.meio_pagamento_id) {
        const method = paymentMethods.find(p => p.id === expense.meio_pagamento_id);
        if (method) {
          if (!methodTotals[method.id]) {
            methodTotals[method.id] = {
              method,
              total: 0,
              count: 0
            };
          }
          methodTotals[method.id].total += expense.valor;
          methodTotals[method.id].count += 1;
          totalAmount += expense.valor;
        }
      }
    });

    // Converter para array e ordenar por valor
    const totalByMethod = Object.values(methodTotals)
      .sort((a, b) => b.total - a.total);

    // Calcular estatísticas
    const methodStats = totalByMethod.map(item => ({
      ...item,
      percentage: totalAmount > 0 ? (item.total / totalAmount) * 100 : 0,
      average: item.count > 0 ? item.total / item.count : 0
    }));

    return {
      totalByMethod,
      totalAmount,
      methodStats
    };
  }, [expenses, paymentMethods]);

  if (analysis.methodStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Análise por Meio de Pagamento
          </CardTitle>
          <CardDescription>
            Visualize seus gastos categorizados por meio de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum gasto encontrado com meio de pagamento para o período selecionado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Análise por Meio de Pagamento
          </CardTitle>
          <CardDescription>
            Total gasto: R$ {analysis.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {analysis.methodStats.length}
              </p>
              <p className="text-sm text-muted-foreground">Meios Utilizados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {analysis.methodStats.reduce((sum, item) => sum + item.count, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Transações</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                R$ {analysis.methodStats.length > 0 ? (analysis.totalAmount / analysis.methodStats.reduce((sum, item) => sum + item.count, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
              </p>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalhamento por Meio de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Gastos por Meio de Pagamento
          </CardTitle>
          <CardDescription>
            Distribuição dos seus gastos por meio de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.methodStats.map((item, index) => {
              const IconComponent = paymentMethodIcons[item.method.tipo] || Wallet;
              return (
                <div key={item.method.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: item.method.cor + '20' }}
                      >
                        <IconComponent 
                          className="w-4 h-4" 
                          style={{ color: item.method.cor }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{item.method.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.count} transação{item.count !== 1 ? 'ões' : ''} • 
                          Ticket médio: R$ {item.average.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant="secondary">
                        {item.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
          <CardDescription>
            Análises automáticas dos seus padrões de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.methodStats.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-sm">
                  <strong>Meio mais utilizado:</strong> {analysis.methodStats[0].method.nome} 
                  ({analysis.methodStats[0].percentage.toFixed(1)}% dos gastos)
                </p>
              </div>
            )}
            
            {analysis.methodStats.length > 1 && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-sm">
                  <strong>Diversificação:</strong> Você utiliza {analysis.methodStats.length} meios de pagamento diferentes, 
                  mostrando boa diversificação nos seus gastos.
                </p>
              </div>
            )}

            {analysis.methodStats.some(item => item.method.tipo === 'cartao_credito') && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <p className="text-sm">
                  <strong>Cartão de Crédito:</strong> 
                  {analysis.methodStats.find(item => item.method.tipo === 'cartao_credito')?.percentage.toFixed(1)}% dos seus gastos são no cartão de crédito.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
