
'use client';
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Book, Landmark, Banknote, FilePlus, FolderKanban, Receipt, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMemo, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { pgcAccounts } from "@/lib/pgc-data";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface JournalEntryLine {
    accountId: string;
    accountName: string;
    debit: number;
    credit: number;
}

interface JournalEntry {
    id: string;
    lines: JournalEntryLine[];
}


export default function AccountingDashboardPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    async function fetchJournal() {
      setEntriesLoading(true);
      try {
        const supabase = getSupabaseClient();
        const { data: entriesData, error: entriesError } = await supabase
          .from('journal_entries')
          .select('*, journal_entry_lines(*)')
          .order('created_at', { ascending: false });

        let normalized: JournalEntry[] = [];

        if (!entriesError && Array.isArray(entriesData)) {
          normalized = entriesData.map((e: any) => {
            const linesSrc: any[] = Array.isArray(e.journal_entry_lines) ? e.journal_entry_lines : [];
            const lines: JournalEntryLine[] = linesSrc.map((l: any) => ({
              accountId: String(l.account_id ?? l.account_code ?? l.account ?? ''),
              accountName: String(l.account_name ?? ''),
              debit: Number(l.debit ?? 0),
              credit: Number(l.credit ?? 0),
            }));
            return { id: String(e.id), lines } as JournalEntry;
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
          const base = (Array.isArray(entriesData2) ? entriesData2 : []).map((e: any) => ({ id: String(e.id), lines: [] } as JournalEntry));
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

        if (isMounted) setEntries(normalized);
      } catch (err: any) {
        const msg = err?.message || 'Erro inesperado ao carregar lançamentos.';
        toast({ title: 'Erro', description: msg, variant: 'destructive' });
        if (isMounted) setEntries([]);
      } finally {
        if (isMounted) setEntriesLoading(false);
      }
    }
    fetchJournal();
    return () => { isMounted = false; };
  }, []);

  const totals = useMemo(() => {
      const balances: { [key: string]: number } = {};
      (entries || []).forEach(entry => {
        (entry.lines || []).forEach(line => {
          if (!line.accountId) return;
          if (!balances[line.accountId]) balances[line.accountId] = 0;
          balances[line.accountId] += (line.debit || 0) - (line.credit || 0);
        });
      });

      let assets = 0;
      let liabilities = 0;
      let equity = 0;
      let revenue = 0;
      let expenses = 0;

      for (const accountId in balances) {
          const account = pgcAccounts.find(a => a.code === accountId);
          if (!account) continue;

          const classCode = parseInt(accountId.split('.')[0]);
          const balance = balances[accountId];

          if (account.class.includes('Activo')) {
              assets += balance;
          } else if (account.class.includes('Passivo')) {
              liabilities -= balance;
          } else if (account.class.includes('Capital Próprio')) {
              equity -= balance;
          } else if (account.class.includes('Custos')) {
              expenses += balance;
          } else if (account.class.includes('Proveitos')) {
              revenue -= balance;
          }
      }
      
      // Equity = Assets - Liabilities
      const calculatedEquity = assets - liabilities;

      return { assets, liabilities, equity: calculatedEquity, revenue, expenses };

  }, [entries]);

  const loading = entriesLoading;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  }
  
  const margin = totals.revenue > 0 ? ( (totals.revenue - totals.expenses) / totals.revenue ) * 100 : 0;


  return (
    <>
      <DashboardHeader title="Dashboard de Contabilidade" />
       <Card className="mb-8 bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Book className="text-primary"/> Visão Geral Contabilística</CardTitle>
          <CardDescription>
            A saúde financeira da sua empresa em conformidade com o PGC de Angola.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ativos</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin"/> : formatCurrency(totals.assets)}</div>
            <p className="text-xs text-muted-foreground">Balanço atualizado em tempo real</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Passivos</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin"/> : formatCurrency(totals.liabilities)}</div>
            <p className="text-xs text-muted-foreground">Capital Próprio: {formatCurrency(totals.equity)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proveitos (Este Mês)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin"/> : formatCurrency(totals.revenue)}</div>
            <p className="text-xs text-muted-foreground">+10% vs. mês passado (exemplo)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos (Este Mês)</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin"/> : formatCurrency(totals.expenses)}</div>
            <p className="text-xs text-muted-foreground">Margem Bruta de {margin.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="font-headline">Acesso Rápido</CardTitle>
            <CardDescription>Navegue para os principais módulos de contabilidade.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/dashboard/accounting/journal" passHref>
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <FilePlus />
                    <span>Novo Lançamento no Diário</span>
                </Button>
            </Link>
            <Link href="/dashboard/accounting/chart-of-accounts" passHref>
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <FolderKanban />
                    <span>Consultar Plano de Contas</span>
                </Button>
            </Link>
            <Link href="/dashboard/financial-statements" passHref>
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <Receipt />
                    <span>Gerar Relatórios Financeiros</span>
                </Button>
            </Link>
        </CardContent>
      </Card>
    </>
  );
}
