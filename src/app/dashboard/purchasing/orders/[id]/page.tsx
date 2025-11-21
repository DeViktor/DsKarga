
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { DashboardHeader } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface PurchaseOrder {
  id: string;
  order_number: string;
  request_number: string;
  supplier_name?: string;
  status: string;
  created_at: string;
}

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
    const supabase = getSupabaseClient();

    const [order, setOrder] = useState<PurchaseOrder | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data, error } = await supabase
                    .from('purchase_orders')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (error) throw error;
                
                if (data) {
                    setOrder({
                        id: data.id,
                        order_number: data.order_number,
                        request_number: data.request_number,
                        supplier_name: data.supplier_name,
                        status: data.status || 'Pendente',
                        created_at: data.created_at
                    });
                } else {
                    setOrder(null);
                }
            } catch (error) {
                console.error('Erro ao carregar ordem:', error);
                toast({ 
                    title: "Erro", 
                    description: "Não foi possível carregar os detalhes da ordem.", 
                    variant: "destructive"
                });
                setOrder(null);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchOrder();
        }
    }, [id, supabase, toast]);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin"/></div>
    }

    if (!order) {
        return notFound();
    }

    return (
        <>
            <DashboardHeader title={`Ordem de Compra ${order.order_number}`}>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4"/> Retroceder
                    </Button>
                </div>
            </DashboardHeader>

            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="font-headline text-2xl">Detalhes da Ordem</CardTitle>
                                <CardDescription>
                                    {order.created_at ? `Criada em ${format(new Date(order.created_at), "dd 'de' MMMM, yyyy", { locale: pt })}` : 'A processar...'}
                                </CardDescription>
                            </div>
                            <Badge variant={getStatusVariant(order.status)} className="text-base px-4 py-1">
                                {order.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Número da Ordem</p>
                            <p className="font-semibold">{order.order_number}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Solicitação de Origem</p>
                            <p className="font-semibold">{order.request_number}</p>
                        </div>
                        {order.supplier_name && (
                            <div>
                                <p className="text-sm text-muted-foreground">Fornecedor</p>
                                <p className="font-semibold">{order.supplier_name}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Informações Adicionais</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">ID da Ordem</p>
                                <p className="font-mono text-sm">{order.id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status Atual</p>
                                <p className="font-semibold">{order.status}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
