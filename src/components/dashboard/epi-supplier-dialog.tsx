
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
import { type EpiSupplier } from '@/hooks/use-epi-suppliers';

const supplierSchema = z.object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    category: z.string().min(1, 'A categoria é obrigatória.'),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Email inválido.').optional().or(z.literal('')),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

interface EpiSupplierDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    supplier: EpiSupplier | null;
    onSave: (id: string, data: SupplierFormValues) => void;
}

export function EpiSupplierDialog({ open, onOpenChange, supplier, onSave }: EpiSupplierDialogProps) {
    const { toast } = useToast();

    const form = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierSchema),
    });

    useEffect(() => {
        if (supplier) {
            form.reset(supplier);
        } else {
            form.reset({
                name: '',
                category: '',
                contactPerson: '',
                phone: '',
                email: ''
            });
        }
    }, [supplier, open, form]);

    const onSubmit = async (data: SupplierFormValues) => {
        const id = supplier ? supplier.id : `sup-${Date.now()}`;
        onSave(id, data);
        toast({ title: 'Sucesso!', description: supplier ? 'Fornecedor atualizado.' : 'Novo fornecedor adicionado.' });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline">{supplier ? 'Editar Fornecedor' : 'Adicionar Fornecedor'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField name="name" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Nome</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField name="category" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Categoria Principal</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField name="contactPerson" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Pessoa de Contato</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField name="phone" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Telefone</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField name="email" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl><Input type="email" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
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
