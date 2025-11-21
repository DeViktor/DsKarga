
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
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, Loader2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter
  } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';
import { format } from "date-fns";
import { pt } from 'date-fns/locale';
import { useRouter } from "next/navigation";
import { pgcAccounts, type PGCAccount } from '@/lib/pgc-data';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface JournalEntryLine {
    accountId: string;
    accountName: string;
    debit: number;
    credit: number;
}

interface JournalEntry {
    id: string;
    date: Date;
    description: string;
    documentRef?: string;
    lines: JournalEntryLine[];
}

const numberFormat = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
    }).format(value);
};

export default function IncomeStatementPage() {
    const router = useRouter();
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [accounts, setAccounts] = useState<PGCAccount[]>(pgcAccounts);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        let isMounted = true;
        async function fetchJournal() {
            setLoading(true);
            try {
                const supabase = getSupabaseClient();
                const { data: entriesData, error: entriesError } = await supabase
                    .from('journal_entries')
                    .select('*, journal_entry_lines(*)')
                    .order('created_at', { ascending: false });

                let normalized: JournalEntry[] = [];

                if (!entriesError && Array.isArray(entriesData)) {
                    normalized = entriesData.map((e: any) => {
                        const dateStr = e.entry_date ?? e.date ?? e.created_at;
                        const linesSrc: any[] = Array.isArray(e.journal_entry_lines) ? e.journal_entry_lines : [];
                        const lines: JournalEntryLine[] = linesSrc.map((l: any) => ({
                            accountId: String(l.account_id ?? l.account_code ?? l.account ?? ''),
                            accountName: String(l.account_name ?? ''),
                            debit: Number(l.debit ?? 0),
                            credit: Number(l.credit ?? 0),
                        }));
                        return {
                            id: String(e.id),
                            date: dateStr ? new Date(dateStr) : new Date(),
                            description: e.description ?? '',
                            documentRef: e.document_ref ?? '',
                            lines,
                        } as JournalEntry;
                    });
                } else {
                    const { data: entriesData2, error: entriesError2 } = await supabase
                        .from('journal_entries')
                        .select('*')
                        .order('created_at', { ascending: false });
                    if (entriesError2) {
                        const msg = entriesError2.message || entriesError2.code || 'Falha ao carregar lançamentos.';
                        toast({ title: 'Erro ao carregar lançamentos', description: msg, variant: 'destructive' });
                        return;
                    }
                    const base = (Array.isArray(entriesData2) ? entriesData2 : []).map((e: any) => {
                        const dateStr = e.entry_date ?? e.date ?? e.created_at;
                        return {
                            id: String(e.id),
                            date: dateStr ? new Date(dateStr) : new Date(),
                            description: e.description ?? '',
                            documentRef: e.document_ref ?? '',
                            lines: [],
                        } as JournalEntry;
                    });

                    const { data: linesData, error: linesError } = await supabase
                        .from('journal_entry_lines')
                        .select('*');
                    if (linesError) {
                        const msg = linesError.message || linesError.code || 'Falha ao carregar linhas.';
                        toast({ title: 'Erro ao carregar linhas', description: msg, variant: 'destructive' });
                        normalized = base;
                    } else {
                        const byEntry: Record<string, JournalEntryLine[]> = {};
                        for (const l of Array.isArray(linesData) ? linesData : []) {
                            const parentId = String(l.entry_id ?? l.journal_entry_id ?? '');
                            if (!parentId) continue;
                            const line: JournalEntryLine = {
                                accountId: String(l.account_id ?? l.account_code ?? l.account ?? ''),
                                accountName: String(l.account_name ?? ''),
                                debit: Number(l.debit ?? 0),
                                credit: Number(l.credit ?? 0),
                            };
                            byEntry[parentId] = byEntry[parentId] || [];
                            byEntry[parentId].push(line);
                        }
                        normalized = base.map(n => ({ ...n, lines: byEntry[String(n.id)] || [] }));
                    }
                }

                if (isMounted) setJournalEntries(normalized);
            } catch (err: any) {
                const msg = err?.message || 'Erro inesperado ao carregar lançamentos.';
                toast({ title: 'Erro', description: msg, variant: 'destructive' });
                if (isMounted) setJournalEntries([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchJournal();
        return () => { isMounted = false; };
    }, []);

    const incomeStatementData = useMemo(() => {
        if (!journalEntries) return null;

        const balances: { [key: string]: number } = {};
        journalEntries.forEach(entry => {
            entry.lines.forEach(line => {
                if (!balances[line.accountId]) {
                    balances[line.accountId] = 0;
                }
                balances[line.accountId] += (line.debit || 0) - (line.credit || 0);
            });
        });
        
        const revenue: { account: string; value: number }[] = [];
        const expenses: { account: string; value: number }[] = [];

        accounts.forEach(account => {
            const balance = balances[account.code] || 0;
            if (balance === 0) return;

            if (account.class.includes('Proveitos')) {
                revenue.push({ account: account.name, value: -balance });
            } else if (account.class.includes('Custos')) {
                expenses.push({ account: account.name, value: balance });
            }
        });
        
        return { revenue, expenses };
    }, [journalEntries, accounts]);
    
    const isLoading = loading;

    const totalRevenue = incomeStatementData?.revenue.reduce((sum, item) => sum + item.value, 0) || 0;
    const totalExpenses = incomeStatementData?.expenses.reduce((sum, item) => sum + item.value, 0) || 0;
    const netIncome = totalRevenue - totalExpenses;

    const downloadXLSX = () => {
        if (!incomeStatementData) return;
        const worksheet = XLSX.utils.json_to_sheet([
            { Grupo: 'Proveitos', 'Sub-Grupo': '', Valor: '' },
            ...incomeStatementData.revenue.map(i => ({ Grupo: '', 'Sub-Grupo': i.account, Valor: i.value })),
            { Grupo: 'Total de Proveitos', 'Sub-Grupo': '', Valor: totalRevenue },
            {},
            { Grupo: 'Custos', 'Sub-Grupo': '', Valor: '' },
            ...incomeStatementData.expenses.map(i => ({ Grupo: '', 'Sub-Grupo': i.account, Valor: i.value })),
            { Grupo: 'Total de Custos', 'Sub-Grupo': '', Valor: totalExpenses },
            {},
            { Grupo: 'Resultado Líquido do Período', 'Sub-Grupo': '', Valor: netIncome },
        ]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Demonstração de Resultados');
        XLSX.writeFile(workbook, `Demonstracao_Resultados_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    }

    const handlePrint = () => {
        window.print();
    }

  return (
    <>
        <DashboardHeader title="Demonstração de Resultados">
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

        <div className="print-only">
             {/* Print layout would go here, for now it just prints the card */}
        </div>

        <Card className="mt-4 print-this">
            <CardHeader>
                <CardTitle className="font-headline">Demonstração de Resultados</CardTitle>
                <CardDescription>Desempenho financeiro para o período atual</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-96">
                        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                    </div>
                ) : !incomeStatementData || journalEntries?.length === 0 ? (
                     <div className="text-center text-muted-foreground py-16">
                        <p>Não existem dados suficientes para gerar o relatório.</p>
                        <p className="text-sm">Por favor, adicione lançamentos no Livro Diário.</p>
                    </div>
                ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow className="font-semibold bg-muted/30"><TableCell>Proveitos</TableCell><TableCell></TableCell></TableRow>
                         {incomeStatementData.revenue.map(item => (
                            <TableRow key={item.account}><TableCell className="pl-8">{item.account}</TableCell><TableCell className="text-right">{numberFormat(item.value)}</TableCell></TableRow>
                        ))}
                        <TableRow className="font-semibold"><TableCell>Total de Proveitos</TableCell><TableCell className="text-right">{numberFormat(totalRevenue)}</TableCell></TableRow>
                        
                        <TableRow className="font-semibold bg-muted/30"><TableCell>Custos</TableCell><TableCell></TableCell></TableRow>
                         {incomeStatementData.expenses.map(item => (
                            <TableRow key={item.account}><TableCell className="pl-8">{item.account}</TableCell><TableCell className="text-right text-destructive">({numberFormat(item.value)})</TableCell></TableRow>
                        ))}
                        <TableRow className="font-semibold"><TableCell>Total de Custos</TableCell><TableCell className="text-right text-destructive">({numberFormat(totalExpenses)})</TableCell></TableRow>
                    </TableBody>
                    <TableFooter>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableCell className="font-headline text-lg">Resultado Líquido do Período</TableCell>
                            <TableCell className={`text-right font-headline text-lg ${netIncome >= 0 ? 'text-green-600' : 'text-destructive'}`}>{numberFormat(netIncome)}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
                )}
            </CardContent>
         </Card>
    </>
  );
}
