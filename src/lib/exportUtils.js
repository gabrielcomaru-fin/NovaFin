// Utilitários para exportação de dados
import { format, parseISO } from 'date-fns';
import { jsPDF } from 'jspdf';

// Função para exportar dados como CSV
export const exportToCSV = (data, filename, headers) => {
  if (!data || data.length === 0) {
    throw new Error('Nenhum dado para exportar');
  }

  // Criar cabeçalhos
  const csvHeaders = headers || Object.keys(data[0]);
  const csvContent = [
    csvHeaders.join(','),
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Escapar vírgulas e aspas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  // Criar e baixar arquivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Função para exportar dados como JSON
export const exportToJSON = (data, filename) => {
  if (!data) {
    throw new Error('Nenhum dado para exportar');
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Função para formatar dados de gastos para exportação
export const formatExpensesForExport = (expenses, categories) => {
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.nome;
    return acc;
  }, {});

  return expenses.map(expense => ({
    'Data': format(parseISO(expense.data), 'dd/MM/yyyy'),
    'Descrição': expense.descricao || '',
    'Valor': expense.valor,
    'Categoria': categoryMap[expense.categoria_id] || 'Sem categoria',
    'Status': expense.pago ? 'Pago' : 'Pendente',
    'Data de Criação': format(parseISO(expense.created_at), 'dd/MM/yyyy HH:mm')
  }));
};

// Função para formatar dados de investimentos para exportação
export const formatInvestmentsForExport = (investments, categories, accounts) => {
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.nome;
    return acc;
  }, {});

  const accountMap = accounts.reduce((map, account) => {
    map[account.id] = account.nome;
    return map;
  }, {});

  return investments.map(investment => ({
    'Data': format(parseISO(investment.data), 'dd/MM/yyyy'),
    'Descrição': investment.descricao || '',
    'Valor do Aporte': investment.valor_aporte,
    'Saldo Total': investment.saldo_total || 0,
    'Categoria': categoryMap[investment.categoria_id] || 'Sem categoria',
    'Instituição': accountMap[investment.instituicao_id] || 'Sem instituição',
    'Data de Criação': format(parseISO(investment.created_at), 'dd/MM/yyyy HH:mm')
  }));
};

// Função para formatar dados de contas para exportação
export const formatAccountsForExport = (accounts) => {
  return accounts.map(account => ({
    'Nome': account.nome,
    'Tipo': account.tipo,
    'Saldo': account.saldo || 0,
    'Descrição': account.descricao || '',
    'Data de Criação': format(parseISO(account.created_at), 'dd/MM/yyyy HH:mm')
  }));
};

// Função para gerar relatório completo
export const generateFullReport = (expenses, investments, accounts, categories, period) => {
  // Maps auxiliares
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.nome;
    return acc;
  }, {});

  // Quebras e somatórios
  const expensesByCategory = expenses.reduce((map, exp) => {
    const key = categoryMap[exp.categoria_id] || 'Sem categoria';
    map[key] = (map[key] || 0) + (exp.valor || 0);
    return map;
  }, {});

  const investmentsByCategory = investments.reduce((map, inv) => {
    const key = categoryMap[inv.categoria_id] || 'Sem categoria';
    map[key] = (map[key] || 0) + (inv.valor_aporte || 0);
    return map;
  }, {});

  // Top N
  const topExpenses = [...expenses]
    .sort((a, b) => (b.valor || 0) - (a.valor || 0))
    .slice(0, 10)
    .map((e) => ({
      data: format(parseISO(e.data), 'dd/MM/yyyy'),
      descricao: e.descricao || '',
      valor: e.valor || 0,
      categoria: categoryMap[e.categoria_id] || 'Sem categoria',
    }));

  // Insights simples
  const totalGastos = expenses.reduce((sum, exp) => sum + (exp.valor || 0), 0);
  const totalInvestimentos = investments.reduce((sum, inv) => sum + (inv.valor_aporte || 0), 0);
  const totalPatrimonio = accounts.reduce((sum, acc) => sum + (acc.saldo || 0), 0);
  const gastosPagos = expenses.filter(exp => exp.pago).reduce((sum, exp) => sum + (exp.valor || 0), 0);
  const gastosPendentes = expenses.filter(exp => !exp.pago).reduce((sum, exp) => sum + (exp.valor || 0), 0);
  const savingsRate = (totalInvestimentos + gastosPagos) > 0 ? (totalInvestimentos / (totalInvestimentos + gastosPagos)) * 100 : 0;

  // Média diária e projeção (estimativa baseada em dias com movimento)
  const byDate = expenses.reduce((map, exp) => {
    const key = format(parseISO(exp.data), 'yyyy-MM-dd');
    map[key] = (map[key] || 0) + (exp.valor || 0);
    return map;
  }, {});
  const uniqueDays = Object.keys(byDate).length || 1;
  const avgDailyExpense = totalGastos / uniqueDays;
  const projectedExpense = avgDailyExpense * Math.max(uniqueDays, 30); // heurística simples

  const report = {
    periodo: period,
    dataGeracao: format(new Date(), 'dd/MM/yyyy HH:mm'),
    resumo: {
      totalGastos,
      totalInvestimentos,
      totalPatrimonio,
      gastosPagos,
      gastosPendentes,
      savingsRate: Number(savingsRate.toFixed(1)),
      avgDailyExpense: Number(avgDailyExpense.toFixed(2)),
      projectedExpense: Number(projectedExpense.toFixed(2)),
    },
    gastos: formatExpensesForExport(expenses, categories),
    investimentos: formatInvestmentsForExport(investments, categories, accounts),
    contas: formatAccountsForExport(accounts),
    breakdowns: {
      gastosPorCategoria: Object.entries(expensesByCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([categoria, total]) => ({ categoria, total })),
      investimentosPorCategoria: Object.entries(investmentsByCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([categoria, total]) => ({ categoria, total })),
      topGastos: topExpenses,
    }
  };

  return report;
};

