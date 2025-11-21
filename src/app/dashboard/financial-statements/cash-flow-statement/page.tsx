
'use client';

import { useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { format } from "date-fns";
import { pt } from 'date-fns/locale';
import { useRouter } from "next/navigation";
import { type Transaction } from "@/components/dashboard/cash-flow/transaction-dialog";
import { getSupabaseClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';

const classifyCategory = (category: string): 'operating' | 'investing' | 'financing' => {
    const c = (category || '').toLowerCase();
    if (c.includes('invest') || c.includes('imobil') || c.includes('aquisi')) return 'investing';
    if (c.includes('financ') || c.includes('empr') || c.includes('loan') || c.includes('capital')) return 'financing';
    return 'operating';
};

const numberFormat = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
};

export default function CashFlowStatementPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        let isMounted = true;
        async function fetchTransactions() {
            try {
                const supabase = getSupabaseClient();
                const { data, error } = await supabase
                    .from('cash_flow_transactions')
                    .select('id, description, amount, type, category, transaction_date')
                    .order('transaction_date', { ascending: false });
                if (error) {
                    if (error.code || error.message) {
                        toast({ title: 'Erro ao carregar transações', description: error.message || error.code, variant: 'destructive' });
                    }
                    if (isMounted) setTransactions([]);
                    return;
                }
                const mapped = (data || []).map((t: any) => ({
                    id: String(t.id),
                    date: t.transaction_date ? new Date(t.transaction_date) : new Date(),
                    description: t.description || 'Transação',
                    type: t.type,
                    category: t.category || 'Geral',
                    amount: Number(t.amount) || 0,
                })) as Transaction[];
                if (isMounted) setTransactions(mapped);
            } catch (err: any) {
                const msg = err?.message || 'Erro inesperado ao carregar transações.';
                toast({ title: 'Erro', description: msg, variant: 'destructive' });
                if (isMounted) setTransactions([]);
            }
        }
        fetchTransactions();
        return () => { isMounted = false; };
    }, []);

    const cashFlowData = useMemo(() => {
        const operating = transactions.filter(t => classifyCategory(t.category) === 'operating');
        const investing = transactions.filter(t => classifyCategory(t.category) === 'investing');
        const financing = transactions.filter(t => classifyCategory(t.category) === 'financing');

        const totalOperating = operating.reduce((acc, t) => acc + (t.type === 'receita' ? t.amount : -t.amount), 0);
        const totalInvesting = investing.reduce((acc, t) => acc + (t.type === 'receita' ? t.amount : -t.amount), 0);
        const totalFinancing = financing.reduce((acc, t) => acc + (t.type === 'receita' ? t.amount : -t.amount), 0);
        const netCashFlow = totalOperating + totalInvesting + totalFinancing;

        return { operating, investing, financing, totalOperating, totalInvesting, totalFinancing, netCashFlow };
    }, [transactions]);

    const renderSection = (title: string, data: Transaction[], total: number) => (
        <>
            <TableRow className="font-semibold bg-muted/30">
                <TableCell colSpan={3}>{title}</TableCell>
            </TableRow>
            {data.map(item => (
                <TableRow key={item.id}>
                    <TableCell className="pl-8">{item.description}</TableCell>
                    <TableCell className="text-right">{item.type === 'receita' ? numberFormat(item.amount) : ''}</TableCell>
                    <TableCell className="text-right">{item.type === 'despesa' ? `(${numberFormat(item.amount)})` : ''}</TableCell>
                </TableRow>
            ))}
            <TableRow>
                <TableCell className="font-bold">Total de {title.toLowerCase()}</TableCell>
                <TableCell colSpan={2} className="text-right font-bold">
                    {numberFormat(total)}
                </TableCell>
            </TableRow>
        </>
    );

    const downloadXLSX = () => {
        const dataToExport = [
            { Categoria: 'Atividades Operacionais', Descrição: '', Entradas: '', Saídas: '' },
            ...cashFlowData.operating.map(item => ({
                Categoria: '',
                Descrição: item.description,
                Entradas: item.type === 'receita' ? item.amount : '',
                Saídas: item.type === 'despesa' ? item.amount : '',
            })),
            { Categoria: 'Total de Atividades Operacionais', Descrição: '', Entradas: cashFlowData.totalOperating, Saídas: '' },
            {},
             { Categoria: 'Aumento/Diminuição Líquida de Caixa', Descrição: '', Entradas: cashFlowData.netCashFlow, Saídas: '' },
        ];
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport, { skipHeader: true });
        XLSX.utils.sheet_add_aoa(worksheet, [['Categoria', 'Descrição', 'Entradas', 'Saídas']], { origin: 'A1' });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Fluxo de Caixa');
        XLSX.writeFile(workbook, `Demonstracao_Fluxo_Caixa_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <DashboardHeader title="Demonstração de Fluxos de Caixa">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retroceder
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button><Download className="mr-2 h-4 w-4" /> Baixar Relatório</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onSelect={downloadXLSX}>Exportar para Excel (.xlsx)</DropdownMenuItem>
                        <DropdownMenuItem onSelect={handlePrint}>Exportar para PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </DashboardHeader>

            <Card className="mt-4 print-this">
                <CardHeader>
                    <CardTitle className="font-headline">Demonstração de Fluxos de Caixa</CardTitle>
                    <CardDescription>Análise das atividades operacionais, de investimento e de financiamento.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-right w-[200px]">Entradas</TableHead>
                                <TableHead className="text-right w-[200px]">Saídas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {renderSection("Atividades Operacionais", cashFlowData.operating, cashFlowData.totalOperating)}
                            {renderSection("Atividades de Investimento", cashFlowData.investing, cashFlowData.totalInvesting)}
                            {renderSection("Atividades de Financiamento", cashFlowData.financing, cashFlowData.totalFinancing)}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="bg-muted/50 hover:bg-muted/50 text-base">
                                <TableCell className="font-headline">Aumento/Diminuição Líquida de Caixa</TableCell>
                                <TableCell colSpan={2} className={`text-right font-headline ${cashFlowData.netCashFlow >= 0 ? 'text-green-600' : 'text-destructive'}`}>{numberFormat(cashFlowData.netCashFlow)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
