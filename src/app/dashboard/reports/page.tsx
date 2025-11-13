

'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Calendar as CalendarIcon, Download, FileText, PieChart, TrendingUp, Users, Shield, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { pt } from "date-fns/locale";
import * as XLSX from 'xlsx';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import { ReportsPrintLayout } from '@/components/dashboard/reports-print-layout';

import { useWorkers } from '@/hooks/use-workers';
import { useServices } from '@/hooks/use-services';
import { useEpiItems } from '@/hooks/use-epis';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { type PurchaseOrder } from '@/firebase/firestore/purchasing';
import { type Transaction } from '@/components/dashboard/cash-flow/transaction-dialog';
import { getSupabaseClient } from '@/lib/supabase/client';

// Transações reais do Supabase
function useTransactions(date: DateRange | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    let isMounted = true;
    async function fetchTransactions() {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        const from = date?.from ? new Date(date.from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const to = date?.to ? new Date(date.to) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .gte('date', from.toISOString())
          .lte('date', to.toISOString());
        if (error) throw error;
        const normalized = (data || []).map((t: any) => ({
          id: t.id,
          date: t.date ? new Date(t.date) : new Date(),
          description: t.description,
          type: t.type,
          category: t.category,
          amount: Number(t.amount) || 0,
        })) as Transaction[];
        if (isMounted) setTransactions(normalized);
      } catch (err) {
        console.error('Erro ao carregar transações do Supabase', err);
        if (isMounted) setTransactions([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchTransactions();
    return () => { isMounted = false; };
  }, [date?.from?.toString(), date?.to?.toString()]);
  return { transactions, loading };
}


type ReportData = { Categoria: string, Valor: string | number }[];
type MultiReportData = { title: string, data: ReportData };

function downloadXLSX(data: ReportData, filename: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

function downloadGeneralXLSX(allData: Record<string, ReportData>) {
    const workbook = XLSX.utils.book_new();
    
    Object.entries(allData).forEach(([key, data]) => {
        const title = key.charAt(0).toUpperCase() + key.slice(1);
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, title);
    });

    const filename = `Relatorio_Geral_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, filename);
}

export default function ReportsPage() {
    const firestore = useFirestore();
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: addDays(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 0),
    });

    const [printData, setPrintData] = useState<{title: string; data: ReportData | MultiReportData[]} | null>(null);

    // Fetching data from hooks
    const { workers, loading: workersLoading } = useWorkers();
    const { services, loading: servicesLoading } = useServices();
    const { epis, loading: episLoading } = useEpiItems();
    
    const poQuery = useMemo(() => firestore ? query(collection(firestore, 'purchase-orders')) : null, [firestore]);
    const { data: purchaseOrders, loading: poLoading } = useCollection<PurchaseOrder>(poQuery);

    const { transactions, loading: transactionsLoading } = useTransactions(date);

    const loading = workersLoading || servicesLoading || episLoading || poLoading || transactionsLoading;

    const reportData = useMemo(() => {
        const totalFaturado = transactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
        const totalDespesas = transactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
        const lucroBruto = totalFaturado - totalDespesas;
        
        const trabalhadoresAtivos = workers.filter(w => w.contractStatus === 'Ativo').length;
        const totalSalarios = workers.reduce((sum, w) => sum + w.baseSalary, 0);

        const servicosPendentes = services?.filter(s => s.status === 'Pendente').length || 0;
        const servicosAprovados = services?.filter(s => s.status === 'Aprovado' || s.status === 'Ativo').length || 0;
        const servicosRejeitados = services?.filter(s => s.status === 'Rejeitado').length || 0;

        const ordensEmitidas = purchaseOrders?.length || 0;
        const valorGasto = 0; // This would require more data from purchase orders

        const itensStockBaixo = epis.filter(e => e.quantity > 0 && e.quantity <= e.lowStockThreshold).length;
        const itensForaStock = epis.filter(e => e.quantity === 0).length;
        const valorInventario = 0; // This would require price data per item

        return {
            finance: [
                { Categoria: 'Total Faturado', Valor: totalFaturado },
                { Categoria: 'Total Despesas', Valor: totalDespesas },
                { Categoria: 'Lucro Bruto', Valor: lucroBruto },
            ],
            rh: [
                { Categoria: 'Trabalhadores Ativos', Valor: trabalhadoresAtivos },
                { Categoria: 'Taxa de Assiduidade Média (%)', Valor: '98.5' }, // Mocked
                { Categoria: 'Total Salários Processados', Valor: totalSalarios },
            ],
            services: [
                { Categoria: 'Requisições Totais', Valor: services?.length || 0 },
                { Categoria: 'Aprovadas / Ativas', Valor: servicosAprovados },
                { Categoria: 'Pendentes', Valor: servicosPendentes },
                { Categoria: 'Rejeitadas', Valor: servicosRejeitados },
            ],
            purchasing: [
                { Categoria: 'Ordens de Compra Emitidas', Valor: ordensEmitidas },
                { Categoria: 'Valor Total Gasto', Valor: valorGasto },
                { Categoria: 'Principal Fornecedor', Valor: 'N/A' }, // Needs more logic
            ],
            inventory: [
                { Categoria: 'Itens em Stock Baixo', Valor: itensStockBaixo },
                { Categoria: 'Itens Fora de Stock', Valor: itensForaStock },
                { Categoria: 'Valor Total do Inventário', Valor: valorInventario },
            ],
        };
    }, [workers, services, purchaseOrders, epis, transactions]);


    const handlePrint = (title: string, data: ReportData) => {
        setPrintData({ title, data });
    };
    
    const handlePrintGeneral = () => {
        const allReportsData: MultiReportData[] = Object.entries(reportData).map(([key, data]) => ({
            title: `Relatório de ${key.charAt(0).toUpperCase() + key.slice(1)}`,
            data: data
        }));
        setPrintData({ title: 'Relatório Geral', data: allReportsData });
    }
    
    useEffect(() => {
        if (printData) {
            const timer = setTimeout(() => {
                window.print();
                setPrintData(null);
            }, 100); // Small delay to allow React to render the print layout

            return () => clearTimeout(timer);
        }
    }, [printData]);

    if (printData) {
        return <ReportsPrintLayout title={printData.title} dateRange={date} data={printData.data} />;
    }

  return (
    <>
      <DashboardHeader title="Relatórios Avançados">
        <div className='flex items-center gap-2'>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                    id="date"
                    variant={"outline"}
                    className="w-[300px] justify-start text-left font-normal"
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                        date.to ? (
                        <>
                            {format(date.from, "LLL dd, y", { locale: pt })} -{" "}
                            {format(date.to, "LLL dd, y", { locale: pt })}
                        </>
                        ) : (
                        format(date.from, "LLL dd, y")
                        )
                    ) : (
                        <span>Selecione uma data</span>
                    )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    locale={pt}
                    />
                </PopoverContent>
            </Popover>
            <Select defaultValue='all'>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por Área" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas as Áreas</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="rh">Recursos Humanos</SelectItem>
                    <SelectItem value="servicos">Serviços</SelectItem>
                    <SelectItem value="compras">Compras</SelectItem>
                </SelectContent>
            </Select>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button><Download className="mr-2 h-4 w-4" /> Baixar Relatório Geral</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => downloadGeneralXLSX(reportData)}>Exportar para Excel (.xlsx)</DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePrintGeneral}>Exportar para PDF</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </DashboardHeader>

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-muted-foreground" /></div>
      ) : (
      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader>
                <div className='flex items-start justify-between'>
                    <div>
                        <CardTitle className="font-headline text-lg flex items-center gap-2"><TrendingUp/> Relatório Financeiro</CardTitle>
                        <CardDescription>Faturação, despesas e lucros.</CardDescription>
                    </div>
                    <FileText className='h-6 w-6 text-muted-foreground'/>
                </div>
            </CardHeader>
            <CardContent className='text-sm space-y-2'>
                {reportData.finance.map(item => (
                    <div key={item.Categoria} className='flex justify-between'>
                        <span className='text-muted-foreground'>{item.Categoria}:</span> 
                        <span className='font-bold'>{typeof item.Valor === 'number' ? item.Valor.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }) : item.Valor}</span>
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full"><Download className="mr-2 h-4 w-4" /> Exportar</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => downloadXLSX(reportData.finance, 'relatorio_financeiro')}>Exportar para Excel (.xlsx)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrint('Relatório Financeiro', reportData.finance)}>Exportar para PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
         <Card>
            <CardHeader>
                 <div className='flex items-start justify-between'>
                    <div>
                        <CardTitle className="font-headline text-lg flex items-center gap-2"><Users/> Relatório de RH</CardTitle>
                        <CardDescription>Assiduidade, salários e pessoal.</CardDescription>
                    </div>
                    <FileText className='h-6 w-6 text-muted-foreground'/>
                </div>
            </CardHeader>
            <CardContent className='text-sm space-y-2'>
                 {reportData.rh.map(item => (
                    <div key={item.Categoria} className='flex justify-between'>
                        <span className='text-muted-foreground'>{item.Categoria}:</span> 
                        <span className='font-bold'>{typeof item.Valor === 'number' ? item.Valor.toLocaleString('pt-AO', { style: item.Categoria.includes('Salários') ? 'currency' : 'decimal', currency: 'AOA' }) : item.Valor}</span>
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full"><Download className="mr-2 h-4 w-4" /> Exportar</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => downloadXLSX(reportData.rh, 'relatorio_rh')}>Exportar para Excel (.xlsx)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrint('Relatório de RH', reportData.rh)}>Exportar para PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
        <Card>
            <CardHeader>
                 <div className='flex items-start justify-between'>
                    <div>
                        <CardTitle className="font-headline text-lg flex items-center gap-2"><BarChart/> Relatório de Serviços</CardTitle>
                        <CardDescription>Análise de requisições de serviço.</CardDescription>
                    </div>
                    <FileText className='h-6 w-6 text-muted-foreground'/>
                </div>
            </CardHeader>
            <CardContent className='text-sm space-y-2'>
                {reportData.services.map(item => (
                    <div key={item.Categoria} className='flex justify-between'>
                        <span className='text-muted-foreground'>{item.Categoria}:</span> 
                        <span className='font-bold'>{item.Valor}</span>
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full"><Download className="mr-2 h-4 w-4" /> Exportar</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => downloadXLSX(reportData.services, 'relatorio_servicos')}>Exportar para Excel (.xlsx)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrint('Relatório de Serviços', reportData.services)}>Exportar para PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
         <Card>
            <CardHeader>
                 <div className='flex items-start justify-between'>
                    <div>
                        <CardTitle className="font-headline text-lg flex items-center gap-2"><PieChart/> Relatório de Compras</CardTitle>
                        <CardDescription>Análise de ordens de compra.</CardDescription>
                    </div>
                    <FileText className='h-6 w-6 text-muted-foreground'/>
                </div>
            </CardHeader>
            <CardContent className='text-sm space-y-2'>
                {reportData.purchasing.map(item => (
                    <div key={item.Categoria} className='flex justify-between'>
                        <span className='text-muted-foreground'>{item.Categoria}:</span> 
                        <span className='font-bold'>{typeof item.Valor === 'number' ? item.Valor.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }) : item.Valor}</span>
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full"><Download className="mr-2 h-4 w-4" /> Exportar</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => downloadXLSX(reportData.purchasing, 'relatorio_compras')}>Exportar para Excel (.xlsx)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrint('Relatório de Compras', reportData.purchasing)}>Exportar para PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
         <Card>
            <CardHeader>
                 <div className='flex items-start justify-between'>
                    <div>
                        <CardTitle className="font-headline text-lg flex items-center gap-2"><Shield/> Relatório de Inventário</CardTitle>
                        <CardDescription>Análise de stock de EPIs.</CardDescription>
                    </div>
                    <FileText className='h-6 w-6 text-muted-foreground'/>
                </div>
            </CardHeader>
            <CardContent className='text-sm space-y-2'>
                {reportData.inventory.map(item => (
                    <div key={item.Categoria} className='flex justify-between'>
                        <span className='text-muted-foreground'>{item.Categoria}:</span> 
                        <span className='font-bold'>{typeof item.Valor === 'number' ? item.Valor.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }) : item.Valor}</span>
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full"><Download className="mr-2 h-4 w-4" /> Exportar</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => downloadXLSX(reportData.inventory, 'relatorio_inventario')}>Exportar para Excel (.xlsx)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrint('Relatório de Inventário', reportData.inventory)}>Exportar para PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
      </div>
    )}
    </>
  );
}
