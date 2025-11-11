
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
import { useFirestore } from '@/firebase';
import { addSupplier, updateSupplier } from '@/firebase/firestore/purchasing';
import { Loader2 } from 'lucide-react';
import { type Supplier } from '@/app/dashboard/purchasing/suppliers/page';

const supplierSchema = z.object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    nif: z.string().min(1, 'O NIF é obrigatório.'),
    contactEmail: z.string().email('Email inválido.').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    supplier: Supplier | null;
}

export function SupplierDialog({ open, onOpenChange, supplier }: SupplierDialogProps) {
    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierSchema),
        defaultValues: { name: '', nif: '', contactEmail: '', phone: '', address: '' }
    });

    useEffect(() => {
        if (open) {
            if (supplier) {
                form.reset(supplier);
            } else {
                form.reset({ name: '', nif: '', contactEmail: '', phone: '', address: '' });
            }
        }
    }, [supplier, open, form]);

    const onSubmit = async (data: SupplierFormValues) => {
        if (!firestore) return;
        try {
            if (supplier) {
                await updateSupplier(firestore, supplier.id, data);
                toast({ title: 'Sucesso!', description: 'Fornecedor atualizado.' });
            } else {
                await addSupplier(firestore, data);
                toast({ title: 'Sucesso!', description: 'Novo fornecedor adicionado.' });
            }
            onOpenChange(false);
        } catch (error) {
            toast({ title: 'Erro!', description: 'Não foi possível guardar os dados.', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline">{supplier ? 'Editar Fornecedor' : 'Adicionar Fornecedor'}</DialogTitle>
                    <DialogDescription>Preencha os detalhes do fornecedor.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField name="name" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Nome</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField name="nif" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>NIF</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField name="contactEmail" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl><Input type="email" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField name="phone" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Telefone</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField name="address" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Morada</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
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
