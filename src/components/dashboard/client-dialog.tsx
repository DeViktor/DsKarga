
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
import { Client } from '@/app/dashboard/clients/page';

const clientSchema = z.object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    nif: z.string().min(1, 'O NIF é obrigatório.'),
    address: z.string().min(1, 'A morada é obrigatória.'),
    province: z.string().min(1, 'A província é obrigatória.'),
    country: z.string().default('Angola'),
    email: z.string().email('Email inválido.').optional().or(z.literal('')),
    phone: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client: Client | null;
}

export function ClientDialog({ open, onOpenChange, client }: ClientDialogProps) {
    const { toast } = useToast();
    const supabase = getSupabaseClient();

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: '',
            nif: '',
            address: '',
            province: '',
            country: 'Angola',
            email: '',
            phone: '',
        }
    });

    useEffect(() => {
        if (open) {
            if (client) {
                form.reset(client);
            } else {
                form.reset({
                    name: '',
                    nif: '',
                    address: '',
                    province: '',
                    country: 'Angola',
                    email: '',
                    phone: '',
                });
            }
        }
    }, [client, open, form]);

    const onSubmit = async (data: ClientFormValues) => {
        try {
            if (client) {
                const { error } = await supabase
                    .from('clients')
                    .update({
                        name: data.name,
                        nif: data.nif,
                        address: data.address,
                        province: data.province,
                        country: data.country,
                        email: data.email || null,
                        phone: data.phone || null,
                    })
                    .eq('id', client.id);
                if (error) {
                    toast({ title: 'Erro!', description: error.message || error.code, variant: 'destructive' });
                    return;
                }
                toast({ title: 'Sucesso!', description: 'O cliente foi atualizado.' });
            } else {
                const { error } = await supabase
                    .from('clients')
                    .insert({
                        name: data.name,
                        nif: data.nif,
                        address: data.address,
                        province: data.province,
                        country: data.country,
                        email: data.email || null,
                        phone: data.phone || null,
                    });
                if (error) {
                    toast({ title: 'Erro!', description: error.message || error.code, variant: 'destructive' });
                    return;
                }
                toast({ title: 'Sucesso!', description: 'O novo cliente foi adicionado.' });
            }
            onOpenChange(false);
        } catch (error: any) {
            toast({ title: 'Erro!', description: error?.message || 'Não foi possível guardar os dados do cliente.', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline">{client ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes do cliente.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField name="name" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Nome do Cliente</FormLabel> <FormControl><Input placeholder="Ex: Nome da Empresa" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField name="nif" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>NIF</FormLabel> <FormControl><Input placeholder="Nº de Identificação Fiscal" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField name="address" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Morada</FormLabel> <FormControl><Input placeholder="Ex: Cazenga, Luanda" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField name="province" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Província</FormLabel> <FormControl><Input placeholder="Ex: Luanda" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField name="email" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl><Input type="email" placeholder="Ex: geral@cliente.com" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField name="phone" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Telefone</FormLabel> <FormControl><Input placeholder="Ex: 923 123 456" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>

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
