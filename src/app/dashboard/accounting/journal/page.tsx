
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
                // Consulta 1: pegar os lançamentos (cabeçalhos)
                const { data: entriesData, error: entriesError } = await supabase
                    .from('journal_entries')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (entriesError) {
                    const message = formatSupabaseError(entriesError);
                    console.error('Erro ao consultar journal_entries:', entriesError);
                    toast({ title: 'Erro ao carregar lançamentos', description: message, variant: 'destructive' });
                    return;
                }

                const normalized = (Array.isArray(entriesData) ? entriesData : []).map((e: any) => {
                    const dateStr = e.entry_date ?? e.date ?? e.created_at;
                    return {
                        id: String(e.id),
                        date: dateStr ? new Date(dateStr) : new Date(),
                        description: e.description ?? '',
                        documentRef: e.document_ref ?? '',
                        lines: [],
                    } as JournalEntry;
                });

                // Consulta 2: pegar as linhas e associar por entry_id (ou journal_entry_id)
                if (normalized.length > 0) {
                    const { data: linesData, error: linesError } = await supabase
                        .from('journal_entry_lines')
                        .select('*');
                    if (linesError) {
                        const message = formatSupabaseError(linesError);
                        console.error('Erro ao consultar journal_entry_lines:', linesError);
                        toast({ title: 'Erro ao carregar linhas', description: message, variant: 'destructive' });
                    } else {
                        console.log(`Entradas carregadas: ${normalized.length}`);
                        console.log(`Linhas carregadas: ${Array.isArray(linesData) ? linesData.length : 0}`);
                        const byEntry: Record<string, JournalEntryLine[]> = {};
                        for (const l of Array.isArray(linesData) ? linesData : []) {
                            const parentId = String(l.entry_id ?? l.journal_entry_id ?? '');
                            if (!parentId) continue;
                            const line: JournalEntryLine = {
                                accountId: String(l.account_id ?? ''),
                                accountName: String(l.account_name ?? ''),
                                debit: Number(l.debit ?? 0),
                                credit: Number(l.credit ?? 0),
                            };
                            byEntry[parentId] = byEntry[parentId] || [];
                            byEntry[parentId].push(line);
                        }
                        for (const n of normalized) {
                            n.lines = byEntry[String(n.id)] || [];
                        }
                    }
                }

                normalized.sort((a, b) => b.date.getTime() - a.date.getTime());

                if (isMounted) setEntries(normalized);
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
                    <TableHead>Conta</TableHead>
                    <TableHead className="text-right">Débito</TableHead>
                    <TableHead className="text-right">Crédito</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </TableCell>
                    </TableRow>
                ) : !entries || entries.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
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
        </CardContent>
      </Card>
    </>
  );
}
