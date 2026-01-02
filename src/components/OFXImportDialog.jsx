import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { parseOfxFile } from '@/lib/ofx';
import { useToast } from '@/components/ui/use-toast';
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Calendar,
  DollarSign,
  Hash,
  Loader2
} from 'lucide-react';

/**
 * Componente reutilizável para importação de arquivos OFX
 * Suporta: despesas, receitas, investimentos
 * 
 * Props:
 * - isOpen: boolean - controla se o dialog está aberto
 * - onOpenChange: (open: boolean) => void - callback para mudança de estado
 * - type: 'expense' | 'income' | 'investment' - tipo de transação
 * - categories: array - lista de categorias disponíveis
 * - paymentMethods?: array - lista de meios de pagamento (opcional)
 * - institutions?: array - lista de instituições (para investimentos)
 * - existingTransactions: array - transações existentes para verificar duplicatas
 * - onImport: (transactions: array) => Promise<{id: string}[]> - callback para importar transações, retorna os registros criados
 * - onUndoImport?: (ids: string[]) => Promise<void> - callback para desfazer importação
 * - onClose: () => void - callback ao fechar
 */
export function OFXImportDialog({
  isOpen,
  onOpenChange,
  type = 'expense',
  categories = [],
  paymentMethods = [],
  institutions = [],
  existingTransactions = [],
  onImport,
  onUndoImport,
  onClose,
}) {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  // Estados principais
  const [step, setStep] = useState('upload'); // 'upload' | 'duplicates' | 'review' | 'importing' | 'complete'
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Transações do OFX
  const [ofxTransactions, setOfxTransactions] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState({}); // { index: boolean }
  const [perTxDescriptions, setPerTxDescriptions] = useState({});
  const [perTxCategories, setPerTxCategories] = useState({});
  const [perTxPaymentMethods, setPerTxPaymentMethods] = useState({});
  const [perTxInstitutions, setPerTxInstitutions] = useState({});
  
  // Configurações globais
  const [globalCategoryId, setGlobalCategoryId] = useState('');
  const [globalPaymentMethod, setGlobalPaymentMethod] = useState('');
  const [globalInstitution, setGlobalInstitution] = useState('');
  const [markAsPaid, setMarkAsPaid] = useState(false);
  
  // Duplicatas
  const [duplicatesFound, setDuplicatesFound] = useState([]);
  const [duplicateDecisions, setDuplicateDecisions] = useState({});
  
  // Progresso da importação
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [importedIds, setImportedIds] = useState([]); // IDs das transações importadas para desfazer
  const [isUndoing, setIsUndoing] = useState(false);

  // Busca/filtro
  const [searchTerm, setSearchTerm] = useState('');

  // Configurações baseadas no tipo
  const config = useMemo(() => {
    const configs = {
      expense: {
        title: 'Importar Despesas do OFX',
        filterFn: (t) => (t.valor < 0) || (String(t.tipo).toUpperCase() === 'DEBIT'),
        transformValue: (v) => Math.abs(v),
        defaultDescription: 'Lançamento OFX',
        emptyMessage: 'Nenhuma despesa encontrada no OFX',
        emptyDescription: 'Verifique se o arquivo contém lançamentos de saída.',
        showPaymentMethods: true,
        showInstitutions: false,
        showPaidCheckbox: true,
        valueColor: 'text-red-600',
        icon: <DollarSign className="h-5 w-5 text-red-600" />,
      },
      income: {
        title: 'Importar Receitas do OFX',
        filterFn: (t) => (t.valor > 0) || (String(t.tipo).toUpperCase() === 'CREDIT'),
        transformValue: (v) => Math.abs(v),
        defaultDescription: 'Receita OFX',
        emptyMessage: 'Nenhuma receita encontrada no OFX',
        emptyDescription: 'Verifique se o arquivo contém lançamentos de entrada.',
        showPaymentMethods: false,
        showInstitutions: false,
        showPaidCheckbox: false,
        valueColor: 'text-green-600',
        icon: <DollarSign className="h-5 w-5 text-green-600" />,
      },
      investment: {
        title: 'Importar Aportes do OFX',
        filterFn: (t) => (t.valor < 0) || (String(t.tipo).toUpperCase() === 'DEBIT'),
        transformValue: (v) => Math.abs(v),
        defaultDescription: 'Aporte OFX',
        emptyMessage: 'Nenhum aporte encontrado no OFX',
        emptyDescription: 'Verifique se o arquivo contém lançamentos de saída relacionados a investimentos.',
        showPaymentMethods: false,
        showInstitutions: true,
        showPaidCheckbox: false,
        valueColor: 'text-blue-600',
        icon: <DollarSign className="h-5 w-5 text-blue-600" />,
      },
    };
    return configs[type] || configs.expense;
  }, [type]);

  // Formatador de moeda
  const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  // Categorização automática baseada no histórico
  const suggestCategory = useCallback((description) => {
    if (!description || !existingTransactions.length) return '';
    
    const lowerDesc = description.toLowerCase().trim();
    
    // Encontrar transações com descrição similar
    const similar = existingTransactions.find(t => {
      const existingDesc = (t.descricao || '').toLowerCase().trim();
      return existingDesc === lowerDesc || 
             existingDesc.includes(lowerDesc) || 
             lowerDesc.includes(existingDesc);
    });
    
    return similar?.categoria_id || '';
  }, [existingTransactions]);

  // Verificar duplicatas
  const checkForDuplicates = useCallback((txs) => {
    const duplicates = [];
    
    txs.forEach((ofxTx, ofxIndex) => {
      const ofxDate = ofxTx.data;
      const ofxDescription = ofxTx.descricao?.toLowerCase().trim() || '';
      const ofxValue = Number(ofxTx.valor) || 0;
      
      const duplicate = existingTransactions.find(existing => {
        const existingDate = existing.data;
        const existingDescription = existing.descricao?.toLowerCase().trim() || '';
        const existingValue = Number(existing.valor || existing.valor_aporte) || 0;
        
        // Verificar mesma data, descrição e valor
        return existingDate === ofxDate && 
               existingDescription === ofxDescription && 
               Math.abs(existingValue - Math.abs(ofxValue)) < 0.01;
      });
      
      if (duplicate) {
        duplicates.push({
          ofxIndex,
          ofxTransaction: ofxTx,
          existingTransaction: duplicate
        });
      }
    });
    
    return duplicates;
  }, [existingTransactions]);

  // Processar arquivo OFX
  const processFile = async (file) => {
    if (!file) return;
    
    setIsProcessing(true);
    try {
      const txs = await parseOfxFile(file);
      
      // Filtrar transações baseado no tipo
      const filteredTxs = txs
        .filter(config.filterFn)
        .map(t => ({ ...t, valor: config.transformValue(t.valor) }))
        // Ordenar por data decrescente para validação
        .sort((a, b) => {
          const dateA = new Date(a.data);
          const dateB = new Date(b.data);
          return dateB - dateA; // Decrescente (mais recente primeiro)
        });
      
      if (filteredTxs.length === 0) {
        toast({
          title: config.emptyMessage,
          description: config.emptyDescription,
          variant: 'destructive'
        });
        return;
      }
      
      // Verificar duplicatas
      const duplicates = checkForDuplicates(filteredTxs);
      setDuplicatesFound(duplicates);
      setDuplicateDecisions({});
      
      // Preparar estados
      setOfxTransactions(filteredTxs);
      
      // Inicializar seleção (todas selecionadas por padrão)
      const initialSelection = {};
      filteredTxs.forEach((_, idx) => {
        initialSelection[idx] = true;
      });
      setSelectedTransactions(initialSelection);
      
      // Inicializar descrições
      const descriptions = {};
      const suggestedCategories = {};
      filteredTxs.forEach((t, idx) => {
        descriptions[idx] = t.descricao || config.defaultDescription;
        // Categorização automática
        const suggested = suggestCategory(t.descricao);
        if (suggested) {
          suggestedCategories[idx] = suggested;
        }
      });
      setPerTxDescriptions(descriptions);
      setPerTxCategories(suggestedCategories);
      setPerTxPaymentMethods({});
      setPerTxInstitutions({});
      
      // Determinar próximo passo
      if (duplicates.length > 0) {
        setStep('duplicates');
      } else {
        setStep('review');
      }
    } catch (err) {
      toast({
        title: 'Falha ao ler OFX',
        description: err?.message || 'Formato inválido.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handlers de drag and drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processMultipleFiles(Array.from(files));
    }
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processMultipleFiles(Array.from(files));
    }
    // Reset input para permitir selecionar o mesmo arquivo novamente
    if (e.target) e.target.value = '';
  };

  // Processar múltiplos arquivos OFX
  const processMultipleFiles = async (files) => {
    if (!files || files.length === 0) return;
    
    console.log('[OFX Import] Iniciando processamento de', files.length, 'arquivo(s)');
    setIsProcessing(true);
    const allTransactions = [];
    const errors = [];
    
    try {
      for (const file of files) {
        console.log('[OFX Import] Processando arquivo:', file.name, 'Tamanho:', file.size, 'bytes');
        try {
          const txs = await parseOfxFile(file);
          console.log('[OFX Import] Transações encontradas no arquivo:', txs.length);
          
          // Filtrar transações baseado no tipo
          const filteredTxs = txs
            .filter(config.filterFn)
            .map(t => ({ 
              ...t, 
              valor: config.transformValue(t.valor),
              sourceFile: file.name 
            }));
          
          console.log('[OFX Import] Transações após filtro (', type, '):', filteredTxs.length);
          allTransactions.push(...filteredTxs);
        } catch (err) {
          console.error('[OFX Import] Erro ao processar arquivo:', file.name, err);
          errors.push(`${file.name}: ${err?.message || 'Erro desconhecido'}`);
        }
      }
      
      console.log('[OFX Import] Total de transações:', allTransactions.length, 'Erros:', errors.length);
      
      if (allTransactions.length === 0) {
        const errorMessage = errors.length > 0 
          ? `Erros: ${errors.join(', ')}` 
          : config.emptyDescription;
        console.warn('[OFX Import] Nenhuma transação encontrada:', errorMessage);
        toast({
          title: config.emptyMessage,
          description: errorMessage,
          variant: 'destructive'
        });
        return;
      }
      
      if (errors.length > 0) {
        toast({
          title: 'Alguns arquivos tiveram erros',
          description: errors.join('; '),
          variant: 'destructive'
        });
      }
      
      // Verificar duplicatas
      const duplicates = checkForDuplicates(allTransactions);
      setDuplicatesFound(duplicates);
      setDuplicateDecisions({});
      
      // Preparar estados
      setOfxTransactions(allTransactions);
      
      // Inicializar seleção (todas selecionadas por padrão)
      const initialSelection = {};
      allTransactions.forEach((_, idx) => {
        initialSelection[idx] = true;
      });
      setSelectedTransactions(initialSelection);
      
      // Inicializar descrições
      const descriptions = {};
      const suggestedCategories = {};
      allTransactions.forEach((t, idx) => {
        descriptions[idx] = t.descricao || config.defaultDescription;
        // Categorização automática
        const suggested = suggestCategory(t.descricao);
        if (suggested) {
          suggestedCategories[idx] = suggested;
        }
      });
      setPerTxDescriptions(descriptions);
      setPerTxCategories(suggestedCategories);
      setPerTxPaymentMethods({});
      setPerTxInstitutions({});
      
      // Determinar próximo passo
      if (duplicates.length > 0) {
        setStep('duplicates');
      } else {
        setStep('review');
      }
    } catch (err) {
      toast({
        title: 'Falha ao processar arquivos',
        description: err?.message || 'Erro desconhecido.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Seleção de transações
  const handleToggleSelect = (index) => {
    setSelectedTransactions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSelectAll = () => {
    const allSelected = {};
    ofxTransactions.forEach((_, idx) => {
      allSelected[idx] = true;
    });
    setSelectedTransactions(allSelected);
  };

  const handleDeselectAll = () => {
    setSelectedTransactions({});
  };

  // Duplicatas
  const handleDuplicateDecision = (ofxIndex, decision) => {
    setDuplicateDecisions(prev => ({
      ...prev,
      [ofxIndex]: decision
    }));
  };

  const handleSkipAllDuplicates = () => {
    const skipDecisions = {};
    duplicatesFound.forEach(dup => {
      skipDecisions[dup.ofxIndex] = 'skip';
    });
    setDuplicateDecisions(skipDecisions);
  };

  const handleImportAllDuplicates = () => {
    const importDecisions = {};
    duplicatesFound.forEach(dup => {
      importDecisions[dup.ofxIndex] = 'import';
    });
    setDuplicateDecisions(importDecisions);
  };

  const handleProceedFromDuplicates = () => {
    // Remover transações marcadas como "ignorar" da lista
    const keptTransactions = [];
    const keptDescriptions = {};
    const keptCategories = {};
    const keptPaymentMethods = {};
    const keptInstitutions = {};
    const keptSelection = {};

    ofxTransactions.forEach((tx, idx) => {
      const isDuplicate = duplicatesFound.some(d => d.ofxIndex === idx);
      const decision = duplicateDecisions[idx];
      
      if (isDuplicate && decision === 'skip') {
        return; // Ignorar esta transação
      }
      
      const newIndex = keptTransactions.length;
      keptTransactions.push(tx);
      if (perTxDescriptions[idx] != null) keptDescriptions[newIndex] = perTxDescriptions[idx];
      if (perTxCategories[idx] != null) keptCategories[newIndex] = perTxCategories[idx];
      if (perTxPaymentMethods[idx] != null) keptPaymentMethods[newIndex] = perTxPaymentMethods[idx];
      if (perTxInstitutions[idx] != null) keptInstitutions[newIndex] = perTxInstitutions[idx];
      keptSelection[newIndex] = selectedTransactions[idx] ?? true;
    });

    setOfxTransactions(keptTransactions);
    setPerTxDescriptions(keptDescriptions);
    setPerTxCategories(keptCategories);
    setPerTxPaymentMethods(keptPaymentMethods);
    setPerTxInstitutions(keptInstitutions);
    setSelectedTransactions(keptSelection);
    setDuplicatesFound([]);
    setDuplicateDecisions({});

    if (keptTransactions.length > 0) {
      setStep('review');
    } else {
      toast({
        title: 'Nenhuma transação para importar',
        description: 'Todas as transações foram ignoradas.',
      });
      handleClose();
    }
  };

  // Confirmação da importação
  const handleConfirmImport = async () => {
    // Verificar se há categoria selecionada
    const hasAnyCategory = ofxTransactions.some((_, idx) => 
      selectedTransactions[idx] && (perTxCategories[idx] || globalCategoryId)
    );
    
    if (!hasAnyCategory) {
      toast({
        title: 'Selecione uma categoria',
        description: 'Defina ao menos a categoria padrão ou por item.',
        variant: 'destructive'
      });
      return;
    }

    // Verificar instituição para investimentos
    if (config.showInstitutions) {
      const hasAnyInstitution = ofxTransactions.some((_, idx) =>
        selectedTransactions[idx] && (perTxInstitutions[idx] || globalInstitution)
      );
      
      if (!hasAnyInstitution) {
        toast({
          title: 'Selecione uma instituição',
          description: 'Defina ao menos a instituição padrão ou por item.',
          variant: 'destructive'
        });
        return;
      }
    }

    setStep('importing');
    setImportProgress(0);
    setImportedCount(0);
    setSkippedCount(0);
    setErrorCount(0);
    setImportedIds([]);

    const transactionsToImport = [];
    
    ofxTransactions.forEach((t, idx) => {
      if (!selectedTransactions[idx]) {
        return; // Não selecionada
      }
      
      const categoria_id = perTxCategories[idx] || globalCategoryId;
      if (!categoria_id) return;

      const payload = {
        descricao: perTxDescriptions[idx] ?? t.descricao ?? config.defaultDescription,
        categoria_id,
        data: t.data || new Date().toISOString().split('T')[0],
      };
      
      // Adicionar valor apropriado baseado no tipo
      if (type === 'investment') {
        payload.valor_aporte = Number(t.valor) || 0;
      } else {
        payload.valor = Number(t.valor) || 0;
      }

      // Campos específicos por tipo
      if (config.showPaymentMethods) {
        payload.meio_pagamento_id = perTxPaymentMethods[idx] || globalPaymentMethod || null;
        payload.pago = markAsPaid;
        payload.recorrente = false;
      }

      if (config.showInstitutions) {
        payload.instituicao_id = perTxInstitutions[idx] || globalInstitution;
      }

      transactionsToImport.push(payload);
    });

    try {
      let success = 0;
      let errors = 0;
      const newIds = [];
      
      for (let i = 0; i < transactionsToImport.length; i++) {
        try {
          const result = await onImport([transactionsToImport[i]]);
          // Tentar capturar o ID do registro criado
          if (result && Array.isArray(result) && result[0]?.id) {
            newIds.push(result[0].id);
          } else if (result?.id) {
            newIds.push(result.id);
          }
          success++;
        } catch (e) {
          errors++;
        }
        
        setImportProgress(Math.round(((i + 1) / transactionsToImport.length) * 100));
        setImportedCount(success);
        setErrorCount(errors);
      }

      setImportedIds(newIds);
      setStep('complete');
      
      const skipped = ofxTransactions.length - transactionsToImport.length;
      setSkippedCount(skipped);

    } catch (e) {
      toast({
        title: 'Erro na importação',
        description: e?.message || 'Tente novamente.',
        variant: 'destructive'
      });
      setStep('review');
    }
  };

  // Desfazer última importação
  const handleUndoImport = async () => {
    if (!onUndoImport || importedIds.length === 0) return;
    
    setIsUndoing(true);
    try {
      await onUndoImport(importedIds);
      toast({
        title: 'Importação desfeita',
        description: `${importedIds.length} transações removidas com sucesso.`,
      });
      handleClose();
    } catch (e) {
      toast({
        title: 'Erro ao desfazer',
        description: e?.message || 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsUndoing(false);
    }
  };

  // Fechar e resetar
  const handleClose = () => {
    setStep('upload');
    setOfxTransactions([]);
    setSelectedTransactions({});
    setPerTxDescriptions({});
    setPerTxCategories({});
    setPerTxPaymentMethods({});
    setPerTxInstitutions({});
    setGlobalCategoryId('');
    setGlobalPaymentMethod('');
    setGlobalInstitution('');
    setMarkAsPaid(false);
    setDuplicatesFound([]);
    setDuplicateDecisions({});
    setImportProgress(0);
    setImportedCount(0);
    setSkippedCount(0);
    setErrorCount(0);
    setSearchTerm('');
    setIsDragging(false);
    setIsProcessing(false);
    setImportedIds([]);
    setIsUndoing(false);
    onClose?.();
    onOpenChange?.(false);
  };

  // Transações filtradas por busca
  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return ofxTransactions.map((t, idx) => ({ ...t, originalIndex: idx }));
    
    const lower = searchTerm.toLowerCase();
    return ofxTransactions
      .map((t, idx) => ({ ...t, originalIndex: idx }))
      .filter(t => 
        (perTxDescriptions[t.originalIndex] || t.descricao || '').toLowerCase().includes(lower) ||
        String(t.valor).includes(searchTerm)
      );
  }, [ofxTransactions, perTxDescriptions, searchTerm]);

  // Contadores
  const selectedCount = Object.values(selectedTransactions).filter(Boolean).length;
  const totalValue = ofxTransactions.reduce((sum, t, idx) => 
    selectedTransactions[idx] ? sum + (Number(t.valor) || 0) : sum, 0
  );

  // Verificar se transação é duplicata
  const isDuplicate = (index) => {
    return duplicatesFound.some(d => d.ofxIndex === index);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {config.icon}
            {config.title}
          </DialogTitle>
        </DialogHeader>

        {/* STEP: Upload */}
        {step === 'upload' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".ofx,.qfx,.ofc,.xml,.txt"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            
            <div
              className={`
                w-full max-w-md p-8 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer
                flex flex-col items-center justify-center gap-4
                ${isDragging 
                  ? 'border-primary bg-primary/10 scale-105' 
                  : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'}
                ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
              `}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Processando arquivo...</p>
                </>
              ) : (
                <>
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">
                      {isDragging ? 'Solte o(s) arquivo(s) aqui' : 'Arraste arquivo(s) OFX'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ou clique para selecionar (múltiplos arquivos suportados)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Formatos: .ofx, .qfx, .ofc, .xml, .txt</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP: Duplicatas */}
        {step === 'duplicates' && (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Foram encontradas <strong>{duplicatesFound.length}</strong> transação(ões) que podem ser duplicatas. Escolha o que fazer com cada uma.
              </p>
            </div>

            <div className="flex-1 overflow-auto border rounded-lg">
              {/* Header - Desktop */}
              <div className="hidden md:grid grid-cols-12 gap-2 p-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b sticky top-0">
                <div className="col-span-3">Descrição OFX</div>
                <div className="col-span-2">Data</div>
                <div className="col-span-2 text-right">Valor</div>
                <div className="col-span-3">Existente</div>
                <div className="col-span-2">Ação</div>
              </div>
              
              {duplicatesFound.map((dup) => (
                <div 
                  key={dup.ofxIndex} 
                  className="p-3 border-b last:border-b-0 bg-yellow-50/50 dark:bg-yellow-900/10"
                >
                  {/* Mobile */}
                  <div className="md:hidden space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{dup.ofxTransaction.descricao}</p>
                        <p className="text-xs text-muted-foreground">{dup.ofxTransaction.data}</p>
                      </div>
                      <span className={`font-bold ${config.valueColor}`}>
                        {currencyFormatter.format(Number(dup.ofxTransaction.valor) || 0)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Existente: {dup.existingTransaction.descricao}
                    </div>
                    <Select 
                      value={duplicateDecisions[dup.ofxIndex] || undefined}
                      onValueChange={(val) => handleDuplicateDecision(dup.ofxIndex, val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Escolher ação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="import">Importar mesmo assim</SelectItem>
                        <SelectItem value="skip">Ignorar (é duplicata)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Desktop */}
                  <div className="hidden md:grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3 text-sm truncate" title={dup.ofxTransaction.descricao}>
                      {dup.ofxTransaction.descricao}
                    </div>
                    <div className="col-span-2 text-xs">{dup.ofxTransaction.data}</div>
                    <div className={`col-span-2 text-right font-medium ${config.valueColor}`}>
                      {currencyFormatter.format(Number(dup.ofxTransaction.valor) || 0)}
                    </div>
                    <div className="col-span-3 text-xs text-muted-foreground truncate" title={dup.existingTransaction.descricao}>
                      {dup.existingTransaction.descricao}
                    </div>
                    <div className="col-span-2">
                      <Select 
                        value={duplicateDecisions[dup.ofxIndex] || undefined}
                        onValueChange={(val) => handleDuplicateDecision(dup.ofxIndex, val)}
                      >
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue placeholder="Escolher" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="import">Importar</SelectItem>
                          <SelectItem value="skip">Ignorar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleSkipAllDuplicates}>
                Ignorar Todas
              </Button>
              <Button variant="outline" size="sm" onClick={handleImportAllDuplicates}>
                Importar Todas
              </Button>
              <div className="flex-1" />
              <Button onClick={handleProceedFromDuplicates}>
                Prosseguir
              </Button>
            </div>
          </div>
        )}

        {/* STEP: Review */}
        {step === 'review' && (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Resumo em Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <Hash className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Selecionados</p>
                    <p className="text-lg font-bold">{selectedCount}/{ofxTransactions.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  {config.icon}
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className={`text-lg font-bold ${config.valueColor}`}>
                      {currencyFormatter.format(totalValue)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-2">
                <CardContent className="p-3 flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Período</p>
                    <p className="text-sm font-medium">
                      {ofxTransactions.length > 0 
                        ? `${ofxTransactions[ofxTransactions.length - 1]?.data} a ${ofxTransactions[0]?.data}`
                        : '-'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Configurações globais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Categoria padrão</label>
                <Select value={globalCategoryId || undefined} onValueChange={setGlobalCategoryId}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {config.showPaymentMethods && paymentMethods.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Meio de pagamento</label>
                  <Select 
                    value={globalPaymentMethod || undefined} 
                    onValueChange={(val) => setGlobalPaymentMethod(val === 'none' ? '' : val)}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não especificado</SelectItem>
                      {paymentMethods.map(pm => (
                        <SelectItem key={pm.id} value={String(pm.id)}>{pm.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {config.showInstitutions && institutions.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Instituição</label>
                  <Select value={globalInstitution || undefined} onValueChange={setGlobalInstitution}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutions.map(inst => (
                        <SelectItem key={inst.id} value={String(inst.id)}>{inst.nome_banco || inst.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {config.showPaidCheckbox && (
                <div className="flex items-center gap-2 pt-6">
                  <input 
                    id="markAsPaid" 
                    type="checkbox" 
                    className="rounded accent-primary h-4 w-4" 
                    checked={markAsPaid} 
                    onChange={(e) => setMarkAsPaid(e.target.checked)} 
                  />
                  <label htmlFor="markAsPaid" className="text-sm">Marcar como pago</label>
                </div>
              )}
            </div>

            {/* Busca e seleção em lote */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Buscar por descrição ou valor..."
                className="flex-1 min-w-[200px] px-3 py-2 border rounded-md text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Selecionar Todas
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                Desmarcar Todas
              </Button>
            </div>

            {/* Lista de transações */}
            <div className="flex-1 overflow-auto border rounded-lg">
              {/* Header - Desktop */}
              <div className="hidden md:grid grid-cols-12 gap-2 p-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b sticky top-0 z-10">
                <div className="col-span-1 text-center">✓</div>
                <div className="col-span-3">Descrição</div>
                <div className="col-span-2">Data</div>
                <div className="col-span-2 text-right">Valor</div>
                <div className="col-span-2">Categoria</div>
                <div className="col-span-2">
                  {config.showPaymentMethods ? 'Pagamento' : config.showInstitutions ? 'Instituição' : ''}
                </div>
              </div>

              {filteredTransactions.map((t) => {
                const idx = t.originalIndex;
                const isSelected = selectedTransactions[idx];
                const isDup = isDuplicate(idx);
                
                return (
                  <div 
                    key={idx} 
                    className={`
                      p-3 border-b last:border-b-0 transition-colors
                      ${isSelected ? 'bg-white dark:bg-background' : 'bg-muted/30 opacity-60'}
                      ${isDup ? 'border-l-4 border-l-yellow-500' : ''}
                    `}
                  >
                    {/* Mobile Layout - Cards */}
                    <div className="md:hidden space-y-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(idx)}
                          className="mt-1 h-4 w-4 rounded accent-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <input
                            className="w-full px-2 py-1 border rounded text-sm"
                            value={perTxDescriptions[idx] ?? t.descricao ?? config.defaultDescription}
                            onChange={(e) => setPerTxDescriptions(prev => ({ ...prev, [idx]: e.target.value }))}
                            disabled={!isSelected}
                          />
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-muted-foreground">{t.data}</span>
                            <span className={`font-bold ${config.valueColor}`}>
                              {currencyFormatter.format(Number(t.valor) || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pl-7">
                        <Select 
                          value={perTxCategories[idx] || globalCategoryId || undefined} 
                          onValueChange={(val) => setPerTxCategories(prev => ({ ...prev, [idx]: val }))}
                          disabled={!isSelected}
                        >
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="Categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(c => (
                              <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {config.showPaymentMethods && (
                          <Select 
                            value={perTxPaymentMethods[idx] || globalPaymentMethod || undefined}
                            onValueChange={(val) => setPerTxPaymentMethods(prev => ({ ...prev, [idx]: val === 'none' ? '' : val }))}
                            disabled={!isSelected}
                          >
                            <SelectTrigger className="w-full h-8 text-xs">
                              <SelectValue placeholder="Pagamento" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não especificado</SelectItem>
                              {paymentMethods.map(pm => (
                                <SelectItem key={pm.id} value={String(pm.id)}>{pm.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        
                        {config.showInstitutions && (
                          <Select 
                            value={perTxInstitutions[idx] || globalInstitution || undefined}
                            onValueChange={(val) => setPerTxInstitutions(prev => ({ ...prev, [idx]: val }))}
                            disabled={!isSelected}
                          >
                            <SelectTrigger className="w-full h-8 text-xs">
                              <SelectValue placeholder="Instituição" />
                            </SelectTrigger>
                            <SelectContent>
                              {institutions.map(inst => (
                                <SelectItem key={inst.id} value={String(inst.id)}>{inst.nome_banco || inst.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      
                      {isDup && (
                        <div className="flex items-center gap-1 text-xs text-yellow-600 pl-7">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Possível duplicata</span>
                        </div>
                      )}
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 flex justify-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(idx)}
                          className="h-4 w-4 rounded accent-primary"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          className="w-full px-2 py-1 border rounded text-sm"
                          value={perTxDescriptions[idx] ?? t.descricao ?? config.defaultDescription}
                          onChange={(e) => setPerTxDescriptions(prev => ({ ...prev, [idx]: e.target.value }))}
                          disabled={!isSelected}
                        />
                        {isDup && (
                          <div className="flex items-center gap-1 text-xs text-yellow-600 mt-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Possível duplicata</span>
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 text-xs">{t.data}</div>
                      <div className={`col-span-2 text-right font-medium ${config.valueColor}`}>
                        {currencyFormatter.format(Number(t.valor) || 0)}
                      </div>
                      <div className="col-span-2">
                        <Select 
                          value={perTxCategories[idx] || globalCategoryId || undefined} 
                          onValueChange={(val) => setPerTxCategories(prev => ({ ...prev, [idx]: val }))}
                          disabled={!isSelected}
                        >
                          <SelectTrigger className="w-full h-8">
                            <SelectValue placeholder="Categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(c => (
                              <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        {config.showPaymentMethods && (
                          <Select 
                            value={perTxPaymentMethods[idx] || globalPaymentMethod || undefined}
                            onValueChange={(val) => setPerTxPaymentMethods(prev => ({ ...prev, [idx]: val === 'none' ? '' : val }))}
                            disabled={!isSelected}
                          >
                            <SelectTrigger className="w-full h-8">
                              <SelectValue placeholder="Pagamento" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não especificado</SelectItem>
                              {paymentMethods.map(pm => (
                                <SelectItem key={pm.id} value={String(pm.id)}>{pm.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {config.showInstitutions && (
                          <Select 
                            value={perTxInstitutions[idx] || globalInstitution || undefined}
                            onValueChange={(val) => setPerTxInstitutions(prev => ({ ...prev, [idx]: val }))}
                            disabled={!isSelected}
                          >
                            <SelectTrigger className="w-full h-8">
                              <SelectValue placeholder="Instituição" />
                            </SelectTrigger>
                            <SelectContent>
                              {institutions.map(inst => (
                                <SelectItem key={inst.id} value={String(inst.id)}>{inst.nome_banco || inst.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmImport} disabled={selectedCount === 0}>
                Importar {selectedCount} {selectedCount === 1 ? 'item' : 'itens'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP: Importing */}
        {step === 'importing' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="text-center">
              <p className="font-medium text-lg">Importando transações...</p>
              <p className="text-sm text-muted-foreground mt-1">
                {importedCount} de {selectedCount} processados
              </p>
            </div>
            <div className="w-full max-w-md">
              <Progress value={importProgress} className="h-3" />
              <p className="text-center text-sm text-muted-foreground mt-2">
                {importProgress}%
              </p>
            </div>
          </div>
        )}

        {/* STEP: Complete */}
        {step === 'complete' && (
          <div className="flex-1 flex flex-col gap-6 p-6 overflow-auto">
            {/* Header de sucesso */}
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-medium text-lg">Importação concluída!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {importedCount} transações importadas com sucesso
                </p>
              </div>
            </div>

            {/* Resumo contextualizado */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Resumo da Importação
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-background rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground">Total importado</p>
                  <p className={`text-lg font-bold ${config.valueColor}`}>
                    {currencyFormatter.format(totalValue)}
                  </p>
                </div>
                <div className="bg-background rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground">Transações</p>
                  <p className="text-lg font-bold">{importedCount}</p>
                </div>
                <div className="bg-background rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground">Valor médio</p>
                  <p className="text-lg font-bold">
                    {currencyFormatter.format(importedCount > 0 ? totalValue / importedCount : 0)}
                  </p>
                </div>
              </div>

              {/* Categorização pendente */}
              {(() => {
                const uncategorized = ofxTransactions.filter((_, idx) => 
                  selectedTransactions[idx] && !perTxCategories[idx] && globalCategoryId
                ).length;
                const withSuggested = Object.values(perTxCategories).filter(Boolean).length;
                
                return (
                  <div className="space-y-2">
                    {withSuggested > 0 && (
                      <div className="flex items-center gap-2 text-sm text-success">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{withSuggested} transações com categoria sugerida automaticamente</span>
                      </div>
                    )}
                    {uncategorized > 0 && (
                      <div className="flex items-center gap-2 text-sm text-warning">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{uncategorized} transações usaram a categoria padrão</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Dica educativa */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <div className="text-sm">
                    <p className="font-medium text-primary">Dica:</p>
                    <p className="text-muted-foreground mt-1">
                      {type === 'expense' && 'Revise suas despesas e marque as recorrentes. Isso ajuda a prever gastos futuros!'}
                      {type === 'income' && 'Identifique suas fontes de renda principais para um melhor planejamento.'}
                      {type === 'investment' && 'Acompanhe seus aportes mensais para manter a consistência nos investimentos!'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Estatísticas adicionais */}
              {skippedCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {skippedCount} transações não foram selecionadas para importação
                </p>
              )}
              {errorCount > 0 && (
                <p className="text-xs text-red-600">
                  {errorCount} transações tiveram erro durante a importação
                </p>
              )}
            </div>

            {/* Ações */}
            <div className="flex flex-wrap justify-center gap-3">
              {onUndoImport && importedIds.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={handleUndoImport}
                  disabled={isUndoing}
                  className="flex items-center gap-2"
                >
                  {isUndoing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Desfazendo...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4" />
                      Desfazer Importação
                    </>
                  )}
                </Button>
              )}
              <Button onClick={handleClose}>
                Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

