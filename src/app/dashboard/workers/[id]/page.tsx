

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { workers as staticWorkers } from "@/lib/data";
import type { Worker } from "@/types/worker";
import { useParams, useRouter } from "next/navigation";
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
import { FileText, Gavel, Hand, User, Edit, Upload, ArrowLeft, Briefcase, CalendarClock, Star, LogOut, Download, Clock, CheckCircle, PlusCircle, Eye, Camera, Loader2 } from "lucide-react";
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

interface WorkerDocument {
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
          contractStatus: (w.contract_status ?? w.status ?? 'Ativo') as Worker['contractStatus'],
          type: (w.type ?? 'Eventual') as Worker['type'],
          photoUrl: w.photo_url ?? w.photoUrl ?? undefined,
          admissionDate: w.admission_date ?? w.admissionDate ?? undefined,
          contractType: w.contract_type ?? w.contractType ?? undefined,
          nationality: w.nationality ?? undefined,
          address: w.address ?? undefined,
          maritalStatus: w.marital_status ?? w.maritalStatus ?? undefined,
          birthDate: w.birth_date ?? w.birthDate ?? undefined,
          email: w.email ?? undefined,
          foodAllowance: Number(w.food_allowance ?? w.foodAllowance ?? 0),
          transportAllowance: Number(w.transport_allowance ?? w.transportAllowance ?? 0),
          shiftAllowance: Number(w.shift_allowance ?? w.shiftAllowance ?? 0),
          bonus: Number(w.bonus ?? 0),
          commission: Number(w.commission ?? 0),
          bi: w.bi ?? undefined,
          nif: w.nif ?? undefined,
          social_security_number: w.social_security_number ?? undefined,
          phone: w.phone ?? undefined,
          gender: w.gender ?? undefined,
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
    if (!loading && workers.length > 0) {
      setWorker(workers.find(w => String(w.id) === String(id)));
    }
  }, [id, workers, loading]);


  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState<null | 'pass' | 'sheet' | 'payslip' | 'disciplinary'>(null);
  const [payslipData, setPayslipData] = useState<{ period: string, netSalary: number } | null>(null);
  const [isAdmissionDialogOpen, setIsAdmissionDialogOpen] = useState(false);

  const [performanceHistory, setPerformanceHistory] = useState(initialPerformanceHistory);

  const [documents, setDocuments] = useState<WorkerDocument[]>([]);
  const [newDocument, setNewDocument] = useState<{ name: string, expiry?: string, notes?: string, file?: File }>({ name: '' });
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
          photoUrl: data.photo_url ?? data.photoUrl ?? undefined,
          admissionDate: data.admission_date ?? data.admissionDate ?? undefined,
          contractType: data.contract_type ?? data.contractType ?? undefined,
          nationality: data.nationality ?? undefined,
          address: data.address ?? undefined,
          maritalStatus: data.marital_status ?? data.maritalStatus ?? undefined,
          birthDate: data.birth_date ?? data.birthDate ?? undefined,
          email: data.email ?? undefined,
          foodAllowance: Number(data.food_allowance ?? data.foodAllowance ?? 0),
          transportAllowance: Number(data.transport_allowance ?? data.transportAllowance ?? 0),
          shiftAllowance: Number(data.shift_allowance ?? data.shiftAllowance ?? 0),
          bonus: Number(data.bonus ?? 0),
          commission: Number(data.commission ?? 0),
          bi: data.bi ?? undefined,
          nif: data.nif ?? undefined,
          social_security_number: data.social_security_number ?? undefined,
          phone: data.phone ?? undefined,
          gender: data.gender ?? undefined,
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

  useEffect(() => {
    if (worker) {
      setProfilePic(worker.photoUrl || `https://picsum.photos/seed/${worker.id}/200/200`);
    }
  }, [worker]);

  if (loading || worker === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-lg font-medium">Trabalhador não encontrado</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retroceder
        </Button>
      </div>
    );
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !worker) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: "Tipo de ficheiro inválido", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Tamanho máximo permitido é 5MB.", variant: "destructive" });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workerId', worker.id);

      const response = await fetch('/api/upload/worker-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const { url } = await response.json();

      const supabase = getSupabaseClient();
      const { error: dbError } = await supabase
        .from('workers')
        .update({ photo_url: url, updated_at: new Date().toISOString() })
        .eq('id', worker.id);

      if (dbError) {
        toast({
          title: "Erro ao salvar no banco",
          description: "Foto enviada, mas erro ao atualizar perfil.",
          variant: "destructive",
        });
        return;
      }

      setProfilePic(url);
      setWorker(prev => prev ? { ...prev, photoUrl: url } as Worker : prev);
      toast({ title: "Foto atualizada", description: "A foto foi enviada com sucesso." });
    } catch (err: any) {
      console.error('Erro no upload da foto', err);
      toast({
        title: "Erro ao enviar foto",
        description: err.message || "Erro desconhecido ao enviar foto.",
        variant: "destructive",
      });
    }
  };


  const handleUpdateWorker = async (updatedData: Partial<Worker>) => {
    if (!worker) return;

    try {
      const { updateWorkerSupabase } = await import('@/lib/supabase/actions');

      // Merge current worker data with updates to match the required structure
      const fullData = {
        name: updatedData.name ?? worker.name,
        role: updatedData.role ?? worker.role,
        department: updatedData.department ?? worker.department,
        category: updatedData.category ?? worker.category,
        baseSalary: updatedData.baseSalary ?? worker.baseSalary,
        contractStatus: updatedData.contractStatus ?? worker.contractStatus,
        type: updatedData.type ?? worker.type,
        photoUrl: updatedData.photoUrl ?? worker.photoUrl,
        admissionDate: updatedData.admissionDate ?? worker.admissionDate,
        contractType: updatedData.contractType ?? worker.contractType,
        nationality: updatedData.nationality ?? worker.nationality,
        address: updatedData.address ?? worker.address,
        maritalStatus: updatedData.maritalStatus ?? worker.maritalStatus,
        birthDate: updatedData.birthDate ?? worker.birthDate,
        email: updatedData.email ?? worker.email,
        foodAllowance: updatedData.foodAllowance ?? worker.foodAllowance,
        transportAllowance: updatedData.transportAllowance ?? worker.transportAllowance,
        shiftAllowance: updatedData.shiftAllowance ?? worker.shiftAllowance,
        bonus: updatedData.bonus ?? worker.bonus,
        commission: updatedData.commission ?? worker.commission,
        bi: updatedData.bi ?? worker.bi,
        nif: updatedData.nif ?? worker.nif,
        socialSecurityNumber: updatedData.social_security_number ?? worker.social_security_number,
        phone: updatedData.phone ?? worker.phone,
        gender: updatedData.gender ?? worker.gender,
      };

      await updateWorkerSupabase(worker.id, fullData);

      setWorker(prevWorker => prevWorker ? { ...prevWorker, ...updatedData } : undefined);
      setIsEditDialogOpen(false);
      toast({
        title: "Perfil Atualizado",
        description: "As informações do trabalhador foram guardadas com sucesso.",
      });
    } catch (err: any) {
      console.error('Erro ao atualizar trabalhador:', err);
      toast({
        title: "Erro ao atualizar",
        description: err.message || "Não foi possível guardar as alterações.",
        variant: "destructive",
      });
    }
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
    const doc: WorkerDocument = {
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
    return <WorkerPayslipPrintLayout worker={worker} salaryData={{ ...payslipData, baseSalary: worker.baseSalary, inss, irt }} />;
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
         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
  <DialogHeader>
    <DialogTitle>Adicionar Novo Trabalhador</DialogTitle>
    <DialogDescription>
      Preencha os dados do trabalhador e mantenha em atualização para a empresa.
    </DialogDescription>
  </DialogHeader>
  <form onSubmit={(e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedData = {
      name: formData.get('name') as string,
      role: formData.get('role') as string,
      department: formData.get('department') as string,
      category: formData.get('category') as string,
      baseSalary: Number(formData.get('baseSalary')),
      admissionDate: formData.get('admissionDate') as string,
      contractType: formData.get('contractType') as string,
      gender: formData.get('gender') as string,
      bi: formData.get('bi') as string,
      nif: formData.get('nif') as string,
      social_security_number: formData.get('socialSecurity') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      birthDate: formData.get('birthDate') as string,
      nationality: formData.get('nationality') as string,
      maritalStatus: formData.get('maritalStatus') as string,
      address: formData.get('address') as string,
      foodAllowance: Number(formData.get('foodAllowance')),
      transportAllowance: Number(formData.get('transportAllowance')),
      shiftAllowance: Number(formData.get('shiftAllowance')),
      bonus: Number(formData.get('bonus')),
      commission: Number(formData.get('commission')),
      contractStatus: formData.get('contractStatus') as Worker['contractStatus'],
      type: formData.get('type') as Worker['type'],
    };
    handleUpdateWorker(updatedData);
  }}>
    <div className="space-y-6 py-4">

      {/* Upload de Foto */}
      <div
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <Camera className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Carregar Foto</p>
        <p className="text-xs text-muted-foreground/70">Clique ou arraste uma imagem</p>
      </div>

      {/* Dados Pessoais */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide border-b pb-2 mb-4">Dados Pessoais</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="name">Nome Completo</Label>
            <Input id="name" name="name" defaultValue={worker.name} placeholder="Nome do trabalhador" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="role">Função</Label>
            <Input id="role" name="role" defaultValue={worker.role} placeholder="Ex: Estivador" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="department">Departamento</Label>
            <Input id="department" name="department" defaultValue={worker.department} placeholder="Ex: Logística" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="category">Categoria Profissional</Label>
            <Input id="category" name="category" defaultValue={worker.category} placeholder="Ex: Classe de Obra 1" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="baseSalary">Salário Base (AOA)</Label>
            <Input id="baseSalary" name="baseSalary" type="number" defaultValue={worker.baseSalary} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="admissionDate">Data de Admissão</Label>
            <Input id="admissionDate" name="admissionDate" type="date" defaultValue={worker.admissionDate} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contractType">Tipo de Contrato</Label>
            <Select name="contractType" defaultValue={worker.contractType}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Indeterminado">A Tempo Indeterminado</SelectItem>
                <SelectItem value="Determinado">A Tempo Determinado</SelectItem>
                <SelectItem value="Eventual">Eventual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="gender">Género</Label>
            <Select name="gender" defaultValue={worker.gender}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Masculino">Masculino</SelectItem>
                <SelectItem value="Feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Dados de Identificação */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide border-b pb-2 mb-4">Dados de Identificação</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="bi">Número de Bilhete de Identidade</Label>
            <Input id="bi" name="bi" defaultValue={worker.bi} placeholder="Ex: 123456789" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nif">Número de NIF</Label>
            <Input id="nif" name="nif" defaultValue={worker.nif} placeholder="Ex: 123456789" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="socialSecurity">Número de Seguro Social</Label>
            <Input id="socialSecurity" name="socialSecurity" defaultValue={worker.social_security_number} placeholder="Ex: 123-456-789" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" defaultValue={worker.phone} placeholder="+244 9xx xxx xxx" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={worker.email} placeholder="exemplo@email.com" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="birthDate">Data de Nascimento</Label>
            <Input id="birthDate" name="birthDate" type="date" defaultValue={worker.birthDate} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nationality">Nacionalidade</Label>
            <Input id="nationality" name="nationality" defaultValue={worker.nationality} placeholder="Ex: Angolano" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="maritalStatus">Estado Civil</Label>
            <Select name="maritalStatus" defaultValue={worker.maritalStatus}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Solteiro/a">Solteiro/a</SelectItem>
                <SelectItem value="Casado/a">Casado/a</SelectItem>
                <SelectItem value="Divorciado/a">Divorciado/a</SelectItem>
                <SelectItem value="Viúvo/a">Viúvo/a</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 col-span-2">
            <Label htmlFor="address">Morada</Label>
            <Input id="address" name="address" defaultValue={worker.address} placeholder="Endereço completo" />
          </div>
        </div>
      </div>

      {/* Subsídios */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide border-b pb-2 mb-4">Subsídios e Remunerações</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="foodAllowance">Subsídio de Alimentação (AOA)</Label>
            <Input id="foodAllowance" name="foodAllowance" type="number" defaultValue={worker.foodAllowance} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="transportAllowance">Subsídio de Transporte (AOA)</Label>
            <Input id="transportAllowance" name="transportAllowance" type="number" defaultValue={worker.transportAllowance} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bonus">Bónus (AOA)</Label>
            <Input id="bonus" name="bonus" type="number" defaultValue={worker.bonus} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="shiftAllowance">Subsídio de Turno (AOA)</Label>
            <Input id="shiftAllowance" name="shiftAllowance" type="number" defaultValue={worker.shiftAllowance} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="commission">Comissões (AOA)</Label>
            <Input id="commission" name="commission" type="number" defaultValue={worker.commission} placeholder="0" />
          </div>
        </div>
      </div>

      {/* Estado do Contrato */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide border-b pb-2 mb-4">Estado do Contrato</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="contractStatus">Estado do Contrato</Label>
            <Select name="contractStatus" defaultValue={worker.contractStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Suspenso">Suspenso</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="type">Tipo</Label>
            <Select name="type" defaultValue={worker.type}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Eventual">Eventual</SelectItem>
                <SelectItem value="Fixo">Fixo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

    </div>
    <DialogFooter>
      <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
      <Button type="submit">Guardar</Button>
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
                    <FileText className="h-4 w-4" /> Gerar Contrato
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setIsPrinting('pass')}><Hand className="h-4 w-4" /> Gerar Passe de Trabalho</Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setIsPrinting('sheet')}><User className="h-4 w-4" /> Gerar Ficha do Trabalhador</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2"><LogOut className="h-4 w-4" /> Admissão / Desligamento</Button>
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
                  <div><p className="text-muted-foreground">Nacionalidade</p><p className="font-medium">{worker.nationality || 'N/A'}</p></div>
                  <div><p className="text-muted-foreground">Estado Civil</p><p className="font-medium">{worker.maritalStatus || 'N/A'}</p></div>
                  <div><p className="text-muted-foreground">Data de Nascimento</p><p className="font-medium">{worker.birthDate || 'N/A'}</p></div>
                  <div><p className="text-muted-foreground">Gênero</p><p className="font-medium">{worker.gender || 'N/A'}</p></div>
                  <div className="md:col-span-2"><p className="text-muted-foreground">Residência</p><p className="font-medium">{worker.address || 'N/A'}</p></div>
                  <div><p className="text-muted-foreground">NIF</p><p className="font-medium">{worker.nif || 'N/A'}</p></div>
                  <div><p className="text-muted-foreground">Nº Seg. Social</p><p className="font-medium">{worker.social_security_number || 'N/A'}</p></div>
                  <div><p className="text-muted-foreground">Nº B.I.</p><p className="font-medium">{worker.bi || 'N/A'}</p></div>
                  <div className="md:col-span-2"><p className="text-muted-foreground">Email</p><p className="font-medium">{worker.email || 'N/A'}</p></div>
                  <div><p className="text-muted-foreground">Contacto</p><p className="font-medium">{worker.phone || 'N/A'}</p></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="font-headline text-lg">Informações Profissionais</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                  <div><p className="text-muted-foreground">Tipo de Trabalhador</p><p className="font-medium">{worker.type}</p></div>
                  <div><p className="text-muted-foreground">Departamento</p><p className="font-medium">{worker.department}</p></div>
                  <div><p className="text-muted-foreground">Estado do Contrato</p><p className="font-medium">{worker.contractStatus}</p></div>
                  <div><p className="text-muted-foreground">Data de Admissão</p><p className="font-medium">{worker.admissionDate || 'N/A'}</p></div>
                  <div><p className="text-muted-foreground">Tipo de Contrato</p><p className="font-medium">{worker.contractType || 'N/A'}</p></div>
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
                      <div className="flex justify-between items-center"><p>Subsídio de Alimentação</p><p className="font-medium">Kz {(worker.foodAllowance || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p></div>
                      <div className="flex justify-between items-center"><p>Subsídio de Transporte</p><p className="font-medium">Kz {(worker.transportAllowance || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p></div>
                      <div className="flex justify-between items-center"><p>Subsídio de Turno</p><p className="font-medium">Kz {(worker.shiftAllowance || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p></div>
                      <div className="flex justify-between items-center"><p>Subsídio de Prémio</p><p className="font-medium">Kz {(worker.bonus || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p></div>
                      <div className="flex justify-between items-center"><p>Subsídio de Comissões</p><p className="font-medium">Kz {(worker.commission || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-lg flex items-center gap-2"><CalendarClock />Registo de Ponto</CardTitle>
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
                  <CardTitle className="font-headline text-lg flex items-center gap-2"><FileText />Salários e Recibos</CardTitle>
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
                            <Button variant="outline" size="sm" onClick={() => handlePrintPayslip(item.period, netSalary)}><Download className="mr-2 h-3 w-3" /> Baixar Recibo</Button>
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
                  <CardTitle className="font-headline text-lg flex items-center gap-2"><Briefcase />Gestão de Férias</CardTitle>
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
                  <CardTitle className="font-headline text-lg flex items-center gap-2"><Star />Avaliação de Desempenho</CardTitle>
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
                          const closeBtn = (e.currentTarget.closest('[role="dialog"]') as HTMLElement)?.querySelector('[type="button"]');
                          if (closeBtn instanceof HTMLElement) closeBtn.click();
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
                                <Eye className="mr-2 h-3 w-3" /> Ver/Baixar
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
                        <Input id="doc-file" type="file" onChange={(e) => e.target.files && setNewDocument(prev => ({ ...prev, file: e.target.files![0] }))} />
                      </div>
                      <Button type="submit"><Upload className="mr-2 h-4 w-4" /> Adicionar à Lista</Button>
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
                                <Download className="mr-2 h-3 w-3" /> Baixar
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
