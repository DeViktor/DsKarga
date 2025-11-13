

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';

import { DashboardHeader } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, PlusCircle, Trash2, Users, Printer, Eraser, Search, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { addServiceRequisitionSupabase } from '@/lib/supabase/actions';
import { ServiceRequisitionPrintLayout } from '@/components/dashboard/service-requisition-print-layout';
import { type Client } from '@/app/dashboard/clients/page';
import { useClients } from '@/hooks/use-clients';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorkers } from '@/hooks/use-workers';
import { type Worker } from '@/app/dashboard/workers/page';


const requisitionSchema = z.object({
  type: z.enum(['Contrato Fixo', 'Eventual (Requisição)'], { required_error: 'O tipo de serviço é obrigatório.'}),
  client: z.string().min(1, 'O cliente é obrigatório'),
  guideNumber: z.string().optional(),
  requestingArea: z.string().min(1, 'Área é obrigatória'),
  responsible: z.string().min(1, 'Responsável é obrigatório'),
  requestDate: z.date({ required_error: 'Data é obrigatória' }),
  reason: z.string().min(1, 'Motivo é obrigatório'),
  mainActivities: z.string().min(1, 'Atividades são obrigatórias'),
  estimatedTime: z.string().min(1, 'Tempo estimado é obrigatório'),
  estimatedStaff: z.coerce.number().min(1, 'Pelo menos 1 pessoa é necessária'),
  budget: z.coerce.number().optional(),
  assignedWorkers: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
});

export type RequisitionFormValues = z.infer<typeof requisitionSchema>;

const servicesNav = [
    { name: "Gestão de Serviços", href: "/dashboard/services" },
    { name: "Novo Serviço", href: "/dashboard/services/new" },
    { name: "Guias de Pagamento", href: "/dashboard/services/payment-guide" },
];

