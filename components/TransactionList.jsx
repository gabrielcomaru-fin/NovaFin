import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
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

export const TransactionList = ({ transactions, categories, type, onEdit, onDelete }) => {
  return (
    <div className="space-y-3">
      {transactions.map((transaction, index) => {
        const category = categories.find(c => c.id === transaction.categoria_id);
        const isExpense = type === 'expense';
        const amount = isExpense ? transaction.valor : transaction.valor_aporte;
        const description = transaction.descricao;

        return (
          <motion.div
            key={transaction.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
            className="flex justify-between items-center p-3 bg-secondary rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div>
                <p className="font-semibold">{description}</p>
                <p className="text-sm text-muted-foreground">{category?.nome || 'Sem categoria'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className={`font-bold text-md ${isExpense ? 'text-destructive' : 'text-green-500'}`}>
                  {isExpense ? '- R$' : '+ R$'} {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">{new Date(transaction.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
              </div>
              <div className="flex items-center ml-2">
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
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};