
'use client';

import { useEffect, useState } from 'react';
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, PlayCircle, Download, Check, Eye } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { useWorkers } from '@/hooks/use-workers';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

interface PayrollRun {
    id: string;
    period: string;
    status: 'Pendente de Aprovação' | 'Aprovado' | 'Pago';
    totalAmount: number;
    processedAt: Date;
}


export default function PayrollPage() {
    const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const { toast } = useToast();
    const { workers } = useWorkers();

    useEffect(() => {
        let isMounted = true;
        async function fetchPayrollRuns() {
            setLoading(true);
            try {
                const supabase = getSupabaseClient();
                const { data, error } = await supabase
                    .from('payroll_runs')
                    .select('*')
                    .order('processed_at', { ascending: false });
                if (error) throw error;
                const normalized = (data || []).map((r: any) => ({
                    id: r.id, // Use the actual UUID id as primary key
                    period: r.period,
                    status: r.status as PayrollRun['status'],
                    totalAmount: r.total_amount || 0,
                    processedAt: r.processed_at ? new Date(r.processed_at) : new Date(),
                })) as PayrollRun[];
                if (isMounted) setPayrollRuns(normalized);
            } catch (err) {
            console.error('Erro ao carregar folhas de pagamento do Supabase', err);
            console.error('Error details:', err instanceof Error ? err.message : String(err));
            if (isMounted) setPayrollRuns([]);
        } finally {
            if (isMounted) setLoading(false);
        }
        }
        fetchPayrollRuns();
        return () => { isMounted = false; };
    }, []);

    const handleProcessPayroll = async () => {
        const lastRunDate = payrollRuns.length > 0 ? payrollRuns[0].processedAt : new Date(2024, 6, 1);
        const nextMonth = new Date(lastRunDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const newRun: PayrollRun = {
            id: crypto.randomUUID(), // Generate a proper UUID for the id column
            period: format(nextMonth, 'MMMM yyyy', { locale: pt }),
            status: 'Pendente de Aprovação',
            totalAmount: 15650000, // Dummy amount
            processedAt: new Date(),
        };

        setPayrollRuns(prev => [newRun, ...prev]);
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase
                .from('payroll_runs')
                .insert({
                    id: newRun.id, // Use the UUID id column
                    run_id: `PAY-${format(nextMonth, 'yyyy-MM')}`, // Generate the business key
                    period: newRun.period,
                    status: newRun.status,
                    total_amount: newRun.totalAmount,
                    processed_at: newRun.processedAt.toISOString(),
                });
            if (error) throw error;
        } catch (err) {
            console.error('Erro ao inserir folha de pagamento no Supabase', err);
            console.error('Error details:', err instanceof Error ? err.message : String(err));
            toast({
                title: "Erro ao processar",
                description: err instanceof Error ? err.message : "Erro ao salvar folha de pagamento no Supabase.",
                variant: "destructive",
            });
        }
        toast({
            title: "Processamento Iniciado",
            description: `A folha de pagamento para ${newRun.period} foi gerada e aguarda aprovação.`
        });
    };

    const handleUpdateStatus = async (id: string, newStatus: PayrollRun['status']) => {
        setPayrollRuns(prev => prev.map(run => run.id === id ? { ...run, status: newStatus } : run));
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase
                .from('payroll_runs')
                .update({ status: newStatus })
                .eq('id', id); // Use the UUID id column for filtering
            if (error) throw error;
        } catch (err) {
            console.error('Erro ao atualizar status no Supabase', err);
            console.error('Error details:', err instanceof Error ? err.message : String(err));
            toast({
                title: "Erro ao atualizar",
                description: err instanceof Error ? err.message : "Erro ao atualizar status no Supabase.",
                variant: "destructive",
            });
        }
        toast({
            title: "Estado Atualizado",
            description: `A folha de pagamento foi marcada como "${newStatus}".`
        });
    };

    const handleDownload = (run: PayrollRun) => {
        if (!workers || workers.length === 0) {
            toast({ title: 'Erro', description: 'Nenhum trabalhador encontrado para gerar o mapa.', variant: 'destructive' });
            return;
        }

        const dataToExport = workers.map(worker => {
            const baseSalary = worker.baseSalary || 0;
            const inss = baseSalary * 0.03;
            const irt = (baseSalary - inss) * 0.10; // Simple calc, needs complex rules for real app
            const netSalary = baseSalary - inss - irt;

            return {
                'Nome do Trabalhador': worker.name,
                'Função': worker.role,
                'Salário Base': baseSalary,
                'INSS (3%)': inss,
                'IRT': irt,
                'Outros Descontos': 0,
                'Salário Líquido': netSalary,
            };
        });
        
        const totals = dataToExport.reduce((acc, curr) => {
            acc['Salário Base'] += curr['Salário Base'];
            acc['INSS (3%)'] += curr['INSS (3%)'];
            acc['IRT'] += curr['IRT'];
            acc['Salário Líquido'] += curr['Salário Líquido'];
            return acc;
        }, { 'Nome do Trabalhador': 'TOTAIS', 'Função': '', 'Salário Base': 0, 'INSS (3%)': 0, 'IRT': 0, 'Outros Descontos': 0, 'Salário Líquido': 0 });
        
        const worksheet = XLSX.utils.json_to_sheet([...dataToExport, totals as any]);
        const workbook = XLSX.utils.book_new();
        // Ensure sheet name is within Excel's 31-character limit
        const sheetName = `Pagamentos ${run.period}`.substring(0, 31);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, `Mapa_Pagamento_${run.period.replace(' ', '_')}.xlsx`);
    }

  return (
    <>
      <DashboardHeader title="Processamento de Salários">
        <Button onClick={handleProcessPayroll}>
          <PlayCircle className="mr-2 h-4 w-4" /> Processar Salários do Mês
        </Button>
      </DashboardHeader>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <CardTitle className="font-headline">Histórico de Processamento</CardTitle>
                <CardDescription>
                    Acompanhe e aprove as folhas de pagamento de cada período.
                </CardDescription>
            </div>
             <div className="flex items-center gap-4">
                <Select defaultValue="all-time">
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Selecionar Período" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all-time">Todo o Histórico</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Período</TableHead>
                        <TableHead>Data de Processamento</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {payrollRuns.map(run => (
                        <TableRow key={run.id}>
                            <TableCell className="font-medium">{run.period}</TableCell>
                            <TableCell>{format(run.processedAt, 'dd/MM/yyyy')}</TableCell>
                            <TableCell>{run.totalAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA'})}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant={run.status === 'Pago' ? 'default' : run.status === 'Aprovado' ? 'secondary' : 'outline'}>
                                    {run.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/dashboard/payroll/${run.id}`}>
                                        <Eye className="mr-2 h-3 w-3" /> Ver Detalhes
                                    </Link>
                                </Button>
                                {run.status === 'Pendente de Aprovação' && (
                                    <Button size="sm" onClick={() => handleUpdateStatus(run.id, 'Aprovado')}>
                                        <Check className="mr-2 h-3 w-3" /> Aprovar
                                    </Button>
                                )}
                                {run.status === 'Aprovado' && (
                                    <Button size="sm" onClick={() => handleUpdateStatus(run.id, 'Pago')}>
                                       <Check className="mr-2 h-3 w-3" /> Marcar como Pago
                                    </Button>
                                )}
                                {run.status === 'Pago' && (
                                    <Button variant="outline" size="sm" onClick={() => handleDownload(run)}>
                                        <Download className="mr-2 h-3 w-3" /> Baixar Mapa
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </>
  );
}
