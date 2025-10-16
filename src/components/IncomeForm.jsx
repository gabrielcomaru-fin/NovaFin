import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input, CurrencyInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, DollarSign } from 'lucide-react';

export function IncomeForm({ onSubmit, incomeToEdit, onOpenChange, isOpen }) {
  const defaultFormData = {
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0]
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [errorMessage, setErrorMessage] = useState('');
  const currencyRef = useRef(null);

  const formatCurrencyForInput = (value) => {
    if (value == null || value === '') return '';
    const numberValue = Number(value);
    if (isNaN(numberValue)) return '';
    return numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  useEffect(() => {
    if (incomeToEdit?.id) {
      setFormData({
        descricao: incomeToEdit.descricao || '',
        valor: formatCurrencyForInput(incomeToEdit.valor),
        data: incomeToEdit.data ? new Date(incomeToEdit.data).toISOString().split('T')[0] : defaultFormData.data
      });
    } else {
      setFormData(defaultFormData);
    }
    setErrorMessage('');
  }, [incomeToEdit, isOpen]);

  useEffect(() => {
    const input = currencyRef.current?.input;
    if (input) {
      const length = input.value.length;
      input.setSelectionRange(length, length);
    }
  }, [formData.valor]);

  const parseCurrency = (value) => {
    if (!value) return 0;
    const normalized = String(value).replace(/\./g, '').replace(',', '.');
    const number = parseFloat(normalized);
    return isNaN(number) ? 0 : number;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const parsedValor = parseCurrency(formData.valor);

    if (parsedValor <= 0) {
      setErrorMessage('Informe um valor válido maior que zero.');
      return;
    }

    if (!formData.descricao.trim() || formData.descricao.trim().length < 3) {
      setErrorMessage('Descrição deve ter pelo menos 3 caracteres.');
      return;
    }

    onSubmit({ ...formData, valor: parsedValor }, incomeToEdit?.id);
    handleReset();
  };

  const handleReset = () => {
    setFormData(defaultFormData);
    setErrorMessage('');
  };

  const handleOpenChange = (open) => {
    onOpenChange(open);
    if (!open) handleReset();
  };

  const handleCurrencyChange = (value) => {
    setFormData({ ...formData, valor: value });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!incomeToEdit?.id && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Receita
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {incomeToEdit?.id ? 'Editar Receita' : 'Adicionar Receita'}
          </DialogTitle>
          <DialogDescription>
            {incomeToEdit?.id ? 'Atualize os detalhes da sua receita.' : 'Registre uma nova receita para controlar suas entradas financeiras.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Salário mensal, Freelance, Venda"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <CurrencyInput
                id="amount"
                placeholder="0,00"
                value={formData.valor}
                onChange={handleCurrencyChange}
                ref={currencyRef}
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
          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
          <Button type="submit" className="w-full">
            {incomeToEdit?.id ? 'Salvar Alterações' : 'Adicionar Receita'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

