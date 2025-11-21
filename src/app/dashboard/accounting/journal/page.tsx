
'use client';

import { useMemo, useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { JournalEntryDialog } from "@/components/dashboard/accounting/journal-entry-dialog";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { identifyTransactionType, getTransactionTypeDescription } from '@/lib/accounting-transaction-types';

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
    transactionType?: ReturnType<typeof identifyTransactionType>;
    totalDebit: number;
    totalCredit: number;
}

const numberFormat = (value: number) => {
    if (value === 0) return '';
    return new Intl.NumberFormat('pt-AO', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
};

export default function JournalPage() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const formatSupabaseError = (err: any): string => {
        try {
            if (!err) return 'Erro desconhecido.';
            if (typeof err === 'string') {
                const parsed = JSON.parse(err);
                return parsed?.message || parsed?.error || err;
            }
            return err.message || err.details || err.hint || err.code || String(err);
        } catch {
            return typeof err === 'string' ? err : 'Erro desconhecido.';
        }
    };

    const addEntry = (entry: Omit<JournalEntry, 'id'>) => {
        setEntries(prev => [{ id: `entry-${Date.now()}`, ...entry }, ...prev]);
    }

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
                        accountName: String(l.account_name ?? l.accoun_name ?? ''),
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
                    // Fallback robusto: duas consultas separadas e associação manual
                    const { data: entriesData2, error: entriesError2 } = await supabase
                        .from('journal_entries')
                        .select('*')
                        .order('created_at', { ascending: false });
                    if (entriesError2) {
                        const message = formatSupabaseError(entriesError2);
                        console.error('Erro ao consultar journal_entries (fallback):', entriesError2);
                        toast({ title: 'Erro ao carregar lançamentos', description: message, variant: 'destructive' });
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
                        const message = formatSupabaseError(linesError);
                        console.error('Erro ao consultar journal_entry_lines:', linesError);
                        toast({ title: 'Erro ao carregar linhas', description: message, variant: 'destructive' });
                        normalized = base; // continua sem linhas
                    } else {
                        const byEntry: Record<string, JournalEntryLine[]> = {};
                        for (const l of Array.isArray(linesData) ? linesData : []) {
                            const parentId = String(l.entry_id ?? l.journal_entry_id ?? '');
                            if (!parentId) continue;
                            const line: JournalEntryLine = {
                                accountId: String(l.account_id ?? l.account_code ?? l.account ?? ''),
                                accountName: String(l.account_name ?? l.accoun_name ?? ''),
                                debit: Number(l.debit ?? 0),
                                credit: Number(l.credit ?? 0),
                            };
                            byEntry[parentId] = byEntry[parentId] || [];
                            byEntry[parentId].push(line);
                        }
                        normalized = base.map(n => ({
                            ...n,
                            lines: byEntry[String(n.id)] || [],
                        }));
                    }
                }

                // Calculate totals and identify transaction types for each entry
                const enhancedEntries = normalized.map(entry => {
                    const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
                    const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);
                    
                    // Identify transaction type based on account codes and patterns
                    const transactionType = entry.lines.length > 0 
                        ? identifyTransactionType(entry.lines)
                        : undefined;
                    
                    return {
                        ...entry,
                        totalDebit,
                        totalCredit,
                        transactionType
                    };
                });

                enhancedEntries.sort((a, b) => b.date.getTime() - a.date.getTime());

                if (isMounted) setEntries(enhancedEntries);
                if (normalized.length === 0) {
                    toast({ title: 'Sem lançamentos', description: 'Nenhum lançamento encontrado em journal_entries.' });
                }
            } catch (err: any) {
                const message = formatSupabaseError(err);
                console.error('Erro ao carregar lançamentos do Supabase:', err);
                if (isMounted) setEntries([]);
                toast({ title: 'Erro ao carregar lançamentos do Supabase', description: message, variant: 'destructive' });
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchJournal();
        return () => { isMounted = false; };
    }, []);

  return (
    <>
      <DashboardHeader title="Livro Diário - Lançamentos Contabilísticos">
        <JournalEntryDialog onEntryAdded={addEntry} />
      </DashboardHeader>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Lançamentos Recentes</CardTitle>
          <CardDescription>
            Histórico de todos os movimentos registados em conformidade com o PGC.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo de Transação</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead className="text-right">Débito</TableHead>
                    <TableHead className="text-right">Crédito</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </TableCell>
                    </TableRow>
                ) : !entries || entries.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                            Nenhum lançamento registado.
                        </TableCell>
                    </TableRow>
                ) : (
                    entries.map((entry, entryIndex) => {
                        const displayLines = entry.lines && entry.lines.length > 0
                            ? entry.lines
                            : [{ accountId: '', accountName: 'Sem linhas', debit: 0, credit: 0 }];
                        return displayLines.map((line, lineIndex) => (
                           <TableRow key={`${entry.id}-${lineIndex}`} className={lineIndex === 0 ? 'border-t-2 border-primary/20' : ''}>
                                {lineIndex === 0 ? (
                                    <>
                                        <TableCell rowSpan={displayLines.length} className="align-top font-medium">
                                            {format(entry.date, 'dd/MM/yyyy', { locale: pt })}
                                        </TableCell>
                                        <TableCell rowSpan={displayLines.length} className="align-top text-muted-foreground">
                                            {entry.documentRef}
                                        </TableCell>
                                        <TableCell rowSpan={displayLines.length} className="align-top">
                                            {entry.description}
                                        </TableCell>
                                        <TableCell rowSpan={displayLines.length} className="align-top">
                                            {entry.transactionType && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{entry.transactionType.icon}</span>
                                                    <div>
                                                        <div className="font-medium text-sm">{entry.transactionType.type}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {getTransactionTypeDescription(entry.transactionType.type)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </TableCell>
                                    </>
                                ) : null}
                                <TableCell>
                                    <div className="font-mono text-xs text-muted-foreground">{line.accountId}</div>
                                    <div>{line.accountName}</div>
                                </TableCell>
                                <TableCell className="text-right font-mono">{numberFormat(line.debit)}</TableCell>
                                <TableCell className="text-right font-mono">{numberFormat(line.credit)}</TableCell>
                           </TableRow>
                        ))
                    })
                )}
            </TableBody>
          </Table>
          
          {entries.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(
                entries.reduce((acc, entry) => {
                  if (entry.transactionType) {
                    const type = entry.transactionType.type;
                    if (!acc[type]) {
                      acc[type] = { count: 0, totalDebit: 0, totalCredit: 0, icon: entry.transactionType.icon };
                    }
                    acc[type].count++;
                    acc[type].totalDebit += entry.totalDebit;
                    acc[type].totalCredit += entry.totalCredit;
                  }
                  return acc;
                }, {} as Record<string, { count: number; totalDebit: number; totalCredit: number; icon: string }>)
              ).map(([type, data]) => (
                <div key={type} className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{data.icon}</span>
                    <h4 className="font-semibold">{type}</h4>
                    <span className="text-xs text-muted-foreground">({data.count})</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Débito total:</span>
                      <span className="font-mono">{numberFormat(data.totalDebit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Crédito total:</span>
                      <span className="font-mono">{numberFormat(data.totalCredit)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
