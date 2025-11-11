
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { type EpiItem } from '@/hooks/use-epis';
import { useEpiSuppliers, type EpiSupplier } from '@/hooks/use-epi-suppliers';

const stockEntrySchema = z.object({
  epiId: z.string().min(1, 'Selecione um item.'),
  quantity: z.coerce.number().min(1, 'A quantidade deve ser positiva.'),
  supplier: z.string().optional(),
});

type StockEntryFormValues = z.infer<typeof stockEntrySchema>;

interface EpiStockEntryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    epis: EpiItem[];
    onSave: (id: string, data: Partial<EpiItem>) => void;
}

export function EpiStockEntryDialog({ open, onOpenChange, epis, onSave }: EpiStockEntryDialogProps) {
    const { toast } = useToast();
    const { suppliers, loading: suppliersLoading } = useEpiSuppliers();

    const form = useForm<StockEntryFormValues>({
        resolver: zodResolver(stockEntrySchema),
        defaultValues: {
            quantity: 1,
        }
    });

    useEffect(() => {
        if (!open) {
            form.reset({ quantity: 1, epiId: undefined, supplier: undefined });
        }
    }, [open, form]);

    const onSubmit = async (data: StockEntryFormValues) => {
        const item = epis.find(e => e.id === data.epiId);
        if (!item) {
            toast({title: "Erro", description: "Item não encontrado.", variant: "destructive"});
            return;
        }

        const newQuantity = item.quantity + data.quantity;
        onSave(item.id, { ...item, quantity: newQuantity });
        
        toast({ title: 'Sucesso!', description: 'Stock atualizado com sucesso.' });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline">Registar Entrada em Stock</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField name="epiId" control={form.control} render={({ field }) => ( 
                            <FormItem> 
                                <FormLabel>Item</FormLabel> 
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Selecione o item que entrou em stock" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {epis.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage /> 
                            </FormItem> 
                        )}/>
                        <FormField name="quantity" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Quantidade</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField name="supplier" control={form.control} render={({ field }) => ( 
                             <FormItem> 
                                <FormLabel>Fornecedor (Opcional)</FormLabel> 
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder={suppliersLoading ? 'A carregar...' : 'Selecione o fornecedor'} /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {suppliers?.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage /> 
                            </FormItem> 
                        )}/>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Adicionar ao Stock
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
