
'use client';

import { Logo } from "@/components/icons";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { DateRange } from "react-day-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type ReportData = { Categoria: string, Valor: string | number }[];
type MultiReportData = { title: string, data: ReportData };

interface ReportsPrintLayoutProps {
    title: string;
    dateRange?: DateRange;
    data: ReportData | MultiReportData[];
}

const formatValue = (value: string | number) => {
    if (typeof value === 'number') {
        // Check if it's a percentage
        if (String(value).includes('.') && Math.abs(value) <= 100) {
            const parts = String(value).split('.');
            if (parts[1] && parts[1].length > 0) {
                return `${value.toFixed(1)}%`;
            }
        }
        return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
    }
    return value;
}

const ReportSection = ({ title, dateRange, data }: {title: string, dateRange?: DateRange, data: ReportData}) => {
    const dateString = dateRange?.from ? (
    dateRange.to ? 
    `De ${format(dateRange.from, "dd/MM/yyyy", { locale: pt })} a ${format(dateRange.to, "dd/MM/yyyy", { locale: pt })}`
    : format(dateRange.from, "dd/MM/yyyy", { locale: pt })
  ) : "N/A";
    
    if (!data) {
        return null; // Don't render if data is not available
    }

    return (
        <Card className="shadow-none border-gray-400 break-inside-avoid">
            <CardHeader>
                <CardTitle className="font-headline">{title}</CardTitle>
                <CardDescription>Dados para o período de {dateString}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-100">
                            <TableHead className="text-black">Categoria</TableHead>
                            <TableHead className="text-black text-right">Valor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{item.Categoria}</TableCell>
                                <TableCell className="text-right">{formatValue(item.Valor)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export function ReportsPrintLayout({ title, dateRange, data }: ReportsPrintLayoutProps) {
  
  const isGeneral = Array.isArray(data);
  const dateString = dateRange?.from ? (
    dateRange.to ? 
    `De ${format(dateRange.from, "dd/MM/yyyy", { locale: pt })} a ${format(dateRange.to, "dd/MM/yyyy", { locale: pt })}`
    : format(dateRange.from, "dd/MM/yyyy", { locale: pt })
  ) : "N/A";


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
                    <h1 className='text-xl font-bold font-headline'>{title}</h1>
                    <p className='text-sm mt-1'>{dateString}</p>
                </div>
            </header>

            <main className="flex-grow space-y-4">
                 {isGeneral ? (
                    data.map((report, index) => <ReportSection key={index} title={report.title} dateRange={dateRange} data={report.data} />)
                 ) : (
                    <ReportSection title={title} dateRange={dateRange} data={data as ReportData} />
                 )}
            </main>
            
            <footer className="mt-auto pt-8">
                <div className="text-center text-xs border-t border-black pt-4">
                    <p>Processado por computador - DS KARGA SISTEM</p>
                    <p>Emitido em: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt })}</p>
                </div>
            </footer>
        </div>
    </div>
  );
}

    
