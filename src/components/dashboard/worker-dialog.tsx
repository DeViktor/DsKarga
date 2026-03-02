

'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
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
import { addWorkerSupabase, updateWorkerSupabase } from '@/lib/supabase/actions';
import { useActivityLogger, ActivityActions, ActivityTargets } from '@/hooks/use-activity-logger';
import { Loader2, Search, PlusCircle, Upload, X } from 'lucide-react';
import type { Worker } from '@/types/worker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { useCandidates, type Candidate } from '@/hooks/use-candidates';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getSupabaseClient } from '@/lib/supabase/client';

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
    photoUrl: z.string().optional(),
});

export type WorkerFormValues = z.infer<typeof workerSchema>;

interface WorkerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    worker: Worker | null;
}

export function WorkerDialog({ open, onOpenChange, worker }: WorkerDialogProps) {
    const { toast } = useToast();
    const { logActivity } = useActivityLogger();
    const { candidates } = useCandidates();
    const [candidateSearchTerm, setCandidateSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Photo upload states
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<WorkerFormValues>({
        resolver: zodResolver(workerSchema),
    });

    useEffect(() => {
        if (open) {
            setPhotoFile(null);
            if (worker) {
                form.reset(worker);
                setPreviewUrl(worker.photoUrl || null);
            } else {
                form.reset({
                    name: '',
                    role: '',
                    department: 'Logística',
                    category: '',
                    baseSalary: 0,
                    contractStatus: 'Ativo',
                    type: 'Eventual',
                    photoUrl: '',
                });
                setPreviewUrl(null);
            }
        }
    }, [worker, open, form]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleRemovePhoto = () => {
        setPhotoFile(null);
        setPreviewUrl(null);
        form.setValue('photoUrl', '');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadPhoto = async (file: File): Promise<string | null> => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('workerId', 'temp'); // For new workers, we use a temp ID or just the filename strategy

            const response = await fetch('/api/upload/worker-photo', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const { url } = await response.json();
            return url;
        } catch (error) {
            console.error('Error uploading photo:', error);
            toast({
                title: 'Erro no Upload',
                description: 'Não foi possível carregar a foto.',
                variant: 'destructive',
            });
            return null;
        }
    };

    const onSubmit = async (data: WorkerFormValues) => {
        setIsLoading(true);
        try {
            let finalPhotoUrl = data.photoUrl;

            if (photoFile) {
                const uploadedUrl = await uploadPhoto(photoFile);
                if (uploadedUrl) {
                    finalPhotoUrl = uploadedUrl;
                }
            }

            const dataWithPhoto = { ...data, photoUrl: finalPhotoUrl };

            if (worker) {
                await updateWorkerSupabase(worker.id, dataWithPhoto);
                await logActivity(
                    ActivityActions.UPDATE,
                    data.name,
                    'worker',
                    { 
                        workerId: worker.id,
                        department: data.department,
                        role: data.role,
                        contractStatus: data.contractStatus 
                    }
                );
                toast({ title: 'Sucesso!', description: 'Os dados do trabalhador foram atualizados.' });
            } else {
                await addWorkerSupabase(dataWithPhoto);
                await logActivity(
                    ActivityActions.CREATE,
                    data.name,
                    'worker',
                    { 
                        department: data.department,
                        role: data.role,
                        contractStatus: data.contractStatus 
                    }
                );
                toast({ title: 'Sucesso!', description: 'O novo trabalhador foi adicionado.' });
            }
            onOpenChange(false);
        } catch (error) {
            console.error('Erro ao salvar trabalhador:', error);
            toast({
                title: 'Erro!',
                description: 'Não foi possível guardar os dados do trabalhador.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
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
                                <div className="flex flex-col items-center gap-4 mb-4">
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage src={previewUrl || ''} />
                                        <AvatarFallback>{form.getValues('name')?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="relative"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Carregar Foto
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                        </Button>
                                        {previewUrl && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleRemovePhoto}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
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
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
