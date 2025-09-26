import React, { useMemo } from 'react';
import { CategoryChart } from '@/components/CategoryChart';
import { Building2 } from 'lucide-react';

export function InvestmentByInstitutionChart({ investments = [], accounts = [] }) {
  const chartData = useMemo(() => {
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

    return Object.entries(totals)
      .map(([name, total]) => ({ 
        categoryName: name, 
        total: total 
      }))
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [investments, accounts]);

  return (
    <CategoryChart
      data={chartData}
      title="Investimentos por Instituição"
      description="Distribuição dos aportes por instituição financeira"
      icon={Building2}
      topN={5}
      height={320}
    />
  );
}


