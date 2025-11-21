
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
import { useToast } from '@/hooks/use-toast';

export default function AccountLedgerPage() {
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

        if (!entriesError && Array.isArray(entriesData)) {
          const normalized = entriesData.map((e: any) => {
            const dateStr = e.entry_date ?? e.date ?? e.created_at;
            const linesSrc: any[] = Array.isArray(e.journal_entry_lines) ? e.journal_entry_lines : [];
            const lines = linesSrc.map((l: any) => ({
              accountId: String(l.account_id ?? l.account_code ?? l.account ?? ''),
              accountName: String(l.account_name ?? ''),
              debit: Number(l.debit ?? 0),
              credit: Number(l.credit ?? 0),
            }));
            return {
              id: String(e.id),
              date: dateStr ? new Date(dateStr) : undefined,
              description: e.description ?? '',
              lines,
            };
          });
          if (isMounted) setJournalEntries(normalized);
        } else {
          const { data: entriesData2, error: entriesError2 } = await supabase
            .from('journal_entries')
            .select('*')
            .order('created_at', { ascending: false });
          if (entriesError2) {
            const msg = entriesError2.message || entriesError2.code || 'Falha ao carregar lançamentos.';
            toast({ title: 'Erro ao carregar lançamentos', description: msg, variant: 'destructive' });
            if (isMounted) setJournalEntries([]);
            return;
          }
          const base = (Array.isArray(entriesData2) ? entriesData2 : []).map((e: any) => ({
            id: String(e.id),
            date: (e.entry_date ?? e.date ?? e.created_at) ? new Date(e.entry_date ?? e.date ?? e.created_at) : undefined,
            description: e.description ?? '',
            lines: [],
          }));
          const { data: linesData, error: linesError } = await supabase
            .from('journal_entry_lines')
            .select('*');
          if (linesError) {
            const msg = linesError.message || linesError.code || 'Falha ao carregar linhas.';
            toast({ title: 'Erro ao carregar linhas', description: msg, variant: 'destructive' });
            if (isMounted) setJournalEntries(base);
          } else {
            const byEntry: Record<string, any[]> = {};
            for (const l of Array.isArray(linesData) ? linesData : []) {
              const parentId = String(l.entry_id ?? l.journal_entry_id ?? '');
              if (!parentId) continue;
              const line = {
                accountId: String(l.account_id ?? l.account_code ?? l.account ?? ''),
                accountName: String(l.account_name ?? ''),
                debit: Number(l.debit ?? 0),
                credit: Number(l.credit ?? 0),
              };
              byEntry[parentId] = byEntry[parentId] || [];
              byEntry[parentId].push(line);
            }
            const normalized = base.map(n => ({ ...n, lines: byEntry[String(n.id)] || [] }));
            if (isMounted) setJournalEntries(normalized);
          }
        }
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
