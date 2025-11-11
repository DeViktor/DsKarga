

'use client';

import { Logo } from "@/components/icons";
import { type Service } from "@/hooks/use-services";
import { type PaymentFormValues, type PaymentCalculatedValues } from "@/app/dashboard/services/payment-guide/page";
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "../ui/separator";

interface PaymentGuidePrintLayoutProps {
    service: Service | null;
    workers: PaymentFormValues['workers'];
    calculatedValues: PaymentCalculatedValues[];
    rates: {
      retentionRate: number;
      inssEmployeeRate: number;
    }
}

const numberFormat = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    }).format(value);
};

export function PaymentGuidePrintLayout({ service, workers, calculatedValues, rates }: PaymentGuidePrintLayoutProps) {
  if (!service) {
    return null;
  }

  const totals = calculatedValues.reduce((acc, curr) => ({
        grossTotal: acc.grossTotal + curr.grossTotal,
        inss: acc.inss + curr.inss,
        irt: acc.irt + curr.irt,
        retention: acc.retention + curr.retention,
        netTotal: acc.netTotal + curr.netTotal,
    }), { grossTotal: 0, inss: 0, irt: 0, retention: 0, netTotal: 0 });

  return (
    <div className="w-[210mm] h-[297mm] mx-auto bg-white text-black p-8 flex flex-col">
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
                <h1 className='text-2xl font-bold font-headline'>GUIA DE PAGAMENTO</h1>
                <p className='font-mono font-bold mt-2'>Serviço Eventual</p>
            </div>
        </header>

        <section className="mb-6 p-4 border rounded-md border-gray-400 text-sm">
            <div className="grid grid-cols-3 gap-4">
                <div><p className="font-bold">Cliente:</p><p>{service.requestingArea}</p></div>
                <div><p className="font-bold">Nº Requisição:</p><p>{service.guideNumber}</p></div>
                <div><p className="font-bold">Data Emissão:</p><p>{format(new Date(), 'dd/MM/yyyy')}</p></div>
            </div>
        </section>

        <main className="flex-grow">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-100 text-[10px]">
                        <TableHead className="text-black">Nome</TableHead>
                        <TableHead className="text-black text-right">Dias</TableHead>
                        <TableHead className="text-black text-right">Valor Dia</TableHead>
                        <TableHead className="text-black text-right">Total Bruto</TableHead>
                        <TableHead className="text-black text-right">INSS</TableHead>
                        <TableHead className="text-black text-right">IRT</TableHead>
                        <TableHead className="text-black text-right">Retenção</TableHead>
                        <TableHead className="text-black text-right font-bold">Total Líquido</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="text-[10px]">
                    {workers.map((worker, index) => (
                        <TableRow key={worker.id}>
                            <TableCell className="font-medium">{worker.name}</TableCell>
                            <TableCell className="text-right">{worker.daysWorked}</TableCell>
                            <TableCell className="text-right">{numberFormat(worker.dailyValue)}</TableCell>
                            <TableCell className="text-right">{numberFormat(calculatedValues[index].grossTotal)}</TableCell>
                            <TableCell className="text-right text-red-600">{numberFormat(calculatedValues[index].inss)}</TableCell>
                            <TableCell className="text-right text-red-600">{numberFormat(calculatedValues[index].irt)}</TableCell>
                            <TableCell className="text-right text-red-600">{numberFormat(calculatedValues[index].retention)}</TableCell>
                            <TableCell className="text-right font-bold">{numberFormat(calculatedValues[index].netTotal)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </main>
        
        <footer className="space-y-12">
             <div className="flex justify-end pt-4">
                <div className="w-1/3 p-4 bg-gray-100 text-xs">
                    <h4 className="font-bold text-center border-b border-gray-400 pb-1 mb-2">Sumário</h4>
                    <div className="space-y-1">
                        <div className="flex justify-between"><p>Total Bruto:</p><p>{numberFormat(totals.grossTotal)}</p></div>
                        <div className="flex justify-between"><p>Total INSS ({rates.inssEmployeeRate}%):</p><p className="text-red-600">{numberFormat(totals.inss)}</p></div>
                        <div className="flex justify-between"><p>Total IRT:</p><p className="text-red-600">{numberFormat(totals.irt)}</p></div>
                        <div className="flex justify-between"><p>Total Retenção ({rates.retentionRate}%):</p><p className="text-red-600">{numberFormat(totals.retention)}</p></div>
                        <Separator className="my-2 bg-gray-400" />
                        <div className="flex justify-between font-bold text-sm"><p>Total Líquido:</p><p>{numberFormat(totals.netTotal)}</p></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 text-center text-sm pt-8">
                <div>
                    <div className="border-t border-black w-full mx-auto pt-1">DS Karga (Preparação)</div>
                </div>
                <div>
                    <div className="border-t border-black w-full mx-auto pt-1">Administração (Aprovação)</div>
                </div>
            </div>

            <div className="text-center text-xs pt-4 border-t border-black">
                <p>Processado por computador - DS KARGA SISTEM</p>
            </div>
        </footer>
    </div>
  );
}
