
'use client';

import { useMemo, useState } from "react";
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
    const [loading, setLoading] = useState(false);

    const addEntry = (entry: Omit<JournalEntry, 'id'>) => {
        setEntries(prev => [{ id: `entry-${Date.now()}`, ...entry }, ...prev]);
    }

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
                    entries.map((entry, entryIndex) => (
                        entry.lines.map((line, lineIndex) => (
                           <TableRow key={`${entry.id}-${lineIndex}`} className={lineIndex === 0 ? 'border-t-2 border-primary/20' : ''}>
                                {lineIndex === 0 ? (
                                    <>
                                        <TableCell rowSpan={entry.lines.length} className="align-top font-medium">
                                            {format(entry.date, 'dd/MM/yyyy', { locale: pt })}
                                        </TableCell>
                                        <TableCell rowSpan={entry.lines.length} className="align-top text-muted-foreground">
                                            {entry.documentRef}
                                        </TableCell>
                                        <TableCell rowSpan={entry.lines.length} className="align-top">
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
                    ))
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
