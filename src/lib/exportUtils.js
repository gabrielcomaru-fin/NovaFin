// Utilitários para exportação de dados
import { format, parseISO } from 'date-fns';

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

  const accountMap = accounts.reduce((acc, acc) => {
    acc[acc.id] = acc.nome;
    return acc;
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
  const report = {
    periodo: period,
    dataGeracao: format(new Date(), 'dd/MM/yyyy HH:mm'),
    resumo: {
      totalGastos: expenses.reduce((sum, exp) => sum + exp.valor, 0),
      totalInvestimentos: investments.reduce((sum, inv) => sum + inv.valor_aporte, 0),
      totalPatrimonio: accounts.reduce((sum, acc) => sum + (acc.saldo || 0), 0),
      gastosPagos: expenses.filter(exp => exp.pago).reduce((sum, exp) => sum + exp.valor, 0),
      gastosPendentes: expenses.filter(exp => !exp.pago).reduce((sum, exp) => sum + exp.valor, 0)
    },
    gastos: formatExpensesForExport(expenses, categories),
    investimentos: formatInvestmentsForExport(investments, categories, accounts),
    contas: formatAccountsForExport(accounts)
  };

  return report;
};

// Função para exportar relatório em PDF (simulado - na prática usaria uma biblioteca como jsPDF)
export const exportToPDF = (data, filename) => {
  // Esta é uma implementação simulada
  // Na prática, você usaria uma biblioteca como jsPDF ou react-pdf
  console.log('Exportando para PDF:', filename, data);
  
  // Por enquanto, vamos exportar como JSON
  exportToJSON(data, filename);
};
