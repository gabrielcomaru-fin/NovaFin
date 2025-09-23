import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { formatCurrencyBRL } from '@/lib/format';

export function InvestmentByInstitutionChart({ investments = [], accounts = [] }) {
  const data = useMemo(() => {
    const accountMap = accounts.reduce((map, acc) => {
      map[acc.id] = acc.nome_banco || acc.nome || 'Instituição';
      return map;
    }, {});

    const totals = investments.reduce((acc, inv) => {
      const key = inv.instituicao_id;
      const name = accountMap[key] || 'Sem instituição';
      acc[name] = (acc[name] || 0) + (inv.valor_aporte || 0);
      return acc;
    }, {});

    const entries = Object.entries(totals)
      .map(([name, total]) => ({ name, value: total }))
      .sort((a, b) => b.value - a.value);

    const top5 = entries.slice(0, 5);
    const othersSum = entries.slice(5).reduce((s, e) => s + e.value, 0);
    if (othersSum > 0) top5.push({ name: 'Outros', value: othersSum });
    return top5;
  }, [investments, accounts]);

  const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#94a3b8'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      return (
        <div className="bg-background border border-border rounded-lg p-2 text-sm">
          <div className="font-medium">{p.name}</div>
          <div className="text-primary">{formatCurrencyBRL(Number(p.value))}</div>
          <div className="text-muted-foreground">{(p.percent * 100).toFixed(1)}%</div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investimentos por Instituição</CardTitle>
        <CardDescription>Distribuição dos aportes por instituição financeira</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Sem aportes no período selecionado.</div>
        )}
      </CardContent>
    </Card>
  );
}


