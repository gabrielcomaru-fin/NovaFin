
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input, CurrencyInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Receipt, Repeat } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceDataContext';

export function ExpenseForm({ onSubmit, expenseToEdit, onOpenChange, isOpen }) {
  const { categories } = useFinance();
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    categoria_id: '',
    recorrente: false,
    data: new Date().toISOString().split('T')[0]
  });

  const expenseCategories = categories.filter(c => c.tipo === 'gasto');

  useEffect(() => {
    if (expenseToEdit && expenseToEdit.id) {
      setFormData({
        descricao: expenseToEdit.descricao || '',
        valor: expenseToEdit.valor?.toString() || '',
        categoria_id: expenseToEdit.categoria_id || '',
        recorrente: expenseToEdit.recorrente || false,
        data: new Date(expenseToEdit.data).toISOString().split('T')[0]
      });
    } else {
      setFormData({
        descricao: '',
        valor: '',
        categoria_id: '',
        recorrente: false,
        data: new Date().toISOString().split('T')[0]
      });
    }
  }, [expenseToEdit, isOpen]);

  const parseCurrency = (value) => {
    if (!value) return 0;
    return parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      valor: parseCurrency(formData.valor)
    }, expenseToEdit?.id);
  };
  
  const handleOpenChange = (open) => {
    onOpenChange(open);
    if (!open) {
      setFormData({
        descricao: '',
        valor: '',
        categoria_id: '',
        recorrente: false,
        data: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleCurrencyChange = (value) => {
    setFormData({ ...formData, valor: value });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!expenseToEdit?.id && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Despesa
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            {expenseToEdit?.id ? 'Editar Despesa' : 'Adicionar Despesa'}
          </DialogTitle>
          <DialogDescription>
            {expenseToEdit?.id ? 'Atualize os detalhes da sua despesa.' : 'Registre uma nova despesa para controlar seus gastos.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Almoço no restaurante"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <CurrencyInput
                id="amount"
                placeholder="0,00"
                value={formData.valor}
                onChange={handleCurrencyChange}
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
            <Select value={formData.categoria_id} onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.recorrente}
              onChange={(e) => setFormData({ ...formData, recorrente: e.target.checked })}
              className="rounded accent-primary"
            />
            <Label htmlFor="isRecurring" className="flex items-center gap-2 text-sm">
              <Repeat className="w-4 h-4" />
              Despesa recorrente
            </Label>
          </div>
          <Button type="submit" className="w-full">
            {expenseToEdit?.id ? 'Salvar Alterações' : 'Adicionar Despesa'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
