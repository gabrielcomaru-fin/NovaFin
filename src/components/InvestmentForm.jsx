import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input, CurrencyInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, TrendingUp, Target } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

export function InvestmentForm({ onSubmit, investmentToEdit, onOpenChange, isOpen }) {
  const { investmentGoal, handleSetInvestmentGoal, categories, accounts } = useFinance();
  const { toast } = useToast();

  const investmentCategories = categories.filter(c => c.tipo === 'investimento');

  const defaultFormData = {
    descricao: '',
    valor_aporte: '',
    categoria_id: '',
    instituicao_id: '',
    data: new Date().toISOString().split('T')[0]
  };

  const defaultGoalFormData = { goal: '' };

  const [formData, setFormData] = useState(defaultFormData);
  const [goalFormData, setGoalFormData] = useState(defaultGoalFormData);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);

  const aporteRef = useRef(null);
  const goalRef = useRef(null);

  // Formatação para exibição correta no CurrencyInput
  const formatCurrencyForInput = (value) => {
    if (value == null || value === '') return '';
    const numberValue = Number(value);
    if (isNaN(numberValue)) return '';
    return numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  useEffect(() => {
    if (investmentToEdit?.id) {
      setFormData({
        descricao: investmentToEdit.descricao || '',
        valor_aporte: formatCurrencyForInput(investmentToEdit.valor_aporte),
        categoria_id: investmentToEdit.categoria_id?.toString() || '',
        instituicao_id: investmentToEdit.instituicao_id?.toString() || '',
        data: investmentToEdit.data ? new Date(investmentToEdit.data).toISOString().split('T')[0] : defaultFormData.data
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [investmentToEdit, isOpen]);

  useEffect(() => {
    setGoalFormData({ goal: formatCurrencyForInput(investmentGoal) });
  }, [investmentGoal, isGoalDialogOpen]);

  // Mantém cursor no final do input ao digitar ou editar
  useEffect(() => {
    const input = aporteRef.current?.input;
    if (input) {
      const length = input.value.length;
      input.setSelectionRange(length, length);
    }
  }, [formData.valor_aporte]);

  useEffect(() => {
    const input = goalRef.current?.input;
    if (input) {
      const length = input.value.length;
      input.setSelectionRange(length, length);
    }
  }, [goalFormData.goal]);

  const parseCurrency = (value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const normalized = String(value).replace(/\./g, '').replace(',', '.');
    const number = parseFloat(normalized);
    return isNaN(number) ? 0 : number;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedValor = parseCurrency(formData.valor_aporte);
    if (parsedValor <= 0) {
      toast({
        title: "Erro",
        description: "Informe um valor de aporte válido maior que zero.",
        variant: "destructive"
      });
      return;
    }
    onSubmit({ ...formData, valor_aporte: parsedValor }, investmentToEdit?.id);
    setFormData(defaultFormData);
  };

  const handleOpenChange = (open) => {
    onOpenChange(open);
    if (!open) setFormData(defaultFormData);
  };

  const handleCurrencyChange = (value, field) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleGoalCurrencyChange = (value) => {
    setGoalFormData({ goal: value });
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    const newGoal = parseCurrency(goalFormData.goal);
    if (isNaN(newGoal) || newGoal < 0) {
      toast({
        title: "Erro",
        description: "Defina um valor válido para a meta.",
        variant: "destructive"
      });
      return;
    }
    try {
      await handleSetInvestmentGoal(newGoal);
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível salvar a meta.', variant: 'destructive' });
      return;
    }
    toast({
      title: "Meta atualizada!",
      description: `Nova meta mensal: R$ ${newGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    });
    setIsGoalDialogOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      {Number(investmentGoal) > 0 && (
        <Badge variant="secondary">
          Meta atual: R$ {Number(investmentGoal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
        </Badge>
      )}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        {!investmentToEdit?.id && (
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Aporte
            </Button>
          </DialogTrigger>
        )}
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {investmentToEdit?.id ? 'Editar Aporte' : 'Registrar Investimento'}
            </DialogTitle>
            <DialogDescription>
              {investmentToEdit?.id ? 'Atualize os detalhes do seu aporte.' : 'Adicione um novo aporte para seus investimentos.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Input
                id="description"
                placeholder="Ex: Aporte mensal"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor do Aporte (R$)</Label>
                <CurrencyInput
                  id="amount"
                  placeholder="0,00"
                  value={formData.valor_aporte}
                  onChange={(value) => handleCurrencyChange(value, 'valor_aporte')}
                  ref={aporteRef}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                {investmentCategories.length > 0 ? (
                  <Select
                    value={formData.categoria_id}
                    onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {investmentCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma categoria de investimento disponível.</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="institution">Instituição Financeira</Label>
                {accounts.length > 0 ? (
                  <Select
                    value={formData.instituicao_id}
                    onValueChange={(value) => setFormData({ ...formData, instituicao_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma instituição" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.nome_banco}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma instituição financeira disponível.</p>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full">
              {investmentToEdit?.id ? 'Salvar Alterações' : 'Registrar Aporte'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Target className="w-4 h-4 mr-2" />
            Definir Meta
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir Meta de Aportes</DialogTitle>
            <DialogDescription>
              Defina sua meta mensal de investimentos para acompanhar seu progresso.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGoalSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goalAmount">Meta Mensal (R$)</Label>
              <CurrencyInput
                id="goalAmount"
                placeholder="0,00"
                value={goalFormData.goal}
                onChange={handleGoalCurrencyChange}
                ref={goalRef}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Definir Meta
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
