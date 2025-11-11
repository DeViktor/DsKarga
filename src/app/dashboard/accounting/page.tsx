
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
import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { pgcAccounts } from "@/lib/pgc-data";

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

// Mocked journal entries for demonstration
const journalEntries: JournalEntry[] = [
    {
        id: "1",
        lines: [
            { accountId: "43", accountName: "Caixa", debit: 850000, credit: 0 },
            { accountId: "71", accountName: "Vendas", debit: 0, credit: 850000 },
        ]
    },
    {
        id: "2",
        lines: [
            { accountId: "631", accountName: "Remunerações", debit: 1200000, credit: 0 },
            { accountId: "41", accountName: "Depósitos à Ordem", debit: 0, credit: 1200000 },
        ]
    },
     {
        id: "3",
        lines: [
            { accountId: "26", accountName: "Matérias Subsidiárias, Consumíveis", debit: 350000, credit: 0 },
            { accountId: "41", accountName: "Depósitos à Ordem", debit: 0, credit: 350000 },
        ]
    }
];


export default function AccountingDashboardPage() {
  
  const entriesLoading = false; // Mocking loading state

  const totals = useMemo(() => {
      if (!journalEntries) return { assets: 0, liabilities: 0, equity: 0, revenue: 0, expenses: 0 };
      
      const balances: { [key: string]: number } = {};
      journalEntries.forEach(entry => {
        entry.lines.forEach(line => {
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

  }, [journalEntries]);

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
