'use client';

import { useState, useMemo } from 'react';
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
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as XLSX from 'xlsx';


const initialTransactions: Transaction[] = [
    { id: '1', date: new Date('2024-07-28'), description: 'Pagamento Fatura #0012 - Cliente A', type: 'receita', category: 'Vendas', amount: 850000 },
    { id: '2', date: new Date('2024-07-25'), description: 'Pagamento de Salários - Julho', type: 'despesa', category: 'Salários', amount: 1200000 },
    { id: '3', date: new Date('2024-07-22'), description: 'Compra de EPIs', type: 'despesa', category: 'Compras', amount: 350000 },
];


export default function CashFlowPage() {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState<'receita' | 'despesa'>('receita');
    
    const [date, setDate] = useState<DateRange | undefined>({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });
    const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all');


    const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
        setTransactions(prev => [...prev, { ...transaction, id: `trans-${Date.now()}` }]);
    };
    
    const openDialog = (type: 'receita' | 'despesa') => {
        setDialogType(type);
        setDialogOpen(true);
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const isInDateRange = date?.from && date?.to ? (transactionDate >= date.from && transactionDate <= date.to) : true;
            const matchesType = filterType === 'all' || t.type === filterType;
            return isInDateRange && matchesType;
        }).sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [transactions, date, filterType]);

    const { totalRevenue, totalExpenses, netResult, balance } = useMemo(() => {
        const revenue = filteredTransactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
        const expenses = filteredTransactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
        return {
            totalRevenue: revenue,
            totalExpenses: expenses,
            netResult: revenue - expenses,
            balance: 1235450.10 + revenue - expenses, // Placeholder base balance
        };
    }, [filteredTransactions]);

     const chartData = useMemo(() => {
        if (!date?.from || !date?.to) return [];
        const interval = eachDayOfInterval({ start: date.from, end: date.to });
        
        return interval.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayTransactions = transactions.filter(t => format(new Date(t.date), 'yyyy-MM-dd') === dayStr);
            return {
                date: format(day, 'dd/MM'),
                revenue: dayTransactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0),
                expenses: dayTransactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0),
            };
        });
    }, [transactions, date]);

    const chartConfig = {
      revenue: { label: "Receitas", color: "hsl(var(--chart-2))" },
      expenses: { label: "Despesas", color: "hsl(var(--chart-4))" },
    } satisfies ChartConfig;

    const downloadXLSX = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredTransactions.map(t => ({
            Data: format(t.date, 'dd/MM/yyyy'),
            Descrição: t.description,
            Tipo: t.type,
            Categoria: t.category,
            Valor: t.amount,
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Fluxo de Caixa');
        XLSX.writeFile(workbook, `Fluxo_de_Caixa_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const handlePrint = () => window.print();

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
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receitas (período)</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalRevenue.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</div>
                <p className="text-xs text-muted-foreground">Total de entradas no período</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas (período)</CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalExpenses.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</div>
                <p className="text-xs text-muted-foreground">Total de saídas no período</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resultado Líquido</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${netResult >= 0 ? 'text-green-600' : 'text-destructive'}`}>{netResult.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</div>
                <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo em Caixa</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{balance.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</div>
                <p className="text-xs text-muted-foreground">Saldo atual estimado</p>
            </CardContent>
        </Card>
      </div>

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
              <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${Number(value) / 1000}k`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area dataKey="expenses" type="natural" fill="var(--color-expenses)" fillOpacity={0.4} stroke="var(--color-expenses)" stackId="a" />
              <Area dataKey="revenue" type="natural" fill="var(--color-revenue)" fillOpacity={0.4} stroke="var(--color-revenue)" stackId="a" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                 <div>
                    <CardTitle className="font-headline">Últimas Transações</CardTitle>
                    <CardDescription>Registo de todas as entradas e saídas de caixa.</CardDescription>
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
                     <Button variant="outline" onClick={downloadXLSX}><Download className="mr-2 h-4 w-4" /> Baixar Excel</Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredTransactions.map((t) => (
                     <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.description}</TableCell>
                        <TableCell>{format(t.date, 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                            <Badge variant={t.type === 'receita' ? 'default' : 'destructive'}>{t.type}</Badge>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{t.category}</Badge></TableCell>
                        <TableCell className={`text-right font-medium ${t.type === 'receita' ? 'text-green-600' : 'text-destructive'}`}>
                            {t.type === 'receita' ? '+' : '-'} {t.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                        </TableCell>
                    </TableRow>
                ))}
                {filteredTransactions.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Nenhuma transação encontrada para os filtros selecionados.</TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} type={dialogType} onSave={addTransaction} />
    </>
  );
}
