
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, FilePlus, BarChart as BarChartIcon, ShieldAlert, Loader2, Users, Calendar as CalendarIcon, UserX } from "lucide-react";
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { format, addDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { DateRange } from "react-day-picker"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


interface SupervisionReport {
  id: string;
  reportDate: string; // Storing as string from datetime-local input
  client: string;
  activity: string;
  staffAllocated: number;
  staffAbsences: number;
  staffNormalHours?: number;
  staffExtraHours?: number;
  safetyIncidents?: string;
  prodGoal?: string;
  prodResult?: string;
  createdAt: Timestamp;
}

export default function SupervisionPage() {
    const firestore = useFirestore();
    const [date, setDate] = useState<DateRange | undefined>({
      from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      to: new Date(),
    });
    const [selectedClient, setSelectedClient] = useState<string>('all');

    const reportsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'supervision-reports'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: allReports, loading } = useCollection<SupervisionReport>(reportsQuery);

    const clients = useMemo(() => {
        if (!allReports) return [];
        const clientSet = new Set(allReports.map(r => r.client));
        return ['all', ...Array.from(clientSet)];
    }, [allReports]);

    const filteredReports = useMemo(() => {
      if (!allReports) return [];
      
      let reports = allReports;

      // Filter by client
      if (selectedClient !== 'all') {
          reports = reports.filter(report => report.client === selectedClient);
      }

      // Filter by date
      if (!date?.from) return reports;

      const from = date.from;
      const to = date.to ? addDays(date.to, 1) : addDays(from, 1); // if no 'to', filter for single day

      return reports.filter(report => {
        if (!report.createdAt) return false;
        const reportDate = report.createdAt.toDate();
        return reportDate >= from && reportDate < to;
      });
    }, [allReports, date, selectedClient]);
    
    const { totalHours, totalIncidents, totalWorkers, totalAbsences } = useMemo(() => {
        if (!filteredReports) return { totalHours: 0, totalIncidents: 0, totalWorkers: 0, totalAbsences: 0 };
        return {
            totalHours: filteredReports.reduce((acc, r) => acc + (r.staffNormalHours || 0) + (r.staffExtraHours || 0), 0),
            totalIncidents: filteredReports.filter(r => r.safetyIncidents && r.safetyIncidents.length > 0).length,
            totalWorkers: filteredReports.reduce((acc, r) => acc + r.staffAllocated, 0),
            totalAbsences: filteredReports.reduce((acc, r) => acc + r.staffAbsences, 0)
        };
    }, [filteredReports]);
    
    const performanceByClient = useMemo(() => {
        if (!filteredReports) return [];
        const dataByClient = filteredReports.reduce((acc, report) => {
            if (!acc[report.client]) {
                acc[report.client] = { client: report.client, 'Pessoal Alocado': 0, 'Faltas': 0 };
            }
            acc[report.client]['Pessoal Alocado'] += report.staffAllocated;
            acc[report.client]['Faltas'] += report.staffAbsences;
            return acc;
        }, {} as Record<string, { client: string; 'Pessoal Alocado': number; 'Faltas': number }>);

        return Object.values(dataByClient);
    }, [filteredReports]);

    const reportsOverTime = useMemo(() => {
        if (!filteredReports || !date?.from) return [];
        
        const from = startOfDay(date.from);
        const to = startOfDay(date.to || date.from);
        const interval = eachDayOfInterval({ start: from, end: to });

        const reportsByDay = filteredReports.reduce((acc, report) => {
             if (report.createdAt) {
                const reportDay = format(report.createdAt.toDate(), 'dd/MM');
                if (!acc[reportDay]) {
                    acc[reportDay] = 0;
                }
                acc[reportDay]++;
            }
            return acc;
        }, {} as Record<string, number>);

        return interval.map(day => {
            const formattedDay = format(day, 'dd/MM');
            return {
                date: formattedDay,
                'Nº Relatórios': reportsByDay[formattedDay] || 0
            };
        });
    }, [filteredReports, date]);


  return (
    <>
      <DashboardHeader title="Dashboard de Supervisão">
        <div className='flex items-center gap-2'>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por cliente..." />
                </SelectTrigger>
                <SelectContent>
                    {clients.map(client => (
                        <SelectItem key={client} value={client}>
                            {client === 'all' ? 'Todos os Clientes' : client}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
           <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y", { locale: pt })} -{" "}
                        {format(date.to, "LLL dd, y", { locale: pt })}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  locale={pt}
                />
              </PopoverContent>
            </Popover>
          <Button asChild>
              <Link href="/dashboard/supervision/new">
                  <FilePlus className="mr-2 h-4 w-4" /> Criar Novo Relatório
              </Link>
          </Button>
        </div>
      </DashboardHeader>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Relatórios</CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className='h-6 w-6 animate-spin'/> : filteredReports?.length || 0}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pessoal Gerido</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className='h-6 w-6 animate-spin'/> : totalWorkers}</div>
            <p className="text-xs text-muted-foreground">Soma de efetivo alocado</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faltas / Ausências</CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{loading ? <Loader2 className='h-6 w-6 animate-spin'/> : totalAbsences}</div>
                <p className="text-xs text-muted-foreground">Total de faltas registadas</p>
            </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidentes de Segurança</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className='h-6 w-6 animate-spin'/> : totalIncidents}</div>
            <p className="text-xs text-muted-foreground">Ocorrências registadas</p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-8 md:grid-cols-2 mb-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Desempenho por Cliente</CardTitle>
                    <CardDescription>Pessoal alocado vs. Faltas por cliente no período selecionado.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={performanceByClient}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="client" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Pessoal Alocado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Faltas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Evolução dos Relatórios</CardTitle>
                    <CardDescription>Número de relatórios submetidos ao longo do tempo.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportsOverTime}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false}/>
                            <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 'dataMax + 2']}/>
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="Nº Relatórios" stroke="hsl(var(--primary))" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                 </CardContent>
            </Card>
        </div>


      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Histórico de Relatórios Diários</CardTitle>
          <CardDescription>
            Acompanhe todos os relatórios de supervisão submetidos no período selecionado.
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
                <TableHead>Data</TableHead>
                <TableHead>Cliente/Local</TableHead>
                <TableHead>Atividade</TableHead>
                <TableHead>Efetivo</TableHead>
                <TableHead>Faltas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports?.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.reportDate ? format(new Date(report.reportDate), 'dd/MM/yyyy HH:mm', { locale: pt }) : 'N/A'}</TableCell>
                  <TableCell>{report.client}</TableCell>
                  <TableCell>{report.activity}</TableCell>
                  <TableCell>{report.staffAllocated}</TableCell>
                  <TableCell>{report.staffAbsences > 0 ? <Badge variant="destructive">{report.staffAbsences}</Badge> : report.staffAbsences}</TableCell>
                   <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/supervision/${report.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> Ver
                        </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
               {filteredReports?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Nenhum relatório encontrado para os filtros selecionados.
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
