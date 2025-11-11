

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Download, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { addSupervisionReport } from '@/firebase/firestore/supervision';
import { SupervisionReportPrintLayout } from '@/components/dashboard/supervision-report-print-layout';
import { type Client } from '@/app/dashboard/clients/page';
import { useClients } from '@/hooks/use-clients';

const reportSchema = z.object({
    supervisor: z.string().default('Admin'),
    reportDate: z.string().min(1, 'A data é obrigatória.'),
    client: z.string().min(1, 'O cliente/local é obrigatório.'),
    activity: z.string().min(1, 'A atividade é obrigatória.'),
    weather: z.string().optional(),
    staffAllocated: z.coerce.number().min(0, 'Deve ser um número positivo.'),
    staffAbsences: z.coerce.number().min(0, 'Deve ser um número positivo.'),
    staffNormalHours: z.coerce.number().min(0, 'Deve ser um número positivo.'),
    staffExtraHours: z.coerce.number().min(0, 'Deve ser um número positivo.'),
    staffReplacements: z.string().optional(),
    staffIssues: z.string().optional(),
    prodGoal: z.string().optional(),
    prodResult: z.string().optional(),
    prodProductiveHours: z.coerce.number().optional(),
    prodNonProductiveHours: z.coerce.number().optional(),
    prodJustification: z.string().optional(),
    safetyEpi: z.enum(['conforme', 'nao-conforme']),
    safetyBriefing: z.enum(['realizado', 'nao-realizado']),
    safetyIncidents: z.string().optional(),
    safetyUnsafeConditions: z.string().optional(),
    clientFeedback: z.string().optional(),
    clientNeeds: z.string().optional(),
    pendingIssues: z.string().optional(),
    highlights: z.string().optional(),
    recommendations: z.string().optional(),
});

export type SupervisionReportFormValues = z.infer<typeof reportSchema>;

const FormSection = ({ title, description, children }: { title: string, description: string, children: React.ReactNode }) => (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
            {children}
        </CardContent>
    </Card>
);

