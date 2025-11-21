
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
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
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FilePlus, CalendarIcon, Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { getSupabaseClient } from '@/lib/supabase/client';
import { pgcAccounts as staticAccounts } from '@/lib/pgc-data';
import { ScrollArea } from '@/components/ui/scroll-area';

const entryLineSchema = z.object({
    accountId: z.string().min(1, 'Conta é obrigatória'),
    accountName: z.string().optional(),
    debit: z.coerce.number().min(0).default(0),
    credit: z.coerce.number().min(0).default(0),
});

const journalEntrySchema = z.object({
    date: z.date({ required_error: 'A data é obrigatória.' }),
    documentRef: z.string().optional(),
    description: z.string().min(1, 'Descrição é obrigatória.'),
    lines: z.array(entryLineSchema).min(2, 'São necessárias pelo menos duas linhas.'),
}).superRefine((data, ctx) => {
    const totalDebit = data.lines.reduce((acc, line) => acc + line.debit, 0);
    const totalCredit = data.lines.reduce((acc, line) => acc + line.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) { // Use tolerance for float comparison
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'O total de débitos e créditos deve ser igual.',
            path: ['lines'],
        });
    }
});

type JournalEntryFormValues = z.infer<typeof journalEntrySchema>;

const transactionTemplates = {
    'salary': {
        description: 'Pagamento de salários referente ao mês de ',
        lines: [
            { accountId: '631', type: 'debit' },
            { accountId: '41', type: 'credit' },
        ]
    },
    'sales': {
        description: 'Venda de mercadorias a ',
        lines: [
            { accountId: '43', type: 'debit' }, // Caixa
            { accountId: '71', type: 'credit' }, // Vendas
        ]
    },
    'purchase': {
        description: 'Compra de mercadorias a ',
        lines: [
            { accountId: '211', type: 'debit' }, // Mercadorias
            { accountId: '41', type: 'credit' }, // Depósitos à Ordem
        ]
    }
};

const numberFormat = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
};

interface JournalEntryDialogProps {
    onEntryAdded: (entry: JournalEntryFormValues) => void;
}

