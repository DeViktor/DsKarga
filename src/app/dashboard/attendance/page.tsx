
'use client';

import { useState, useMemo, useEffect } from 'react';
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChevronLeft, ChevronRight, Save, Loader2, Clock, History } from "lucide-react";
import { Input } from '@/components/ui/input';
import { useWorkers, type WorkerWithService } from '@/hooks/use-workers';
import { useToast } from '@/hooks/use-toast';
import { AttendanceSheetPrintLayout } from '@/components/dashboard/attendance-sheet-print-layout';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useServices } from '@/hooks/use-services';
import { getSupabaseClient } from '@/lib/supabase/client';

interface AttendanceRecord {
    entry: string;
    exit: string;
    overtime: string;
    absence: string;
}

interface SavedSheet {
    id: string;
    date: Date;
    responsible: string;
    clientName?: string;
    attendanceData: Record<string, AttendanceRecord>;
}

export default function AttendancePage() {
    const { toast } = useToast();
    const { workers, loading } = useWorkers();
    const { services, loading: servicesLoading } = useServices();
    const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
    const [isPrinting, setIsPrinting] = useState(false);
    const [savedSheets, setSavedSheets] = useState<SavedSheet[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sheetToPrint, setSheetToPrint] = useState<SavedSheet | null>(null);


    const fixedWorkers = useMemo(() => workers.filter(w => w.type === 'Fixo'), [workers]);
    const eventualWorkers = useMemo(() => workers.filter(w => w.type === 'Eventual'), [workers]);

    useEffect(() => {
      // Initialize attendance with default values
      const initialAttendance: Record<string, AttendanceRecord> = {};
      workers.forEach(worker => {
        initialAttendance[worker.id] = {
          entry: '08:00',
          exit: '17:00',
          overtime: '00:00',
          absence: '00:00',
        };
      });
      setAttendance(initialAttendance);
    }, [workers]);

    useEffect(() => {
      if (isPrinting) {
        const timer = setTimeout(() => {
          window.print();
          setIsPrinting(false);
          setSheetToPrint(null);
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [isPrinting]);

    useEffect(() => {
      let isMounted = true;
      async function fetchSavedSheets() {
        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase
            .from('attendance_sheets')
            .select('*')
            .order('date', { ascending: false });
          if (error) throw error;
          const normalized = (data || []).map((s: any) => ({
            id: String(s.id ?? s.uuid),
            date: s.date ? new Date(s.date) : new Date(),
            responsible: s.responsible ?? 'Admin',
            clientName: s.client_name ?? 'N/A',
            attendanceData: s.attendance_data ?? {},
          })) as SavedSheet[];
          if (isMounted) setSavedSheets(normalized);
        } catch (err) {
          console.error('Erro ao carregar folhas de assiduidade do Supabase', err);
          if (isMounted) setSavedSheets([]);
        }
      }
      fetchSavedSheets();
      return () => { isMounted = false; };
    }, []);

    const handleTimeChange = (workerId: string, type: keyof AttendanceRecord, value: string) => {
        setAttendance(prev => ({
            ...prev,
            [workerId]: {
                ...prev[workerId],
                [type]: value,
            }
        }));
    };
    
    const handleSave = async () => {
        // Find a client name from the assigned workers for context
        const assignedWorker = workers.find(w => w.assignedToService);
        let clientName = 'N/A';
        if(assignedWorker && services) {
            const service = services.find(s => s.assignedWorkers?.some(aw => aw.id === assignedWorker.id));
            if(service) {
                clientName = service.client;
            }
        }

        const newSheet: SavedSheet = {
            id: `sheet-${Date.now()}`,
            date: currentDate,
            responsible: 'Admin', // Placeholder for logged-in user
            clientName: clientName,
            attendanceData: { ...attendance },
        };
        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase
            .from('attendance_sheets')
            .insert({
              date: newSheet.date.toISOString(),
              responsible: newSheet.responsible,
              client_name: newSheet.clientName,
              attendance_data: newSheet.attendanceData,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();
          if (error) throw error;
          const inserted: SavedSheet = {
            id: String(data.id ?? newSheet.id),
            date: data.date ? new Date(data.date) : newSheet.date,
            responsible: data.responsible ?? newSheet.responsible,
            clientName: data.client_name ?? newSheet.clientName,
            attendanceData: data.attendance_data ?? newSheet.attendanceData,
          };
          setSavedSheets(prev => [inserted, ...prev]);
          toast({
              title: "Registos Salvos",
              description: "A folha de ponto do dia foi guardada com sucesso.",
          });
        } catch (err) {
          console.error('Erro ao salvar folha de assiduidade no Supabase', err);
          toast({
            title: "Erro ao salvar",
            description: "Não foi possível gravar no Supabase.",
            variant: "destructive",
          });
        }
    };

    const handlePrintCurrent = () => {
        setSheetToPrint({ 
            id: 'current', 
            date: currentDate, 
            responsible: 'Admin', 
            attendanceData: attendance,
        });
        setIsPrinting(true);
    };

    const handleViewSaved = (sheet: SavedSheet) => {
        setSheetToPrint(sheet);
        setIsPrinting(true);
    };

    const renderAttendanceTable = (title: string, workerList: WorkerWithService[]) => (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Trabalhador</TableHead>
                          <TableHead className="text-center">Entrada</TableHead>
                          <TableHead className="text-center">Saída</TableHead>
                          <TableHead className="text-center">Horas Extras (hh:mm)</TableHead>
                          <TableHead className="text-center">Faltas/Atrasos (hh:mm)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workerList.map((worker) => (
                          <TableRow key={worker.id}>
                            <TableCell className="font-medium">{worker.name}</TableCell>
                            <TableCell className="text-center">
                              <Input 
                                type="time" 
                                className="w-32 mx-auto"
                                value={attendance[worker.id]?.entry || '08:00'}
                                onChange={(e) => handleTimeChange(worker.id, 'entry', e.target.value)}
                                />
                            </TableCell>
                             <TableCell className="text-center">
                              <Input 
                                type="time" 
                                className="w-32 mx-auto" 
                                value={attendance[worker.id]?.exit || '17:00'}
                                onChange={(e) => handleTimeChange(worker.id, 'exit', e.target.value)}
                                />
                            </TableCell>
                             <TableCell className="text-center">
                               <Input 
                                 type="time"
                                 className="w-32 mx-auto"
                                 value={attendance[worker.id]?.overtime || '00:00'}
                                 onChange={(e) => handleTimeChange(worker.id, 'overtime', e.target.value)}
                                />
                            </TableCell>
                             <TableCell className="text-center">
                               <Input 
                                 type="time"
                                 className="w-32 mx-auto"
                                 value={attendance[worker.id]?.absence || '00:00'}
                                 onChange={(e) => handleTimeChange(worker.id, 'absence', e.target.value)}
                                />
                            </TableCell>
                          </TableRow>
                        ))}
                         {workerList.length === 0 && (
                             <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Nenhum trabalhador encontrado.
                                </TableCell>
                            </TableRow>
                         )}
                      </TableBody>
                    </Table>
                  </div>
            </CardContent>
        </Card>
    );
    
    if (isPrinting && sheetToPrint) {
      return <AttendanceSheetPrintLayout workers={workers} attendance={sheetToPrint.attendanceData} date={sheetToPrint.date} />;
    }

  return (
    <>
      <DashboardHeader title="Gestão de Assiduidade">
         <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrintCurrent}>
              <FileText className="mr-2 h-4 w-4" />
              Gerar Folha de Ponto Diária
            </Button>
             <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Registos do Dia
            </Button>
        </div>
      </DashboardHeader>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="font-headline">Registo de Assiduidade Diária</CardTitle>
                <CardDescription>
                    Registe a presença, faltas e horas extras dos colaboradores.
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() - 1)))}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="font-medium text-sm">{format(currentDate, 'dd/MM/yyyy')}</span>
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() + 1)))}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
          </div>
        </CardHeader>
      </Card>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {renderAttendanceTable("Trabalhadores Fixos", fixedWorkers)}
                {renderAttendanceTable("Trabalhadores Eventuais", eventualWorkers)}
            </div>
             <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><History /> Histórico de Folhas Salvas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead className="text-right">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {savedSheets.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                            Nenhuma folha salva ainda.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    savedSheets.map(sheet => (
                                        <TableRow key={sheet.id}>
                                            <TableCell className="font-medium">{format(sheet.date, 'dd/MM/yyyy')}</TableCell>
                                            <TableCell><Badge variant="secondary">{sheet.clientName}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleViewSaved(sheet)}>Ver</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
      )}

    </>
  );
}
