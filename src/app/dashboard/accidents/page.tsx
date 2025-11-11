
'use client';

import { useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Siren, Loader2, Eye } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AccidentReportDialog } from "@/components/dashboard/accident-report-dialog";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy, Timestamp } from "firebase/firestore";
import { format } from 'date-fns';
import { type Client } from "@/app/dashboard/clients/page";
import { useClients } from "@/hooks/use-clients";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Accident {
    id: string;
    datetime: { seconds: number };
    workerName: string;
    type: 'sem-baixa' | 'com-baixa' | 'quase-acidente';
    severity: 'leve' | 'moderado' | 'grave';
    clientUnit: string;
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


export default function AccidentsPage() {
  const firestore = useFirestore();
  const { clients, loading: clientsLoading } = useClients();

  const accidentsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'work-accidents'), orderBy('datetime', 'desc'));
  }, [firestore]);
  

  const { data: firestoreAccidents, loading: accidentsLoading } = useCollection<Accident>(accidentsQuery);

  const allAccidents = useMemo(() => {
    const combined = [...mockAccidents, ...(firestoreAccidents || [])];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique.sort((a,b) => b.datetime.seconds - a.datetime.seconds);
  }, [firestoreAccidents]);


  const loading = accidentsLoading || clientsLoading;

  const totalAccidents = allAccidents?.length || 0;
  const severeAccidents = allAccidents?.filter(a => a.severity === 'grave').length || 0;

  const getSeverityBadge = (severity: Accident['severity']) => {
    switch (severity) {
        case 'leve': return <Badge variant="secondary">Leve</Badge>;
        case 'moderado': return <Badge variant="outline">Moderado</Badge>;
        case 'grave': return <Badge variant="destructive">Grave</Badge>;
        default: return <Badge>N/A</Badge>;
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


  return (
    <>
      <DashboardHeader title="Acidentes de Trabalho">
        <AccidentReportDialog clients={clients || []} />
      </DashboardHeader>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Acidentes</CardTitle>
                <Siren className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalAccidents}</div>
                <p className="text-xs text-muted-foreground">No último ano</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Acidentes Graves</CardTitle>
                <Siren className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : severeAccidents}</div>
                <p className="text-xs text-muted-foreground">Com necessidade de hospitalização</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dias Sem Acidentes</CardTitle>
                <Siren className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">125</div>
                <p className="text-xs text-muted-foreground">Recorde da empresa</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Registos de Acidentes</CardTitle>
          <CardDescription>
            Documentação de todos os incidentes e acidentes de trabalho.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : (
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Trabalhador</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Gravidade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {allAccidents && allAccidents.map(accident => (
                    <TableRow key={accident.id} className="cursor-pointer" onClick={() => window.location.href=`/dashboard/accidents/${accident.id}`}>
                        <TableCell className="font-medium">{accident.workerName || 'N/A'}</TableCell>
                        <TableCell>{format(new Date(accident.datetime.seconds * 1000), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell>{getAccidentType(accident.type)}</TableCell>
                        <TableCell>{getSeverityBadge(accident.severity)}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/dashboard/accidents/${accident.id}`}><Eye className="mr-2 h-4 w-4"/> Ver</Link>
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
                 {allAccidents?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nenhum acidente registado.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
