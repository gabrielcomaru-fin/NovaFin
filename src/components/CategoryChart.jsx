import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const COLORS = [
  'hsl(213, 77%, 59%)', // primary
  'hsl(340, 82%, 52%)', // vibrant-accent
  'hsl(160, 100%, 30%)',
  'hsl(45, 100%, 50%)',
  'hsl(280, 80%, 60%)',
  'hsl(20, 100%, 60%)',
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-background border rounded-lg shadow-sm">
        <p className="font-bold">{`${payload[0].name}`}</p>
        <p className="text-sm text-primary">{`Valor: R$ ${payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</p>
        <p className="text-sm text-muted-foreground">{`Percentual: ${(payload[0].percent * 100).toFixed(2)}%`}</p>
      </div>
    );
  }
  return null;
};

export const CategoryChart = ({ data, title, description }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const chartData = data.map(item => ({
      name: item.categoryName,
      value: item.total,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};