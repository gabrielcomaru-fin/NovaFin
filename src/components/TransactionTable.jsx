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
import { Badge } from "@/components/ui/badge";

export const TransactionTable = ({ transactions, categories, accounts, type, onEdit, onDelete, onTogglePayment }) => {
  const isExpense = type === 'expense';

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead className="hidden sm:table-cell">Categoria</TableHead>
              {!isExpense && <TableHead className="hidden md:table-cell">Instituição</TableHead>}
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="hidden md:table-cell">Data</TableHead>
              {isExpense && <TableHead className="text-center hidden sm:table-cell">Status</TableHead>}
              <TableHead className="text-right">Ações</TableHead>
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
                  <TableCell className="font-medium">
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
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{category?.nome || 'Sem categoria'}</Badge>
                  </TableCell>
                  {!isExpense && (
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary">{institution?.nome_banco || 'Sem instituição'}</Badge>
                    </TableCell>
                  )}
                  <TableCell className={`text-right font-semibold ${isExpense ? 'text-destructive' : 'text-green-500'}`}>
                    {isExpense ? '- R$ ' : '+ R$ '} {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {new Date(transaction.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </TableCell>
                  {isExpense && (
                    <TableCell className="text-center hidden sm:table-cell">
                      <div className="flex items-center justify-center">
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
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
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
        </TableBody>
        </Table>
      </div>
    </div>
  );
};