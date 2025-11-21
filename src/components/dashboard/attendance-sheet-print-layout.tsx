
'use client';

import { Logo } from "@/components/icons";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import type { Worker } from "@/types/worker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AttendanceRecord {
    entry: string;
    exit: string;
    overtime: string;
    absence: string;
}

interface PrintLayoutProps {
    workers: Worker[];
    attendance: Record<string, AttendanceRecord>;
    date: Date;
}

export function AttendanceSheetPrintLayout({ workers, attendance, date }: PrintLayoutProps) {
  const today = new Date();

  const renderTableForType = (title: string, workerList: Worker[]) => {
    if (workerList.length === 0) return null;
    return (
        <div className="break-inside-avoid">
            <h2 className="font-bold text-lg mb-2 mt-4">{title}</h2>
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-100 text-xs">
                        <TableHead className="text-black w-[200px]">Nome do Trabalhador</TableHead>
                        <TableHead className="text-black text-center">Entrada</TableHead>
                        <TableHead className="text-black text-center">Saída</TableHead>
                        <TableHead className="text-black text-center">H. Extras</TableHead>
                        <TableHead className="text-black text-center">Faltas</TableHead>
                        <TableHead className="text-black w-[150px]">Assinatura</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                    {workerList.map(worker => {
                        const record = attendance[worker.id] || { entry: '', exit: '', overtime: '', absence: '' };
                        return (
                            <TableRow key={worker.id}>
                                <TableCell>{worker.name}</TableCell>
                                <TableCell className="text-center">{record.entry}</TableCell>
                                <TableCell className="text-center">{record.exit}</TableCell>
                                <TableCell className="text-center">{record.overtime}</TableCell>
                                <TableCell className="text-center">{record.absence}</TableCell>
                                <TableCell className="border-l"></TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
  }

  const fixedWorkers = workers.filter(w => w.type === 'Fixo');
  const eventualWorkers = workers.filter(w => w.type === 'Eventual');

  return (
    <div className="print-only">
      <div className="w-[210mm] min-h-[297mm] mx-auto bg-white text-black p-8 flex flex-col text-sm">
        <header className="flex justify-between items-start mb-8">
            <div className="w-1/2">
                <Logo />
            </div>
            <div className="w-1/2 text-right">
                <h1 className='text-xl font-bold font-headline'>FOLHA DE PONTO DIÁRIA</h1>
                <p className='text-sm mt-1'>Data: {format(date, "dd 'de' MMMM 'de' yyyy", { locale: pt })}</p>
            </div>
        </header>

        <main className="flex-grow">
            {renderTableForType("Trabalhadores Fixos", fixedWorkers)}
            {renderTableForType("Trabalhadores Eventuais", eventualWorkers)}
        </main>
        
        <footer className="mt-auto pt-8">
            <div className="grid grid-cols-2 gap-16 text-center">
                <div>
                    <div className="border-t border-black pt-1">Responsável (DS Karga)</div>
                </div>
                 <div>
                    <div className="border-t border-black pt-1">Fiscal (Cliente)</div>
                </div>
            </div>
            <div className="text-center text-xs pt-8 mt-8 border-t border-gray-300">
                <p>Processado por computador - DS KARGA SISTEM</p>
            </div>
        </footer>
      </div>
    </div>
  );
}
