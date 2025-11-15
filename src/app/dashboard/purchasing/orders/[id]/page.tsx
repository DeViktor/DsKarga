
"use client";

import { useMemo, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { type PurchaseOrder, updatePurchaseOrderStatus, updatePurchaseOrder } from '@/firebase/firestore/purchasing';
import { DashboardHeader } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Download, Check, X, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Supplier } from '../../suppliers/page';

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Entregue': return 'default';
        case 'Pendente': return 'secondary';
        case 'Atrasado': return 'destructive';
        case 'Cancelado': return 'destructive';
        default: return 'outline';
    }
};

export default function PurchaseOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;
    const firestore = useFirestore();

    const [isEditingSupplier, setIsEditingSupplier] = useState(false);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');

    const orderRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'purchase-orders', id);
    }, [firestore, id]);

    const { data: order, loading: orderLoading } = useDoc<PurchaseOrder>(orderRef);
    
    const suppliersQuery = useMemo(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'suppliers'), orderBy('name'))
    },[firestore]);
    const { data: suppliers, loading: suppliersLoading } = useCollection<Supplier>(suppliersQuery);

     const handleUpdateStatus = async (status: PurchaseOrder['status']) => {
        if (!firestore) return;
        try {
            await updatePurchaseOrderStatus(firestore, id, status);
            toast({ title: "Sucesso", description: `Ordem marcada como ${status.toLowerCase()}.` });
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível atualizar o estado.", variant: "destructive"});
        }
    }
    
    const handleAssignSupplier = async () => {
        if (!firestore || !selectedSupplierId) return;
        const supplier = suppliers?.find(s => s.id === selectedSupplierId);
        if (!supplier) return;
        try {
            await updatePurchaseOrder(firestore, id, { supplierId: supplier.id, supplierName: supplier.name });
            toast({ title: "Sucesso", description: `Fornecedor ${supplier.name} associado.`});
            setIsEditingSupplier(false);
        } catch (error) {
             toast({ title: "Erro", description: "Não foi possível associar o fornecedor.", variant: "destructive"});
        }
    };

    if (orderLoading || suppliersLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin"/></div>
    }

    if (!order) {
        return notFound();
    }

    return (
        <>
            <DashboardHeader title={`Ordem de Compra ${order.orderNumber}`}>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2"/>Retroceder</Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline"><Download className="mr-2"/>Baixar</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem disabled>Exportar para PDF</DropdownMenuItem>
                            <DropdownMenuItem disabled>Exportar para Excel</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {order.status === 'Pendente' && (
                        <>
                            <Button variant="destructive" onClick={() => handleUpdateStatus('Cancelado')}><X className="mr-2"/>Cancelar Ordem</Button>
                            <Button onClick={() => handleUpdateStatus('Entregue')}><Truck className="mr-2"/>Marcar como Entregue</Button>
                        </>
                    )}
                </div>
            </DashboardHeader>

            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2">
                     <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="font-headline text-2xl">Detalhes da Ordem de Compra</CardTitle>
                                    <CardDescription>
                                        {order.createdAt ? `Gerada em ${format(order.createdAt.toDate(), "dd 'de' MMMM, yyyy", { locale: pt })}` : 'A processar...'}
                                    </CardDescription>
                                </div>
                                <Badge variant={getStatusVariant(order.status)} className="text-base px-4 py-1">{order.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <h3 className="font-headline text-lg mb-2">Itens</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className="text-center">Quantidade</TableHead>
                                        <TableHead>Unidade</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map(item => (
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
                </div>
                 <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Fornecedor</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {order.supplierName && !isEditingSupplier ? (
                                <div className="space-y-4">
                                    <p className="font-bold text-lg">{order.supplierName}</p>
                                    <Button variant="outline" onClick={() => setIsEditingSupplier(true)}>Alterar Fornecedor</Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                     <div className="space-y-2">
                                        <Label>Selecionar Fornecedor</Label>
                                         <Select onValueChange={setSelectedSupplierId}>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent>
                                                {suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleAssignSupplier} disabled={!selectedSupplierId}>Associar</Button>
                                        {order.supplierName && <Button variant="ghost" onClick={() => setIsEditingSupplier(false)}>Cancelar</Button>}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Informações Adicionais</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div><p className="text-sm text-muted-foreground">Solicitação de Origem</p><p className="font-semibold">{order.requestNumber}</p></div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}
