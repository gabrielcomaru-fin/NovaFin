import { useCallback } from 'react';
import jsPDF from 'jspdf';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useAdvancedMetrics } from './useAdvancedMetrics';
import { useSmartInsights } from './useSmartInsights';
import { useScenarioAnalysis } from './useScenarioAnalysis';

export const useAdvancedExport = () => {
  const { expenses, investments, accounts, categories } = useFinance();
  const { financialHealth, trends } = useAdvancedMetrics();
  const { insights, recommendations } = useSmartInsights();
  const { investmentScenarios, spendingScenarios, retirementScenarios } = useScenarioAnalysis();

  // Exportar para PDF
  const exportToPDF = useCallback(async (reportData, format = 'comprehensive') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Função para adicionar nova página
    const addNewPage = () => {
      doc.addPage();
      yPosition = 20;
    };

    // Função para verificar se precisa de nova página
    const checkPageBreak = (requiredSpace = 20) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        addNewPage();
      }
    };

    // Cabeçalho
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório Financeiro Personalizado', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Resumo Executivo
    if (format === 'comprehensive' || format === 'executive') {
      checkPageBreak(30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo Executivo', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.valor, 0);
      const totalInvestments = investments.reduce((sum, investment) => sum + investment.valor_aporte, 0);
      const totalAccounts = accounts.reduce((sum, account) => sum + (account.saldo || 0), 0);
      
      doc.text(`• Total de Gastos: R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPosition);
      yPosition += 6;
      doc.text(`• Total de Investimentos: R$ ${totalInvestments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPosition);
      yPosition += 6;
      doc.text(`• Saldo Total: R$ ${totalAccounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPosition);
      yPosition += 6;
      doc.text(`• Score de Saúde Financeira: ${financialHealth?.financialHealthScore || 0}/100`, 20, yPosition);
      yPosition += 15;
    }

    // Métricas Financeiras
    if (format === 'comprehensive' || format === 'metrics') {
      checkPageBreak(40);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Métricas Financeiras', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (financialHealth) {
        doc.text(`• Taxa de Poupança: ${financialHealth.savingsRate.toFixed(1)}%`, 20, yPosition);
        yPosition += 6;
        doc.text(`• Razão de Liquidez: ${financialHealth.liquidityRatio.toFixed(1)} meses`, 20, yPosition);
        yPosition += 6;
        doc.text(`• Diversificação: ${financialHealth.investmentDiversification.toFixed(1)}%`, 20, yPosition);
        yPosition += 6;
        doc.text(`• Eficiência Orçamentária: ${financialHealth.budgetEfficiency.toFixed(1)}%`, 20, yPosition);
        yPosition += 15;
      }
    }

    // Insights e Recomendações
    if (format === 'comprehensive' || format === 'insights') {
      if (insights && insights.length > 0) {
        checkPageBreak(30);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Insights Inteligentes', 20, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        insights.slice(0, 5).forEach((insight, index) => {
          checkPageBreak(15);
          doc.text(`${index + 1}. ${insight.title}`, 20, yPosition);
          yPosition += 6;
          doc.text(`   ${insight.message}`, 20, yPosition);
          yPosition += 6;
          if (insight.recommendation) {
            doc.text(`   Recomendação: ${insight.recommendation}`, 20, yPosition);
            yPosition += 6;
          }
          yPosition += 5;
        });
      }
    }

    // Análise de Cenários
    if (format === 'comprehensive' || format === 'scenarios') {
      checkPageBreak(40);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Análise de Cenários', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (investmentScenarios) {
        doc.text('Cenários de Investimento (10 anos):', 20, yPosition);
        yPosition += 6;
        
        Object.values(investmentScenarios).forEach((scenario) => {
          checkPageBreak(15);
          doc.text(`• ${scenario.name}: R$ ${scenario.projection.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }
    }

    // Tabela de Gastos
    if (format === 'comprehensive' || format === 'detailed') {
      checkPageBreak(30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalhamento de Gastos', 20, yPosition);
      yPosition += 10;

      // Cabeçalho da tabela
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Data', 20, yPosition);
      doc.text('Descrição', 50, yPosition);
      doc.text('Valor', 120, yPosition);
      doc.text('Categoria', 150, yPosition);
      yPosition += 6;

      // Linhas da tabela
      doc.setFont('helvetica', 'normal');
      expenses.slice(0, 20).forEach((expense) => {
        checkPageBreak(8);
        const category = categories.find(c => c.id === expense.categoria_id);
        doc.text(expense.data, 20, yPosition);
        doc.text(expense.descricao.substring(0, 20), 50, yPosition);
        doc.text(`R$ ${expense.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 120, yPosition);
        doc.text(category?.nome || 'N/A', 150, yPosition);
        yPosition += 6;
      });
    }

    // Tabela de Investimentos
    if (format === 'comprehensive' || format === 'detailed') {
      checkPageBreak(30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalhamento de Investimentos', 20, yPosition);
      yPosition += 10;

      // Cabeçalho da tabela
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Data', 20, yPosition);
      doc.text('Descrição', 50, yPosition);
      doc.text('Valor', 120, yPosition);
      doc.text('Categoria', 150, yPosition);
      yPosition += 6;

      // Linhas da tabela
      doc.setFont('helvetica', 'normal');
      investments.slice(0, 20).forEach((investment) => {
        checkPageBreak(8);
        const category = categories.find(c => c.id === investment.categoria_id);
        doc.text(investment.data, 20, yPosition);
        doc.text(investment.descricao?.substring(0, 20) || 'Investimento', 50, yPosition);
        doc.text(`R$ ${investment.valor_aporte.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 120, yPosition);
        doc.text(category?.nome || 'N/A', 150, yPosition);
        yPosition += 6;
      });
    }

    // Rodapé
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório gerado pelo NovaFin - Sistema de Controle Financeiro Pessoal', pageWidth / 2, pageHeight - 10, { align: 'center' });

    return doc.save('relatorio-financeiro.pdf');
  }, [expenses, investments, accounts, categories, financialHealth, insights, investmentScenarios]);

  // Exportar para Excel (CSV)
  const exportToCSV = useCallback(async (reportData, format = 'comprehensive') => {
    let csvContent = '';
    
    // Cabeçalho do relatório
    csvContent += 'Relatório Financeiro Personalizado\n';
    csvContent += `Gerado em: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    
    // Resumo Executivo
    if (format === 'comprehensive' || format === 'executive') {
      csvContent += 'RESUMO EXECUTIVO\n';
      csvContent += 'Métrica,Valor\n';
      
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.valor, 0);
      const totalInvestments = investments.reduce((sum, investment) => sum + investment.valor_aporte, 0);
      const totalAccounts = accounts.reduce((sum, account) => sum + (account.saldo || 0), 0);
      
      csvContent += `Total de Gastos,R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      csvContent += `Total de Investimentos,R$ ${totalInvestments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      csvContent += `Saldo Total,R$ ${totalAccounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      csvContent += `Score de Saúde Financeira,${financialHealth?.financialHealthScore || 0}/100\n\n`;
    }
    
    // Métricas Financeiras
    if (format === 'comprehensive' || format === 'metrics') {
      csvContent += 'MÉTRICAS FINANCEIRAS\n';
      csvContent += 'Métrica,Valor\n';
      
      if (financialHealth) {
        csvContent += `Taxa de Poupança,${financialHealth.savingsRate.toFixed(1)}%\n`;
        csvContent += `Razão de Liquidez,${financialHealth.liquidityRatio.toFixed(1)} meses\n`;
        csvContent += `Diversificação,${financialHealth.investmentDiversification.toFixed(1)}%\n`;
        csvContent += `Eficiência Orçamentária,${financialHealth.budgetEfficiency.toFixed(1)}%\n\n`;
      }
    }
    
    // Gastos detalhados
    if (format === 'comprehensive' || format === 'detailed') {
      csvContent += 'GASTOS DETALHADOS\n';
      csvContent += 'Data,Descrição,Valor,Categoria,Pago\n';
      
      expenses.forEach((expense) => {
        const category = categories.find(c => c.id === expense.categoria_id);
        csvContent += `${expense.data},"${expense.descricao}",R$ ${expense.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })},${category?.nome || 'N/A'},${expense.pago ? 'Sim' : 'Não'}\n`;
      });
      csvContent += '\n';
    }
    
    // Investimentos detalhados
    if (format === 'comprehensive' || format === 'detailed') {
      csvContent += 'INVESTIMENTOS DETALHADOS\n';
      csvContent += 'Data,Descrição,Valor Aporte,Saldo Total,Categoria\n';
      
      investments.forEach((investment) => {
        const category = categories.find(c => c.id === investment.categoria_id);
        csvContent += `${investment.data},"${investment.descricao || 'Investimento'}",R$ ${investment.valor_aporte.toLocaleString('pt-BR', { minimumFractionDigits: 2 })},R$ ${(investment.saldo_total || investment.valor_aporte).toLocaleString('pt-BR', { minimumFractionDigits: 2 })},${category?.nome || 'N/A'}\n`;
      });
      csvContent += '\n';
    }
    
    // Insights
    if (format === 'comprehensive' || format === 'insights') {
      csvContent += 'INSIGHTS E RECOMENDAÇÕES\n';
      csvContent += 'Tipo,Título,Mensagem,Recomendação\n';
      
      if (insights) {
        insights.forEach((insight) => {
          csvContent += `${insight.type},"${insight.title}","${insight.message}","${insight.recommendation || ''}"\n`;
        });
      }
      csvContent += '\n';
    }
    
    // Cenários de investimento
    if (format === 'comprehensive' || format === 'scenarios') {
      csvContent += 'CENÁRIOS DE INVESTIMENTO (10 ANOS)\n';
      csvContent += 'Cenário,Retorno Anual,Valor Projetado,Total Investido,Ganhos\n';
      
      if (investmentScenarios) {
        Object.values(investmentScenarios).forEach((scenario) => {
          csvContent += `${scenario.name},${(scenario.annualReturn * 100).toFixed(1)}%,R$ ${scenario.projection.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })},R$ ${scenario.projection.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })},R$ ${scenario.projection.totalGains.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
        });
      }
    }
    
    // Download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'relatorio-financeiro.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [expenses, investments, accounts, categories, financialHealth, insights, investmentScenarios]);

  // Exportar para JSON
  const exportToJSON = useCallback(async (reportData, format = 'comprehensive') => {
    const jsonData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        format: format,
        version: '1.0'
      },
      summary: {
        totalExpenses: expenses.reduce((sum, expense) => sum + expense.valor, 0),
        totalInvestments: investments.reduce((sum, investment) => sum + investment.valor_aporte, 0),
        totalAccounts: accounts.reduce((sum, account) => sum + (account.saldo || 0), 0),
        financialHealthScore: financialHealth?.financialHealthScore || 0
      },
      financialHealth: financialHealth,
      trends: trends,
      insights: insights,
      recommendations: recommendations,
      scenarios: {
        investment: investmentScenarios,
        spending: spendingScenarios,
        retirement: retirementScenarios
      },
      data: {
        expenses: expenses,
        investments: investments,
        accounts: accounts,
        categories: categories
      }
    };
    
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'relatorio-financeiro.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [expenses, investments, accounts, categories, financialHealth, trends, insights, recommendations, investmentScenarios, spendingScenarios, retirementScenarios]);

  return {
    exportToPDF,
    exportToCSV,
    exportToJSON
  };
};
