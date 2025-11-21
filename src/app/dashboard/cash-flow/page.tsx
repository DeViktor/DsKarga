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
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, ArrowDownCircle, DollarSign, TrendingUp, Filter, Download, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { TransactionDialog, Transaction } from '@/components/dashboard/cash-flow/transaction-dialog';
import { DateRange } from "react-day-picker";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subDays, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from 'xlsx';
import { getSupabaseClient } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';

// Tipos de dados financeiros
interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  category: string;
  date: Date;
  source: 'transactions' | 'billing' | 'journal_entries';
  reference?: string;
  status?: string;
}

interface CashFlowData {
  transactions: FinancialTransaction[];
  totalRevenue: number;
  totalExpenses: number;
  netResult: number;
  currentBalance: number;
  isLoading: boolean;
}

export default function CashFlowPage() {
    const [cashFlowData, setCashFlowData] = useState<CashFlowData>({
        transactions: [],
        totalRevenue: 0,
        totalExpenses: 0,
        netResult: 0,
        currentBalance: 0,
        isLoading: true
    });
    
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState<'receita' | 'despesa'>('receita');
    
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all');

    // Buscar dados de múltiplas fontes
    useEffect(() => {
        let isMounted = true;
        
        async function fetchFinancialData() {
            if (!isMounted) return;
            
            setCashFlowData(prev => ({ ...prev, isLoading: true }));
            
            try {
                const supabase = getSupabaseClient();
                const allTransactions: FinancialTransaction[] = [];
                
                console.log('🔄 Buscando dados financeiros...');
                
                // Test database connectivity first
                try {
                    const { data: testData, error: testError } = await supabase
                        .from('workers')
                        .select('*', { count: 'exact', head: true });
                    
                    if (testError) {
                        console.error('Database connectivity test failed:', testError);
                        if (testError.code === '42501') {
                            toast({
                                title: 'Permissão negada',
                                description: 'Você não tem permissão para acessar o banco de dados.',
                                variant: 'destructive'
                            });
                        }
                    } else {
                        console.log('✅ Database connectivity test passed');
                    }
                } catch (testErr) {
                    console.error('Database connectivity test error:', testErr);
                }
                
                // 1. Buscar transações da tabela cash_flow_transactions
                console.log('📊 Buscando transações...');
                let transactionsData = null;
                let transactionsError = null;
                
                try {
                    const result = await supabase
                        .from('cash_flow_transactions')
                        .select('id, description, amount, type, category, transaction_date, created_at')
                        .order('transaction_date', { ascending: false });
                    
                    transactionsData = result.data;
                    transactionsError = result.error;
                    
                    console.log('✅ Cash flow transactions result:', result);
                } catch (catchError) {
                    console.error('❌ Exception ao buscar cash_flow_transactions:', catchError);
                    transactionsError = catchError;
                }
                
                if (transactionsError) {
                    console.error('Erro ao buscar transações:', transactionsError);
                    console.error('Error details:', JSON.stringify(transactionsError, null, 2));
                    console.error('Error code:', transactionsError.code);
                    console.error('Error message:', transactionsError.message);
                    console.error('Error type:', typeof transactionsError);
                    console.error('Error keys:', Object.keys(transactionsError || {}));
                    
                    // Handle different error types
                    if (transactionsError.code === '42501') {
                        toast({
                            title: 'Permissão negada',
                            description: 'Você não tem permissão para acessar as transações. Contacte o administrador.',
                            variant: 'destructive'
                        });
                    } else if (transactionsError.code === 'PGRST205') {
                        toast({
                            title: 'Tabela não encontrada',
                            description: 'A tabela de transações não existe.',
                            variant: 'destructive'
                        });
                    } else if (!transactionsError.code && !transactionsError.message) {
                        // Handle empty error object - this is the main issue
                        console.error('❌ Empty error object detected - this usually indicates RLS or connection issues');
                        toast({
                            title: 'Erro de conexão',
                            description: 'Não foi possível acessar as transações. Verifique suas permissões de banco de dados.',
                            variant: 'destructive'
                        });
                    }
                } else if (transactionsData && transactionsData.length > 0) {
                    const mappedTransactions = transactionsData.map((t: any) => ({
                        id: `trans-${t.id}`,
                        description: t.description || 'Transação',
                        amount: Number(t.amount) || 0,
                        type: t.type || (Number(t.amount) >= 0 ? 'receita' : 'despesa'),
                        category: t.category || 'Geral',
                        date: t.transaction_date ? new Date(t.transaction_date) : new Date(),
                        source: 'transactions' as const
                    }));
                    allTransactions.push(...mappedTransactions);
                    console.log(`✅ ${mappedTransactions.length} transações encontradas`);
                } else {
                    console.log('ℹ️  Nenhuma transação encontrada na tabela cash_flow_transactions');
                }
                
                // 2. Buscar faturas da tabela billing (como receitas)
                console.log('💰 Buscando faturas...');
                const { data: billingData, error: billingError } = await supabase
                    .from('billing')
                    .select('id, billing_number, total_amount, issue_date, status, client_name')
                    .in('status', ['Emitida', 'Pago', 'Parcialmente Pago'])
                    .order('issue_date', { ascending: false });
                
                if (billingError) {
                    console.error('Erro ao buscar faturas:', billingError);
                    console.error('Billing error details:', JSON.stringify(billingError, null, 2));
                    
                    // Handle permission denied error (RLS)
                    if (billingError.code === '42501') {
                        toast({
                            title: 'Permissão negada',
                            description: 'Você não tem permissão para acessar as faturas.',
                            variant: 'destructive'
                        });
                    } else if (!billingError.code && !billingError.message) {
                        // Handle empty error object - silently continue, billing might not exist
                        console.log('Tabela billing não disponível ou sem permissões');
                    }
                } else if (billingData && billingData.length > 0) {
                    const mappedBilling = billingData.map((b: any) => ({
                        id: `bill-${b.id}`,
                        description: `Fatura ${b.billing_number} - ${b.client_name || 'Cliente'}`,
                        amount: Number(b.total_amount) || 0,
                        type: 'receita' as const,
                        category: 'Faturamento',
                        date: b.issue_date ? new Date(b.issue_date) : new Date(),
                        source: 'billing' as const,
                        reference: b.billing_number,
                        status: b.status
                    }));
                    allTransactions.push(...mappedBilling);
                    console.log(`✅ ${mappedBilling.length} faturas encontradas`);
                }
                
                // 3. Buscar lançamentos contábeis da tabela journal_entries
                console.log('📒 Buscando lançamentos contábeis...');
                const { data: journalData, error: journalError } = await supabase
                    .from('journal_entries')
                    .select('id, description, amount, entry_date')
                    .order('entry_date', { ascending: false });
                
                if (journalError) {
                    if (journalError.code || journalError.message) {
                        console.error('Erro ao buscar lançamentos:', journalError);
                        console.error('Journal error details:', JSON.stringify(journalError, null, 2));
                        
                        if (journalError.code === '42501') {
                            toast({
                                title: 'Permissão negada',
                                description: 'Você não tem permissão para acessar os lançamentos contábeis.',
                                variant: 'destructive'
                            });
                        }
                    } else {
                        console.warn('Tabela journal_entries não disponível ou sem permissões');
                    }
                } else if (journalData && journalData.length > 0) {
                    const mappedJournal = journalData.map((j: any) => ({
                        id: `journal-${j.id}`,
                        description: j.description || 'Lançamento Contábil',
                        amount: Number(j.amount) || 0,
                        type: Number(j.amount) >= 0 ? 'receita' : 'despesa',
                        category: 'Contabilidade',
                        date: j.entry_date ? new Date(j.entry_date) : new Date(),
                        source: 'journal_entries' as const
                    }));
                    allTransactions.push(...mappedJournal);
                    console.log(`✅ ${mappedJournal.length} lançamentos encontrados`);
                }
                
                console.log(`📈 Total de transações financeiras: ${allTransactions.length}`);
                
                // If no data was loaded from any source, provide fallback sample data
                if (allTransactions.length === 0) {
                    console.warn('⚠️ Nenhuma transação foi carregada de nenhuma fonte - usando dados de exemplo');
                    
                    // Fallback sample data for demonstration
                    const sampleData: FinancialTransaction[] = [
                        {
                            id: 'sample-1',
                            description: 'Venda de Serviços - Consultoria',
                            amount: 5000,
                            type: 'receita',
                            category: 'Serviços',
                            date: new Date(2024, 10, 15),
                            source: 'transactions'
                        },
                        {
                            id: 'sample-2',
                            description: 'Compra de Material de Escritório',
                            amount: 850,
                            type: 'despesa',
                            category: 'Material',
                            date: new Date(2024, 10, 14),
                            source: 'transactions'
                        },
                        {
                            id: 'sample-3',
                            description: 'Pagamento de Salários',
                            amount: 12000,
                            type: 'despesa',
                            category: 'Pessoal',
                            date: new Date(2024, 10, 10),
                            source: 'transactions'
                        },
                        {
                            id: 'sample-4',
                            description: 'Recebimento de Cliente - Projeto Alpha',
                            amount: 8000,
                            type: 'receita',
                            category: 'Projetos',
                            date: new Date(2024, 10, 8),
                            source: 'transactions'
                        },
                        {
                            id: 'sample-5',
                            description: 'Aluguel do Escritório',
                            amount: 2500,
                            type: 'despesa',
                            category: 'Operacional',
                            date: new Date(2024, 10, 5),
                            source: 'transactions'
                        }
                    ];
                    
                    allTransactions.push(...sampleData);
                    
                    toast({
                        title: 'Modo de demonstração',
                        description: 'Exibindo dados de exemplo. Adicione transações reais para ver seus dados.',
                        variant: 'default'
                    });
                }
                
                // Calcular totais
                const totalRevenue = allTransactions
                    .filter(t => t.type === 'receita')
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                const totalExpenses = allTransactions
                    .filter(t => t.type === 'despesa')
                    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                
                const netResult = totalRevenue - totalExpenses;
                
                // Calcular saldo atual (considerando um saldo inicial)
                const initialBalance = 1235450.10; // Saldo inicial do código original
                const currentBalance = initialBalance + netResult;
                
                if (isMounted) {
                    setCashFlowData({
                        transactions: allTransactions,
                        totalRevenue,
                        totalExpenses,
                        netResult,
                        currentBalance,
                        isLoading: false
                    });
                }
                
            } catch (error) {
                console.error('❌ Erro ao buscar dados financeiros:', error);
                console.error('Error details:', JSON.stringify(error, null, 2));
                
                // Handle empty error object
                if (error && typeof error === 'object' && !error.code && !error.message) {
                    toast({
                        title: 'Erro de conexão',
                        description: 'Não foi possível conectar ao banco de dados. Verifique sua conexão com o Supabase.',
                        variant: 'destructive'
                    });
                } else {
                    toast({
                        title: 'Erro ao carregar dados',
                        description: 'Não foi possível carregar os dados financeiros.',
                        variant: 'destructive'
                    });
                }
                
                if (isMounted) {
                    setCashFlowData({
                        transactions: [],
                        totalRevenue: 0,
                        totalExpenses: 0,
                        netResult: 0,
                        currentBalance: 1235450.10,
                        isLoading: false
                    });
                }
            }
        }
        
        fetchFinancialData();
        
        return () => { 
            isMounted = false; 
        };
    }, []);

    // Adicionar nova transação
    const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        try {
            const supabase = getSupabaseClient();
            
            // Inserir na tabela transactions
            const { data: insertedData, error } = await supabase
                .from('cash_flow_transactions')
                .insert({
                    description: transaction.description,
                    amount: transaction.amount,
                    type: transaction.type,
                    category: transaction.category,
                    transaction_date: transaction.date.toISOString(),
                    created_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (error) {
                console.error('Erro ao inserir transação:', error);
                console.error('Error details:', JSON.stringify(error, null, 2));
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                
                // Handle permission denied error (RLS)
                if (error.code === '42501') {
                    toast({
                        title: 'Permissão negada',
                        description: 'Você não tem permissão para criar transações. Contacte o administrador.',
                        variant: 'destructive'
                    });
                    return;
                } else if (error.code === 'PGRST205') {
                    toast({
                        title: 'Tabela não encontrada',
                        description: 'A tabela de transações não existe.',
                        variant: 'destructive'
                    });
                    return;
                } else if (error.code === '23502') {
                    // Not null constraint violation
                    const columnName = error.details?.match(/column "([^"]+)"/)?.[1] || 'campo desconhecido';
                    toast({
                        title: 'Erro de validação',
                        description: `O campo "${columnName}" é obrigatório.`,
                        variant: 'destructive'
                    });
                    return;
                } else if (!error.code && !error.message) {
                    // Handle empty error object
                    toast({
                        title: 'Erro desconhecido',
                        description: 'Não foi possível adicionar a transação. Tente novamente.',
                        variant: 'destructive'
                    });
                    return;
                }
                
                throw error;
            }
            
            // Adicionar localmente
            const newTransaction: FinancialTransaction = {
                id: `trans-${insertedData.id}`,
                description: insertedData.description,
                amount: Number(insertedData.amount),
                type: insertedData.type,
                category: insertedData.category,
                date: new Date(insertedData.transaction_date),
                source: 'transactions'
            };
            
            setCashFlowData(prev => {
                const updatedTransactions = [newTransaction, ...prev.transactions];
                const totalRevenue = updatedTransactions
                    .filter(t => t.type === 'receita')
                    .reduce((sum, t) => sum + t.amount, 0);
                const totalExpenses = updatedTransactions
                    .filter(t => t.type === 'despesa')
                    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                const netResult = totalRevenue - totalExpenses;
                const initialBalance = 1235450.10;
                const currentBalance = initialBalance + netResult;
                
                return {
                    ...prev,
                    transactions: updatedTransactions,
                    totalRevenue,
                    totalExpenses,
                    netResult,
                    currentBalance
                };
            });
            
            toast({
                title: 'Sucesso',
                description: `${transaction.type === 'receita' ? 'Receita' : 'Despesa'} adicionada com sucesso.`,
            });
            
        } catch (err) {
            console.error('Erro ao adicionar transação:', err);
            console.error('Error details:', JSON.stringify(err, null, 2));
            
            // Only show generic error if we haven't already handled specific cases
            if (err && typeof err === 'object' && !err.code && !err.message) {
                toast({
                    title: 'Erro de conexão',
                    description: 'Não foi possível conectar ao banco de dados. Verifique sua conexão.',
                    variant: 'destructive'
                });
            } else if (!toast.title) {
                toast({
                    title: 'Erro',
                    description: 'Não foi possível adicionar a transação.',
                    variant: 'destructive'
                });
            }
        }
    };

    const openDialog = (type: 'receita' | 'despesa') => {
        setDialogType(type);
        setDialogOpen(true);
    };

    // Filtrar transações por data e tipo
    const filteredTransactions = useMemo(() => {
        return cashFlowData.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const isInDateRange = date?.from && date?.to ? 
                (transactionDate >= date.from && transactionDate <= date.to) : true;
            const matchesType = filterType === 'all' || t.type === filterType;
            return isInDateRange && matchesType;
        }).sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [cashFlowData.transactions, date, filterType]);

    // Dados para o gráfico
    const chartData = useMemo(() => {
        if (!date?.from || !date?.to) return [];
        const interval = eachDayOfInterval({ start: date.from, end: date.to });
        
        return interval.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayTransactions = filteredTransactions.filter(t => 
                format(new Date(t.date), 'yyyy-MM-dd') === dayStr
            );
            return {
                date: format(day, 'dd/MM'),
                revenue: dayTransactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0),
                expenses: dayTransactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + Math.abs(t.amount), 0),
            };
        });
    }, [filteredTransactions, date]);

    const chartConfig = {
        revenue: { label: "Receitas", color: "hsl(var(--chart-2))" },
        expenses: { label: "Despesas", color: "hsl(var(--chart-4))" },
    } satisfies ChartConfig;

    // Exportar para Excel
    const downloadXLSX = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredTransactions.map(t => ({
            Data: format(t.date, 'dd/MM/yyyy'),
            Descrição: t.description,
            Tipo: t.type === 'receita' ? 'Receita' : 'Despesa',
            Categoria: t.category,
            Valor: t.amount,
            Fonte: t.source,
            Referência: t.reference || '',
            Status: t.status || ''
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Fluxo de Caixa');
        XLSX.writeFile(workbook, `Fluxo_de_Caixa_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const handlePrint = () => window.print();

    // Mostrar loading enquanto busca dados
    if (cashFlowData.isLoading) {
        return (
            <>
                <DashboardHeader title="Fluxo de Caixa">
                    <Button variant="outline" disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
                    </Button>
                </DashboardHeader>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Carregando dados financeiros...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <DashboardHeader title="Fluxo de Caixa">
                <Button variant="outline" onClick={() => openDialog('despesa')}>
                    <ArrowDownCircle className="mr-2 h-4 w-4" /> Nova Despesa
                </Button>
                <Button onClick={() => openDialog('receita')}>
                    <ArrowUpCircle className="mr-2 h-4 w-4" /> Nova Receita
                </Button>
            </DashboardHeader>
            
            {/* Cards de Resumo */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receitas (período)</CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {cashFlowData.totalRevenue.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {filteredTransactions.filter(t => t.type === 'receita').length} receitas no período
                        </p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Despesas (período)</CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                            {cashFlowData.totalExpenses.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {filteredTransactions.filter(t => t.type === 'despesa').length} despesas no período
                        </p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resultado Líquido</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${cashFlowData.netResult >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {cashFlowData.netResult.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {cashFlowData.netResult >= 0 ? 'Lucro' : 'Prejuízo'} no período
                        </p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo em Caixa</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${cashFlowData.currentBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {cashFlowData.currentBalance.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Saldo atual estimado
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Gráfico de Evolução */}
            {chartData.length > 0 && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="font-headline">Evolução do Fluxo de Caixa</CardTitle>
                        <CardDescription>Análise de receitas e despesas ao longo do tempo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                            <AreaChart data={chartData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                <YAxis 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickMargin={8} 
                                    tickFormatter={(value) => `${Number(value) / 1000}k`} 
                                />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area 
                                    dataKey="expenses" 
                                    type="natural" 
                                    fill="var(--color-expenses)" 
                                    fillOpacity={0.4} 
                                    stroke="var(--color-expenses)" 
                                    stackId="a" 
                                />
                                <Area 
                                    dataKey="revenue" 
                                    type="natural" 
                                    fill="var(--color-revenue)" 
                                    fillOpacity={0.4} 
                                    stroke="var(--color-revenue)" 
                                    stackId="a" 
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            )}

            {/* Tabela de Transações */}
            <Card>
                <CardHeader>
                    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                        <div>
                            <CardTitle className="font-headline">Últimas Transações</CardTitle>
                            <CardDescription>
                                Registo de todas as entradas e saídas de caixa ({filteredTransactions.length} transações)
                            </CardDescription>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button id="date" variant={"outline"} className={cn( "w-[260px] justify-start text-left font-normal", !date && "text-muted-foreground" )}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? ( date.to ? ( <>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</> ) : ( format(date.from, "LLL dd, y") ) ) : ( <span>Selecione uma data</span> )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2}/>
                                </PopoverContent>
                            </Popover>
                            <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
                                <SelectTrigger className='w-[180px]'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='all'>Todas as Transações</SelectItem>
                                    <SelectItem value='receita'>Apenas Receitas</SelectItem>
                                    <SelectItem value='despesa'>Apenas Despesas</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={downloadXLSX}>
                                <Download className="mr-2 h-4 w-4" /> Baixar Excel
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Nenhuma transação encontrada para os filtros selecionados.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Fonte</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-medium">{t.description}</TableCell>
                                        <TableCell>{format(t.date, 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>
                                            <Badge variant={t.type === 'receita' ? 'default' : 'destructive'}>
                                                {t.type === 'receita' ? 'Receita' : 'Despesa'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{t.category}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{t.source}</Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-medium ${t.type === 'receita' ? 'text-green-600' : 'text-destructive'}`}>
                                            {t.type === 'receita' ? '+' : '-'} {t.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            
            <TransactionDialog 
                open={dialogOpen} 
                onOpenChange={setDialogOpen} 
                type={dialogType} 
                onSave={addTransaction} 
            />
        </>
    );
}