export default function NewSupervisionReportPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const router = useRouter();
    const [lastReport, setLastReport] = useState<SupervisionReportFormValues | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

    const { clients, loading: clientsLoading } = useClients();

    const form = useForm<SupervisionReportFormValues>({
        resolver: zodResolver(reportSchema),
        defaultValues: {
            supervisor: 'Admin',
            reportDate: '',
            client: '',
            activity: '',
            weather: '',
            staffAllocated: 0,
            staffAbsences: 0,
            staffNormalHours: 0,
            staffExtraHours: 0,
            staffReplacements: '',
            staffIssues: '',
            prodGoal: '',
            prodResult: '',
            prodProductiveHours: 0,
            prodNonProductiveHours: 0,
            prodJustification: '',
            safetyEpi: 'conforme',
            safetyBriefing: 'realizado',
            safetyIncidents: '',
            safetyUnsafeConditions: '',
            clientFeedback: '',
            clientNeeds: '',
            pendingIssues: '',
            highlights: '',
            recommendations: '',
        },
    });

    useEffect(() => {
        if (isPrinting) {
            const timer = setTimeout(() => {
                window.print();
                setIsPrinting(false);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isPrinting]);

    const onSubmit = async (data: SupervisionReportFormValues) => {
        if (!firestore) {
            toast({ title: 'Erro', description: 'Base de dados não conectada.', variant: 'destructive'});
            return;
        }

        setSubmissionStatus('submitting');
        try {
            await addSupervisionReport(firestore, data);
            toast({ title: 'Sucesso!', description: 'Relatório diário submetido com sucesso.'});
            router.push('/dashboard/supervision');
        } catch (error) {
            console.error('Failed to submit report:', error);
            toast({ title: 'Erro', description: 'Não foi possível submeter o relatório.', variant: 'destructive'});
            setSubmissionStatus('idle');
        }
    };
    
    const handlePrint = () => {
        if (!lastReport) return;
        setIsPrinting(true);
    };

    if (isPrinting && lastReport) {
        return <SupervisionReportPrintLayout report={lastReport} />;
    }

  return (
    <>
      <DashboardHeader title="Novo Relatório Diário de Supervisão">
        {submissionStatus === 'success' && lastReport && (
            <Button variant="outline" onClick={handlePrint}>
                <Download className="mr-2 h-4 w-4" /> Baixar PDF do Último Relatório
            </Button>
        )}
        <Button onClick={form.handleSubmit(onSubmit)} disabled={submissionStatus === 'submitting'}>
            {submissionStatus === 'submitting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submeter Relatório
        </Button>
      </DashboardHeader>
      
      {submissionStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5"/>
            <div>
              <p className="font-bold">Relatório submetido com sucesso!</p>
              <p className="text-sm">Pode criar um novo relatório ou baixar o PDF do anterior.</p>
            </div>
          </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
                <FormSection title="I. Identificação e Contexto" description="Informações gerais sobre o turno e a atividade.">
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="supervisor" render={({ field }) => ( <FormItem> <FormLabel>Supervisor</FormLabel> <FormControl><Input {...field} disabled /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name="reportDate" render={({ field }) => ( <FormItem> <FormLabel>Data e Turno</FormLabel> <FormControl><Input type="datetime-local" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                         <FormField control={form.control} name="client" render={({ field }) => ( 
                            <FormItem> 
                                <FormLabel>Cliente / Local</FormLabel> 
                                <Select onValueChange={field.onChange} value={field.value} disabled={clientsLoading}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={clientsLoading ? 'A carregar...' : 'Selecione o cliente...'} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {clients?.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage /> 
                            </FormItem> 
                        )} />
                         <FormField control={form.control} name="weather" render={({ field }) => ( <FormItem> <FormLabel>Condições Climáticas</FormLabel> <FormControl><Input placeholder="Ex: Chuva fraca, Sol intenso" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    </div>
                    <FormField control={form.control} name="activity" render={({ field }) => ( <FormItem> <FormLabel>Atividade Supervisionada</FormLabel> <FormControl><Textarea placeholder="Ex: Carga de contêineres 20', descarga de cimento a granel..." {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                </FormSection>

                <FormSection title="II. Recursos Humanos e Presença" description="Monitoramento da força de trabalho cedida.">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField control={form.control} name="staffAllocated" render={({ field }) => ( <FormItem> <FormLabel>Efetivo Alocado</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name="staffAbsences" render={({ field }) => ( <FormItem> <FormLabel>Faltas / Ausências</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name="staffNormalHours" render={({ field }) => ( <FormItem> <FormLabel>Horas Normais</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name="staffExtraHours" render={({ field }) => ( <FormItem> <FormLabel>Horas Extras</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    </div>
                    <FormField control={form.control} name="staffReplacements" render={({ field }) => ( <FormItem> <FormLabel>Substituições (Se Houve)</FormLabel> <FormControl><Textarea placeholder="Detalhes de qualquer trabalhador que precisou ser substituído e o motivo." {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name="staffIssues" render={({ field }) => ( <FormItem> <FormLabel>Ocorrências de RH</FormLabel> <FormControl><Textarea placeholder="Atrasos significativos, problemas de comportamento, reclamações ou disputas internas." {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                </FormSection>
                
                <FormSection title="III. Produtividade e Desempenho" description="Medição da produção e eficiência da operação.">
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="prodGoal" render={({ field }) => ( <FormItem> <FormLabel>Meta do Dia/Turno</FormLabel> <FormControl><Input placeholder="Ex: Descarregar 150 contêineres" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name="prodResult" render={({ field }) => ( <FormItem> <FormLabel>Resultado Alcançado</FormLabel> <FormControl><Input placeholder="Ex: 145 contêineres descarregados" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="prodProductiveHours" render={({ field }) => ( <FormItem> <FormLabel>Tempo Produtivo (h)</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name="prodNonProductiveHours" render={({ field }) => ( <FormItem> <FormLabel>Tempo Não Produtivo (h)</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    </div>
                    <FormField control={form.control} name="prodJustification" render={({ field }) => ( <FormItem> <FormLabel>Justificativa para Desvios / Paradas</FormLabel> <FormControl><Textarea placeholder="Ex: Avaria de equipamento do cliente, espera por material, pausa para chuva..." {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                </FormSection>
            </div>
            <div className="lg:col-span-1 space-y-8">
                <FormSection title="IV. Segurança e Conformidade" description="Documentação de todos os aspetos de segurança no trabalho.">
                    <FormField
                        control={form.control}
                        name="safetyEpi"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Utilização de EPIs</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="conforme">Conforme</SelectItem>
                                        <SelectItem value="nao-conforme">Não Conforme</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="safetyBriefing"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Briefing de Segurança</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="realizado">Realizado</SelectItem>
                                        <SelectItem value="nao-realizado">Não Realizado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField control={form.control} name="safetyIncidents" render={({ field }) => ( <FormItem> <FormLabel>Acidentes / Incidentes</FormLabel> <FormControl><Textarea placeholder="Descrever qualquer ocorrência, mesmo que pequena." {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name="safetyUnsafeConditions" render={({ field }) => ( <FormItem> <FormLabel>Condições Inseguras</FormLabel> <FormControl><Textarea placeholder="Descrever riscos no ambiente que precisam de correção." {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                </FormSection>

                <FormSection title="V. Questões de Cliente e Pendências" description="Comunicação e alinhamento com o cliente e próximo turno.">
                    <FormField control={form.control} name="clientFeedback" render={({ field }) => ( <FormItem> <FormLabel>Feedback do Cliente</FormLabel> <FormControl><Textarea placeholder="Registrar qualquer feedback recebido." {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name="clientNeeds" render={({ field }) => ( <FormItem> <FormLabel>Necessidades do Cliente</FormLabel> <FormControl><Textarea placeholder="Ex: Mais 5 estivadores, equipamentos especiais..." {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name="pendingIssues" render={({ field }) => ( <FormItem> <FormLabel>Pendências (Follow-up)</FormLabel> <FormControl><Textarea placeholder="Tarefas não concluídas a serem transferidas." {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                </FormSection>

                <FormSection title="VI. Observações e Recomendações" description="Resumo final e sugestões de melhoria.">
                    <FormField control={form.control} name="highlights" render={({ field }) => ( <FormItem> <FormLabel>Destaques do Dia</FormLabel> <FormControl><Textarea placeholder="Equipes que superaram a meta, trabalhadores com excelente desempenho..." {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name="recommendations" render={({ field }) => ( <FormItem> <FormLabel>Recomendações</FormLabel> <FormControl><Textarea placeholder="Sugestões para melhorar a eficiência, segurança ou gestão." {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                </FormSection>
            </div>
        </form>
      </Form>
    </>
  );
}
