
'use client';

import { useMemo, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Download } from 'lucide-react';
import { format } from 'date-fns';
import { SupervisionReportPrintLayout } from '@/components/dashboard/supervision-report-print-layout';

// This should match the structure of your data in Firestore
export interface SupervisionReport {
  id: string;
  supervisor: string;
  reportDate: string;
  client: string;
  activity: string;
  weather?: string;
  staffAllocated: number;
  staffAbsences: number;
  staffNormalHours: number;
  staffExtraHours: number;
  staffReplacements?: string;
  staffIssues?: string;
  prodGoal?: string;
  prodResult?: string;
  prodProductiveHours?: number;
  prodNonProductiveHours?: number;
  prodJustification?: string;
  safetyEpi: 'conforme' | 'nao-conforme';
  safetyBriefing: 'realizado' | 'nao-realizado';
  safetyIncidents?: string;
  safetyUnsafeConditions?: string;
  clientFeedback?: string;
  clientNeeds?: string;
  pendingIssues?: string;
  highlights?: string;
  recommendations?: string;
}

const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6 break-inside-avoid">
        <h3 className="font-headline text-lg font-semibold mb-3 border-b pb-2">{title}</h3>
        <div className="space-y-4 text-sm">{children}</div>
    </div>
);

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => {
    if (!value && typeof value !== 'number') return null;
    return (
        <div>
            <p className="font-medium text-muted-foreground">{label}</p>
            <p className="mt-1">{value}</p>
        </div>
    );
};


export default function SupervisionReportDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const firestore = useFirestore();
    const reportRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'supervision-reports', id);
    }, [firestore, id]);

    const { data: report, loading } = useDoc<SupervisionReport>(reportRef);

    const handlePrint = () => {
        window.print();
    }
    
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-16 w-16 animate-spin text-primary"/>
            </div>
        );
    }
    
    if (!report) {
        return notFound();
    }

  return (
    <>
      <DashboardHeader title={`Relatório: ${report.client}`}>
        <div className="print:hidden flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Retroceder
            </Button>
            <Button variant="outline" onClick={handlePrint}><Download className="mr-2"/> Baixar PDF</Button>
        </div>
      </DashboardHeader>

      <div className="print-this">
         <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Relatório Diário de Supervisão</CardTitle>
                <CardDescription>
                    Gerado por {report.supervisor} em {report.reportDate ? format(new Date(report.reportDate), 'dd/MM/yyyy HH:mm') : 'N/A'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <DetailSection title="I. Identificação e Contexto">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <DetailItem label="Cliente / Local" value={report.client} />
                                <DetailItem label="Condições Climáticas" value={report.weather} />
                            </div>
                            <DetailItem label="Atividade Supervisionada" value={report.activity} />
                        </DetailSection>
                         <DetailSection title="II. Recursos Humanos e Presença">
                            <div className="grid sm:grid-cols-4 gap-4">
                                <DetailItem label="Efetivo Alocado" value={report.staffAllocated} />
                                <DetailItem label="Faltas / Ausências" value={report.staffAbsences} />
                                <DetailItem label="Horas Normais" value={report.staffNormalHours} />
                                <DetailItem label="Horas Extras" value={report.staffExtraHours} />
                            </div>
                            <DetailItem label="Substituições" value={report.staffReplacements} />
                            <DetailItem label="Ocorrências de RH" value={report.staffIssues} />
                        </DetailSection>
                    </div>
                     <div className="lg:col-span-1 space-y-6">
                        <DetailSection title="IV. Segurança e Conformidade">
                            <DetailItem label="Utilização de EPIs" value={report.safetyEpi} />
                            <DetailItem label="Briefing de Segurança" value={report.safetyBriefing} />
                            <DetailItem label="Acidentes / Incidentes" value={report.safetyIncidents} />
                            <DetailItem label="Condições Inseguras" value={report.safetyUnsafeConditions} />
                        </DetailSection>
                    </div>
                    <div className="lg:col-span-3 grid md:grid-cols-2 gap-8">
                         <DetailSection title="III. Produtividade e Desempenho">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <DetailItem label="Meta do Dia/Turno" value={report.prodGoal} />
                                <DetailItem label="Resultado Alcançado" value={report.prodResult} />
                                <DetailItem label="Tempo Produtivo (h)" value={report.prodProductiveHours} />
                                <DetailItem label="Tempo Não Produtivo (h)" value={report.prodNonProductiveHours} />
                            </div>
                            <DetailItem label="Justificativa para Desvios / Paradas" value={report.prodJustification} />
                        </DetailSection>

                         <DetailSection title="V. Questões de Cliente e Pendências">
                            <DetailItem label="Feedback do Cliente" value={report.clientFeedback} />
                            <DetailItem label="Necessidades do Cliente" value={report.clientNeeds} />
                            <DetailItem label="Pendências (Follow-up)" value={report.pendingIssues} />
                        </DetailSection>
                    </div>
                     <div className="lg:col-span-3">
                         <DetailSection title="VI. Observações e Recomendações">
                            <DetailItem label="Destaques do Dia" value={report.highlights} />
                            <DetailItem label="Recomendações" value={report.recommendations} />
                        </DetailSection>
                    </div>
                </div>
            </CardContent>
         </Card>
      </div>

      <div className="hidden print-only">
        <SupervisionReportPrintLayout report={report} />
      </div>
    </>
  );
}
