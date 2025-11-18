

'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { type Service } from '@/hooks/use-services';
import { DashboardHeader } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, Check, X, Users, Calendar, DollarSign, Clock, Briefcase, FileText, User, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useCandidates, type Candidate } from '@/hooks/use-candidates';
import { CandidateDetailDialog } from '@/components/dashboard/candidate-detail-dialog';
import { ServiceRequisitionPrintLayout } from '@/components/dashboard/service-requisition-print-layout';

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => {
    if (!value) return null;
    return (
        <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</p>
            <p className="mt-1 ml-6 text-base font-semibold">{value}</p>
        </div>
    )
}

export default function ServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;
    const [isPrinting, setIsPrinting] = useState(false);
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);

    const { candidates } = useCandidates();
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

    useEffect(() => {
        async function fetchService() {
            if (!id) return;
            
            setLoading(true);
            try {
                const supabase = getSupabaseClient();
                const { data, error } = await supabase
                    .from('service_requisitions')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) {
                    console.error('Error fetching service:', error);
                    toast({
                        title: 'Erro!',
                        description: 'Não foi possível carregar os detalhes da requisição.',
                        variant: 'destructive'
                    });
                    return;
                }

                if (data) {
                    const normalizedService: Service = {
                        id: data.id,
                        guideNumber: data.guide_number ?? data.guideNumber ?? '',
                        requestingArea: data.requesting_area ?? data.requestingArea ?? '',
                        responsible: data.responsible ?? '',
                        requestDate: data.request_date ? new Date(data.request_date) : new Date(),
                        reason: data.reason ?? '',
                        mainActivities: data.main_activities ?? data.mainActivities ?? '',
                        estimatedTime: data.estimated_time ?? data.estimatedTime ?? '',
                        estimatedStaff: Number(data.estimated_staff ?? data.estimatedStaff ?? 0),
                        budget: data.budget != null ? Number(data.budget) : undefined,
                        assignedWorkers: Array.isArray(data.assigned_workers) ? data.assigned_workers : [],
                        status: (data.status ?? 'Pendente') as Service['status'],
                        createdAt: data.created_at ? new Date(data.created_at) : new Date(),
                        type: (data.type ?? 'Eventual (Requisição)') as Service['type'],
                        client: data.client ?? '',
                    };
                    setService(normalizedService);
                }
            } catch (error) {
                console.error('Error fetching service:', error);
                toast({
                    title: 'Erro!',
                    description: 'Não foi possível carregar os detalhes da requisição.',
                    variant: 'destructive'
                });
            } finally {
                setLoading(false);
            }
        }

        fetchService();
    }, [id, toast]);

    useEffect(() => {
        if (isPrinting) {
          const timer = setTimeout(() => {
            const printTitle = service?.guideNumber || 'Guia-Requisicao';
            const originalTitle = document.title;
            document.title = printTitle;
            window.print();
            document.title = originalTitle;
            setIsPrinting(false);
          }, 100);
          return () => clearTimeout(timer);
        }
      }, [isPrinting, service]);

    const handleUpdateStatus = async (status: 'Aprovado' | 'Rejeitado') => {
        if (!id) return;
        
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase
                .from('service_requisitions')
                .update({ status })
                .eq('id', id);

            if (error) {
                throw error;
            }

            // Update local state
            if (service) {
                setService({ ...service, status });
            }

            toast({
                title: 'Estado Atualizado!',
                description: `A requisição foi marcada como ${status.toLowerCase()}.`
            });
        } catch (error) {
            console.error("Failed to update status:", error);
            toast({
                title: 'Erro!',
                description: 'Não foi possível atualizar o estado da requisição.',
                variant: 'destructive'
            });
        }
    };
    
    const handlePrint = () => {
        setIsPrinting(true);
    }

    const handleWorkerClick = (workerId: string) => {
        const candidate = candidates.find(c => c.id === workerId);
        if (candidate) {
            setSelectedCandidate(candidate);
        } else {
            toast({
                title: 'Candidato não encontrado',
                description: 'Não foi possível encontrar os detalhes completos para este trabalhador.',
                variant: 'destructive',
            })
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-16 w-16 animate-spin text-primary"/>
            </div>
        );
    }
    
    if (!service) {
        return notFound();
    }

    if (isPrinting) {
        return <ServiceRequisitionPrintLayout service={service} />;
    }

    const getStatusVariant = (status: Service['status']) => {
        switch (status) {
            case 'Aprovado': return 'default';
            case 'Pendente': return 'secondary';
            case 'Rejeitado': return 'destructive';
            default: return 'outline';
        }
    }

  return (
    <>
      <DashboardHeader title={`Requisição: ${service.guideNumber}`}>
        <div className="print:hidden flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Retroceder
            </Button>
            <Button variant="outline" onClick={handlePrint}><Printer className="mr-2"/> Imprimir</Button>
            <Button variant="destructive" onClick={() => handleUpdateStatus('Rejeitado')} disabled={service.status !== 'Pendente'}><X className="mr-2"/> Rejeitar</Button>
            <Button onClick={() => handleUpdateStatus('Aprovado')} disabled={service.status !== 'Pendente'}><Check className="mr-2"/> Aprovar Requisição</Button>
        </div>
      </DashboardHeader>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="font-headline text-2xl">Detalhes da Requisição</CardTitle>
                            <CardDescription>
                                Emitido em {format(service.requestDate, "dd 'de' MMMM, yyyy", { locale: pt })}
                            </CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(service.status)} className="text-base px-4 py-1">{service.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <DetailItem icon={Briefcase} label="Área Solicitante" value={service.requestingArea} />
                        <DetailItem icon={User} label="Responsável" value={service.responsible} />
                        <DetailItem icon={Calendar} label="Data da Solicitação" value={format(service.requestDate, "PPP", { locale: pt })} />
                        <DetailItem icon={Users} label="Pessoal Estimado" value={`${service.estimatedStaff} pessoas`} />
                        <DetailItem icon={Clock} label="Tempo Estimado" value={service.estimatedTime} />
                        <DetailItem icon={DollarSign} label="Orçamento" value={service.budget ? service.budget.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }) : 'N/A'} />
                    </div>
                     <div className="space-y-2 pt-4 border-t">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4"/> Motivo da Solicitação</h4>
                        <p className="text-base">{service.reason}</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4"/> Principais Atividades</h4>
                        <p className="text-base">{service.mainActivities}</p>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Assinaturas</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center pt-8">
                        <div>
                            <div className="border-t border-dashed w-full mx-auto pt-2">Chefe da Área Solicitante</div>
                        </div>
                            <div>
                            <div className="border-t border-dashed w-full mx-auto pt-2">Recursos Humanos (Cliente)</div>
                        </div>
                            <div>
                            <div className="border-t border-dashed w-full mx-auto pt-2">Diretor Fabril</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
        <div className="lg:col-span-1">
            <Card className="sticky top-8">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Users /> Pessoal Alocado</CardTitle>
                </CardHeader>
                <CardContent>
                    {service.assignedWorkers && service.assignedWorkers.length > 0 ? (
                        <ul className="space-y-3">
                            {service.assignedWorkers.map((worker) => (
                                <li key={worker.id}>
                                    <button 
                                        className="w-full flex items-center gap-3 p-2 bg-muted/50 rounded-md text-left hover:bg-muted transition-colors"
                                        onClick={() => handleWorkerClick(worker.id)}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <span className="font-medium">{worker.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">Nenhum trabalhador alocado para este serviço.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
      
        <CandidateDetailDialog 
            candidate={selectedCandidate}
            open={!!selectedCandidate}
            onOpenChange={(isOpen) => !isOpen && setSelectedCandidate(null)}
        />
    </>
  );
}
