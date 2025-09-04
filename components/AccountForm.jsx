import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CurrencyInput, Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, CreditCard, Building } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceDataContext';

export function AccountForm() {
  const { addAccount, accounts } = useFinance();
  const [formData, setFormData] = useState({
    nome_banco: '',
    saldo: '',
  });
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleCurrencyChange = (value) => {
    setFormData({ ...formData, saldo: value });
  };
  
  const parseCurrency = (value) => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nome_banco || !formData.saldo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const saldoValue = parseCurrency(formData.saldo);

    await addAccount({
      ...formData,
      saldo: saldoValue,
    });

    toast({
      title: "Conta adicionada!",
      description: `${formData.nome_banco} - R$ ${saldoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    });

    setFormData({
      nome_banco: '',
      saldo: '',
    });
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Conta
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Adicionar Conta Bancária
            </DialogTitle>
            <DialogDescription>
              Registre uma nova conta para acompanhar seu patrimônio.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Conta</Label>
              <Input
                id="name"
                placeholder="Ex: Conta Corrente Banco X"
                value={formData.nome_banco}
                onChange={(e) => setFormData({ ...formData, nome_banco: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="balance">Saldo Atual (R$)</Label>
              <CurrencyInput
                id="balance"
                placeholder="0,00"
                value={formData.saldo}
                onChange={handleCurrencyChange}
                required
              />
            </div>
            
            <Button type="submit" className="w-full">
              Adicionar Conta
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Suas Contas
          </CardTitle>
          <CardDescription>Saldos das suas contas bancárias</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-semibold">Nenhuma conta registrada ainda.</p>
              <p className="text-sm">Adicione suas contas para acompanhar seu patrimônio!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account, index) => (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex justify-between items-center p-4 bg-secondary rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{account.nome_banco}</p>
                    <p className="text-sm text-muted-foreground">Conta Bancária</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">
                      R$ {account.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}