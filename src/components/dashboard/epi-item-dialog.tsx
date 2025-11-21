
'use client';

import { useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { type EpiItem } from '@/hooks/use-epis';


const itemSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  quantity: z.coerce.number().min(0, 'A quantidade não pode ser negativa.'),
  lowStockThreshold: z.coerce.number().min(0, 'O valor não pode ser negativo.'),
  location: z.string().optional(),
  expiryDate: z.string().optional(),
});

export type ItemFormValues = z.infer<typeof itemSchema>;

interface EpiItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: EpiItem | null;
    onSave: (id: string, data: ItemFormValues) => void;
}

export function EpiItemDialog({ open, onOpenChange, item, onSave }: EpiItemDialogProps) {
    const { toast } = useToast();
    const isEditing = !!item;

    const form = useForm<ItemFormValues>({
        resolver: zodResolver(itemSchema),
    });

    useEffect(() => {
        if (item) {
            form.reset({
                ...item,
                expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '', // Format for date input
            });
        } else {
            form.reset({
                name: '',
                category: '',
                quantity: 0,
                lowStockThreshold: 10,
                location: '',
                expiryDate: '',
            });
        }
    }, [item, open, form]);

    const onSubmit = async (data: ItemFormValues) => {
        try {
            if (item) {
                // Update existing item
                await onSave(item.id, data);
            } else {
                // Add new item - pass null as ID since Supabase will generate it
                await onSave(null as any, data);
            }
            toast({ title: 'Sucesso!', description: item ? 'O item foi atualizado.' : 'O novo item foi adicionado.' });
            onOpenChange(false);
        } catch (error) {
            console.error('Erro ao salvar item:', error);
            toast({ 
                title: 'Erro!', 
                description: `Erro ao ${item ? 'atualizar' : 'adicionar'} item: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                variant: 'destructive'
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline">{item ? 'Editar Item' : 'Adicionar Novo Item ao Inventário'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField name="name" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Nome do Produto</FormLabel> <FormControl><Input {...field} disabled={isEditing} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField name="category" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Categoria</FormLabel> <FormControl><Input {...field} disabled={isEditing} /></FormControl> <FormMessage /> </FormItem> )} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField name="quantity" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Quantidade Inicial</FormLabel> <FormControl><Input type="number" {...field} disabled={isEditing} /></FormControl> <FormMessage /> </FormItem> )}/>
                            <FormField name="lowStockThreshold" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Stock Mínimo</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <FormField name="location" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Localização</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                            <FormField name="expiryDate" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Data de Validade</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
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
