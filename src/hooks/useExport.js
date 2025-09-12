import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { 
  exportToCSV, 
  exportToJSON, 
  formatExpensesForExport, 
  formatInvestmentsForExport, 
  formatAccountsForExport,
  generateFullReport 
} from '@/lib/exportUtils';

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportData = useCallback(async (exportFn, filename, type) => {
    try {
      setIsExporting(true);
      await exportFn();
      
      toast({
        title: "Exportação concluída",
        description: `Arquivo ${filename} exportado com sucesso!`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: error.message || "Ocorreu um erro ao exportar os dados.",
      });
    } finally {
      setIsExporting(false);
    }
  }, [toast]);

  const exportExpenses = useCallback((expenses, categories, filename = 'gastos') => {
    const formattedData = formatExpensesForExport(expenses, categories);
    const headers = ['Data', 'Descrição', 'Valor', 'Categoria', 'Status', 'Data de Criação'];
    
    exportData(
      () => exportToCSV(formattedData, filename, headers),
      `${filename}.csv`,
      'CSV'
    );
  }, [exportData]);

  const exportInvestments = useCallback((investments, categories, accounts, filename = 'investimentos') => {
    const formattedData = formatInvestmentsForExport(investments, categories, accounts);
    const headers = ['Data', 'Descrição', 'Valor do Aporte', 'Saldo Total', 'Categoria', 'Instituição', 'Data de Criação'];
    
    exportData(
      () => exportToCSV(formattedData, filename, headers),
      `${filename}.csv`,
      'CSV'
    );
  }, [exportData]);

  const exportAccounts = useCallback((accounts, filename = 'contas') => {
    const formattedData = formatAccountsForExport(accounts);
    const headers = ['Nome', 'Tipo', 'Saldo', 'Descrição', 'Data de Criação'];
    
    exportData(
      () => exportToCSV(formattedData, filename, headers),
      `${filename}.csv`,
      'CSV'
    );
  }, [exportData]);

  const exportFullReport = useCallback((expenses, investments, accounts, categories, period, format = 'JSON') => {
    const report = generateFullReport(expenses, investments, accounts, categories, period);
    const filename = `relatorio-financeiro-${period}`;
    
    if (format === 'JSON') {
      exportData(
        () => exportToJSON(report, filename),
        `${filename}.json`,
        'JSON'
      );
    } else {
      // Para CSV, exportar cada seção separadamente
      exportData(
        () => {
          exportToCSV(report.gastos, `${filename}-gastos`, Object.keys(report.gastos[0] || {}));
          exportToCSV(report.investimentos, `${filename}-investimentos`, Object.keys(report.investimentos[0] || {}));
          exportToCSV(report.contas, `${filename}-contas`, Object.keys(report.contas[0] || {}));
        },
        `${filename}-completo`,
        'CSV'
      );
    }
  }, [exportData]);

  const exportFilteredData = useCallback((data, type, filename, format = 'CSV') => {
    if (!data || data.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum dado para exportar",
        description: "Não há dados disponíveis para o período selecionado.",
      });
      return;
    }

    const exportFn = format === 'CSV' ? exportToCSV : exportToJSON;
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    
    exportData(
      () => exportFn(data, filename, headers),
      `${filename}.${format.toLowerCase()}`,
      format
    );
  }, [exportData, toast]);

  return {
    isExporting,
    exportExpenses,
    exportInvestments,
    exportAccounts,
    exportFullReport,
    exportFilteredData,
  };
};
