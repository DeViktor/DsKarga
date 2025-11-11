
'use client';

import { Logo } from "@/components/icons";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { type Worker } from "@/app/dashboard/workers/page";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface WorkersReportPrintLayoutProps {
    workers: Worker[];
}

const numberFormat = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    }).format(value);
};

export function WorkersReportPrintLayout({ workers }: WorkersReportPrintLayoutProps) {
  const today = new Date();
  
  return (
    <div className="print-only">
        <div className="w-[210mm] min-h-[297mm] mx-auto bg-white text-black p-8 flex flex-col">
            <header className="flex justify-between items-start mb-8">
                <div className="w-1/2">
                    <Logo />
                    <div className="text-xs mt-4 space-y-px">
                        <p className="font-bold">DS KARGA Engenhosos</p>
                        <p>Luanda, Urbanização Nova Vida, Rua 181, Casa 6024</p>
                        <p>Contribuinte: 5000870595</p>
                    </div>
                </div>
                <div className="w-1/2 text-right">
                    <h1 className='text-xl font-bold font-headline'>Relatório Geral de Trabalhadores</h1>
                    <p className='text-sm mt-1'>Emitido em: {format(today, "dd 'de' MMMM 'de' yyyy", { locale: pt })}</p>
                </div>
            </header>

            <main className="flex-grow">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-100 text-xs">
                            <TableHead className="text-black">Nome</TableHead>
                            <TableHead className="text-black">Departamento</TableHead>
                            <TableHead className="text-black">Função</TableHead>
                            <TableHead className="text-black">Salário Base</TableHead>
                            <TableHead className="text-black">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                        {workers.map(worker => (
                            <TableRow key={worker.id}>
                                <TableCell className="font-medium">{worker.name}</TableCell>
                                <TableCell>{worker.department}</TableCell>
                                <TableCell>{worker.role}</TableCell>
                                <TableCell>{numberFormat(worker.baseSalary)}</TableCell>
                                <TableCell>
                                    <Badge 
                                        variant={
                                            worker.contractStatus === 'Ativo' ? 'default' :
                                            worker.contractStatus === 'Suspenso' ? 'destructive' : 'secondary'
                                        }
                                        className="print:border print:text-black print:bg-white"
                                    >
                                        {worker.contractStatus}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </main>
            
            <footer className="mt-auto pt-8">
                <div className="text-center text-xs border-t border-black pt-4">
                    <p>Total de Trabalhadores: {workers.length}</p>
                    <p>Processado por computador - DS KARGA SISTEM</p>
                </div>
            </footer>
        </div>
    </div>
  );
}
