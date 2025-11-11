
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
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
import { Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { addAccidentReport } from '@/firebase/firestore/accidents';
import { workers } from '@/lib/data';
import { type Client } from '@/app/dashboard/clients/page';


const accidentSchema = z.object({
    datetime: z.string().min(1, 'A data e hora são obrigatórias.'),
    clientUnit: z.string().min(1, 'A unidade/cliente é obrigatória.'),
    workerName: z.string().min(1, 'O nome do trabalhador é obrigatório.'),
    type: z.enum(['sem-baixa', 'com-baixa', 'quase-acidente'], {
        required_error: 'O tipo de incidente é obrigatório.'
    }),
    severity: z.enum(['leve', 'moderado', 'grave'], {
        required_error: 'A gravidade é obrigatória.'
    }),
    description: z.string().min(1, 'A descrição é obrigatória.'),
    probableCause: z.string().min(1, 'A causa provável é obrigatória.'),
});

type AccidentFormValues = z.infer<typeof accidentSchema>;

interface AccidentReportDialogProps {
    clients: Client[];
}


export function AccidentReportDialog({ clients }: AccidentReportDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<AccidentFormValues>({
    resolver: zodResolver(accidentSchema),
    defaultValues: {
        datetime: '',
        clientUnit: '',
        workerName: '',
        description: '',
        probableCause: ''
    }
  });

  const onSubmit = async (data: AccidentFormValues) => {
    if (!firestore) return;

    try {
        await addAccidentReport(firestore, data);
        toast({
            title: 'Sucesso!',
            description: 'O registo de acidente foi guardado.',
        });
        form.reset();
        // Here you might want to somehow close the dialog.
        // A common pattern is to control the open state from the parent.
        // For now, we'll just reset the form.
    } catch (error) {
        console.error("Failed to save accident report: ", error);
        toast({
            title: 'Erro!',
            description: 'Não foi possível guardar o registo. Tente novamente.',
            variant: 'destructive'
        });
    }
  }


  return (
    <Dialog onOpenChange={(open) => { if(!open) form.reset()}}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Registo de Acidente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Registar Novo Incidente</DialogTitle>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
                <FormField
                    control={form.control}
                    name="datetime"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Data e Hora</FormLabel>
                        <FormControl>
                            <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="workerName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Trabalhador Envolvido</FormLabel>
                        <FormControl>
                            <Input placeholder="Nome do trabalhador" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="clientUnit"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Unidade/Cliente</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                {clients.map(client => (
                                    <SelectItem key={client.id} value={client.name}>{client.name}</SelectItem>
                                ))}
                                <SelectItem value="dskarga">Instalações DS Karga</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tipo de Incidente</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                             <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="sem-baixa">Acidente sem Baixa</SelectItem>
                                <SelectItem value="com-baixa">Acidente com Baixa</SelectItem>
                                <SelectItem value="quase-acidente">Quase Acidente</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Gravidade</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="leve">Leve (sem afastamento)</SelectItem>
                                <SelectItem value="moderado">Moderado (com afastamento)</SelectItem>
                                <SelectItem value="grave">Grave (hospitalização)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Descrição da Ocorrência</FormLabel>
                        <FormControl>
                           <Textarea placeholder="Descreva o que aconteceu..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                  <FormField
                    control={form.control}
                    name="probableCause"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Causa Provável</FormLabel>
                        <FormControl>
                           <Input placeholder="Ex: Ato inseguro, condição insegura..." {...field} />
                        </FormControl>
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
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Registar
                </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
