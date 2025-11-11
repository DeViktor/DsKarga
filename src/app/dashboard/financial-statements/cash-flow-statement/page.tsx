
'use client';

import { useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { format } from "date-fns";
import { pt } from 'date-fns/locale';
import { useRouter } from "next/navigation";
import { type Transaction } from "@/components/dashboard/cash-flow/transaction-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';

const initialTransactions: Transaction[] = [
    { id: '1', date: new Date('2024-07-28'), description: 'Pagamento Fatura #0012 - Cliente A', type: 'receita', category: 'Vendas', amount: 850000 },
    { id: '2', date: new Date('2024-07-25'), description: 'Pagamento de Salários - Julho', type: 'despesa', category: 'Salários', amount: 1200000 },
    { id: '3', date: new Date('2024-07-22'), description: 'Compra de EPIs', type: 'despesa', category: 'Compras', amount: 350000 },
];

const numberFormat = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
};

export default function CashFlowStatementPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

    const cashFlowData = useMemo(() => {
        const operating = transactions.filter(t => ['Vendas', 'Salários', 'Compras'].includes(t.category));
        const investing: Transaction[] = []; // Adicionar lógica se houver categorias de investimento
        const financing: Transaction[] = []; // Adicionar lógica se houver categorias de financiamento

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
