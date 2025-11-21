
'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { MoreHorizontal, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Entregue': return 'default';
        case 'Pendente': return 'secondary';
        case 'Atrasado': return 'destructive';
        case 'Cancelado': return 'destructive';
        default: return 'outline';
    }
};

type UiOrder = {
  id: string;
  orderNumber: string;
  requestNumber?: string;
  supplierName?: string | null;
  issueDate?: string | null;
  createdAt?: string | null;
  status: string;
  itemsCount?: number;
};

export default function PurchaseOrdersPage() {
  const { toast } = useToast();
  const supabase = getSupabaseClient();
  const [purchaseOrders, setPurchaseOrders] = useState<UiOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        toast({ title: 'Erro', description: error.message || 'Falha ao carregar ordens.', variant: 'destructive' });
        setPurchaseOrders([]);
      } else {
        const mapped: UiOrder[] = (data || []).map((row: any) => ({
          id: row.id,
          orderNumber: row.order_number,
          requestNumber: row.request_number,
          supplierName: row.supplier_name ?? null,
          issueDate: row.issue_date ?? null,
          createdAt: row.created_at ?? null,
          status: row.status || 'Pendente',
          itemsCount: row.items_count ?? undefined,
        }));
        setPurchaseOrders(mapped);
      }
      setLoading(false);
    };
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateStatus = async (id: string, status: UiOrder['status']) => {
    const { error } = await supabase
      .from('purchase_orders')
      .update({ status })
      .eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o estado.', variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: `Ordem de compra marcada como ${status.toLowerCase()}.` });
      setPurchaseOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    }
  };

  return (
    <>
      <DashboardHeader title="Ordens de Compra" />
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Acompanhar Ordens de Compra</CardTitle>
          <CardDescription>
            Acompanhe o estado de todas as ordens de compra emitidas para os fornecedores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Ordem</TableHead>
                <TableHead>Nº Solicitação</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data de Emissão</TableHead>
                <TableHead>Nº Itens</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
              ) : purchaseOrders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono">{order.orderNumber}</TableCell>
                  <TableCell className="font-mono">{order.requestNumber}</TableCell>
                  <TableCell className="font-medium">{order.supplierName || 'A definir'}</TableCell>
                  <TableCell>{(order.issueDate || order.createdAt) ? format(new Date(order.issueDate || order.createdAt), 'dd/MM/yyyy') : 'A processar...'}</TableCell>
                  <TableCell>{typeof order.itemsCount === 'number' ? order.itemsCount : '-'}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
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
                        <DropdownMenuItem asChild><Link href={`/dashboard/purchasing/orders/${order.id}`}>Ver Detalhes da Ordem</Link></DropdownMenuItem>
                        {order.status === 'Pendente' && (
                          <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'Entregue')}>Marcar como Entregue</DropdownMenuItem>
                        )}
                        <DropdownMenuItem disabled>Lançar Fatura</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {!loading && purchaseOrders?.length === 0 && (
                 <TableRow><TableCell colSpan={7} className="h-24 text-center">Nenhuma ordem de compra encontrada.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
