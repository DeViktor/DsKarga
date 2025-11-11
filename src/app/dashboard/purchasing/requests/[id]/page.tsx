
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc, Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { type PurchaseRequest, updatePurchaseRequestStatus, addPurchaseOrder } from '@/firebase/firestore/purchasing';
import { DashboardHeader } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Download, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PurchaseRequestPrintLayout } from '@/components/dashboard/purchasing/purchase-request-print-layout';


const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Aprovado': return 'default';
        case 'Pendente': return 'secondary';
        case 'Rejeitado': return 'destructive';
        default: return 'outline';
    }
};

export default function PurchaseRequestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;
    const firestore = useFirestore();
    const [isPrinting, setIsPrinting] = useState(false);

    const requestRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'purchase-requests', id);
    }, [firestore, id]);

    const { data: request, loading } = useDoc<PurchaseRequest>(requestRef);

    useEffect(() => {
        if (isPrinting) {
          const timer = setTimeout(() => {
            window.print();
            setIsPrinting(false);
          }, 100);
          return () => clearTimeout(timer);
        }
    }, [isPrinting]);

     const handleUpdateStatus = async (status: 'Aprovado' | 'Rejeitado') => {
        if (!firestore) return;
        try {
        await updatePurchaseRequestStatus(firestore, id, status);
        toast({ title: "Sucesso", description: `Solicitação marcada como ${status.toLowerCase()}.` });
        } catch (error) {
        toast({ title: "Erro", description: "Não foi possível atualizar o estado.", variant: "destructive"});
        }
    }

    const handleGenerateOrder = async () => {
        if (!firestore || !request) return;
        try {
            await addPurchaseOrder(firestore, request);
            toast({ title: "Sucesso", description: "Ordem de compra gerada." });
            router.push('/dashboard/purchasing/orders');
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível gerar a ordem de compra.", variant: "destructive"});
        }
    }

    const handlePrint = () => {
        setIsPrinting(true);
    }

    const downloadXLSX = () => {
        if (!request) return;
        const dataToExport = [
            { Chave: 'Nº Solicitação', Valor: request.requestNumber },
            { Chave: 'Data', Valor: request.createdAt ? format(request.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A' },
            { Chave: 'Departamento', Valor: request.department },
            { Chave: 'Requisitante', Valor: request.requester },
            { Chave: 'Estado', Valor: request.status },
            { Chave: 'Justificação', Valor: request.justification },
            {},
            { Chave: 'Item', Valor: 'Quantidade', Unidade: 'Unid.' } ,
             ...request.items.map(item => ({
                Chave: item.description,
                Valor: item.quantity,
                Unidade: item.unit
            }))
        ];
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Solicitacao Compra');
        XLSX.writeFile(workbook, `Solicitacao_Compra_${request.requestNumber}.xlsx`);
    }


    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin"/></div>
    }

    if (!request) {
        return notFound();
    }

    if (isPrinting) {
        return <PurchaseRequestPrintLayout request={request} />;
    }

    return (
        <>
            <DashboardHeader title={`Solicitação ${request.requestNumber}`}>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2"/>Retroceder</Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button><Download className="mr-2"/>Baixar</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={handlePrint}>Exportar para PDF</DropdownMenuItem>
                            <DropdownMenuItem onSelect={downloadXLSX}>Exportar para Excel</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {request.status === 'Pendente' && (
                        <>
                            <Button variant="destructive" onClick={() => handleUpdateStatus('Rejeitado')}><X className="mr-2"/>Rejeitar</Button>
                            <Button onClick={() => handleUpdateStatus('Aprovado')}><Check className="mr-2"/>Aprovar</Button>
                        </>
                    )}
                    {request.status === 'Aprovado' && (
                        <Button onClick={handleGenerateOrder}>Gerar Ordem de Compra</Button>
                    )}
                </div>
            </DashboardHeader>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="font-headline text-2xl">Detalhes da Solicitação de Compra</CardTitle>
                            <CardDescription>
                                {request.createdAt ? `Criado por ${request.requester} em ${format(request.createdAt.toDate(), "dd 'de' MMMM, yyyy", { locale: pt })}` : 'A processar...'}
                            </CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(request.status)} className="text-base px-4 py-1">{request.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <div><p className="text-sm text-muted-foreground">Departamento</p><p className="font-semibold">{request.department}</p></div>
                        <div><p className="text-sm text-muted-foreground">Data da Necessidade</p><p className="font-semibold">{request.date ? format((request.date as unknown as Timestamp).toDate(), 'PPP', {locale: pt}) : 'N/A'}</p></div>
                    </div>
                    <div className="mb-6">
                        <p className="text-sm text-muted-foreground">Justificação</p>
                        <p className="font-semibold">{request.justification}</p>
                    </div>

                    <h3 className="font-headline text-lg mb-2">Itens Solicitados</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-center">Quantidade</TableHead>
                                <TableHead>Unidade</TableHead>
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
                </CardContent>
            </Card>
        </>
    )
}
