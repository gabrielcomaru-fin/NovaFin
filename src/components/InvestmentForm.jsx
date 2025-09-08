import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input, CurrencyInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, TrendingUp, Target } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceDataContext';
import { useToast } from '@/components/ui/use-toast';

export function InvestmentForm({ onSubmit, investmentToEdit, onOpenChange, isOpen }) {
    const { investmentGoal, setInvestmentGoal, categories } = useFinance();
    const [formData, setFormData] = useState({
        descricao: '',
        valor_aporte: '',
        categoria_id: '',
        data: new Date().toISOString().split('T')[0]
    });
    
    const [goalFormData, setGoalFormData] = useState({
        goal: ''
    });

    const investmentCategories = categories.filter(c => c.tipo === 'investimento');
    
    const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (investmentToEdit && investmentToEdit.id) {
            setFormData({
                descricao: investmentToEdit.descricao || '',
                valor_aporte: investmentToEdit.valor_aporte?.toString() || '',
                categoria_id: investmentToEdit.categoria_id?.toString() || '',
                data: new Date(investmentToEdit.data).toISOString().split('T')[0]
            });
        } else {
             setFormData({
                descricao: '',
                valor_aporte: '',
                categoria_id: '',
                data: new Date().toISOString().split('T')[0]
            });
        }
    }, [investmentToEdit, isOpen]);

    useEffect(() => {
        setGoalFormData({ goal: investmentGoal?.toString() || '' });
    }, [investmentGoal, isGoalDialogOpen]);
    
    const parseCurrency = (value) => {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        return parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            valor_aporte: parseCurrency(formData.valor_aporte)
        }, investmentToEdit?.id);
    };

    const handleOpenChange = (open) => {
        onOpenChange(open);
        if (!open) {
             setFormData({
                descricao: '',
                valor_aporte: '',
                categoria_id: '',
                data: new Date().toISOString().split('T')[0]
            });
        }
    };
    
    const handleGoalSubmit = (e) => {
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

        setInvestmentGoal(newGoal);
        
        toast({
            title: "Meta atualizada!",
            description: `Nova meta mensal: R$ ${newGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        });

        setIsGoalDialogOpen(false);
    };
    
    const handleCurrencyChange = (value, field) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleGoalCurrencyChange = (value) => {
        setGoalFormData({ goal: value });
    };

    return (
        <div className="flex gap-2">
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
                            {investmentToEdit ? 'Editar Aporte' : 'Registrar Investimento'}
                        </DialogTitle>
                        <DialogDescription>
                            {investmentToEdit ? 'Atualize os detalhes do seu aporte.' : 'Adicione um novo aporte para seus investimentos.'}
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
                        <div className="space-y-2">
                            <Label htmlFor="category">Categoria</Label>
                            <Select value={formData.categoria_id} onValueChange={(value) => setFormData({ ...formData, categoria_id: value })} required>
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
                        </div>
                        <Button type="submit" className="w-full">
                            {investmentToEdit ? 'Salvar Alterações' : 'Registrar Aporte'}
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