// Função para exportar relatório em PDF (simulado - na prática usaria uma biblioteca como jsPDF)
export const exportToPDF = (report, filename) => {
  if (!report) {
    throw new Error('Nenhum dado para exportar');
  }

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Relatório Financeiro - NovaFin', pageWidth / 2, y, { align: 'center' });
  y += 24;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Período: ${report.periodo}`, margin, y);
  doc.text(`Gerado em: ${report.dataGeracao}`, pageWidth - margin, y, { align: 'right' });
  y += 20;

  // Helpers
  const ensurePageSpace = (needed = 14) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
      addFooter();
    }
  };

  const addSectionTitle = (title) => {
    ensurePageSpace(24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
  };

  // Resumo
  const resumo = report.resumo || {};
  addSectionTitle('Resumo');
  const linhasResumo = [
    `Total de Gastos: R$ ${(resumo.totalGastos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `Total Investido: R$ ${(resumo.totalInvestimentos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `Patrimônio Estimado: R$ ${(resumo.totalPatrimonio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `Gastos Pagos: R$ ${(resumo.gastosPagos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `Gastos Pendentes: R$ ${(resumo.gastosPendentes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `Taxa de Poupança: ${(resumo.savingsRate || 0).toFixed(1)}%`,
    `Média diária de gastos: R$ ${(resumo.avgDailyExpense || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `Projeção de gastos (heurística): R$ ${(resumo.projectedExpense || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
  ];
  linhasResumo.forEach((linha) => {
    ensurePageSpace();
    doc.text(linha, margin, y);
    y += 14;
  });

  // Quebra por categoria (Top 5)
  if (report.breakdowns?.gastosPorCategoria?.length) {
    addSectionTitle('Categorias - Gastos (Top 5)');
    report.breakdowns.gastosPorCategoria.slice(0, 5).forEach((item) => {
      ensurePageSpace();
      const linha = `${item.categoria}: R$ ${Number(item.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      doc.text(linha, margin, y);
      y += 14;
    });
  }

  if (report.breakdowns?.investimentosPorCategoria?.length) {
    addSectionTitle('Categorias - Investimentos (Top 5)');
    report.breakdowns.investimentosPorCategoria.slice(0, 5).forEach((item) => {
      ensurePageSpace();
      const linha = `${item.categoria}: R$ ${Number(item.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      doc.text(linha, margin, y);
      y += 14;
    });
  }

  // Top gastos
  if (report.breakdowns?.topGastos?.length) {
    addSectionTitle('Maiores Gastos (Top 10)');
    report.breakdowns.topGastos.forEach((g) => {
      ensurePageSpace();
      const text = `${g.data} • ${g.descricao || 'Sem descrição'} • ${g.categoria} • R$ ${Number(g.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      const wrapped = doc.splitTextToSize(text, pageWidth - margin * 2);
      wrapped.forEach((line) => {
        ensurePageSpace();
        doc.text(line, margin, y);
        y += 14;
      });
    });
  }

  // Rodapé básico
  const addFooter = () => {
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Gerado por NovaFin', pageWidth / 2, footerY, { align: 'center' });
    doc.setTextColor(0);
  };
  addFooter();

  doc.save(`${filename}.pdf`);
};
