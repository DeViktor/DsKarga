
'use client';

import { useEffect, useMemo, useState } from "react";
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
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
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
  const router = useRouter();
  const { toast } = useToast();
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchRequests() {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('purchase_requests')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        const normalized = (data || []).map((r: any) => ({
          id: r.id,
          requestNumber: r.request_number,
          department: r.department,
          items: r.items || [],
          date: r.request_date ? new Date(r.request_date) : null,
          status: r.status || 'Pendente',
        }));
        if (isMounted) setPurchaseRequests(normalized);
      } catch (err) {
        console.error('Erro ao carregar solicitações do Supabase', err);
        if (isMounted) setPurchaseRequests([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchRequests();
    return () => { isMounted = false; };
  }, []);

  const handleUpdateStatus = async (id: string, status: 'Aprovado' | 'Rejeitado') => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('purchase_requests')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: `Solicitação marcada como ${status.toLowerCase()}.` });
      setPurchaseRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar o estado.", variant: "destructive"});
    }
  }

  const handleGenerateOrder = async (request: any) => {
    try {
      const supabase = getSupabaseClient();
      const orderNumber = `OC-${new Date().getFullYear()}-${Date.now()}`;
      const payload = {
        order_number: orderNumber,
        request_number: request.requestNumber,
        status: 'Pendente',
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('purchase_orders')
        .insert(payload);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Ordem de compra gerada." });
      router.push('/dashboard/purchasing/orders');
    } catch (error) {
       const message = error instanceof Error ? error.message : 'Não foi possível gerar a ordem de compra.';
       toast({ title: "Erro", description: message, variant: "destructive"});
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
                    {request.date ? format(request.date as Date, 'dd/MM/yyyy', { locale: pt }) : 'A processar...'}
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
