import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { 
  Edit, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  CreditCard,
  Wallet,
  Smartphone,
  Banknote,
  Building2
} from 'lucide-react';
import { useFinance } from '@/contexts/FinanceDataContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

const paymentMethodTypes = [
  { value: 'cartao_credito', label: 'Cartão de Crédito', icon: CreditCard, color: '#EF4444' },
  { value: 'cartao_debito', label: 'Cartão de Débito', icon: CreditCard, color: '#3B82F6' },
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote, color: '#10B981' },
  { value: 'pix', label: 'PIX', icon: Smartphone, color: '#8B5CF6' },
  { value: 'transferencia', label: 'Transferência', icon: Building2, color: '#F59E0B' },
  { value: 'boleto', label: 'Boleto', icon: Wallet, color: '#6B7280' },
  { value: 'outros', label: 'Outros', icon: Wallet, color: '#9CA3AF' }
];

export function PaymentMethodManager() {
    const { paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } = useFinance();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
    const [formData, setFormData] = useState({ nome: '', tipo: '', cor: '#3B82F6' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.nome.trim()) {
            toast({
                title: "Erro",
                description: "O nome do meio de pagamento é obrigatório.",
                variant: "destructive"
            });
            return;
        }

        if (!formData.tipo) {
            toast({
                title: "Erro",
                description: "O tipo do meio de pagamento é obrigatório.",
                variant: "destructive"
            });
            return;
        }

        try {
            if (editingPaymentMethod) {
                console.log('Atualizando meio de pagamento:', editingPaymentMethod.id, formData);
                
                await updatePaymentMethod(editingPaymentMethod.id, {
                    nome: formData.nome,
                    tipo: formData.tipo,
                    cor: formData.cor,
                });
                
                toast({
                    title: "Meio de pagamento atualizado!",
                    description: `${formData.nome} foi atualizado com sucesso.`,
                });
            } else {
                console.log('Adicionando novo meio de pagamento:', formData);
                await addPaymentMethod({
                    nome: formData.nome,
                    tipo: formData.tipo,
                    cor: formData.cor,
                });
                toast({
                    title: "Meio de pagamento adicionado!",
                    description: `${formData.nome} foi adicionado com sucesso.`,
                });
            }

            setFormData({ nome: '', tipo: '', cor: '#3B82F6' });
            setEditingPaymentMethod(null);
            setIsOpen(false);
        } catch (error) {
            console.error('Erro detalhado ao salvar meio de pagamento:', error);
            toast({
                title: "Erro",
                description: `Erro ao salvar meio de pagamento: ${error.message || 'Tente novamente.'}`,
                variant: "destructive"
            });
        }
    };

    const handleEdit = (paymentMethod) => {
        setEditingPaymentMethod(paymentMethod);
        setFormData({
            nome: paymentMethod.nome,
            tipo: paymentMethod.tipo,
            cor: paymentMethod.cor || '#3B82F6'
        });
        setIsOpen(true);
    };

    const handleDelete = async (id, nome) => {
        if (window.confirm(`Tem certeza que deseja excluir "${nome}"?`)) {
            try {
                await deletePaymentMethod(id);
                toast({
                    title: "Meio de pagamento excluído!",
                    description: `${nome} foi removido com sucesso.`,
                });
            } catch (error) {
                toast({
                    title: "Erro",
                    description: "Erro ao excluir meio de pagamento. Tente novamente.",
                    variant: "destructive"
                });
            }
        }
    };

    const handleCancel = () => {
        setFormData({ nome: '', tipo: '', cor: '#3B82F6' });
        setEditingPaymentMethod(null);
        setIsOpen(false);
    };

    const getTypeInfo = (tipo) => {
        return paymentMethodTypes.find(t => t.value === tipo) || paymentMethodTypes[paymentMethodTypes.length - 1];
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Meios de Pagamento
                </CardTitle>
                <CardDescription>
                    Gerencie os meios de pagamento para categorizar suas despesas.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Meio de Pagamento
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingPaymentMethod ? 'Editar Meio de Pagamento' : 'Adicionar Meio de Pagamento'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingPaymentMethod 
                                    ? 'Atualize as informações do meio de pagamento.'
                                    : 'Adicione um novo meio de pagamento para categorizar suas despesas.'
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome</Label>
                                <Input
                                    id="nome"
                                    placeholder="Ex: Cartão Nubank, PIX, Dinheiro"
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tipo">Tipo</Label>
                                <Select
                                    value={formData.tipo}
                                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethodTypes.map((type) => {
                                            const IconComponent = type.icon;
                                            return (
                                                <SelectItem key={type.value} value={type.value}>
                                                    <div className="flex items-center gap-2">
                                                        <IconComponent className="w-4 h-4" style={{ color: type.color }} />
                                                        {type.label}
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cor">Cor</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="cor"
                                        type="color"
                                        value={formData.cor}
                                        onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                                        className="w-16 h-10 p-1"
                                    />
                                    <Input
                                        value={formData.cor}
                                        onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                                        placeholder="#3B82F6"
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" onClick={handleCancel}>
                                        <X className="w-4 h-4 mr-2" />
                                        Cancelar
                                    </Button>
                                </DialogClose>
                                <Button type="submit">
                                    <Check className="w-4 h-4 mr-2" />
                                    {editingPaymentMethod ? 'Salvar Alterações' : 'Adicionar'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <div className="space-y-2">
                    {paymentMethods.length > 0 ? (
                        paymentMethods.map((paymentMethod) => {
                            const typeInfo = getTypeInfo(paymentMethod.tipo);
                            const IconComponent = typeInfo.icon;
                            
                            return (
                                <div
                                    key={paymentMethod.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-8 h-8 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: paymentMethod.cor + '20' }}
                                        >
                                            <IconComponent 
                                                className="w-4 h-4" 
                                                style={{ color: paymentMethod.cor }}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-medium">{paymentMethod.nome}</p>
                                            <p className="text-sm text-muted-foreground">{typeInfo.label}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(paymentMethod)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(paymentMethod.id, paymentMethod.nome)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum meio de pagamento cadastrado.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
