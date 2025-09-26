import React, { memo, useMemo } from 'react';
import { CategoryChart } from '@/components/CategoryChart';
import { PieChart as PieChartIcon } from 'lucide-react';

const CategoryBreakdownChart = memo(function CategoryBreakdownChart({ expenses, categories }) {
  const chartData = useMemo(() => {
    const expenseCategories = categories.filter(c => c.tipo === 'gasto');
    const categoryTotals = {};

    // Calcular totais por categoria
    expenses.forEach(expense => {
      const categoryId = expense.categoria_id;
      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = 0;
      }
      categoryTotals[categoryId] += expense.valor;
    });

    // Criar dados para o gráfico
    const full = expenseCategories
      .map(category => ({
        name: category.nome,
        value: categoryTotals[category.id] || 0,
        color: category.cor || '#8884d8'
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    const top5 = full.slice(0, 5);
    const othersSum = full.slice(5).reduce((s, e) => s + e.value, 0);
    if (othersSum > 0) top5.push({ name: 'Outros', value: othersSum, color: '#94a3b8' });
    return top5;
  }, [expenses, categories]);

  if (chartData.length === 0) {
    return (
      <CategoryChart
        data={[]}
        title="Gastos por Categoria"
        description="Distribuição dos gastos por categoria"
        icon={PieChartIcon}
      />
    );
  }

  return (
    <CategoryChart
      data={chartData.map(d => ({ categoryName: d.name, total: d.value }))}
      title="Gastos por Categoria"
      description="Distribuição dos gastos por categoria"
      icon={PieChartIcon}
      topN={5}
      height={320}
    />
  );
});

export { CategoryBreakdownChart };
