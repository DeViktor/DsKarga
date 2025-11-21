

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { workers as staticWorkers } from "@/lib/data";
import type { Worker } from "@/types/worker";
import { notFound, useParams, useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Gavel, Hand, User, Edit, Upload, ArrowLeft, Briefcase, CalendarClock, Star, LogOut, Download, Clock, CheckCircle, PlusCircle, View, Camera, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { WorkerPassPrintLayout } from '@/components/dashboard/worker-pass-print-layout';
import { WorkerSheetPrintLayout } from '@/components/dashboard/worker-sheet-print-layout';
import { WorkerPayslipPrintLayout } from '@/components/dashboard/worker-payslip-print-layout';
import { WorkerDisciplinaryPrintLayout, type DisciplinaryAction } from '@/components/dashboard/worker-disciplinary-print-layout';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient } from '@/lib/supabase/client';
import { admitWorkerSupabase } from '@/lib/supabase/actions';


const attendanceHistory = [
    { date: '2024-07-29', entry: '08:01', exit: '17:05', absence: '00:00' },
    { date: '2024-07-28', entry: '08:15', exit: '17:00', absence: '00:15' },
    { date: '2024-07-27', entry: '08:00', exit: '16:30', absence: '00:30' },
];

const vacationHistory = [
    { start: '2023-12-20', end: '2024-01-05', days: 10, status: 'Aprovado' },
    { start: '2023-08-01', end: '2023-08-15', days: 10, status: 'Aprovado' },
];

const initialPerformanceHistory = [
    { date: '2024-06-15', evaluator: 'Supervisor A', score: 4.5, notes: 'Excelente desempenho, proativo e colaborativo.' },
    { date: '2023-12-10', evaluator: 'Supervisor A', score: 4.0, notes: 'Bom desempenho, cumpriu todas as metas.' },
];

const payrollHistory = [
    { period: 'Julho 2024', status: 'Pago' },
    { period: 'Junho 2024', status: 'Pago' },
    { period: 'Maio 2024', status: 'Pago' },
];

interface Document {
    id: number;
    name: string;
    expiry?: string;
    notes?: string;
    file: File;
}