export function JournalEntryDialog({ onEntryAdded }: JournalEntryDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatSupabaseError = (err: any): string => {
        try {
            if (!err) return 'Erro desconhecido.';
            if (typeof err === 'string') {
                const parsed = JSON.parse(err);
                return parsed?.message || parsed?.error || err;
            }
            return err.message || err.details || err.hint || err.code || String(err);
        } catch {
            return typeof err === 'string' ? err : 'Erro desconhecido.';
        }
    };
    
    const form = useForm<JournalEntryFormValues>({
        resolver: zodResolver(journalEntrySchema),
        defaultValues: {
            date: new Date(),
            description: '',
            documentRef: '',
            lines: [
                { accountId: '', accountName: '', debit: 0, credit: 0 },
                { accountId: '', accountName: '', debit: 0, credit: 0 },
            ],
        },
    });

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "lines",
    });

    const watchLines = form.watch('lines');

    const handleTransactionTypeChange = (type: keyof typeof transactionTemplates) => {
        const template = transactionTemplates[type];
        const monthName = format(form.getValues('date'), 'MMMM', { locale: pt });
        form.setValue('description', template.description + (type === 'salary' ? monthName : ''));

        const newLines = template.lines.map(line => {
            const account = staticAccounts.find(a => a.code === line.accountId);
            return {
                accountId: account?.code || '',
                accountName: account?.name || '',
                debit: 0,
                credit: 0
            }
        });
        replace(newLines);
    };

    const handleValueChange = (index: number, field: 'debit' | 'credit', value: number) => {
        const currentLines = form.getValues('lines');
        const otherField = field === 'debit' ? 'credit' : 'debit';
        
        currentLines[index][field] = value;
        // currentLines[index][otherField] = 0; // This was removed to allow manual balancing

        // Simple auto-balance for 2 lines
        if(currentLines.length === 2 && value > 0) {
            const otherIndex = index === 0 ? 1 : 0;
            currentLines[otherIndex][otherField] = value;
            currentLines[otherIndex][field] = 0;
        }

        replace(currentLines);
    }

    const totals = useMemo(() => {
        return watchLines.reduce((acc, line) => ({
            debit: acc.debit + (line.debit || 0),
            credit: acc.credit + (line.credit || 0),
        }), { debit: 0, credit: 0 });
    }, [watchLines]);

    const isBalanced = useMemo(() => totals.debit > 0 && Math.abs(totals.debit - totals.credit) < 0.001, [totals]);

    const onSubmit = async (data: JournalEntryFormValues) => {
        setIsSubmitting(true);
        try {
            const supabase = getSupabaseClient();
            // Primeiro, inserir o cabeçalho do lançamento (sem coluna 'lines')
            const payloadEntry: any = {
                entry_date: data.date.toISOString(),
                document_ref: data.documentRef ?? null,
                description: data.description,
                created_at: new Date().toISOString(),
            };
            const { data: inserted, error: insertEntryError } = await supabase
                .from('journal_entries')
                .insert(payloadEntry)
                .select('id')
                .single();
            if (insertEntryError) {
                throw new Error(formatSupabaseError(insertEntryError));
            }

            const entryId = inserted?.id;
            if (!entryId) {
                throw new Error('Inserção realizada, mas não foi possível obter o ID do lançamento.');
            }

            // Em seguida, inserir as linhas na tabela dedicada correta
            const lineRows = data.lines.map(l => ({
                entry_id: entryId,
                account_id: l.accountId,
                account_name: l.accountName,
                debit: l.debit,
                credit: l.credit,
                created_at: new Date().toISOString(),
            }));
            let { error: lineError } = await supabase
                .from('journal_entry_lines')
                .insert(lineRows);
            // Fallback: se coluna entry_id não existir, tentar journal_entry_id
            if (lineError && /entry_id/i.test((lineError.message || '').toLowerCase())) {
                const altRows = data.lines.map(l => ({
                    journal_entry_id: entryId,
                    account_id: l.accountId,
                    account_name: l.accountName,
                    debit: l.debit,
                    credit: l.credit,
                    created_at: new Date().toISOString(),
                }));
                const altRes = await supabase
                    .from('journal_entry_lines')
                    .insert(altRows);
                lineError = altRes.error;
            }
            // Fallback: se coluna account_id não existir, tentar account_code
            if (lineError && /account_id/i.test((lineError.message || '').toLowerCase())) {
                const altRows = data.lines.map(l => ({
                    entry_id: entryId,
                    account_code: l.accountId,
                    account_name: l.accountName,
                    debit: l.debit,
                    credit: l.credit,
                    created_at: new Date().toISOString(),
                }));
                const altRes = await supabase
                    .from('journal_entry_lines')
                    .insert(altRows);
                lineError = altRes.error;
            }
            // Fallback: se coluna account_name estiver com typo accoun_name
            if (lineError && /account_name/i.test((lineError.message || '').toLowerCase())) {
                const altRows = data.lines.map(l => ({
                    entry_id: entryId,
                    account_id: l.accountId,
                    accoun_name: l.accountName,
                    debit: l.debit,
                    credit: l.credit,
                    created_at: new Date().toISOString(),
                }));
                const altRes = await supabase
                    .from('journal_entry_lines')
                    .insert(altRows);
                lineError = altRes.error;
            }
            if (lineError) {
                throw new Error(formatSupabaseError(lineError));
            }
            onEntryAdded(data);
            toast({ title: 'Lançamento Adicionado!', description: 'O seu lançamento foi gravado no Supabase.' });
            form.reset({
                 date: new Date(),
                 description: '',
                 documentRef: '',
                 lines: [
                     { accountId: '', accountName: '', debit: 0, credit: 0 },
                     { accountId: '', accountName: '', debit: 0, credit: 0 },
                 ],
            });
            setOpen(false);
        } catch (err: any) {
            const message = formatSupabaseError(err);
            console.error('Erro ao salvar lançamento no Supabase:', err);
            toast({ title: 'Erro ao salvar', description: message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAccountSelect = (lineIndex: number, accountCode: string, callback: () => void) => {
        const account = staticAccounts.find(a => a.code === accountCode);
        if(account) {
            form.setValue(`lines.${lineIndex}.accountId`, account.code);
            form.setValue(`lines.${lineIndex}.accountName`, account.name);
        }
        callback();
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><FilePlus className="mr-2 h-4 w-4" /> Novo Lançamento</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="font-headline">Novo Lançamento no Livro Diário</DialogTitle>
                    <DialogDescription>Registe uma nova transação contabilística.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-4 items-end">
                             <FormItem>
                                <FormLabel>Tipo de Transação (Modelo)</FormLabel>
                                 <Select onValueChange={(value) => handleTransactionTypeChange(value as keyof typeof transactionTemplates)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um modelo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="salary">Pagamento de Salários</SelectItem>
                                        <SelectItem value="sales">Venda a Dinheiro</SelectItem>
                                        <SelectItem value="purchase">Compra a Dinheiro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                            <FormField name="date" control={form.control} render={({ field }) => (
                                <FormItem>
                                <FormLabel>Data do Lançamento</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 opacity-50" />
                                            {field.value ? format(field.value, "PPP", { locale: pt }) : <span>Selecione a data</span>}
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )} />
                             <FormField name="documentRef" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Documento de Suporte</FormLabel>
                                    <FormControl><Input placeholder="Ex: Fatura FT001/24" {...field} /></FormControl>
                                </FormItem>
                             )} />
                        </div>
                         <FormField name="description" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descrição do Movimento</FormLabel>
                                <FormControl><Textarea placeholder="Descreva a natureza da transação" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                         )} />

                        <div className="border rounded-md">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-1/2">Conta</TableHead>
                                        <TableHead className="text-right">Débito</TableHead>
                                        <TableHead className="text-right">Crédito</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell>
                                                <FormField
                                                    control={form.control}
                                                    name={`lines.${index}.accountId`}
                                                    render={({ field }) => {
                                                        const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);
                                                        return (
                                                        <FormItem>
                                                          <Popover open={accountPopoverOpen} onOpenChange={setAccountPopoverOpen}>
                                                                <PopoverTrigger asChild>
                                                                    <FormControl>
                                                                        <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                                                                            {field.value ? `${form.watch(`lines.${index}.accountId`)} - ${form.watch(`lines.${index}.accountName`)}` : "Selecione uma conta"}
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-[400px] p-0">
                                                                     <Command>
                                                                        <CommandInput placeholder="Pesquisar conta..." className="h-9" />
                                                                        <CommandList>
                                                                            <CommandEmpty>Nenhuma conta encontrada.</CommandEmpty>
                                                                            <CommandGroup>
                                                                                <ScrollArea className="h-72">
                                                                                    {staticAccounts.map((account) => (
                                                                                        <CommandItem
                                                                                            value={`${account.code} - ${account.name}`}
                                                                                            key={account.code}
                                                                                            onSelect={() => handleAccountSelect(index, account.code, () => setAccountPopoverOpen(false))}
                                                                                        >
                                                                                        {account.code} - {account.name}
                                                                                        </CommandItem>
                                                                                    ))}
                                                                                </ScrollArea>
                                                                            </CommandGroup>
                                                                        </CommandList>
                                                                    </Command>
                                                                </PopoverContent>
                                                            </Popover>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <FormField control={form.control} name={`lines.${index}.debit`} render={({ field }) => (<FormItem><FormControl><Input type="number" className="text-right" value={field.value} onChange={(e) => handleValueChange(index, 'debit', parseFloat(e.target.value) || 0)} /></FormControl></FormItem>)} />
                                            </TableCell>
                                            <TableCell>
                                                <FormField control={form.control} name={`lines.${index}.credit`} render={({ field }) => (<FormItem><FormControl><Input type="number" className="text-right" value={field.value} onChange={(e) => handleValueChange(index, 'credit', parseFloat(e.target.value) || 0)}/></FormControl></FormItem>)} />
                                            </TableCell>
                                            <TableCell>
                                                 <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                 <TableFooter>
                                    <TableRow>
                                        <TableCell><Button type="button" variant="outline" size="sm" onClick={() => append({ accountId: '', accountName: '', debit: 0, credit: 0 })}><PlusCircle className="mr-2"/>Adicionar Linha</Button></TableCell>
                                        <TableCell className="text-right font-bold">{numberFormat(totals.debit)}</TableCell>
                                        <TableCell className="text-right font-bold">{numberFormat(totals.credit)}</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                         {form.formState.errors.lines && (
                             <p className="text-sm font-medium text-destructive">{form.formState.errors.lines.root?.message}</p>
                         )}

                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={!isBalanced || isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 animate-spin"/>}
                                Guardar Lançamento
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
