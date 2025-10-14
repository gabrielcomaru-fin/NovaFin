import React, { memo, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Smartphone, Banknote, Building2, FileText, Wallet } from 'lucide-react';

const PaymentMethodChart = memo(function PaymentMethodChart({ expenses, paymentMethods }) {
  const chartData = useMemo(() => {
    if (!expenses.length || !paymentMethods.length) return [];

    const paymentTotals = paymentMethods.map(pm => {
      const expensesByPayment = expenses.filter(exp => exp.meio_pagamento_id === pm.id);
      const total = expensesByPayment.reduce((sum, exp) => sum + exp.valor, 0);
      
      return {
        name: pm.nome,
        value: total,
        color: pm.cor || '#3b82f6',
        tipo: pm.tipo,
        count: expensesByPayment.length
      };
    }).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

    return paymentTotals;
  }, [expenses, paymentMethods]);

  const getPaymentIcon = (tipo) => {
    const iconMap = {
      cartao_credito: CreditCard,
      cartao_debito: CreditCard,
      dinheiro: Banknote,
      pix: Smartphone,
      transferencia: Building2,
      boleto: FileText,
      outros: Wallet,
    };
    return iconMap[tipo] || Wallet;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            {React.createElement(getPaymentIcon(data.tipo), { className: "h-4 w-4" })}
            <span className="font-medium">{data.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Valor: R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">
            Transações: {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Distribuição por Meio de Pagamento
          </CardTitle>
          <CardDescription>Nenhuma despesa encontrada com meios de pagamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <CreditCard className="w-12 h-12 mx-auto opacity-50 mb-2" />
            <p>Nenhuma despesa registrada com meio de pagamento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Distribuição por Meio de Pagamento
        </CardTitle>
        <CardDescription>Como você distribui seus gastos entre diferentes meios de pagamento</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Lista detalhada */}
        <div className="mt-4 space-y-2">
          {chartData.map((item, index) => {
            const Icon = getPaymentIcon(item.tipo);
            const percentage = chartData.reduce((sum, item) => sum + item.value, 0) > 0 
              ? (item.value / chartData.reduce((sum, item) => sum + item.value, 0)) * 100 
              : 0;
            
            return (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" style={{ color: item.color }} />
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <div className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}% • {item.count} transação{item.count !== 1 ? 'ões' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export { PaymentMethodChart };
