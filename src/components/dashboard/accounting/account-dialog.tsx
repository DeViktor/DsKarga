
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { addAccount, updateAccount } from '@/firebase/firestore/accounts';
import { Loader2 } from 'lucide-react';
import { PGCAccount } from '@/app/dashboard/accounting/chart-of-accounts/page';

const accountSchema = z.object({
    code: z.string().min(1, 'O código é obrigatório.'),
    name: z.string().min(1, 'A designação é obrigatória.'),
    class: z.string().min(1, 'A classe é obrigatória.'),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    account: PGCAccount | null;
}

export function AccountDialog({ open, onOpenChange, account }: AccountDialogProps) {
    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<AccountFormValues>({
        resolver: zodResolver(accountSchema),
    });

    useEffect(() => {
        if (account) {
            form.reset(account);
        } else {
            form.reset({
                code: '',
                name: '',
                class: '',
            });
        }
    }, [account, open, form]);

    const onSubmit = async (data: AccountFormValues) => {
        if (!firestore) return;
        try {
            if (account) {
                await updateAccount(firestore, account.id, data);
                 toast({ title: 'Sucesso!', description: 'A conta foi atualizada.' });
            } else {
                await addAccount(firestore, data);
                toast({ title: 'Sucesso!', description: 'A nova conta foi adicionada.' });
            }
            onOpenChange(false);
        } catch (error) {
            toast({
                title: 'Erro!',
                description: 'Não foi possível guardar a conta.',
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline">{account ? 'Editar Conta' : 'Adicionar Nova Conta'}</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes da conta do PGC.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Código</FormLabel>
                                    <FormControl><Input placeholder="Ex: 11.1" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Designação</FormLabel>
                                    <FormControl><Input placeholder="Ex: Equipamento de Transporte" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="class"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Classe</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a classe da conta" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Contas de Balanço - Activo">Contas de Balanço - Activo</SelectItem>
                                            <SelectItem value="Contas de Balanço - Terceiros">Contas de Balanço - Terceiros</SelectItem>
                                            <SelectItem value="Contas de Balanço - Tesouraria">Contas de Balanço - Tesouraria</SelectItem>
                                            <SelectItem value="Contas de Balanço - Capital Próprio">Contas de Balanço - Capital Próprio</SelectItem>
                                            <SelectItem value="Contas de Resultados - Custos">Contas de Resultados - Custos</SelectItem>
                                            <SelectItem value="Contas de Resultados - Proveitos">Contas de Resultados - Proveitos</SelectItem>
                                            <SelectItem value="Contas de Resultados - Resultados">Contas de Resultados - Resultados</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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

