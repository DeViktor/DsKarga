
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


export default function BalanceSheetPage() {
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

    const balanceSheetData = useMemo(() => {
        if (!journalEntries) return null;

        const balances: { [key: string]: number } = {};

        // Calculate balances from journal entries
        journalEntries.forEach(entry => {
            entry.lines.forEach(line => {
                if (!balances[line.accountId]) {
                    balances[line.accountId] = 0;
                }
                balances[line.accountId] += (line.debit || 0) - (line.credit || 0);
            });
        });

        const assets = { current: [] as { account: string; value: number }[], nonCurrent: [] as { account: string; value: number }[] };
        const liabilities = { current: [] as { account: string; value: number }[], nonCurrent: [] as { account: string; value: number }[] };
        const equity = [] as { account: string; value: number }[];
        let netIncomeForPeriod = 0;

        accounts.forEach(account => {
            const balance = balances[account.code] || 0;
            if (balance === 0) return;

            const accountItem = { account: account.name, value: balance };
            const invertedAccountItem = { account: account.name, value: -balance };
            
            if (account.class.includes('Activo')) {
                if (parseInt(account.code.split('.')[0]) < 20) {
                    assets.nonCurrent.push(accountItem);
                } else {
                    assets.current.push(accountItem);
                }
            } else if (account.class.includes('Passivo')) {
                 if (parseInt(account.code.split('.')[0]) > 40) {
                    liabilities.nonCurrent.push(invertedAccountItem);
                } else {
                    liabilities.current.push(invertedAccountItem);
                }
            } else if (account.class.includes('Capital Próprio')) {
                equity.push(invertedAccountItem);
            } else if (account.class.includes('Custos') || account.class.includes('Proveitos')) {
                 netIncomeForPeriod -= balance;
            }
        });
        
        if (netIncomeForPeriod !== 0) {
            equity.push({ account: 'Resultado Líquido do Período', value: netIncomeForPeriod });
        }

        const totalAssets = assets.current.reduce((sum, item) => sum + item.value, 0) + assets.nonCurrent.reduce((sum, item) => sum + item.value, 0);
        const totalLiabilities = liabilities.current.reduce((sum, item) => sum + item.value, 0) + liabilities.nonCurrent.reduce((sum, item) => sum + item.value, 0);
        
        return { assets, liabilities, equity, totalAssets, totalLiabilities };

    }, [journalEntries, accounts]);
    
    const isLoading = loading;

    const totalCurrentAssets = balanceSheetData?.assets.current.reduce((sum, item) => sum + item.value, 0) || 0;
    const totalNonCurrentAssets = balanceSheetData?.assets.nonCurrent.reduce((sum, item) => sum + item.value, 0) || 0;
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    const totalCurrentLiabilities = balanceSheetData?.liabilities.current.reduce((sum, item) => sum + item.value, 0) || 0;
    const totalNonCurrentLiabilities = balanceSheetData?.liabilities.nonCurrent.reduce((sum, item) => sum + item.value, 0) || 0;
    const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;
    
    const totalEquity = balanceSheetData?.equity.reduce((sum, item) => sum + item.value, 0) || 0;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    const downloadXLSX = () => {
        if (!balanceSheetData) return;

        const worksheet = XLSX.utils.json_to_sheet([
            { Grupo: 'Ativo Corrente', 'Sub-Grupo': '', Valor: ''},
            ...balanceSheetData.assets.current.map(i => ({ Grupo: '', 'Sub-Grupo': i.account, Valor: i.value })),
            { Grupo: 'Total Ativo Corrente', 'Sub-Grupo': '', Valor: totalCurrentAssets },
            {},
            { Grupo: 'Ativo Não Corrente', 'Sub-Grupo': '', Valor: '' },
            ...balanceSheetData.assets.nonCurrent.map(i => ({ Grupo: '', 'Sub-Grupo': i.account, Valor: i.value })),
            { Grupo: 'Total Ativo Não Corrente', 'Sub-Grupo': '', Valor: totalNonCurrentAssets },
            {},
            { Grupo: 'Total do Ativo', 'Sub-Grupo': '', Valor: totalAssets },
            {},
            { Grupo: 'Passivo Corrente', 'Sub-Grupo': '', Valor: '' },
            ...balanceSheetData.liabilities.current.map(i => ({ Grupo: '', 'Sub-Grupo': i.account, Valor: i.value })),
            { Grupo: 'Total Passivo Corrente', 'Sub-Grupo': '', Valor: totalCurrentLiabilities },
            {},
            { Grupo: 'Passivo Não Corrente', 'Sub-Grupo': '', Valor: '' },
            ...balanceSheetData.liabilities.nonCurrent.map(i => ({ Grupo: '', 'Sub-Grupo': i.account, Valor: i.value })),
            { Grupo: 'Total Passivo Não Corrente', 'Sub-Grupo': '', Valor: totalNonCurrentLiabilities },
            {},
            { Grupo: 'Capital Próprio', 'Sub-Grupo': '', Valor: '' },
            ...balanceSheetData.equity.map(i => ({ Grupo: '', 'Sub-Grupo': i.account, Valor: i.value })),
            { Grupo: 'Total Capital Próprio', 'Sub-Grupo': '', Valor: totalEquity },
            {},
            { Grupo: 'Total Passivo + Capital Próprio', 'Sub-Grupo': '', Valor: totalLiabilitiesAndEquity },
        ]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Balanço Patrimonial');
        XLSX.writeFile(workbook, `Balanco_Patrimonial_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    }

    const handlePrint = () => {
        window.print();
    }

  return (
    <>
        <DashboardHeader title="Balanço Patrimonial">
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
                <CardTitle className="font-headline">Balanço Patrimonial</CardTitle>
                <CardDescription>Posição financeira da empresa em {format(new Date(), 'dd MMMM, yyyy', { locale: pt})}</CardDescription>
            </CardHeader>
            <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                </div>
            ) : !balanceSheetData || journalEntries?.length === 0 ? (
                <div className="text-center text-muted-foreground py-16">
                    <p>Não existem dados suficientes para gerar o balanço.</p>
                    <p className="text-sm">Por favor, adicione lançamentos no Livro Diário.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-headline text-lg mb-2 text-center">Ativo</h3>
                        <Table>
                            <TableHeader><TableRow><TableHead>Ativo Corrente</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {balanceSheetData.assets.current.map(item => (
                                    <TableRow key={item.account}><TableCell>{item.account}</TableCell><TableCell className="text-right">{numberFormat(item.value)}</TableCell></TableRow>
                                ))}
                            </TableBody>
                            <TableFooter><TableRow><TableCell className="font-bold">Total Ativo Corrente</TableCell><TableCell className="text-right font-bold">{numberFormat(totalCurrentAssets)}</TableCell></TableRow></TableFooter>
                        </Table>
                         <Table className="mt-4">
                            <TableHeader><TableRow><TableHead>Ativo Não Corrente</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {balanceSheetData.assets.nonCurrent.map(item => (
                                    <TableRow key={item.account}><TableCell>{item.account}</TableCell><TableCell className="text-right">{numberFormat(item.value)}</TableCell></TableRow>
                                ))}
                            </TableBody>
                            <TableFooter><TableRow><TableCell className="font-bold">Total Ativo Não Corrente</TableCell><TableCell className="text-right font-bold">{numberFormat(totalNonCurrentAssets)}</TableCell></TableRow></TableFooter>
                        </Table>
                         <Table className="mt-4"><TableFooter><TableRow className="bg-muted/50 hover:bg-muted/50"><TableCell className="font-headline text-lg">Total do Ativo</TableCell><TableCell className="text-right font-headline text-lg">{numberFormat(totalAssets)}</TableCell></TableRow></TableFooter></Table>
                    </div>
                    <div>
                        <h3 className="font-headline text-lg mb-2 text-center">Passivo e Capital Próprio</h3>
                        <Table>
                            <TableHeader><TableRow><TableHead>Passivo Corrente</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {balanceSheetData.liabilities.current.map(item => (
                                    <TableRow key={item.account}><TableCell>{item.account}</TableCell><TableCell className="text-right">{numberFormat(item.value)}</TableCell></TableRow>
                                ))}
                            </TableBody>
                            <TableFooter><TableRow><TableCell className="font-bold">Total Passivo Corrente</TableCell><TableCell className="text-right font-bold">{numberFormat(totalCurrentLiabilities)}</TableCell></TableRow></TableFooter>
                        </Table>
                         <Table className="mt-4">
                            <TableHeader><TableRow><TableHead>Passivo Não Corrente</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {balanceSheetData.liabilities.nonCurrent.map(item => (
                                     <TableRow key={item.account}><TableCell>{item.account}</TableCell><TableCell className="text-right">{numberFormat(item.value)}</TableCell></TableRow>
                                ))}
                            </TableBody>
                             <TableFooter><TableRow><TableCell className="font-bold">Total Passivo Não Corrente</TableCell><TableCell className="text-right font-bold">{numberFormat(totalNonCurrentLiabilities)}</TableCell></TableRow></TableFooter>
                        </Table>
                         <Table className="mt-4">
                            <TableHeader><TableRow><TableHead>Capital Próprio</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {balanceSheetData.equity.map(item => (
                                     <TableRow key={item.account}><TableCell>{item.account}</TableCell><TableCell className="text-right">{numberFormat(item.value)}</TableCell></TableRow>
                                ))}
                            </TableBody>
                            <TableFooter><TableRow><TableCell className="font-bold">Total Capital Próprio</TableCell><TableCell className="text-right font-bold">{numberFormat(totalEquity)}</TableCell></TableRow></TableFooter>
                        </Table>
                         <Table className="mt-4"><TableFooter><TableRow className="bg-muted/50 hover:bg-muted/50"><TableCell className="font-headline text-lg">Total Passivo + Capital Próprio</TableCell><TableCell className="text-right font-headline text-lg">{numberFormat(totalLiabilitiesAndEquity)}</TableCell></TableRow></TableFooter></Table>
                    </div>
                </div>
            )}
            </CardContent>
        </Card>
    </>
  );
}
