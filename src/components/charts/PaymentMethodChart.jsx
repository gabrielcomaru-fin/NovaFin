import React, { memo, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Smartphone, Banknote, Building2, FileText, Wallet } from 'lucide-react';

// Função para ajustar a cor baseada no tema
const getAdjustedColor = (color) => {
  if (!color) return 'hsl(var(--primary))';
  
  // Verificar se estamos no tema escuro
  const isDark = document.documentElement.classList.contains('dark');
  
  if (!isDark) {
    // No tema claro, usar a cor original
    return color;
  }
  
  // No tema escuro, verificar se a cor é muito escura
  let r, g, b;
  
  // Converter diferentes formatos de cor para RGB
  if (color.startsWith('#')) {
    // Formato hex
    const hex = color.replace('#', '');
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else if (color.startsWith('rgb')) {
    // Formato rgb/rgba
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      r = parseInt(matches[0]);
      g = parseInt(matches[1]);
      b = parseInt(matches[2]);
    } else {
      return 'hsl(var(--primary))';
    }
  } else {
    // Se não conseguir parsear, usar cor primária
    return 'hsl(var(--primary))';
  }
  
  // Calcular luminosidade relativa (0-1)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Se a cor for muito escura (luminosidade < 0.5), clarear significativamente
  if (luminance < 0.5) {
    // Para cores muito escuras, usar uma cor mais clara baseada na cor original
    // mas garantindo visibilidade mínima
    const minLuminance = 0.6; // Luminosidade mínima desejada
    const targetLuminance = Math.max(minLuminance, luminance * 2.5);
    
    // Ajustar cada componente RGB para atingir a luminosidade desejada
    const currentLum = luminance;
    const ratio = targetLuminance / currentLum;
    
    let newR = Math.min(255, Math.round(r * ratio));
    let newG = Math.min(255, Math.round(g * ratio));
    let newB = Math.min(255, Math.round(b * ratio));
    
    // Garantir que pelo menos um componente seja significativamente claro
    const maxComponent = Math.max(newR, newG, newB);
    if (maxComponent < 150) {
      // Se ainda estiver muito escuro, usar a cor primária como fallback
      return 'hsl(var(--primary))';
    }
    
    return `rgb(${newR}, ${newG}, ${newB})`;
  }
  
  // Se já for clara o suficiente, usar a cor original
  return color;
};

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
                  <Icon className="h-4 w-4" style={{ color: getAdjustedColor(item.color) || 'hsl(var(--primary))' }} />
                  <span className="font-medium text-card-foreground">{item.name}</span>
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
