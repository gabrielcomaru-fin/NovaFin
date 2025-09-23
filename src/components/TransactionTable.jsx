import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, CheckCircle, Clock, CreditCard, CheckCircle2, XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.jsx";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronUp, ChevronDown, Filter as FilterIcon } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export const TransactionTable = ({
  transactions,
  categories,
  accounts,
  type,
  onEdit,
  onDelete,
  onTogglePayment,
  // filtros e ordenação controlados pelo pai
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  paymentStatus,
  onPaymentStatusChange,
  sortBy,
  onSortChange,
}) => {
  const isExpense = type === 'expense';

  const isDescFiltered = Boolean(searchTerm && String(searchTerm).trim() !== '');
  const isCategoryFiltered = Boolean(selectedCategory && selectedCategory !== 'all');
  const isStatusFiltered = Boolean(isExpense && paymentStatus && paymentStatus !== 'all');

  const sortIcon = (keyAsc, keyDesc) => {
    if (!sortBy) return null;
    if (sortBy === keyAsc) return <ChevronUp className="inline-block h-3.5 w-3.5 ml-1 opacity-70" />;
    if (sortBy === keyDesc) return <ChevronDown className="inline-block h-3.5 w-3.5 ml-1 opacity-70" />;
    return null;
  };

  const toggleSort = (keyAsc, keyDesc) => {
    if (!onSortChange) return;
    if (sortBy === keyDesc) {
      onSortChange(keyAsc);
    } else if (sortBy === keyAsc) {
      onSortChange(keyDesc);
    } else {
      onSortChange(keyDesc);
    }
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="align-middle whitespace-nowrap w-[30%]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] uppercase text-muted-foreground">Descrição</span>
                  {onSearchChange && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={`h-6 w-6 p-0 ${isDescFiltered ? 'text-primary bg-primary/10' : 'text-muted-foreground'} hover:text-foreground`}
                          title="Filtrar descrição"
                        >
                          <FilterIcon className="h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72" align="start">
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">Filtrar Descrição</div>
                          <Input
                            value={searchTerm || ''}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Digite parte da descrição"
                            className="h-8 text-sm"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </TableHead>
              <TableHead className="hidden sm:table-cell align-middle whitespace-nowrap w-[18%]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] uppercase text-muted-foreground">Categoria</span>
                  {onCategoryChange && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={`h-6 w-6 p-0 ${isCategoryFiltered ? 'text-primary bg-primary/10' : 'text-muted-foreground'} hover:text-foreground`}
                          title="Filtrar categoria"
                        >
                          <FilterIcon className="h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56" align="start">
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">Filtrar Categoria</div>
                          <Select value={selectedCategory || 'all'} onValueChange={onCategoryChange}>
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas</SelectItem>
                              {categories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </TableHead>
              {!isExpense && (
                <TableHead className="hidden md:table-cell align-middle whitespace-nowrap w-[18%]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase text-muted-foreground">Instituição</span>
                  </div>
                </TableHead>
              )}
              <TableHead className="align-middle cursor-pointer select-none w-[14%]">
                <div className="flex items-center gap-1.5" onClick={() => toggleSort(isExpense ? 'value-asc' : 'value-asc', isExpense ? 'value-desc' : 'value-desc')}>
                  <span className="text-xs uppercase text-muted-foreground">Valor</span>
                  {sortIcon(isExpense ? 'value-asc' : 'value-asc', isExpense ? 'value-desc' : 'value-desc')}
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell align-middle cursor-pointer select-none w-[12%]">
                <div className="flex items-center gap-1.5" onClick={() => toggleSort('date-asc', 'date-desc')}>
                  <span className="text-xs uppercase text-muted-foreground">Data</span>
                  {sortIcon('date-asc', 'date-desc')}
                </div>
              </TableHead>
              {isExpense && (
                <TableHead className="hidden sm:table-cell align-middle whitespace-nowrap w-[12%]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] uppercase text-muted-foreground">Status</span>
                    {onPaymentStatusChange && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-6 w-6 p-0 ${isStatusFiltered ? 'text-primary bg-primary/10' : 'text-muted-foreground'} hover:text-foreground`}
                            title="Filtrar status"
                          >
                            <FilterIcon className="h-3.5 w-3.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56" align="center">
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">Filtrar Status</div>
                            <Select value={paymentStatus || 'all'} onValueChange={onPaymentStatusChange}>
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Todos" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="paid">Pagos</SelectItem>
                                <SelectItem value="pending">Pendentes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </TableHead>
              )}
              <TableHead className="align-middle whitespace-nowrap w-[10%]">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs uppercase text-muted-foreground">Ações</span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          <AnimatePresence>
            {transactions.map((transaction) => {
              const category = categories.find(c => c.id === transaction.categoria_id);
              const institution = accounts?.find(a => a.id === transaction.instituicao_id);
              const amount = isExpense ? transaction.valor : transaction.valor_aporte;
              const description = transaction.descricao;

              return (
                <motion.tr
                  key={transaction.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="hover:bg-muted/50"
                >
                  <TableCell className="font-medium w-[30%]">
                    <div className="space-y-1">
                      <div>{description}</div>
                      <div className="sm:hidden">
                        <Badge variant="outline" className="text-xs">{category?.nome || 'Sem categoria'}</Badge>
                      </div>
                      {isExpense && (
                        <div className="sm:hidden">
                          {transaction.pago ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Pago
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell w-[18%]">
                    <Badge variant="outline">{category?.nome || 'Sem categoria'}</Badge>
                  </TableCell>
                  {!isExpense && (
                    <TableCell className="hidden md:table-cell w-[18%]">
                      <Badge variant="secondary">{institution?.nome_banco || 'Sem instituição'}</Badge>
                    </TableCell>
                  )}
                  <TableCell className={`font-semibold w-[14%] ${isExpense ? 'text-destructive text-left' : 'text-green-500 text-left'}`}>
                    {isExpense ? '- R$ ' : '+ R$ '} {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground w-[12%] text-left">
                    {new Date(transaction.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </TableCell>
                  {isExpense && (
                    <TableCell className="hidden sm:table-cell w-[12%]">
                      <div className="flex items-center">
                        {transaction.pago ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Pago
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="w-[10%]">
                    <div className="flex items-center gap-1">
                      {isExpense && onTogglePayment && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => onTogglePayment(transaction.id)}
                          title={transaction.pago ? "Marcar como não pago" : "Marcar como pago"}
                        >
                          {transaction.pago ? (
                            <XCircle className="h-4 w-4 text-orange-600 hover:text-orange-700" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-600 hover:text-green-700" />
                          )}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(transaction)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente esta transação.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(transaction.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    </div>
                  </TableCell>
                </motion.tr>
              );
            })}
          </AnimatePresence>
          {transactions.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                Nenhum resultado para os filtros aplicados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        </Table>
      </div>
    </div>
  );
};