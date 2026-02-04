
'use client';

import { Logo } from "@/components/icons";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define interface locally or import from a shared types file
// Adapting to match the normalized data from Supabase (where dates are Date objects)
interface PurchaseRequest {
    id: string;
    requestNumber: string;
    requester: string;
    department: string;
    justification: string;
    items: any[];
    status: string;
    date: Date | null;
    createdAt: Date | null;
}

interface PrintLayoutProps {
    request: PurchaseRequest;
}

export function PurchaseRequestPrintLayout({ request }: PrintLayoutProps) {
  const today = new Date();

  return (
    <div className="print-only">
        <div className="w-[210mm] min-h-[297mm] mx-auto bg-white text-black p-8 flex flex-col text-sm">
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
                    <h1 className='text-2xl font-bold font-headline'>Solicitação de Compra</h1>
                    <p className='font-mono font-bold mt-2'>{request.requestNumber}</p>
                </div>
            </header>
            
            <section className="mb-6 p-4 border rounded-md border-gray-400">
                <div className="grid grid-cols-3 gap-4">
                    <div><p className="font-bold">Requisitante:</p><p>{request.requester}</p></div>
                    <div><p className="font-bold">Departamento:</p><p>{request.department}</p></div>
                    <div><p className="font-bold">Data da Solicitação:</p><p>{request.createdAt ? format(request.createdAt, 'dd/MM/yyyy') : 'N/A'}</p></div>
                     <div><p className="font-bold">Data da Necessidade:</p><p>{request.date ? format(request.date, 'dd/MM/yyyy') : 'N/A'}</p></div>
                </div>
            </section>
            
            <div className='my-6 space-y-4'>
                <div><h4 className='font-bold text-base border-b-2 border-black pb-1 mb-2'>Justificação da Necessidade</h4><p>{request.justification}</p></div>
            </div>

            <main className="flex-grow">
                 <h4 className='font-bold text-base border-b-2 border-black pb-1 mb-2'>Itens Solicitados</h4>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-100">
                            <TableHead className="text-black">Descrição</TableHead>
                            <TableHead className="text-black text-center">Quantidade</TableHead>
                            <TableHead className="text-black">Unidade</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {request.items.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </main>
            
            <footer className="mt-auto pt-16">
                <div className="grid grid-cols-2 gap-8 text-center text-sm">
                    <div>
                        <div className="border-t border-black w-3/4 mx-auto pt-1">Assinatura do Requisitante</div>
                    </div>
                    <div>
                        <div className="border-t border-black w-3/4 mx-auto pt-1">Assinatura da Direção</div>
                    </div>
                </div>
                <div className="text-center text-xs pt-8 mt-8 border-t border-gray-300">
                    <p>Documento gerado em {format(today, "dd/MM/yyyy HH:mm", { locale: pt })} por DS KARGA SISTEM</p>
                </div>
            </footer>
        </div>
    </div>
  );
}
