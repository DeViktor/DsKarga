

'use client';

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import * as XLSX from 'xlsx';
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
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MoreHorizontal, Search, UserPlus, List, LayoutGrid, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WorkerDialog, type WorkerFormValues } from "@/components/dashboard/worker-dialog";
import { useWorkers, type WorkerWithService } from "@/hooks/use-workers";
import type { Worker } from "@/types/worker";
import { WorkersReportPrintLayout } from "@/components/dashboard/workers-report-print-layout";


// O tipo Worker agora é importado de @/types/worker

export default function WorkersPage() {
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithService | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const { workers: allWorkers, loading } = useWorkers();

  const fixedWorkers = useMemo(() => allWorkers.filter(w => w.type === 'Fixo'), [allWorkers]);
  const eventualWorkers = useMemo(() => allWorkers.filter(w => w.type === 'Eventual'), [allWorkers]);

  const handleEdit = (worker: WorkerWithService) => {
    setSelectedWorker(worker);
    setDialogOpen(true);
  };
  
  const handleAddNew = () => {
    setSelectedWorker(null);
    setDialogOpen(true);
  }

  const downloadXLSX = () => {
    if (!allWorkers) return;
    const worksheet = XLSX.utils.json_to_sheet(allWorkers.map(worker => ({
      'ID': worker.id,
      'Nome': worker.name,
      'Departamento': worker.department,
      'Função': worker.role,
      'Categoria': worker.category || 'N/A',
      'Estado Contrato': worker.contractStatus,
      'Tipo': worker.type,
      'Salário Base': worker.baseSalary,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trabalhadores');
    XLSX.writeFile(workbook, 'Relatorio_Trabalhadores.xlsx');
  };

  const handlePrint = () => {
    setIsPrinting(true);
  };
  
   useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPrinting]);
  
  if (isPrinting) {
    return <WorkersReportPrintLayout workers={allWorkers} />;
  }

  const renderGrid = (title: string, data: WorkerWithService[]) => (
    <div className="space-y-4">
        <h2 className="font-headline text-xl font-semibold">{title}</h2>
        {data.length === 0 ? (
             <p className="text-muted-foreground text-sm">Nenhum trabalhador deste tipo encontrado.</p>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {data.map((worker) => (
                  <Card key={worker.id} className="flex flex-col">
                    <CardHeader className="flex flex-col items-center text-center">
                      <Avatar className="w-16 h-16 mb-4">
                        <AvatarImage src={`https://picsum.photos/seed/${worker.id}/100/100`} />
                        <AvatarFallback>{worker.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-lg font-headline">{worker.name}</CardTitle>
                      <CardDescription>{worker.role}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2 text-center">
                        <p className="text-sm text-muted-foreground">{worker.department}</p>
                        <Badge variant={
                            worker.contractStatus === 'Ativo' ? 'default' :
                            worker.contractStatus === 'Suspenso' ? 'destructive' : 'secondary'
                        }>
                            {worker.contractStatus}
                        </Badge>
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="outline" className="w-full">
                           <Link href={`/dashboard/workers/${worker.id}`}>Ver Perfil</Link>
                        </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
        )}
    </div>
  );

  const renderTable = (title: string, data: WorkerWithService[]) => (
     <div className="space-y-4">
        <h2 className="font-headline text-xl font-semibold">{title}</h2>
         {data.length === 0 ? (
             <p className="text-muted-foreground text-sm">Nenhum trabalhador deste tipo encontrado.</p>
        ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Estado do Contrato</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell className="font-medium">{worker.name}</TableCell>
                    <TableCell>{worker.department}</TableCell>
                    <TableCell>{worker.role}</TableCell>
                    <TableCell>
                      <Badge variant={
                        worker.contractStatus === 'Ativo' ? 'default' :
                        worker.contractStatus === 'Suspenso' ? 'destructive' : 'secondary'
                      }>
                        {worker.contractStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/workers/${worker.id}`}>Ver Detalhes</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(worker)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Gerar Folha de Salário</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Rescindir Contrato</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        )}
    </div>
  );

  const renderContent = () => {
    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="h-12 w-12 animate-spin text-muted-foreground"/></div>;
    }

    if (!allWorkers || allWorkers.length === 0) {
        return <div className="text-center text-muted-foreground py-16">Nenhum trabalhador encontrado.</div>
    }

    const renderer = view === 'list' ? renderTable : renderGrid;

    return (
        <div className="space-y-8">
            {renderer("Trabalhadores Fixos", fixedWorkers)}
            <Separator />
            {renderer("Trabalhadores Eventuais", eventualWorkers)}
        </div>
    )
  }


  return (
    <>
      <DashboardHeader title="Trabalhadores">
        <div className="relative ml-auto flex-1 md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Procurar trabalhadores..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
          />
        </div>
        <div className="flex items-center gap-2">
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')}>
                <List className="h-4 w-4" />
                <span className="sr-only">Lista</span>
            </Button>
            <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')}>
                <LayoutGrid className="h-4 w-4" />
                <span className="sr-only">Grelha</span>
            </Button>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Baixar Relatório</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onSelect={downloadXLSX}>Exportar para Excel (.xlsx)</DropdownMenuItem>
                <DropdownMenuItem onSelect={handlePrint}>Exportar para PDF</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={handleAddNew}>
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar Trabalhador
        </Button>
      </DashboardHeader>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Gestão da Força de Trabalho</CardTitle>
          <CardDescription>
            Gira todos os trabalhadores contratados, os seus contratos e informações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
      
      <WorkerDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        worker={selectedWorker}
      />
    </>
  );
}
