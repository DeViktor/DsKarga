

'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { addWorker, updateWorker } from '@/firebase/firestore/workers';
import { Loader2, Search, PlusCircle } from 'lucide-react';
import { Worker } from '@/app/dashboard/workers/page';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { useCandidates, type Candidate } from '@/hooks/use-candidates';

const workerSchema = z.object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    role: z.string().min(1, 'A função é obrigatória.'),
    department: z.string().min(1, 'O departamento é obrigatório.'),
    category: z.string().optional(),
    baseSalary: z.coerce.number().min(0, 'O salário deve ser um valor positivo.'),
    contractStatus: z.enum(['Ativo', 'Suspenso', 'Concluído'], {
        required_error: "O estado do contrato é obrigatório."
    }),
    type: z.enum(['Fixo', 'Eventual'], {
        required_error: "O tipo de trabalhador é obrigatório."
    }),
});

export type WorkerFormValues = z.infer<typeof workerSchema>;

interface WorkerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    worker: Worker | null;
}

export function WorkerDialog({ open, onOpenChange, worker }: WorkerDialogProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { candidates } = useCandidates();
    const [candidateSearchTerm, setCandidateSearchTerm] = useState('');

    const form = useForm<WorkerFormValues>({
        resolver: zodResolver(workerSchema),
    });

    useEffect(() => {
        if (open) {
            if (worker) {
                form.reset(worker);
            } else {
                form.reset({
                    name: '',
                    role: '',
                    department: 'Logística',
                    category: '',
                    baseSalary: 0,
                    contractStatus: 'Ativo',
                    type: 'Eventual'
                });
            }
        }
    }, [worker, open, form]);

    const onSubmit = async (data: WorkerFormValues) => {
        if (!firestore) return;
        try {
            if (worker) {
                await updateWorker(firestore, worker.id, data);
                 toast({ title: 'Sucesso!', description: 'Os dados do trabalhador foram atualizados.' });
            } else {
                await addWorker(firestore, data);
                toast({ title: 'Sucesso!', description: 'O novo trabalhador foi adicionado.' });
            }
            onOpenChange(false);
        } catch (error) {
            toast({
                title: 'Erro!',
                description: 'Não foi possível guardar os dados do trabalhador.',
                variant: 'destructive',
            });
        }
    };
    
    const filteredCandidates = useMemo(() => {
        return candidates.filter(c => 
            c.name.toLowerCase().includes(candidateSearchTerm.toLowerCase()) || 
            c.role?.toLowerCase().includes(candidateSearchTerm.toLowerCase())
        );
    }, [candidates, candidateSearchTerm]);

    const handleCandidateSelect = (candidate: Candidate) => {
        form.setValue('name', candidate.name);
        form.setValue('role', candidate.role || '');
        form.setValue('department', candidate.areaOfSpecialization || 'N/A');
        // You can add more fields to pre-populate here
        toast({
            title: 'Dados do Candidato Carregados',
            description: `${candidate.name} pré-preenchido no formulário.`
        })
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="font-headline">{worker ? 'Editar Trabalhador' : 'Adicionar Novo Trabalhador'}</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes do trabalhador manualmente ou selecione um candidato para pré-preencher.
                    </DialogDescription>
                </DialogHeader>
                <div className='grid md:grid-cols-2 gap-8'>
                    <div>
                        <h3 className='font-semibold mb-2'>Preenchimento Manual</h3>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField name="name" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Nome Completo</FormLabel> <FormControl><Input placeholder="Nome do trabalhador" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormField name="role" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Função</FormLabel> <FormControl><Input placeholder="Ex: Estivador" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormField name="department" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Departamento</FormLabel> <FormControl><Input placeholder="Ex: Logística" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormField name="category" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Categoria Profissional</FormLabel> <FormControl><Input placeholder="Ex: Mão de Obra I" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormField name="baseSalary" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Salário Base (AKZ)</FormLabel> <FormControl><Input type="number" placeholder="0" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <div className='grid grid-cols-2 gap-4'>
                                    <FormField name="contractStatus" control={form.control} render={({ field }) => ( 
                                        <FormItem> 
                                            <FormLabel>Estado do Contrato</FormLabel> 
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o estado..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Ativo">Ativo</SelectItem>
                                                    <SelectItem value="Suspenso">Suspenso</SelectItem>
                                                    <SelectItem value="Concluído">Concluído</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage /> 
                                        </FormItem> 
                                    )}/>
                                    <FormField name="type" control={form.control} render={({ field }) => ( 
                                        <FormItem> 
                                            <FormLabel>Tipo</FormLabel> 
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o tipo..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Fixo">Fixo</SelectItem>
                                                    <SelectItem value="Eventual">Eventual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage /> 
                                        </FormItem> 
                                    )}/>
                                </div>
                                <DialogFooter className="pt-4">
                                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Guardar
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </div>
                     <div>
                        <h3 className='font-semibold mb-2'>Puxar do Banco de Candidatos</h3>
                        <div className='border rounded-md p-4 space-y-4'>
                            <div className='relative'>
                                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                                <Input 
                                    placeholder='Buscar candidato...' 
                                    className='pl-8'
                                    value={candidateSearchTerm}
                                    onChange={(e) => setCandidateSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className='max-h-80 overflow-y-auto space-y-2 pr-2'>
                                {filteredCandidates.length > 0 ? filteredCandidates.map(candidate => (
                                    <div key={candidate.id} className='flex items-center justify-between p-2 border rounded-md text-sm'>
                                        <div>
                                            <p className='font-medium'>{candidate.name}</p>
                                            <p className='text-xs text-muted-foreground'>{candidate.role || 'N/A'}</p>
                                        </div>
                                        <Button variant='outline' size='sm' onClick={() => handleCandidateSelect(candidate)}>
                                            <PlusCircle className='mr-2 h-4 w-4' />
                                            Usar
                                        </Button>
                                    </div>
                                )) : (
                                    <p className='text-sm text-muted-foreground text-center py-4'>Nenhum candidato encontrado.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
