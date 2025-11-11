
'use client';

import { useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText, Loader2 } from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { addPurchaseOrder, updatePurchaseRequestStatus, type PurchaseRequest } from "@/firebase/firestore/purchasing";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";


const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Aprovado': return 'default';
        case 'Pendente': return 'secondary';
        case 'Rejeitado': return 'destructive';
        default: return 'outline';
    }
};

export default function PurchaseRequestsPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const requestsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'purchase-requests'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: purchaseRequests, loading } = useCollection<PurchaseRequest>(requestsQuery);

  const handleUpdateStatus = async (id: string, status: 'Aprovado' | 'Rejeitado') => {
    if (!firestore) return;
    try {
      await updatePurchaseRequestStatus(firestore, id, status);
      toast({ title: "Sucesso", description: `Solicitação marcada como ${status.toLowerCase()}.` });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar o estado.", variant: "destructive"});
    }
  }

  const handleGenerateOrder = async (request: PurchaseRequest) => {
    if (!firestore) return;
    try {
      await addPurchaseOrder(firestore, request);
      toast({ title: "Sucesso", description: "Ordem de compra gerada." });
      router.push('/dashboard/purchasing/orders');
    } catch (error) {
       toast({ title: "Erro", description: "Não foi possível gerar a ordem de compra.", variant: "destructive"});
    }
  }

  return (
    <>
      <DashboardHeader title="Solicitações de Compra" />
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Gerir Solicitações</CardTitle>
          <CardDescription>
            Visualize e aprove ou rejeite as solicitações de compra pendentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Solicitação</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Item Principal Solicitado</TableHead>
                <TableHead>Data da Necessidade</TableHead>
                <TableHead>Nº Itens</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                </TableRow>
              ) : purchaseRequests?.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">Nenhuma solicitação encontrada.</TableCell>
                </TableRow>
              ) : purchaseRequests?.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-mono">{request.requestNumber}</TableCell>
                  <TableCell>{request.department}</TableCell>
                  <TableCell className="font-medium">
                    {request.items[0]?.description}
                    {request.items.length > 1 && ` (+${request.items.length - 1})`}
                  </TableCell>
                  <TableCell>
                    {request.date ? format((request.date as unknown as Timestamp).toDate(), 'dd/MM/yyyy', { locale: pt }) : 'A processar...'}
                  </TableCell>
                  <TableCell>{request.items.length}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link href={`/dashboard/purchasing/requests/${request.id}`}>Ver Detalhes</Link></DropdownMenuItem>
                        {request.status === 'Pendente' && (
                          <>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'Aprovado')}>Aprovar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleUpdateStatus(request.id, 'Rejeitado')}>Rejeitar</DropdownMenuItem>
                          </>
                        )}
                         {request.status === 'Aprovado' && (
                            <DropdownMenuItem onClick={() => handleGenerateOrder(request)}>Gerar Ordem de Compra</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
