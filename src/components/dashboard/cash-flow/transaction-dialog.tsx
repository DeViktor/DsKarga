'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  type: 'receita' | 'despesa';
  category: string;
  amount: number;
}

const transactionSchema = z.object({
  date: z.string().min(1, { message: "A data é obrigatória." }),
  description: z.string().min(1, { message: "A descrição é obrigatória." }),
  amount: z.coerce.number().min(0.01, { message: "O valor deve ser maior que zero." }),
  category: z.string().min(1, { message: "A categoria é obrigatória." }),
  type: z.enum(['receita', 'despesa']),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'receita' | 'despesa';
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
}

const receitaCategorias = ['Vendas', 'Serviços', 'Outras Receitas'];
const despesaCategorias = ['Salários', 'Compras', 'Marketing', 'Aluguel', 'Outras Despesas'];

export function TransactionDialog({ open, onOpenChange, type, onSave }: TransactionDialogProps) {
  const { toast } = useToast();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      type: type,
    },
  });

  useEffect(() => {
    form.reset({
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      amount: 0,
      category: '',
      type: type,
    });
  }, [type, open, form]);

  const onSubmit = async (data: TransactionFormValues) => {
    onSave({
        ...data,
        date: new Date(data.date),
    });
    toast({
      title: 'Sucesso!',
      description: `Sua ${type} foi registrada com sucesso.`,
    });
    onOpenChange(false);
  };

  const categories = type === 'receita' ? receitaCategorias : despesaCategorias;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">
            Nova {type === 'receita' ? 'Receita' : 'Despesa'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Pagamento de fatura, compra de material..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (AOA)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {categories.map(cat => (
                               <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                           ))}
                        </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
