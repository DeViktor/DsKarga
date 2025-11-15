
'use client';

import { useEffect, useMemo, useState } from "react";
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
import { format } from 'date-fns';
import { type Client } from "@/app/dashboard/clients/page";
import { useClients } from "@/hooks/use-clients";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Accident {
    id: string;
    date: Date;
    workerName: string;
    type: 'sem-baixa' | 'com-baixa' | 'quase-acidente';
    severity: 'leve' | 'moderado' | 'grave';
    clientUnit: string;
    description: string;
    probableCause: string;
}


export default function AccidentsPage() {
  const { clients, loading: clientsLoading } = useClients();
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [loadingAccidents, setLoadingAccidents] = useState<boolean>(true);
  const { toast } = useToast();

  const formatSupabaseError = (err: any): string => {
    try {
      if (!err) return 'Erro desconhecido.';
      if (typeof err === 'string') {
        const parsed = JSON.parse(err);
        return parsed?.message || parsed?.error || err;
      }
      return err.message || err.details || err.hint || err.code || String(err);
    } catch {
      return typeof err === 'string' ? err : 'Erro desconhecido.';
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchAccidents() {
      setLoadingAccidents(true);
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('work_accidents')
          .select('*')
          .order('datetime', { ascending: false });
        if (error) throw error;
        const normalized = (data || []).map((a: any) => ({
          id: a.id,
          date: a.datetime ? new Date(a.datetime) : new Date(),
          workerName: a.worker_name,
          type: a.type,
          severity: a.severity,
          clientUnit: a.client_unit,
          description: a.description,
          probableCause: a.probable_cause,
        })) as Accident[];
        if (isMounted) setAccidents(normalized);
      } catch (err: any) {
        const message = formatSupabaseError(err);
        console.error('Erro ao carregar acidentes do Supabase', err);
        if (isMounted) setAccidents([]);
        toast({ title: 'Erro ao carregar acidentes', description: message, variant: 'destructive' });
      } finally {
        if (isMounted) setLoadingAccidents(false);
      }
    }
    fetchAccidents();
    return () => { isMounted = false; };
  }, []);

  const loading = loadingAccidents || clientsLoading;

  const totalAccidents = accidents?.length || 0;
  const severeAccidents = accidents?.filter(a => a.severity === 'grave').length || 0;

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
                <div className="text-2xl font-bold">
                  {loading ? '—' : (() => {
                    if (!accidents || accidents.length === 0) return '—';
                    const latest = accidents[0];
                    const days = Math.floor((Date.now() - latest.date.getTime()) / (1000 * 60 * 60 * 24));
                    return String(days);
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">Dias desde último acidente</p>
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
                {accidents && accidents.map(accident => (
                    <TableRow key={accident.id} className="cursor-pointer" onClick={() => window.location.href=`/dashboard/accidents/${accident.id}`}>
                        <TableCell className="font-medium">{accident.workerName || 'N/A'}</TableCell>
                        <TableCell>{format(accident.date, 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell>{getAccidentType(accident.type)}</TableCell>
                        <TableCell>{getSeverityBadge(accident.severity)}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/dashboard/accidents/${accident.id}`}><Eye className="mr-2 h-4 w-4"/> Ver</Link>
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
                 {accidents?.length === 0 && (
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
