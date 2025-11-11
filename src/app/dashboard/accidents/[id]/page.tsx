
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import * as XLSX from 'xlsx';
import { DashboardHeader } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Download, User, Calendar, Siren, AlertTriangle, HelpCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

interface Accident {
    id: string;
    datetime: { seconds: number };
    workerName: string;
    clientUnit: string;
    type: 'sem-baixa' | 'com-baixa' | 'quase-acidente';
    severity: 'leve' | 'moderado' | 'grave';
    description: string;
    probableCause: string;
}

const mockAccidents: Accident[] = [
    {
        id: 'mock-1',
        datetime: { seconds: Math.floor(new Date().getTime() / 1000) - 86400 * 5 }, // 5 days ago
        workerName: 'Manuel Joaquim',
        clientUnit: 'Cliente A',
        type: 'sem-baixa',
        severity: 'leve',
        description: 'Escorregou no chão molhado, mas não sofreu ferimentos. Retomou ao trabalho imediatamente.',
        probableCause: 'Chão molhado não sinalizado.'
    },
    {
        id: 'mock-2',
        datetime: { seconds: Math.floor(new Date().getTime() / 1000) - 86400 * 12 }, // 12 days ago
        workerName: 'Sofia Costa',
        clientUnit: 'Cliente B',
        type: 'com-baixa',
        severity: 'moderado',
        description: 'Corte no braço esquerdo ao manusear material cortante sem luvas adequadas. Necessitou de sutura.',
        probableCause: 'Não utilização do EPI correto (luvas de corte).'
    }
];

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div>
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</p>
        <p className="mt-1 ml-6 text-base font-semibold">{value}</p>
    </div>
);

const getSeverityBadge = (severity: Accident['severity']) => {
    switch (severity) {
        case 'leve': return <Badge variant="secondary" className="text-base px-3 py-1">Leve</Badge>;
        case 'moderado': return <Badge variant="outline" className="text-base px-3 py-1 border-yellow-500 text-yellow-500">Moderado</Badge>;
        case 'grave': return <Badge variant="destructive" className="text-base px-3 py-1">Grave</Badge>;
        default: return <Badge className="text-base px-3 py-1">N/A</Badge>;
    }
}

const getAccidentType = (type: Accident['type']) => {
    switch (type) {
        case 'sem-baixa': return 'Acidente sem Baixa';
        case 'com-baixa': return 'Acidente com Baixa';
        case 'quase-acidente': return 'Quase Acidente';
        default: return 'N/A';
    }
}


export default function AccidentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;
    
    const firestore = useFirestore();
    const accidentsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'work-accidents'));
    }, [firestore]);

    const { data: firestoreAccidents, loading: accidentsLoading } = useCollection<Accident>(accidentsQuery);

    const accident = useMemo(() => {
        if (!id || accidentsLoading) return null;
        const allAccidents = [...mockAccidents, ...(firestoreAccidents || [])];
        return allAccidents.find(a => a.id === id) || null;
    }, [id, firestoreAccidents, accidentsLoading]);

    const loading = accidentsLoading;

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin"/></div>
    }

    if (!accident) {
        return notFound();
    }

    const handlePrint = () => {
        window.print();
    }
    
    const downloadXLSX = () => {
        const dataToExport = [
            { Chave: 'ID do Relatório', Valor: accident.id },
            { Chave: 'Data e Hora', Valor: format(accident.datetime.seconds * 1000, "dd/MM/yyyy HH:mm", { locale: pt }) },
            { Chave: 'Trabalhador Envolvido', Valor: accident.workerName },
            { Chave: 'Unidade / Cliente', Valor: accident.clientUnit },
            { Chave: 'Tipo de Incidente', Valor: getAccidentType(accident.type) },
            { Chave: 'Gravidade', Valor: accident.severity },
            { Chave: 'Descrição', Valor: accident.description },
            { Chave: 'Causa Provável', Valor: accident.probableCause },
        ];
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatorio Acidente');
        XLSX.writeFile(workbook, `Relatorio_Acidente_${accident.id.substring(0, 8)}.xlsx`);
    }

    return (
        <>
            <DashboardHeader title={`Relatório de Acidente: ${accident.id.substring(0, 8)}`}>
                <div className="flex items-center gap-2 print:hidden">
                    <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2"/>Retroceder</Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button><Download className="mr-2"/>Baixar Relatório</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={handlePrint}>Exportar para PDF</DropdownMenuItem>
                            <DropdownMenuItem onSelect={downloadXLSX}>Exportar para Excel</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </DashboardHeader>

            <Card className="print-this">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="font-headline text-2xl">Relatório de Acidente de Trabalho</CardTitle>
                            <CardDescription>
                                Detalhes da ocorrência registada.
                            </CardDescription>
                        </div>
                        {getSeverityBadge(accident.severity)}
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                     <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <DetailItem icon={Calendar} label="Data e Hora" value={format(accident.datetime.seconds * 1000, "dd/MM/yyyy HH:mm", { locale: pt })} />
                        <DetailItem icon={User} label="Trabalhador Envolvido" value={accident.workerName} />
                        <DetailItem icon={Siren} label="Unidade / Cliente" value={accident.clientUnit} />
                        <DetailItem icon={AlertTriangle} label="Tipo de Incidente" value={getAccidentType(accident.type)} />
                    </div>

                     <div className="space-y-4 pt-4 border-t">
                        <div>
                            <h4 className="font-medium text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4"/> Descrição da Ocorrência</h4>
                            <p className="mt-1 text-base">{accident.description}</p>
                        </div>
                         <div>
                            <h4 className="font-medium text-muted-foreground flex items-center gap-2"><HelpCircle className="h-4 w-4"/> Causa Provável</h4>
                            <p className="mt-1 text-base">{accident.probableCause}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}