export default function WorkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<Worker[]>([]);

  useEffect(() => {
    async function fetchWorkers() {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('workers')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;

        const normalized = (data || []).map((w: any) => ({
          id: w.id,
          name: w.name ?? '',
          role: w.role ?? '',
          department: w.department ?? '',
          category: w.category ?? '',
          baseSalary: Number(w.base_salary ?? w.baseSalary ?? 0),
          contractStatus: (w.status ?? 'Ativo') as Worker['contractStatus'],
          type: (w.type ?? 'Eventual') as Worker['type'],
        })) as Worker[];

        setWorkers(normalized);
      } catch (err) {
        console.error('Erro ao carregar trabalhadores do Supabase', err);
        setWorkers([]);
      } finally {
        setLoading(false);
      }
    }
    fetchWorkers();
  }, []);

  const [worker, setWorker] = useState<Worker | undefined>(undefined);
  
  useEffect(() => {
    if(!loading && workers.length > 0) {
      setWorker(workers.find(w => w.id === id));
    }
  }, [id, workers, loading]);

  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState<null | 'pass' | 'sheet' | 'payslip' | 'disciplinary'>(null);
  const [payslipData, setPayslipData] = useState<{period: string, netSalary: number} | null>(null);
  const [isAdmissionDialogOpen, setIsAdmissionDialogOpen] = useState(false);
  
  const [performanceHistory, setPerformanceHistory] = useState(initialPerformanceHistory);
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newDocument, setNewDocument] = useState<{name: string, expiry?: string, notes?: string, file?: File}>({ name: '' });
  const [documentExpires, setDocumentExpires] = useState<'nao' | 'sim'>('nao');


  const [disciplinaryHistory, setDisciplinaryHistory] = useState<DisciplinaryAction[]>([]);
  const [newDisciplinaryAction, setNewDisciplinaryAction] = useState<DisciplinaryAction>({
    type: 'verbal',
    date: '',
    description: '',
    actionTaken: ''
  });
  const [currentDisciplinaryAction, setCurrentDisciplinaryAction] = useState<DisciplinaryAction | null>(null);
  
  const [profilePic, setProfilePic] = useState(`https://picsum.photos/seed/${id}/200/200`);
  const fileInputRef = useRef<HTMLInputElement>(null);


   useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        let printTitle = `DSKarga_${isPrinting}`;
        if (worker) {
            printTitle = 
              isPrinting === 'payslip' ? `Recibo-${payslipData?.period}_${worker.name.replace(/ /g, '_')}` :
              isPrinting === 'pass' ? `Passe_Trabalho_${worker.name.replace(/ /g, '_')}` :
              isPrinting === 'sheet' ? `Ficha_Trabalhador_${worker.name.replace(/ /g, '_')}` :
              isPrinting === 'disciplinary' ? `Advertencia_${worker.name.replace(/ /g, '_')}`
              : printTitle;
        }
        document.title = printTitle;
        window.print();
        document.title = "DS KARGA SISTEM"; // Reset title
        setIsPrinting(null);
        setPayslipData(null);
        setCurrentDisciplinaryAction(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPrinting, worker, payslipData, currentDisciplinaryAction]);

  const handleAdmission = async () => {
    if (!worker) return;
    
    try {
      await admitWorkerSupabase(worker.id, {
        admissionDate: new Date().toISOString().split('T')[0],
        position: worker.role,
        department: worker.department,
        salary: worker.baseSalary,
        contractType: worker.type,
      });
      
      toast({
        title: "Sucesso!",
        description: `Funcionário ${worker.name} admitido com sucesso.`,
      });
      
      // Recarregar dados do worker
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('id', worker.id)
        .single();
      
      if (!error && data) {
        const normalized = {
          id: data.id,
          name: data.name ?? '',
          role: data.role ?? '',
          department: data.department ?? '',
          category: data.category ?? '',
          baseSalary: Number(data.base_salary ?? data.baseSalary ?? 0),
          contractStatus: (data.contract_status ?? 'Ativo') as Worker['contractStatus'],
          type: (data.type ?? 'Eventual') as Worker['type'],
        };
        setWorker(normalized);
      }
      
      setIsAdmissionDialogOpen(false);
    } catch (error) {
      console.error('Erro ao admitir funcionário:', error);
      toast({
        title: "Erro!",
        description: "Não foi possível admitir o funcionário.",
        variant: "destructive",
      });
    }
  };

  if (loading || worker === undefined) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  if (!worker) {
    notFound();
  }
  
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
         toast({
          title: "Foto de Perfil Atualizada",
          description: "A nova foto foi carregada nesta sessão.",
        });
      };
      reader.readAsDataURL(file);
    }
  };


  const handleUpdateWorker = (updatedData: Partial<Worker>) => {
      setWorker(prevWorker => prevWorker ? { ...prevWorker, ...updatedData } : undefined);
      setIsEditDialogOpen(false);
       toast({
          title: "Perfil Atualizado",
          description: "As informações do trabalhador foram atualizadas nesta sessão.",
        });
  }
  
  const handleAddEvaluation = (evaluationData: { evaluator: string, score: number, notes: string }) => {
    const newEvaluation = {
        date: new Date().toISOString().split('T')[0], // format to 'YYYY-MM-DD'
        ...evaluationData
    };
    setPerformanceHistory(prev => [newEvaluation, ...prev]);
  };

  const handleAddDisciplinaryAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisciplinaryAction.type || !newDisciplinaryAction.date || !newDisciplinaryAction.description) {
      toast({
        title: "Campos Obrigatórios",
        description: "Por favor, preencha todos os campos da ocorrência.",
        variant: "destructive"
      });
      return;
    }
    const newAction = { ...newDisciplinaryAction, id: Date.now() };
    setDisciplinaryHistory(prev => [newAction, ...prev]);
    setCurrentDisciplinaryAction(newAction);
    setIsPrinting('disciplinary');
    
    setNewDisciplinaryAction({ type: 'verbal', date: '', description: '', actionTaken: '' });
    const form = e.target as HTMLFormElement;
    form.reset();
  };
  
  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocument.name || !newDocument.file) {
        toast({
            title: "Campos Obrigatórios",
            description: "Por favor, preencha o nome do documento e selecione um ficheiro.",
            variant: "destructive"
        });
        return;
    }
    const doc: Document = {
        id: Date.now(),
        name: newDocument.name,
        expiry: documentExpires === 'sim' ? newDocument.expiry : undefined,
        notes: newDocument.notes,
        file: newDocument.file
    };
    setDocuments(prev => [...prev, doc]);
    setNewDocument({ name: '' });
    setDocumentExpires('nao');
    const form = e.target as HTMLFormElement;
    form.reset();
     toast({
        title: "Documento Adicionado",
        description: `O documento "${doc.name}" foi carregado com sucesso.`,
    });
  };

  const handleDownloadDocument = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const inss = (worker.baseSalary || 0) * 0.03;
  const irt = ((worker.baseSalary || 0) - inss) * 0.10; // Simple calc, might need complex rules
  const netSalary = (worker.baseSalary || 0) - inss - irt;

  const handlePrintPayslip = (period: string, netSalary: number) => {
    setPayslipData({ period, netSalary });
    setIsPrinting('payslip');
  };

  const handleViewDisciplinary = (action: DisciplinaryAction) => {
    setCurrentDisciplinaryAction(action);
    setIsPrinting('disciplinary');
  };


  if (isPrinting === 'pass' && worker) {
    return <WorkerPassPrintLayout worker={worker} />;
  }

  if (isPrinting === 'sheet' && worker) {
    return <WorkerSheetPrintLayout worker={worker} />;
  }
  
  if (isPrinting === 'payslip' && worker && payslipData) {
    return <WorkerPayslipPrintLayout worker={worker} salaryData={{...payslipData, baseSalary: worker.baseSalary, inss, irt}} />;
  }

  if (isPrinting === 'disciplinary' && worker && currentDisciplinaryAction) {
    return <WorkerDisciplinaryPrintLayout worker={worker} action={currentDisciplinaryAction} />;
  }


  return (
    <>
      <DashboardHeader title="Perfil do Trabalhador">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retroceder
        </Button>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Editar Perfil</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Perfil</DialogTitle>
                    <DialogDescription>
                        Faça alterações nas informações do trabalhador.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const updatedData = {
                        name: formData.get('name') as string,
                        role: formData.get('role') as string,
                        department: formData.get('department') as string,
                        baseSalary: Number(formData.get('salary')),
                        contractStatus: formData.get('status') as Worker['contractStatus'],
                        type: formData.get('type') as Worker['type'],
                    };
                    handleUpdateWorker(updatedData);
                }}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nome</Label>
                            <Input id="name" name="name" defaultValue={worker.name} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">Função</Label>
                            <Input id="role" name="role" defaultValue={worker.role} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="department" className="text-right">Departamento</Label>
                            <Input id="department" name="department" defaultValue={worker.department} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="salary" className="text-right">Salário Base</Label>
                            <Input id="salary" name="salary" type="number" defaultValue={worker.baseSalary} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Estado</Label>
                            <Select name="status" defaultValue={worker.contractStatus}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Ativo">Ativo</SelectItem>
                                    <SelectItem value="Suspenso">Suspenso</SelectItem>
                                    <SelectItem value="Concluído">Concluído</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">Tipo</Label>
                            <Select name="type" defaultValue={worker.type}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Fixo">Fixo</SelectItem>
                                    <SelectItem value="Eventual">Eventual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                        <Button type="submit">Guardar Alterações</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </DashboardHeader>

      <Tabs defaultValue="overview">
        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1 space-y-6">
              <Card>
                  <CardHeader className="items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={profilePic} />
                        <AvatarFallback>{worker.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handlePhotoUpload} 
                    />
                      <CardTitle className="font-headline text-2xl">{worker.name}</CardTitle>
                      <CardDescription>{worker.role}</CardDescription>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                        <Camera className="mr-2 h-4 w-4" />
                        Alterar Foto
                      </Button>
                      <div className="pt-2">
                        <Badge variant={worker.contractStatus === 'Ativo' ? 'default' : 'secondary'}>{worker.contractStatus}</Badge>
                      </div>
                  </CardHeader>
                  <CardContent>
                       <TabsList className="grid w-full grid-cols-1 h-auto">
                        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                        <TabsTrigger value="attendance">Folha de Ponto</TabsTrigger>
                        <TabsTrigger value="payroll">Salários e Recibos</TabsTrigger>
                        <TabsTrigger value="vacation">Férias</TabsTrigger>
                        <TabsTrigger value="performance">Avaliação de Desempenho</TabsTrigger>
                        <TabsTrigger value="disciplinary">Processos Disciplinares</TabsTrigger>
                        <TabsTrigger value="documents">Documentação</TabsTrigger>
                      </TabsList>
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle className="font-headline text-lg">Ações de RH</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                       <Button variant="outline" className="w-full justify-start gap-2" asChild>
                            <Link href={`/dashboard/workers/${worker.id}/contract`}>
                                <FileText className="h-4 w-4"/> Gerar Contrato
                            </Link>
                        </Button>
                      <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setIsPrinting('pass')}><Hand className="h-4 w-4"/> Gerar Passe de Trabalho</Button>
                      <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setIsPrinting('sheet')}><User className="h-4 w-4"/> Gerar Ficha do Trabalhador</Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="w-full justify-start gap-2"><LogOut className="h-4 w-4"/> Admissão / Desligamento</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Admissão e Desligamento</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Selecione a ação que pretende executar para o trabalhador <span className="font-bold">{worker.name}</span>.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <Button variant="secondary" onClick={() => setIsAdmissionDialogOpen(true)}>Admitir</Button>
                                <AlertDialogAction asChild>
                                    <Link href={`/dashboard/workers/${worker.id}/termination`}>Desligar</Link>
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      {/* Dialog de Confirmação de Admissão */}
                      <AlertDialog open={isAdmissionDialogOpen} onOpenChange={setIsAdmissionDialogOpen}>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Admissão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja admitir o trabalhador <span className="font-bold">{worker.name}</span>? 
                              Esta ação irá atualizar o status do contrato para 'Ativo'.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleAdmission}>
                              Confirmar Admissão
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </CardContent>
              </Card>
          </div>
          <div className="lg:col-span-3">
              <TabsContent value="overview" className="space-y-8 mt-0">
                  <Card>
                      <CardHeader><CardTitle className="font-headline text-lg">Informações Pessoais</CardTitle></CardHeader>
                      <CardContent className="grid md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                          <div><p className="text-muted-foreground">Nacionalidade</p><p className="font-medium">Angolana</p></div>
                          <div><p className="text-muted-foreground">Estado Civil</p><p className="font-medium">N/A</p></div>
                          <div><p className="text-muted-foreground">Data de Nascimento</p><p className="font-medium">N/A</p></div>
                          <div><p className="text-muted-foreground">Gênero</p><p className="font-medium">Masculino</p></div>
                          <div className="md:col-span-2"><p className="text-muted-foreground">Residência</p><p className="font-medium">Luanda-Viana/ Estalagem</p></div>
                          <div><p className="text-muted-foreground">NIF</p><p className="font-medium">N/A</p></div>
                          <div><p className="text-muted-foreground">Nº Seg. Social</p><p className="font-medium">N/A</p></div>
                          <div><p className="text-muted-foreground">Nº B.I.</p><p className="font-medium">006158685LA044</p></div>
                          <div className="md:col-span-2"><p className="text-muted-foreground">Email</p><p className="font-medium">emanuelcosta63@gmail.com</p></div>
                          <div><p className="text-muted-foreground">Contacto</p><p className="font-medium">N/A</p></div>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader><CardTitle className="font-headline text-lg">Informações Profissionais</CardTitle></CardHeader>
                      <CardContent className="grid md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                           <div><p className="text-muted-foreground">Tipo de Trabalhador</p><p className="font-medium">{worker.type}</p></div>
                           <div><p className="text-muted-foreground">Departamento</p><p className="font-medium">{worker.department}</p></div>
                           <div><p className="text-muted-foreground">Estado do Contrato</p><p className="font-medium">{worker.contractStatus}</p></div>
                          <div><p className="text-muted-foreground">Data de Admissão</p><p className="font-medium">N/A</p></div>
                          <div><p className="text-muted-foreground">Tipo de Contrato</p><p className="font-medium">N/A</p></div>
                           <div><p className="text-muted-foreground">ID do Trabalhador</p><p className="font-medium">{worker.id}</p></div>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader><CardTitle className="font-headline text-lg">Salários e Encargos</CardTitle></CardHeader>
                      <CardContent>
                          <div className="grid md:grid-cols-2 gap-x-8">
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between items-center"><p>Salário Base</p><p className="font-medium">Kz {(worker.baseSalary || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p></div>
                                <div className="flex justify-between items-center"><p>INSS (3%)</p><p className="font-medium text-red-600">- Kz {inss.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p></div>
                                <div className="flex justify-between items-center"><p>IRT</p><p className="font-medium text-red-600">- Kz {irt.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p></div>
                                <Separator className="my-2" />
                                <div className="flex justify-between items-center text-base">
                                    <p className="font-semibold">Salário Líquido</p>
                                    <p className="font-bold text-primary">Kz {netSalary.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between items-center"><p>Subsídio de Alimentação</p><p className="font-medium">Kz 0,00</p></div>
                                <div className="flex justify-between items-center"><p>Subsídio de Transporte</p><p className="font-medium">Kz 0,00</p></div>
                                <div className="flex justify-between items-center"><p>Subsídio de Turno</p><p className="font-medium">N/A</p></div>
                                <div className="flex justify-between items-center"><p>Subsídio de Prémio</p><p className="font-medium">Kz 0,00</p></div>
                                <div className="flex justify-between items-center"><p>Subsídio de Comissões</p><p className="font-medium">Kz 0,00</p></div>
                            </div>
                          </div>
                      </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="attendance" className="mt-0">
                  <Card>
                      <CardHeader>
                          <CardTitle className="font-headline text-lg flex items-center gap-2"><CalendarClock/>Registo de Ponto</CardTitle>
                          <CardDescription>Histórico de assiduidade do trabalhador.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Data</TableHead>
                                      <TableHead>Entrada</TableHead>
                                      <TableHead>Saída</TableHead>
                                      <TableHead>Ausência (hh:mm)</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                 {attendanceHistory.map(item => (
                                    <TableRow key={item.date}>
                                        <TableCell>{item.date}</TableCell>
                                        <TableCell>{item.entry}</TableCell>
                                        <TableCell>{item.exit}</TableCell>
                                        <TableCell>{item.absence}</TableCell>
                                    </TableRow>
                                 ))}
                              </TableBody>
                          </Table>
                      </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="payroll" className="mt-0">
                  <Card>
                      <CardHeader>
                          <CardTitle className="font-headline text-lg flex items-center gap-2"><FileText/>Salários e Recibos</CardTitle>
                          <CardDescription>Histórico de pagamentos e recibos de vencimento.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Período</TableHead>
                                      <TableHead>Estado</TableHead>
                                      <TableHead>Valor Líquido</TableHead>
                                      <TableHead className="text-right">Ações</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {payrollHistory.map(item => (
                                       <TableRow key={item.period}>
                                          <TableCell className="font-medium">{item.period}</TableCell>
                                          <TableCell><Badge>{item.status}</Badge></TableCell>
                                          <TableCell>Kz {netSalary.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</TableCell>
                                          <TableCell className="text-right">
                                              <Button variant="outline" size="sm" onClick={() => handlePrintPayslip(item.period, netSalary)}><Download className="mr-2 h-3 w-3"/> Baixar Recibo</Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="vacation" className="mt-0">
                  <Card>
                      <CardHeader>
                          <CardTitle className="font-headline text-lg flex items-center gap-2"><Briefcase/>Gestão de Férias</CardTitle>
                          <CardDescription>Solicite e consulte o estado das férias.</CardDescription>
                      </CardHeader>
                      <CardContent>
                           <div className='mb-6 p-4 rounded-lg bg-muted/50 grid grid-cols-3 items-center'>
                                <div><p className='text-sm text-muted-foreground'>Total de Dias</p><p className='text-2xl font-bold'>22</p></div>
                                <div><p className='text-sm text-muted-foreground'>Dias Gozados</p><p className='text-2xl font-bold'>20</p></div>
                                <div><p className='text-sm text-muted-foreground'>Dias Restantes</p><p className='text-2xl font-bold text-primary'>2</p></div>
                           </div>
                           <Table>
                               <TableHeader>
                                   <TableRow>
                                       <TableHead>Data Início</TableHead>
                                       <TableHead>Data Fim</TableHead>
                                       <TableHead>Nº Dias</TableHead>
                                       <TableHead>Estado</TableHead>
                                   </TableRow>
                               </TableHeader>
                               <TableBody>
                                    {vacationHistory.map(item => (
                                        <TableRow key={item.start}>
                                            <TableCell>{item.start}</TableCell>
                                            <TableCell>{item.end}</TableCell>
                                            <TableCell>{item.days}</TableCell>
                                            <TableCell><Badge>{item.status}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                               </TableBody>
                           </Table>
                      </CardContent>
                  </Card>
              </TabsContent>
              
               <TabsContent value="performance" className="mt-0">
                  <Card>
                      <CardHeader>
                          <CardTitle className="font-headline text-lg flex items-center gap-2"><Star/>Avaliação de Desempenho</CardTitle>
                          <CardDescription>Registo de avaliações de desempenho.</CardDescription>
                      </CardHeader>
                      <CardContent>
                           <div className='mb-6 p-4 rounded-lg bg-muted/50 flex items-center justify-between'>
                                <div className='flex items-center gap-4'>
                                    <p className='text-sm'>Última Avaliação</p>
                                    <div className='flex gap-1'>
                                        <Star className='text-yellow-400 fill-yellow-400' />
                                        <Star className='text-yellow-400 fill-yellow-400' />
                                        <Star className='text-yellow-400 fill-yellow-400' />
                                        <Star className='text-yellow-400 fill-yellow-400' />
                                        <Star className='text-yellow-400 fill-yellow-200' />
                                    </div>
                                    <p className='font-bold text-lg'>4.5 / 5</p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button>Nova Avaliação</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Nova Avaliação de Desempenho</DialogTitle>
                                            <DialogDescription>
                                                Registe uma nova avaliação para <span className="font-bold">{worker.name}</span>.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.currentTarget);
                                            const evaluationData = {
                                                evaluator: formData.get('evaluator') as string,
                                                score: Number(formData.get('score')),
                                                notes: formData.get('notes') as string,
                                            };
                                            handleAddEvaluation(evaluationData);
                                            (e.currentTarget.closest('[role="dialog"]') as HTMLElement)?.querySelector('[aria-label="Close"]')?.click();
                                        }}>
                                            <div className="grid gap-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="evaluator">Avaliador</Label>
                                                    <Input id="evaluator" name="evaluator" defaultValue="Supervisor A" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="score">Pontuação (1-5)</Label>
                                                    <Input id="score" name="score" type="number" min="1" max="5" step="0.1" defaultValue="4" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="notes">Observações</Label>
                                                    <Textarea id="notes" name="notes" placeholder="Descreva o desempenho..." />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                                                <Button type="submit">Guardar Avaliação</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                           </div>
                            <Table>
                               <TableHeader>
                                   <TableRow>
                                       <TableHead>Data</TableHead>
                                       <TableHead>Avaliador</TableHead>
                                       <TableHead>Pontuação</TableHead>
                                       <TableHead>Observações</TableHead>
                                   </TableRow>
                               </TableHeader>
                               <TableBody>
                                    {performanceHistory.map(item => (
                                        <TableRow key={item.date}>
                                            <TableCell>{item.date}</TableCell>
                                            <TableCell>{item.evaluator}</TableCell>
                                            <TableCell>{item.score}</TableCell>
                                            <TableCell>{item.notes}</TableCell>
                                        </TableRow>
                                    ))}
                               </TableBody>
                           </Table>
                      </CardContent>
                  </Card>
              </TabsContent>

               <TabsContent value="disciplinary" className="space-y-6 mt-0">
                 <Card>
                    <CardHeader>
                      <CardTitle className="font-headline text-lg">Registo de Processos Disciplinares</CardTitle>
                      <CardDescription>Adicione e consulte ocorrências disciplinares.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       <form onSubmit={handleAddDisciplinaryAction}>
                            <div className="space-y-4 rounded-lg border p-4">
                               <h4 className="font-semibold">Adicionar Nova Ocorrência</h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="occurrence-type">Tipo</Label>
                                        <Select name="type" onValueChange={(value) => setNewDisciplinaryAction(p => ({ ...p, type: value as DisciplinaryAction['type'] }))}>
                                            <SelectTrigger id="occurrence-type"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="verbal">Verbal</SelectItem>
                                                <SelectItem value="escrita">Advertência Escrita</SelectItem>
                                                <SelectItem value="suspensao">Suspensão</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="occurrence-date">Data da Ocorrência</Label>
                                        <Input id="occurrence-date" name="date" type="date" onChange={(e) => setNewDisciplinaryAction(p => ({ ...p, date: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="occurrence-description">Descrição Detalhada da Falta</Label>
                                    <Textarea id="occurrence-description" name="description" placeholder="Descreva a ocorrência..." onChange={(e) => setNewDisciplinaryAction(p => ({ ...p, description: e.target.value }))} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="occurrence-result">Resultado/Ação</Label>
                                    <Input id="occurrence-result" name="actionTaken" placeholder="Ex: Suspensão 1 dia" onChange={(e) => setNewDisciplinaryAction(p => ({ ...p, actionTaken: e.target.value }))} />
                                </div>
                                <Button type="submit"><Gavel className="mr-2 h-4 w-4" /> Adicionar e Gerar Documento</Button>
                            </div>
                        </form>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Ação</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {disciplinaryHistory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum processo disciplinar registado.</TableCell>
                                    </TableRow>
                                ) : (
                                    disciplinaryHistory.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.date}</TableCell>
                                            <TableCell><Badge variant={item.type === 'suspensao' ? 'destructive' : 'secondary'}>{item.type}</Badge></TableCell>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell>{item.actionTaken}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => handleViewDisciplinary(item)}>
                                                    <View className="mr-2 h-3 w-3" /> Ver/Baixar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                  </Card>
              </TabsContent>

               <TabsContent value="documents" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-headline text-lg">Documentação do Trabalhador</CardTitle>
                      <CardDescription>Carregue e gira os documentos relevantes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleAddDocument}>
                            <div className="space-y-4 rounded-lg border p-4">
                                <h4 className="font-semibold">Carregar Novo Documento</h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="doc-name">Nome do documento</Label>
                                        <Input id="doc-name" value={newDocument.name} onChange={(e) => setNewDocument(prev => ({ ...prev, name: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>O documento expira?</Label>
                                        <RadioGroup defaultValue="nao" value={documentExpires} onValueChange={(value: 'sim' | 'nao') => setDocumentExpires(value)} className="flex items-center space-x-4">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="sim" id="expires-sim" />
                                                <Label htmlFor="expires-sim">Sim</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="nao" id="expires-nao" />
                                                <Label htmlFor="expires-nao">Não</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>
                                {documentExpires === 'sim' && (
                                <div className="space-y-2">
                                    <Label htmlFor="doc-expiry">Data de Expiração</Label>
                                    <Input id="doc-expiry" type="date" onChange={(e) => setNewDocument(prev => ({ ...prev, expiry: e.target.value }))} />
                                </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="doc-notes">Notas (opcional)</Label>
                                    <Textarea id="doc-notes" onChange={(e) => setNewDocument(prev => ({ ...prev, notes: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="doc-file">Ficheiro</Label>
                                    <Input id="doc-file" type="file" onChange={(e) => e.target.files && setNewDocument(prev => ({...prev, file: e.target.files![0]}))} />
                                </div>
                                <Button type="submit"><Upload className="mr-2 h-4 w-4"/> Adicionar à Lista</Button>
                            </div>
                        </form>
                        
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Data Expira</TableHead>
                                    <TableHead>Notas</TableHead>
                                    <TableHead className="text-right">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.length === 0 ? (
                                     <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum documento carregado.</TableCell>
                                    </TableRow>
                                ) : (
                                    documents.map(doc => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium">{doc.name}</TableCell>
                                            <TableCell>{doc.expiry || 'N/A'}</TableCell>
                                            <TableCell>{doc.notes || 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => handleDownloadDocument(doc.file)}>
                                                    <Download className="mr-2 h-3 w-3"/> Baixar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                  </Card>
              </TabsContent>
          </div>
        </div>
      </Tabs>
    </>
  );
}
