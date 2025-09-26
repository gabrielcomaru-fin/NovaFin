import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';

const COLORS = [
  'hsl(213, 77%, 59%)', // primary
  'hsl(340, 82%, 52%)', // vibrant-accent
  'hsl(160, 100%, 30%)',
  'hsl(45, 100%, 50%)',
  'hsl(280, 80%, 60%)',
  'hsl(20, 100%, 60%)',
];

const CustomTooltip = ({ active, payload, label, totalValue }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const percentage = totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(1) : '0.0';
    
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground">{data.name}</p>
        <p className="text-sm text-primary">
          R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground">
          {percentage}% do total
        </p>
      </div>
    );
  }
  return null;
};

export const CategoryChart = ({
  data,
  title,
  description,
  icon: TitleIcon,
  topN = 5,
  height = 320,
}) => {
  const { prepared, totalValue } = useMemo(() => {
    const rows = (data || [])
      .map(item => ({ name: item.categoryName, value: Number(item.total) || 0 }))
      .filter(r => r.value > 0)
      .sort((a, b) => b.value - a.value);
    
    if (rows.length === 0) return { prepared: [], totalValue: 0 };
    
    const total = rows.reduce((sum, r) => sum + r.value, 0);
    
    if (rows.length <= topN) return { prepared: rows, totalValue: total };
    
    const top = rows.slice(0, topN);
    const othersValue = rows.slice(topN).reduce((s, r) => s + r.value, 0);
    if (othersValue > 0) top.push({ name: 'Outros', value: othersValue });
    
    return { prepared: top, totalValue: total };
  }, [data, topN]);

  if (!prepared || prepared.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {TitleIcon ? <TitleIcon className="h-5 w-5 text-primary" /> : <PieChartIcon className="h-5 w-5 text-primary" />}
            {title || 'Gráfico de Categorias'}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Nenhum dado disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {TitleIcon ? <TitleIcon className="h-5 w-5 text-primary" /> : <PieChartIcon className="h-5 w-5 text-primary" />}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={prepared}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                stroke="hsl(var(--background))"
                strokeWidth={2}
                label={({ name, percent }) => {
                  // Só mostra label se percentual >= 5% para evitar sobreposição
                  return percent >= 0.05 ? `${(percent * 100).toFixed(0)}%` : '';
                }}
                labelLine={false}
              >
                {prepared.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={(props) => <CustomTooltip {...props} totalValue={totalValue} />} />
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};