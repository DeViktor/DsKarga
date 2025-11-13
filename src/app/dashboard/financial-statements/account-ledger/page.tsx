
'use client';

import { useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { pt } from 'date-fns/locale';
import { useRouter } from "next/navigation";
import { pgcAccounts, type PGCAccount } from '@/lib/pgc-data';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function AccountLedgerPage() {
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchJournal() {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*');
        if (error) throw error;
        const normalized = (data || []).map((e: any) => ({
          ...e,
          date: e.date ? new Date(e.date) : undefined,
        }));
        if (isMounted) setJournalEntries(normalized);
      } catch (err) {
        console.error('Failed to load journal entries from Supabase', err);
        if (isMounted) setJournalEntries([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchJournal();
    return () => { isMounted = false; };
  }, []);

const numberFormat = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
};

    const router = useRouter();
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

    const ledgerData = useMemo(() => {
        if (!selectedAccountId) return [];
        let balance = 0;
        return journalEntries
            .flatMap(entry => 
                entry.lines
                    .filter(line => line.accountId === selectedAccountId)
                    .map(line => ({
                        date: entry.date,
                        description: entry.description,
                        debit: line.debit,
                        credit: line.credit,
                        balance: balance += line.debit - line.credit
                    }))
            );
    }, [selectedAccountId]);
    
    const selectedAccount = pgcAccounts.find(a => a.code === selectedAccountId);

    return (
        <>
            <DashboardHeader title="Extrato de Conta (Razão)">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retroceder
                </Button>
                <Button disabled={!selectedAccountId}><Download className="mr-2 h-4 w-4" /> Baixar Extrato</Button>
            </DashboardHeader>
            
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Extrato de Conta (Razão)</CardTitle>
                    <CardDescription>Selecione uma conta para ver todos os seus movimentos e saldo.</CardDescription>
                    <div className="pt-4">
                        <Select onValueChange={setSelectedAccountId}>
                            <SelectTrigger className="w-full md:w-[400px]">
                                <SelectValue placeholder="Selecione uma conta do PGC..." />
                            </SelectTrigger>
                            <SelectContent>
                                {pgcAccounts.map(account => (
                                    <SelectItem key={account.id} value={account.code}>
                                        {account.code} - {account.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {selectedAccountId && selectedAccount ? (
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px]">Data</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead className="text-right">Débito</TableHead>
                                    <TableHead className="text-right">Crédito</TableHead>
                                    <TableHead className="text-right">Saldo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ledgerData.length > 0 ? ledgerData.map((entry, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{format(entry.date, 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>{entry.description}</TableCell>
                                        <TableCell className="text-right font-mono">{entry.debit > 0 ? numberFormat(entry.debit) : ''}</TableCell>
                                        <TableCell className="text-right font-mono">{entry.credit > 0 ? numberFormat(entry.credit) : ''}</TableCell>
                                        <TableCell className="text-right font-mono font-bold">{numberFormat(entry.balance)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">Nenhum movimento encontrado para esta conta.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                             {ledgerData.length > 0 && (
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-right font-bold text-lg">Saldo Final</TableCell>
                                        <TableCell className="text-right font-bold text-lg">{numberFormat(ledgerData[ledgerData.length - 1].balance)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            )}
                        </Table>
                    ) : (
                         <div className="text-center text-muted-foreground py-16">
                            <p>Selecione uma conta para visualizar o seu extrato.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
