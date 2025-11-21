'use client';

import { useParams, useRouter, notFound } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download } from 'lucide-react';
import { useWorkers } from '@/hooks/use-workers';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const numberFormat = (value: number) => {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
  }).format(value);
};

export default function PayrollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { workers, loading } = useWorkers();

  // In a real app, you'd fetch the specific payroll run data using the id
  const payrollId = params.id;
  const period = payrollId.toString().replace('pay-', '').replace('-', '/'); // e.g., "2024/07"

  const payrollData = workers.map(worker => {
    const baseSalary = worker.baseSalary || 0;
    const inss = baseSalary * 0.03;
    const irt = (baseSalary - inss) * 0.10; // Simple calc
    const netSalary = baseSalary - inss - irt;
    return {
      worker,
      baseSalary,
      inss,
      irt,
      netSalary,
    };
  });
  
  const handleDownload = () => {
        const dataToExport = payrollData.map(data => ({
            'Nome do Trabalhador': data.worker.name,
            'Função': data.worker.role,
            'Salário Base': data.baseSalary,
            'INSS (3%)': data.inss,
            'IRT': data.irt,
            'Outros Descontos': 0,
            'Salário Líquido': data.netSalary,
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        // Ensure sheet name is within Excel's 31-character limit
        const sheetName = `Pagamentos ${period.replace('/', '-')}`.substring(0, 31);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, `Mapa_Pagamento_${period.replace('/', '-')}.xlsx`);
  }

  return (
    <>
      <DashboardHeader title={`Folha de Pagamento - ${period}`}>
         <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
             <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" /> Baixar Mapa
            </Button>
        </div>
      </DashboardHeader>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Mapa de Pagamento Detalhado</CardTitle>
          <CardDescription>
            Detalhes do processamento de salários para o período de {period}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trabalhador</TableHead>
                <TableHead>Salário Base</TableHead>
                <TableHead>INSS (3%)</TableHead>
                <TableHead>IRT</TableHead>
                <TableHead>Salário Líquido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollData.map(({ worker, baseSalary, inss, irt, netSalary }) => (
                <TableRow key={worker.id}>
                  <TableCell className="font-medium">{worker.name}</TableCell>
                  <TableCell>{numberFormat(baseSalary)}</TableCell>
                  <TableCell className="text-destructive">-{numberFormat(inss)}</TableCell>
                  <TableCell className="text-destructive">-{numberFormat(irt)}</TableCell>
                  <TableCell className="font-bold">{numberFormat(netSalary)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