export default function NewServicePage() {
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);

  const { clients, loading: clientsLoading } = useClients();
  const { workers, loading: workersLoading } = useWorkers();
  
  const form = useForm<RequisitionFormValues>({
    resolver: zodResolver(requisitionSchema),
    defaultValues: {
      requestingArea: '',
      responsible: '',
      requestDate: new Date(),
      reason: '',
      mainActivities: '',
      estimatedTime: '',
      assignedWorkers: [],
      estimatedStaff: 1,
      budget: 0,
      client: '',
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'assignedWorkers',
  });

  const formValues = form.watch();

  useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        const guideNumber = form.getValues('guideNumber') || 'GUIA-A-GERAR';
        const originalTitle = document.title;
        document.title = guideNumber;
        window.print();
        document.title = originalTitle;
        setIsPrinting(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPrinting, form]);

  const onSubmit = async (data: RequisitionFormValues) => {
    try {
      await addServiceRequisitionSupabase(data);
      toast({
        title: "Sucesso!",
        description: "O serviço foi submetido com sucesso.",
      });
      resetForm();
    } catch (err: any) {
      console.error("Falha ao submeter serviço no Supabase", err);
      toast({
        title: "Erro ao Submeter",
        description: err?.message ?? "Não foi possível registar o serviço.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
  }
  
  const addWorker = (worker: Worker) => {
    if(!fields.some(w => w.id === worker.id)) {
        append({ id: worker.id, name: worker.name });
    }
  }

  const resetForm = () => {
    form.reset({
        requestDate: new Date(),
        assignedWorkers: [],
        estimatedStaff: 1,
        requestingArea: '',
        responsible: '',
        reason: '',
        mainActivities: '',
        estimatedTime: '',
        budget: 0,
        client: '',
        type: undefined,
    });
  }
  
  const filteredWorkers = useMemo(() => {
    return workers.filter(worker =>
      worker.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, workers]);

  if (isPrinting) {
     return (
        <ServiceRequisitionPrintLayout 
            service={{...formValues, id: 'temp', guideNumber: 'GUIA-A-GERAR', status: 'Pendente', createdAt: {seconds: 0, nanoseconds: 0}}}
        />
    );
  }
  
  const selectedType = form.watch('type');

  return (
    <>
      <DashboardHeader title="Novo Serviço">
          <div className="print:hidden flex items-center gap-2">
            <Button variant="outline" onClick={resetForm}><Eraser className="mr-2 h-4 w-4" /> Limpar</Button>
            <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Imprimir Guia</Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Guardar e Submeter
            </Button>
          </div>
      </DashboardHeader>
      
       <Tabs value={pathname} className="w-full mb-6">
            <TabsList>
                {servicesNav.map((item) => (
                     <Link key={item.name} href={item.href} passHref>
                        <TabsTrigger value={item.href}>
                            {item.name}
                        </TabsTrigger>
                    </Link>
                ))}
            </TabsList>
        </Tabs>
      
      <Form {...form}>
        <form className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-3 print:hidden">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                    <CardTitle className="font-headline">Detalhes do Serviço</CardTitle>
                    <CardDescription>
                        Preencha as informações para registar um novo serviço (Contrato Fixo ou Requisição Eventual).
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField name="type" control={form.control} render={({ field }) => (<FormItem><FormLabel>Tipo de Serviço</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Contrato Fixo">Contrato Fixo</SelectItem><SelectItem value="Eventual (Requisição)">Eventual (Requisição)</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                           <FormField
                                control={form.control}
                                name="client"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Cliente</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={clientsLoading}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={clientsLoading ? "A carregar..." : "Selecione o cliente..."} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {clients?.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                        <div className='grid md:grid-cols-3 gap-4'>
                            <FormItem>
                                <FormLabel>Nº da Guia/Ref.</FormLabel>
                                <FormControl>
                                    <Input value={selectedType === 'Eventual (Requisição)' ? "A ser gerado" : "N/A"} disabled />
                                </FormControl>
                            </FormItem>
                            <FormField name="requestingArea" control={form.control} render={({ field }) => (<FormItem><FormLabel>Área Solicitante</FormLabel><FormControl><Input placeholder="Ex: Produção" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField name="responsible" control={form.control} render={({ field }) => (<FormItem><FormLabel>Responsável</FormLabel><FormControl><Input placeholder="Nome do responsável" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                             <FormField
                                control={form.control}
                                name="requestDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>{selectedType === 'Contrato Fixo' ? 'Data de Início do Contrato' : 'Data Início'}</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                            {field.value ? format(field.value, "PPP") : <span>Selecione uma data</span>}
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField name="estimatedStaff" control={form.control} render={({ field }) => (<FormItem><FormLabel>Nº Pessoal Estimado</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField name="estimatedTime" control={form.control} render={({ field }) => (<FormItem><FormLabel>{selectedType === 'Contrato Fixo' ? 'Duração do Contrato' : 'Duração'}</FormLabel><FormControl><Input placeholder={selectedType === 'Contrato Fixo' ? 'Ex: 12 meses' : 'Ex: 5 dias'} {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField name="reason" control={form.control} render={({ field }) => (<FormItem><FormLabel>{selectedType === 'Contrato Fixo' ? 'Objeto do Contrato' : 'Objeto do Serviço'}</FormLabel><FormControl><Textarea placeholder="Descreva o motivo/objeto do serviço..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField name="mainActivities" control={form.control} render={({ field }) => (<FormItem><FormLabel>Principais Atividades a Desempenhar</FormLabel><FormControl><Textarea placeholder="Liste as atividades..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField name="budget" control={form.control} render={({ field }) => (<FormItem><FormLabel>Orçamento do Serviço (Opcional)</FormLabel><FormControl><Input type="number" placeholder="Kz" value={field.value ?? 0} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-1 print:hidden">
                 <Card className="sticky top-8">
                     <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <Users className="h-5 w-5"/>
                            Alocar Pessoal (Opcional)
                        </CardTitle>
                        <CardDescription>Selecione trabalhadores do seu quadro de pessoal para este serviço.</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Pesquisar trabalhador..." 
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                            {workersLoading ? (
                                <div className="flex justify-center items-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : filteredWorkers.map(worker => {
                                const isAlreadyAssignedCurrent = fields.some(w => w.id === worker.id);
                                const isAssignedToOtherService = worker.assignedToService;
                                const isDisabled = isAlreadyAssignedCurrent || isAssignedToOtherService;

                                return (
                                <div key={worker.id} className="flex items-center justify-between p-2 border rounded-md text-sm">
                                    <div>
                                        <p className="font-medium">{worker.name}</p>
                                        <p className="text-xs text-muted-foreground">{worker.role || 'N/A'}</p>
                                        {isAssignedToOtherService && <p className='text-xs font-bold text-orange-500'>Alocado</p>}
                                    </div>
                                    <Button type="button" size="sm" variant="outline" onClick={() => addWorker(worker)} disabled={isDisabled}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Alocar
                                    </Button>
                                </div>
                            )})}
                            {filteredWorkers.length === 0 && !workersLoading && (
                                 <p className="text-sm text-muted-foreground text-center py-4">Nenhum trabalhador encontrado.</p>
                            )}
                        </div>
                        <Separator />
                         <h4 className='font-medium'>Pessoal Alocado</h4>
                         {fields.length > 0 ? (
                             <ul className="space-y-2">
                                {fields.map((worker, index) => (
                                    <li key={worker.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                        <span>{worker.name}</span>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-2">Nenhum trabalhador alocado.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
