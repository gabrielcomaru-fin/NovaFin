import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CreditCard, 
  Wallet, 
  Smartphone, 
  Banknote, 
  Building2, 
  FileText,
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

export function PaymentMethodChart({ expenses, paymentMethods, type = 'pie' }) {
  const chartData = useMemo(() => {
    if (!expenses.length || !paymentMethods.length) {
      return [];
    }

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

    return Object.values(methodTotals)
      .sort((a, b) => b.total - a.total)
      .map(item => ({
        ...item,
        percentage: totalAmount > 0 ? (item.total / totalAmount) * 100 : 0
      }));
  }, [expenses, paymentMethods]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Gastos por Meio de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum dado disponível para exibir o gráfico.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (type === 'pie') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Gastos por Meio de Pagamento
          </CardTitle>
          <CardDescription>
            Distribuição percentual dos gastos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.map((item, index) => {
              const IconComponent = paymentMethodIcons[item.method.tipo] || Wallet;
              return (
                <div key={item.method.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: item.method.cor + '20' }}
                    >
                      <IconComponent 
                        className="w-3 h-3" 
                        style={{ color: item.method.cor }}
                      />
                    </div>
                    <span className="font-medium">{item.method.nome}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'bar') {
    const maxValue = Math.max(...chartData.map(item => item.total));
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Gastos por Meio de Pagamento
          </CardTitle>
          <CardDescription>
            Comparação de valores gastos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.map((item, index) => {
              const IconComponent = paymentMethodIcons[item.method.tipo] || Wallet;
              const barWidth = maxValue > 0 ? (item.total / maxValue) * 100 : 0;
              
              return (
                <div key={item.method.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.method.cor }}
                      />
                      <span className="font-medium text-sm">{item.method.nome}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">
                        R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.count} transação{item.count !== 1 ? 'ões' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${barWidth}%`,
                        backgroundColor: item.method.cor 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
