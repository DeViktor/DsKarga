
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
import { getSupabaseClient } from '@/lib/supabase/client';
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

    const form = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierSchema),
        defaultValues: { name: '', nif: '', contactEmail: '', phone: '', address: '' }
    });

    useEffect(() => {
        if (open) {
            if (supplier) {
                console.log('Editing supplier:', supplier);
                form.reset({
                    name: supplier.name || '',
                    nif: supplier.nif || '',
                    contactEmail: supplier.contactEmail || '',
                    phone: supplier.phone || '',
                    address: supplier.address || ''
                });
            } else {
                console.log('Adding new supplier');
                form.reset({ name: '', nif: '', contactEmail: '', phone: '', address: '' });
            }
        }
    }, [supplier, open, form]);

    const onSubmit = async (data: SupplierFormValues) => {
        try {
            const supabase = getSupabaseClient();
            console.log('Submitting supplier data:', data);
            console.log('Current supplier:', supplier);
            
            let success = false;
            
            if (supplier) {
                // Update existing supplier
                console.log('Updating supplier with ID:', supplier.id);
                
                // Build update payload only with provided fields
                const updatePayload: any = {
                    name: data.name,
                    nif: data.nif,
                    contact_email: data.contactEmail || null,
                    phone: data.phone || null,
                    address: data.address || null
                };
                
                // Remove undefined/null values that might cause issues
                Object.keys(updatePayload).forEach(key => {
                    if (updatePayload[key] === undefined) {
                        delete updatePayload[key];
                    }
                });
                
                console.log('Update payload:', updatePayload);
                
                const { data: updatedData, error } = await supabase
                    .from('suppliers')
                    .update(updatePayload)
                    .eq('id', supplier.id)
                    .select()
                    .single();
                
                if (error) {
                    console.error('Error updating supplier:', error);
                    console.error('Error details:', error.message, error.code, error.details);
                    throw new Error(`Failed to update supplier: ${error.message}`);
                }
                
                console.log('Supplier updated successfully:', updatedData);
                toast({ title: 'Sucesso!', description: 'Fornecedor atualizado.' });
                success = true;
            } else {
                // Create new supplier
                console.log('Creating new supplier');
                const insertPayload = {
                    name: data.name,
                    nif: data.nif,
                    contact_email: data.contactEmail || null,
                    phone: data.phone || null,
                    address: data.address || null,
                    created_at: new Date().toISOString()
                };
                
                console.log('Insert payload:', insertPayload);
                
                const { data: insertedData, error } = await supabase
                    .from('suppliers')
                    .insert(insertPayload)
                    .select()
                    .single();
                
                if (error) {
                    console.error('Error creating supplier:', error);
                    console.error('Error details:', error.message, error.code, error.details);
                    throw new Error(`Failed to create supplier: ${error.message}`);
                }
                
                console.log('Supplier created successfully:', insertedData);
                toast({ title: 'Sucesso!', description: 'Novo fornecedor adicionado.' });
                success = true;
            }
            
            // Only close dialog if operation was successful
            if (success) {
                onOpenChange(false);
            }
        } catch (error) {
            console.error('Erro ao salvar fornecedor:', error);
            const errorMessage = error instanceof Error ? error.message : 'Não foi possível guardar os dados.';
            toast({ title: 'Erro!', description: errorMessage, variant: 'destructive' });
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
