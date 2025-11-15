
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
// import { Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
// Removed actions import; using Supabase client directly
import { getSupabaseClient } from '@/lib/supabase/client';
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
    const [isPrinting, setIsPrinting] = useState(false);
    const [request, setRequest] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchRequest() {
            setLoading(true);
            try {
                const supabase = getSupabaseClient();
                const { data, error } = await supabase
                    .from('purchase_requests')
                    .select('*')
                    .eq('id', id)
                    .limit(1)
                    .single();
                if (error) throw error;
                // Primeiro, normaliza os campos principais
                let normalized = data ? {
                    id: data.id,
                    requestNumber: data.request_number,
                    requester: data.requester,
                    department: data.department,
                    date: data.request_date ? new Date(data.request_date) : null,
                    justification: data.justification,
                    items: data.items || [],
                    status: data.status || 'Pendente',
                    createdAt: data.created_at ? new Date(data.created_at) : null,
                } : null;

                // Se não houver itens embutidos, tentar buscar na tabela relacional
                if (normalized && (!normalized.items || normalized.items.length === 0)) {
                    const { data: relItems, error: relError } = await supabase
                        .from('purchase_request_items')
                        .select('id, description, quantity, unit')
                        .eq('request_id', id);
                    if (relError) {
                        const msg = relError.message?.toLowerCase() || '';
                        const relationMissing = msg.includes('relation') && msg.includes('does not exist');
                        if (relationMissing) {
                            // Tentar nome alternativo
                            const retry = await supabase
                                .from('purchase_requests_items')
                                .select('id, description, quantity, unit')
                                .eq('request_id', id);
                            if (!retry.error && retry.data) {
                                normalized = { ...normalized, items: retry.data };
                            }
                        }
                    } else if (relItems) {
                        normalized = { ...normalized, items: relItems };
                    }
                }
                if (isMounted) setRequest(normalized);
            } catch (err) {
                console.error('Erro ao carregar solicitação do Supabase', err);
                if (isMounted) setRequest(null);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        if (id) fetchRequest();
        return () => { isMounted = false; };
    }, [id]);

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
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase
              .from('purchase_requests')
              .update({ status })
              .eq('id', id);
            if (error) throw error;
            toast({ title: "Sucesso", description: `Solicitação marcada como ${status.toLowerCase()}.` });
            setRequest(prev => prev ? { ...prev, status } : prev);
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível atualizar o estado.", variant: "destructive"});
        }
    }

    const handleGenerateOrder = async () => {
        if (!request) return;
        try {
            const supabase = getSupabaseClient();
            const orderNumber = `PO-${Date.now()}`;
            // Payload mínimo para evitar erro de colunas ausentes (items_count, supplier_name, issue_date)
            const payload = {
              order_number: orderNumber,
              request_id: request.id,
              request_number: request.requestNumber,
              issue_date: new Date().toISOString(),
              status: 'Pendente',
              created_at: new Date().toISOString(),
            };
            // Inserção robusta: remove colunas ausentes até o insert funcionar
            const tryInsert = async (initial: any) => {
              let current = { ...initial };
              for (let i = 0; i < 5; i++) {
                const res = await supabase
                  .from('purchase_orders')
                  .insert(current)
                  .select('id, order_number')
                  .single();
                if (!res.error) return res.data;
                const em = res.error.message || '';
                const lower = em.toLowerCase();
                if (lower.includes('relation') && lower.includes('does not exist')) {
                  throw new Error('Tabela purchase_orders não encontrada no Supabase. Verifique o schema.');
                }
                const matchQuoted = em.match(/Could not find the '([^']+)' column/i) || em.match(/'([^']+)'\s+column/i);
                const matchDblQuoted = em.match(/column\s+"([^"]+)"/i);
                const missingCol = (matchQuoted && matchQuoted[1]) || (matchDblQuoted && matchDblQuoted[1]) || null;
                if (missingCol && missingCol in current) {
                  const { [missingCol]: _omit, ...rest } = current as any;
                  current = rest;
                  continue;
                }
                if (lower.includes('schema cache') || lower.includes('column')) {
                  const { issue_date, request_id, request_number, ...rest } = current as any;
                  current = rest;
                  continue;
                }
                throw new Error(`${res.error.message}${res.error.details ? ` — ${res.error.details}` : ''}`);
              }
              throw new Error('Falha ao criar ordem: colunas ausentes no schema.');
            };

            const createdOrder = await tryInsert(payload);
            // Inserir itens da ordem após criação (caminho principal)
            const items = Array.isArray(request.items) ? request.items : [];
            if (items.length > 0 && createdOrder?.id) {
              const orderItems = items.map((it: any) => ({
                order_id: createdOrder.id,
                item_id: it.itemId ?? it.id ?? null,
                description: it.description ?? it.name ?? '',
                quantity: Number(it.quantity ?? it.qty ?? 0),
                unit: it.unit ?? it.uom ?? null,
                created_at: new Date().toISOString(),
              }));
              const ins1 = await supabase.from('purchase_order_items').insert(orderItems);
              if (ins1.error) {
                const e = ins1.error.message?.toLowerCase() || '';
                if (e.includes('relation') && e.includes('does not exist')) {
                  const ins2 = await supabase.from('purchase_orders_items').insert(orderItems);
                  if (ins2.error) {
                    toast({
                      title: 'Ordem criada com avisos',
                      description: `Itens não inseridos: ${ins2.error.message}${ins2.error.details ? ` — ${ins2.error.details}` : ''}`,
                      variant: 'destructive',
                    });
                  }
                } else if (e.includes('null value') && e.includes('item_id')) {
                  toast({
                    title: 'Ordem criada com avisos',
                    description: 'Itens não inseridos: a coluna item_id é obrigatória. Selecione itens do catálogo ou torne item_id opcional.',
                    variant: 'destructive',
                  });
                } else {
                  toast({
                    title: 'Ordem criada com avisos',
                    description: `Itens não inseridos: ${ins1.error.message}${ins1.error.details ? ` — ${ins1.error.details}` : ''}`,
                    variant: 'destructive',
                  });
                }
              }
            }
            toast({ title: 'Sucesso', description: `Ordem ${createdOrder.order_number} criada.` });
            // Redireciona para a listagem de ordens (que lê do Supabase)
            router.push('/dashboard/purchasing/orders');
          
        } catch (error) {
            // Mostrar mensagem detalhada do Supabase quando disponível
            const anyErr = error as any;
            const message = (anyErr && typeof anyErr === 'object' && 'message' in anyErr)
              ? `${anyErr.message}${anyErr.details ? ` — ${anyErr.details}` : ''}`
              : 'Não foi possível gerar a ordem de compra.';
            console.error('Falha ao gerar ordem de compra:', error);
            toast({ title: "Erro", description: message, variant: "destructive"});
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
                                {request.createdAt ? `Criado por ${request.requester} em ${format(request.createdAt as Date, "dd 'de' MMMM, yyyy", { locale: pt })}` : 'A processar...'}
                            </CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(request.status)} className="text-base px-4 py-1">{request.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <div><p className="text-sm text-muted-foreground">Departamento</p><p className="font-semibold">{request.department}</p></div>
                        <div><p className="text-sm text-muted-foreground">Data da Necessidade</p><p className="font-semibold">{request.date ? format(request.date as Date, 'PPP', {locale: pt}) : 'N/A'}</p></div>
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
