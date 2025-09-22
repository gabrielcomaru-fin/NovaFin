import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Sun, Moon, Upload, Download, Edit, Plus, Trash2, Check, X, AlertTriangle } from 'lucide-react';
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
import { useTheme } from '@/hooks/useTheme';
import { CurrencyInput } from '@/components/CurrencyInput';


function CategoryManager({ type }) {
    const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
    const { toast } = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategory, setNewCategory] = useState({ nome: '', limite: '' });

    const filteredCategories = categories.filter(c => c.tipo === type);
    const title = type === 'gasto' ? 'Gerenciar Categorias de Gastos' : 'Gerenciar Categorias de Investimentos';

    const handleAdd = async () => {
        if (!newCategory.nome) {
            toast({ title: 'Erro', description: 'O nome da categoria é obrigatório.', variant: 'destructive' });
            return;
        }
        const unformattedLimite = newCategory.limite ? newCategory.limite.replace(/\./g, '').replace(',', '.') : null;

        await addCategory({ ...newCategory, tipo: type, limite: unformattedLimite ? parseFloat(unformattedLimite) : null });
        toast({ title: 'Sucesso', description: 'Categoria adicionada.' });
        setNewCategory({ nome: '', limite: '' });
        setIsAdding(false);
    };

    const startEditing = (category) => {
        setEditingCategory({ 
            ...category,
            limite: category.limite ? category.limite.toString().replace('.', ',') : '' 
        });
    }

    const saveEditing = async () => {
        const { id, created_at, usuario_id, icone, tipo, ...updateData } = editingCategory;
        const unformattedLimite = updateData.limite ? updateData.limite.replace(/\./g, '').replace(',', '.') : null;
        updateData.limite = unformattedLimite ? parseFloat(unformattedLimite) : null;
        await updateCategory(id, updateData);
        toast({ title: 'Sucesso', description: 'Categoria atualizada.' });
        setEditingCategory(null);
    }
    
    const handleDelete = async (id) => {
        await deleteCategory(id);
        toast({ title: 'Sucesso', description: 'Categoria excluída.' });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Adicione, edite ou remova categorias.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {filteredCategories.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary group">
                             {editingCategory && editingCategory.id === cat.id ? (
                                <>
                                    <div className="flex items-center gap-2 flex-grow">
                                        <Input value={editingCategory.nome} onChange={(e) => setEditingCategory({...editingCategory, nome: e.target.value})} className="h-8"/>
                                        {type === 'gasto' && <CurrencyInput placeholder="Limite" value={editingCategory.limite || ''} onChange={(value) => setEditingCategory({...editingCategory, limite: value})} className="h-8 w-24"/>}
                                    </div>
                                    <div className="flex gap-1">
                                         <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveEditing}><Check className="w-4 h-4 text-green-500"/></Button>
                                         <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingCategory(null)}><X className="w-4 h-4 text-destructive"/></Button>
                                    </div>
                                </>
                             ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <span>{cat.nome}</span>
                                        {cat.limite > 0 && <span className="text-xs text-muted-foreground">(Limite: R$ {cat.limite.toLocaleString('pt-BR')})</span>}
                                    </div>
                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEditing(cat)}><Edit className="w-4 h-4"/></Button>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button size="icon" variant="ghost" className="h-8 w-8"><Trash2 className="w-4 h-4 text-destructive"/></Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/> Excluir Categoria</DialogTitle>
                                                    <DialogDescription>
                                                        Tem certeza que deseja excluir a categoria "<strong>{cat.nome}</strong>"? Esta ação não pode ser desfeita. As transações associadas a esta categoria não serão excluídas, mas ficarão sem categoria.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button variant="outline">Cancelar</Button>
                                                    </DialogClose>
                                                    <DialogClose asChild>
                                                        <Button variant="destructive" onClick={() => handleDelete(cat.id)}>Excluir</Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </>
                             )}
                        </div>
                    ))}
                </div>

                {isAdding ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-dashed">
                        <Input placeholder="Nome da categoria" value={newCategory.nome} onChange={(e) => setNewCategory({...newCategory, nome: e.target.value})} className="h-9"/>
                        {type === 'gasto' && <CurrencyInput placeholder="Limite (opcional)" value={newCategory.limite} onChange={(value) => setNewCategory({...newCategory, limite: value})} className="h-9 w-32"/>}
                        <Button onClick={handleAdd} className="h-9">Salvar</Button>
                        <Button variant="ghost" onClick={() => setIsAdding(false)} className="h-9">Cancelar</Button>
                    </div>
                ) : (
                    <Button variant="outline" onClick={() => setIsAdding(true)} className="w-full">
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Categoria
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

export function SettingsPage() {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const handleNotImplemented = () => {
    toast({
      title: "🚧 Funcionalidade em desenvolvimento!",
      description: "Esta funcionalidade ainda não foi implementada, mas você pode solicitá-la no próximo prompt!",
    });
  };

  return (
    <>
      <Helmet>
        <title>Configurações - Lumify</title>
        <meta name="description" content="Gerencie suas preferências e configurações de conta." />
      </Helmet>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Aparência</CardTitle>
                        <CardDescription>Personalize a aparência do aplicativo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="dark-mode" className="text-base">Modo Escuro</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Sun className="h-[1.2rem] w-[1.2rem]" />
                            <Switch
                            id="dark-mode"
                            checked={theme === 'dark'}
                            onCheckedChange={toggleTheme}
                            />
                            <Moon className="h-[1.2rem] w-[1.2rem]" />
                        </div>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Perfil do Usuário</CardTitle>
                        <CardDescription>Atualize suas informações pessoais.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input id="name" placeholder="Seu nome" defaultValue="Usuário Exemplo" />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="Seu email" defaultValue="exemplo@email.com" disabled />
                        </div>
                        <Button onClick={handleNotImplemented}>Salvar Alterações</Button>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                 <CategoryManager type="gasto" />
                 <CategoryManager type="investimento" />
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Dados</CardTitle>
                <CardDescription>Gerencie seus dados financeiros.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" onClick={handleNotImplemented} className="flex gap-2">
                    <Upload className="w-4 h-4"/>
                    Importar CSV
                </Button>
                <Button variant="outline" onClick={handleNotImplemented} className="flex gap-2">
                    <Download className="w-4 h-4"/>
                    Exportar CSV/Excel
                </Button>
            </CardContent>
        </Card>
      </div>
    </>
  );
}