

'use client';

import { useState, useMemo, useEffect } from 'react';
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, FileDown, Printer, PlusCircle, Loader2 } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/icons";
import Image from "next/image";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { type Client } from '@/app/dashboard/clients/page';
import { useClients } from '@/hooks/use-clients';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient } from '@/lib/supabase/client';

interface InvoiceItem {
    id: number;
    description: string;
    quantity: number;
    price: number;
    discount: number;
}

export default function BillingPage() {
    const { clients, loading: clientsLoading } = useClients();
    const { toast } = useToast();

    const [docType, setDocType] = useState('Fatura');
    const [invoiceNumber, setInvoiceNumber] = useState(`FT ${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}`);
    
    const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
    const [clientDetails, setClientDetails] = useState<Partial<Client>>({});
    
    const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
    const [dueDate, setDueDate] = useState<Date | undefined>();

    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [newItem, setNewItem] = useState({ description: '', quantity: 1, price: 0, discount: 0 });
    
    const [observations, setObservations] = useState('');
    const [ivaRate, setIvaRate] = useState(14);
    const [applyRetention, setApplyRetention] = useState(false);

    useEffect(() => {
        const prefix = {
            'Fatura': 'FT',
            'Fatura Proforma': 'FP',
            'Orçamento': 'ORC',
            'Nota de Crédito': 'NC',
        }[docType] || 'DOC';
        setInvoiceNumber(`${prefix} ${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}`);
    }, [docType]);

    useEffect(() => {
        if (selectedClientId && clients) {
            const client = clients.find(c => c.id === selectedClientId);
            if (client) {
                setClientDetails(client);
            }
        } else {
            setClientDetails({});
        }
    }, [selectedClientId, clients]);

    const handleClientDetailChange = (field: keyof Client, value: string) => {
        setClientDetails(prev => ({...prev, [field]: value }));
    }

    const handleAddItem = () => {
        if (!newItem.description || newItem.quantity <= 0 || newItem.price <= 0) {
            return;
        }
        setItems([...items, { ...newItem, id: Date.now() }]);
        setNewItem({ description: '', quantity: 1, price: 0, discount: 0 });
    };
    
    const totals = useMemo(() => {
        const totalIliquido = items.reduce((acc, item) => acc + (item.price * item.quantity * (1 - item.discount / 100)), 0);
        const imposto = totalIliquido * (ivaRate / 100);
        const retencao = applyRetention ? totalIliquido * 0.065 : 0;
        const total = totalIliquido + imposto - retencao;

        return { totalIliquido, imposto, retencao, total, desconto: 0 }; 
    }, [items, ivaRate, applyRetention]);

    const handlePrint = () => {
      window.print();
    }

    const handleSaveInvoice = async () => {
      if (!items.length) {
        toast({ title: 'Sem itens', description: 'Adicione itens à fatura antes de salvar.', variant: 'destructive' });
        return;
      }
      
      try {
        const supabase = getSupabaseClient();
        
        // Ensure required fields have valid values
        const finalIssueDate = issueDate ? new Date(issueDate) : new Date();
        const finalDueDate = dueDate ? new Date(dueDate) : null;
        
        // Validate required fields
        if (!invoiceNumber || invoiceNumber.trim() === '') {
          toast({ title: 'Erro', description: 'Número da fatura é obrigatório.', variant: 'destructive' });
          return;
        }
        
        const payload: any = {
          document_type: docType,
          billing_number: invoiceNumber.trim(),
          client_id: selectedClientId,
          client_name: clientDetails.name ?? null,
          client_nif: clientDetails.nif ?? null,
          client_address: clientDetails.address ?? null,
          client_province: clientDetails.province ?? null,
          issue_date: finalIssueDate.toISOString(),
          due_date: finalDueDate ? finalDueDate.toISOString() : null,
          observations: observations || '',
          iva_rate: ivaRate,
          apply_retention: applyRetention,
          items: items.map(i => ({ id: i.id, description: i.description, quantity: i.quantity, price: i.price, discount: i.discount })),
          subtotal: totals.totalIliquido,
          tax_amount: totals.imposto,
          retention_amount: totals.retencao,
          total_amount: totals.total,
          status: 'Emitida',
          created_at: new Date().toISOString(),
        };
        
        // Remove undefined values but keep null values
        Object.keys(payload).forEach(k => {
          if (payload[k] === undefined) {
            delete payload[k];
          }
        });
        
        console.log('Saving invoice with payload:', JSON.stringify(payload, null, 2));
        
        const { data, error } = await supabase
          .from('billing')
          .insert(payload)
          .select('id, billing_number')
          .single();
          
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Invoice saved successfully:', data);
        toast({ title: 'Fatura salva', description: `Documento ${data?.billing_number || invoiceNumber} gravado com sucesso.` });
        
      } catch (err: any) {
        console.group('🚨 BILLING SAVE ERROR DETAILS');
        console.error('Error type:', typeof err);
        console.error('Error constructor:', err?.constructor?.name);
        console.error('Error keys:', Object.keys(err || {}));
        
        // Create a comprehensive error object that can be properly logged
        const comprehensiveError = {
          type: typeof err,
          constructor: err?.constructor?.name,
          message: err?.message || 'No message',
          code: err?.code || 'No code',
          details: err?.details || 'No details',
          hint: err?.hint || 'No hint',
          stack: err?.stack || 'No stack',
          // Try to capture all enumerable properties
          enumerableProps: {},
          // Try to capture all own properties
          ownProps: {}
        };
        
        // Capture enumerable properties
        if (err) {
          for (const key in err) {
            try {
              comprehensiveError.enumerableProps[key] = err[key];
            } catch (e) {
              comprehensiveError.enumerableProps[key] = '[Cannot access]';
            }
          }
          
          // Capture own properties
          Object.getOwnPropertyNames(err).forEach(key => {
            try {
              comprehensiveError.ownProps[key] = err[key];
            } catch (e) {
              comprehensiveError.ownProps[key] = '[Cannot access]';
            }
          });
        }
        
        console.error('Comprehensive error object:', JSON.stringify(comprehensiveError, null, 2));
        console.groupEnd();
        
        // Handle different error formats from Supabase
        let errorMessage = 'Não foi possível gravar a fatura no Supabase.';
        let errorCode = err?.code || 'UNKNOWN';
        
        // Special handling for cases where error object appears empty
        if (!err || (typeof err === 'object' && Object.keys(err).length === 0)) {
          errorMessage = 'Erro desconhecido ao salvar fatura. Por favor, tente novamente.';
          errorCode = 'EMPTY_ERROR';
        }
        
        if (err?.code === '42501') {
          errorMessage = 'Permissão negada: você não tem autorização para criar faturas. Contacte o administrador do sistema.';
        } else if (err?.code === 'PGRST205') {
          errorMessage = 'Tabela de faturas não encontrada. Contacte o administrador do sistema.';
        } else if (err?.code === '23502') {
          // Not null constraint violation
          const columnName = err?.details?.match(/column "([^"]+)"/)?.[1] || 'campo desconhecido';
          errorMessage = `Erro: O campo "${columnName}" é obrigatório.`;
        } else if (err?.message?.includes('billing')) {
          errorMessage = 'Erro na base de dados: tabela de faturas não está disponível.';
        } else if (err?.message) {
          errorMessage = `Erro: ${err.message}`;
        } else if (typeof err === 'string') {
          errorMessage = `Erro: ${err}`;
        } else if (err instanceof Error) {
          errorMessage = `Erro: ${err.message}`;
        }
        
        console.error('Final error message:', errorMessage);
        console.error('Error code:', errorCode);
        console.groupEnd();
        
        toast({ 
          title: 'Erro ao salvar fatura', 
          description: errorMessage, 
          variant: 'destructive',
          duration: 10000
        });
      }
    }

  return (
    <>
      <DashboardHeader title="Faturação" />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Gerar Documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Tipo de Documento</Label>
                    <Select value={docType} onValueChange={setDocType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Fatura">Fatura</SelectItem>
                            <SelectItem value="Fatura Proforma">Fatura Proforma</SelectItem>
                            <SelectItem value="Orçamento">Orçamento</SelectItem>
                            <SelectItem value="Nota de Crédito">Nota de Crédito</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div className='grid grid-cols-2 gap-4'>
                    <div className="space-y-2">
                        <Label>Data de Emissão</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {issueDate ? format(issueDate, 'PPP', { locale: pt }) : <span>Selecione a data</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={issueDate} onSelect={setIssueDate} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                     <div className="space-y-2">
                        <Label>Data de Vencimento</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dueDate ? format(dueDate, 'PPP', { locale: pt }) : <span>Selecione a data</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dueDate} onSelect={setDueDate} /></PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle className="font-headline text-lg">Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label>Selecionar Cliente (Base)</Label>
                    <Select onValueChange={setSelectedClientId} disabled={clientsLoading}>
                        <SelectTrigger>
                            <SelectValue placeholder={clientsLoading ? <div className='flex items-center gap-2'><Loader2 className='animate-spin'/> A carregar...</div> : "Selecione um cliente para pré-preencher"} />
                        </SelectTrigger>
                        <SelectContent>
                            {clients?.map(client => (
                                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Nome do Cliente</Label>
                    <Input value={clientDetails.name || ''} onChange={(e) => handleClientDetailChange('name', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>NIF</Label>
                    <Input value={clientDetails.nif || ''} onChange={(e) => handleClientDetailChange('nif', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Morada</Label>
                    <Input value={clientDetails.address || ''} onChange={(e) => handleClientDetailChange('address', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Província</Label>
                    <Input value={clientDetails.province || ''} onChange={(e) => handleClientDetailChange('province', e.target.value)} />
                </div>
            </CardContent>
          </Card>


           <Card>
              <CardHeader>
                <CardTitle className="font-headline text-lg">Itens</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                    <Label>Descrição</Label>
                    <Input placeholder="Descrição do serviço/produto" value={newItem.description} onChange={(e) => setNewItem({...newItem, description: e.target.value})} />
                </div>
                 <div className="grid grid-cols-3 gap-2">
                    <div className='space-y-2'>
                        <Label>Qtd.</Label>
                        <Input type="number" value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: parseFloat(e.target.value) || 1})} />
                    </div>
                     <div className='space-y-2'>
                        <Label>Preço Unit.</Label>
                        <Input type="number" placeholder="0" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})} />
                    </div>
                     <div className='space-y-2'>
                        <Label>Desc. (%)</Label>
                        <Input type="number" placeholder="0" value={newItem.discount} onChange={(e) => setNewItem({...newItem, discount: parseFloat(e.target.value) || 0})} />
                    </div>
                 </div>
                 <Button className="w-full" onClick={handleAddItem}><PlusCircle className="mr-2 h-4 w-4"/> Adicionar Item</Button>
              </CardContent>
           </Card>

            <Card>
                <CardHeader>
                   <CardTitle className="font-headline text-lg">Detalhes Adicionais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label>Taxa de IVA (%)</Label>
                        <Input type="number" value={ivaRate} onChange={(e) => setIvaRate(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="retention" checked={applyRetention} onCheckedChange={(checked) => setApplyRetention(Boolean(checked))} />
                        <label htmlFor="retention" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Aplicar Retenção na Fonte (6.5%)
                        </label>
                    </div>
                    <Separator />
                    <div className='text-right'>
                        <p className='text-muted-foreground'>Total:</p>
                        <p className='text-2xl font-bold'>{totals.total.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                    </div>
                </CardContent>
            </Card>

        </div>
        <div className="md:col-span-2">
            <Card className="print:shadow-none print:border-none">
                <CardHeader className="flex flex-row items-center justify-between print:hidden">
                    <div>
                        <CardTitle className="font-headline">Pré-visualização</CardTitle>
                        <CardDescription>{docType} n.º {invoiceNumber}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={handlePrint} disabled={items.length === 0}><Printer className="h-4 w-4"/></Button>
                        <Button variant="outline" size="icon" onClick={handleSaveInvoice} disabled={items.length === 0}><FileDown className="h-4 w-4"/></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-8 border-t bg-white text-black dark:bg-gray-950 dark:text-white print:p-0 print:border-none">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-2/3">
                            <Logo />
                            <div className="text-xs mt-4 space-y-px">
                                <p className="font-bold">DS KARGA Engenhosos</p>
                                <p>Luanda, Urbanização Nova Vida, Rua 181, Casa 6024</p>
                                <p>Tel: (244) 935404823</p>
                                <p>Web: www.dskarga.com</p>
                                <p>E-mail: geral@dskarga.com</p>
                                <p>Contribuinte: 5000870595</p>
                            </div>
                        </div>
                        <div className="w-1/3 text-right">
                           <div className="w-24 h-24 ml-auto mb-4">
                             <Image src="https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=DSKargaSistem" alt="QR Code" width={96} height={96} />
                           </div>
                           <div className="text-xs">
                                <p className="font-bold">Exmo.(s) Sr(s)</p>
                                <p>{clientDetails.name || 'N/A'}</p>
                                <p>{clientDetails.address || 'N/A'}</p>
                                <p>{clientDetails.province || 'N/A'} - {clientDetails.country || 'N/A'}</p>
                           </div>
                        </div>
                    </div>
                    
                    <div className="mb-4 text-sm font-bold border-b-2 border-black pb-1">
                        {docType} n.º {invoiceNumber}
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-xs border-b-2 border-black pb-2">
                        <div>
                            <p className="font-bold">Data de emissão</p>
                            <p>{issueDate ? format(issueDate, 'yyyy-MM-dd') : 'N/A'}</p>
                        </div>
                        <div>
                            <p className="font-bold">Contribuinte</p>
                            <p>{clientDetails.nif || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="font-bold">Vencimento</p>
                            <p>{dueDate ? format(dueDate, 'yyyy-MM-dd') : (issueDate ? format(issueDate, 'yyyy-MM-dd') : 'N/A')}</p>
                        </div>
                        <div>
                            <p className="font-bold">V/ Ref.</p>
                        </div>
                    </div>
                    <div className="mt-2 text-xs border-b-2 border-black pb-2 min-h-[40px]">
                        <p className="font-bold">Observações</p>
                        <p>{observations}</p>
                    </div>

                    <div className="my-4">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-100 dark:bg-gray-800 text-xs">
                                    <TableHead className="text-black dark:text-white w-[80px]">Código</TableHead>
                                    <TableHead className="text-black dark:text-white">Descrição</TableHead>
                                    <TableHead className="text-right text-black dark:text-white">Preço Uni.</TableHead>
                                    <TableHead className="text-center text-black dark:text-white">Qtd.</TableHead>
                                    <TableHead className="text-center text-black dark:text-white">Desc. %</TableHead>
                                    <TableHead className="text-right text-black dark:text-white">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="text-xs">
                                {items.map((item) => {
                                    const itemTotal = item.price * item.quantity * (1 - item.discount / 100);
                                    return (
                                    <TableRow key={item.id} className="border-b border-gray-300">
                                        <TableCell></TableCell>
                                        <TableCell className="font-medium">{item.description}</TableCell>
                                        <TableCell className="text-right">{item.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</TableCell>
                                        <TableCell className="text-center">{item.quantity.toFixed(2)}</TableCell>
                                        <TableCell className="text-center">{item.discount.toFixed(2)}%</TableCell>
                                        <TableCell className="text-right font-bold">{itemTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</TableCell>
                                    </TableRow>
                                    );
                                })}
                                 {items.length === 0 && (
                                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum item adicionado.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-between gap-8 mt-8 text-xs">
                        <div className="w-2/3">
                            <h4 className="font-bold border-b border-black">Imposto/IVA</h4>
                            <div className="flex justify-between mt-1">
                                <span>IVA ({ivaRate.toFixed(2)}%)</span>
                                <span>{totals.totalIliquido.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                                <span className="font-bold">{totals.imposto.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                            </div>
                            <div className="mt-4">
                                <h4 className="font-bold border-b border-black">Bens e Serviços</h4>
                                <p className="mt-1">Os bens/serviços foram colocados à disposição do adquirente na data e local do documento</p>
                            </div>
                            <div className="mt-4">
                                <h4 className="font-bold border-b border-black">Dados Bancários</h4>
                                <p className="mt-1 font-semibold">BENEFICIARIO DS ENGENHOSOS COMERC PREST SERV LDA</p>
                                <p>IBAN: 005100003087088015180</p>
                                <p>SWIFT/BIC: BCCBAOLUXXX</p>
                            </div>
                        </div>
                        <div className="w-1/3 p-4 bg-gray-100 dark:bg-gray-800">
                            <h4 className="font-bold text-center border-b border-gray-400 pb-1 mb-2">Sumário</h4>
                            <div className="space-y-1">
                                <div className="flex justify-between"><p>Total ilíquido:</p><p>{totals.totalIliquido.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p></div>
                                <div className="flex justify-between"><p>Desconto:</p><p>{(items.reduce((acc, item) => acc + item.price * item.quantity * (item.discount / 100) ,0)).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p></div>
                                <div className="flex justify-between"><p>Imposto/IVA:</p><p>{totals.imposto.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p></div>
                                {applyRetention && <div className="flex justify-between"><p>Retenção: (6.5%)</p><p>- {totals.retencao.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p></div>}
                                <Separator className="my-2 bg-gray-400" />
                                <div className="flex justify-between font-bold text-sm"><p>Total:</p><p>{totals.total.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p></div>
                            </div>
                        </div>
                    </div>
                    <div className="text-center text-xs mt-8 pt-4 border-t border-black">
                        <p>Processado por computador</p>
                        <p>DS KARGA - Tornando leve a sua Karga</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
