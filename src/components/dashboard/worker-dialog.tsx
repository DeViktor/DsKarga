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
    admissionDate: z.string().optional(),
    contractType: z.string().optional(),
    admissionNotes: z.string().optional(),
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
                    admissionDate: '',
                    contractType: '',
                    admissionNotes: '',
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
            formData.append('workerId', 'temp');

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

            const dataWithPhoto = {
                ...data,
                photoUrl: finalPhotoUrl,
                admissionDate: data.admissionDate || undefined,
                contractType: data.contractType || undefined,
                admissionNotes: data.admissionNotes || undefined,
            };

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
        toast({
            title: 'Dados do Candidato Carregados',
            description: `${candidate.name} pré-preenchido no formulário.`
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/*
              max-w-4xl para dar mais largura ao dialog e acomodar o layout de duas colunas.
              overflow-hidden para conter o scroll interno corretamente.
            */}
            <DialogContent className="sm:max-w-4xl overflow-hidden p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="font-headline">
                        {worker ? 'Editar Trabalhador' : 'Adicionar Novo Trabalhador'}
                    </DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes do trabalhador manualmente ou selecione um candidato para pré-preencher.
                    </DialogDescription>
                </DialogHeader>

                {/*
                  Layout principal: flex row.
                  - Coluna esquerda (formulário): flex-1, cresce e ocupa todo espaço livre.
                  - Coluna direita (candidatos): largura fixa w-72, não encolhe (flex-shrink-0).
                */}
                <div className="flex min-h-0">

                    {/* ── Coluna esquerda: Formulário ── */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 border-r">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                            Preenchimento Manual
                        </h3>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                                {/* Avatar + botão de foto */}
                                <div className="flex flex-col items-center gap-3">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={previewUrl || ''} />
                                        <AvatarFallback className="text-lg">
                                            {form.getValues('name')?.charAt(0) || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
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

                                {/*
                                  Grade flex com wrap:
                                  - Cada campo tem flex: 1 1 calc(50% - 0.5rem) → ocupa ~50% da linha.
                                  - min-w-[160px] para evitar campos muito estreitos em telas menores.
                                  - Campos especiais recebem w-full para ocupar a linha inteira.
                                */}
                                <div className="flex flex-wrap gap-3">

                                    {/* Nome + Função — meia largura cada */}
                                    <FormField name="name" control={form.control} render={({ field }) => (
                                        <FormItem className="flex-1 basis-[calc(50%-0.375rem)] min-w-[160px]">
                                            <FormLabel>Nome Completo</FormLabel>
                                            <FormControl><Input placeholder="Nome do trabalhador" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField name="role" control={form.control} render={({ field }) => (
                                        <FormItem className="flex-1 basis-[calc(50%-0.375rem)] min-w-[160px]">
                                            <FormLabel>Função</FormLabel>
                                            <FormControl><Input placeholder="Ex: Estivador" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    {/* Departamento + Categoria — meia largura cada */}
                                    <FormField name="department" control={form.control} render={({ field }) => (
                                        <FormItem className="flex-1 basis-[calc(50%-0.375rem)] min-w-[160px]">
                                            <FormLabel>Departamento</FormLabel>
                                            <FormControl><Input placeholder="Ex: Logística" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField name="category" control={form.control} render={({ field }) => (
                                        <FormItem className="flex-1 basis-[calc(50%-0.375rem)] min-w-[160px]">
                                            <FormLabel>Categoria Profissional</FormLabel>
                                            <FormControl><Input placeholder="Ex: Mão de Obra I" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    {/* Salário + Data de admissão — meia largura cada */}
                                    <FormField name="baseSalary" control={form.control} render={({ field }) => (
                                        <FormItem className="flex-1 basis-[calc(50%-0.375rem)] min-w-[160px]">
                                            <FormLabel>Salário Base (AKZ)</FormLabel>
                                            <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField name="admissionDate" control={form.control} render={({ field }) => (
                                        <FormItem className="flex-1 basis-[calc(50%-0.375rem)] min-w-[160px]">
                                            <FormLabel>Data de Admissão</FormLabel>
                                            <FormControl><Input type="date" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    {/* Tipo de contrato + Género — meia largura cada */}
                                    <FormField name="contractType" control={form.control} render={({ field }) => (
                                        <FormItem className="flex-1 basis-[calc(50%-0.375rem)] min-w-[160px]">
                                            <FormLabel>Tipo de Contrato</FormLabel>
                                            <FormControl><Input placeholder="Ex: Tempo Indeterminado" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField name="gender" control={form.control} render={({ field }) => (
                                        <FormItem className="flex-1 basis-[calc(50%-0.375rem)] min-w-[160px]">
                                            <FormLabel>Género (opcional)</FormLabel>
                                            <FormControl><Input placeholder="Ex: Masculino" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField name="nif" control={form.control} render={({ field }) => (
                                        <FormItem className="flex-1 basis-[calc(50%-0.375rem)] min-w-[160px]">
                                            <FormLabel>Numero de Identidade Fiscal</FormLabel>
                                            <FormControl><Input placeholder="Ex: 123456789" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField name="bi" control={form.control} render={({ field }) => (
                                        <FormItem className="flex-1 basis-[calc(50%-0.375rem)] min-w-[160px]">
                                            <FormLabel>Bilhete de Identidade</FormLabel>
                                            <FormControl><Input placeholder="Ex: 123456789" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField name="social_security_number" control={form.control} render={({ field }) => (
                                        <FormItem className="flex-1 basis-[calc(50%-0.375rem)] min-w-[160px]">
                                            <FormLabel>Numero do Seguro Social</FormLabel>
                                            <FormControl><Input placeholder="Ex: 123456789" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField name="phone" control={form.control} render={({ field }) => (
                                        <FormItem className="flex-1 basis-[calc(50%-0.375rem)] min-w-[160px]">
                                            <FormLabel>Numero do Seguro Social</FormLabel>
                                            <FormControl><Input placeholder="Ex: 123456789" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    {/* Notas — linha inteira (w-full) */}
                                    <FormField name="admissionNotes" control={form.control} render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Notas de Admissão (opcional)</FormLabel>
                                            <FormControl><Input placeholder="Observações" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    {/* Estado do contrato + Tipo — meia largura cada */}
                                    <FormField name="contractStatus" control={form.control} render={({ field }) => (
                                        <FormItem className="flex-1 basis-[calc(50%-0.375rem)] min-w-[160px]">
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
                                    )} />

                                    <FormField name="type" control={form.control} render={({ field }) => (
                                        <FormItem className="flex-1 basis-[calc(50%-0.375rem)] min-w-[160px]">
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
                                    )} />

                                </div>

                                <DialogFooter className="pt-4 border-t">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">Cancelar</Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Guardar
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </div>

                    {/* ── Coluna direita: Banco de Candidatos (largura fixa, não encolhe) ── */}
                    <div className="w-72 flex-shrink-0 flex flex-col gap-4 px-5 py-5 bg-muted/40">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Banco de Candidatos
                        </h3>

                        {/* Campo de busca */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar candidato..."
                                className="pl-8"
                                value={candidateSearchTerm}
                                onChange={(e) => setCandidateSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Lista de candidatos com scroll */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {filteredCandidates.length > 0 ? (
                                filteredCandidates.map(candidate => (
                                    <div
                                        key={candidate.id}
                                        className="flex items-center justify-between p-3 border rounded-lg bg-background text-sm"
                                    >
                                        <div className="min-w-0 mr-2">
                                            <p className="font-medium truncate">{candidate.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {candidate.role || 'N/A'}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-shrink-0"
                                            onClick={() => handleCandidateSelect(candidate)}
                                        >
                                            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                                            Usar
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Nenhum candidato encontrado.
                                </p>
                            )}
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}