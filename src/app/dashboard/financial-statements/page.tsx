
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
import { Button } from "@/components/ui/button";
import { Receipt, Download, BarChart, FileText, Landmark, LineChart, BookOpen } from "lucide-react";
import Link from "next/link";


export default function FinancialStatementsPage() {
  
  return (
    <>
      <DashboardHeader title="Demonstrações Financeiras e Fiscais">
        <Button><Download className="mr-2 h-4 w-4" /> Baixar Pacote de Relatórios</Button>
      </DashboardHeader>
       <Card className="mb-8 bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Receipt className="text-primary"/> Relatórios Financeiros e Fiscais</CardTitle>
          <CardDescription>
            Gere e visualize as demonstrações financeiras essenciais para a sua empresa.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card>
              <CardHeader>
                  <div className='flex items-start justify-between'>
                      <div>
                          <CardTitle className="font-headline text-lg flex items-center gap-2"><Landmark/> Balanço Patrimonial</CardTitle>
                          <CardDescription>Posição financeira da empresa num dado momento.</CardDescription>
                      </div>
                      <FileText className='h-6 w-6 text-muted-foreground'/>
                  </div>
              </CardHeader>
              <CardFooter>
                 <Button asChild className="w-full">
                    <Link href="/dashboard/financial-statements/balance-sheet">Visualizar Relatório</Link>
                 </Button>
              </CardFooter>
          </Card>
          <Card>
              <CardHeader>
                  <div className='flex items-start justify-between'>
                      <div>
                          <CardTitle className="font-headline text-lg flex items-center gap-2"><BarChart/> Demonstração de Resultados</CardTitle>
                          <CardDescription>Desempenho financeiro ao longo de um período.</CardDescription>
                      </div>
                      <FileText className='h-6 w-6 text-muted-foreground'/>
                  </div>
              </CardHeader>
              <CardFooter>
                 <Button asChild className="w-full">
                    <Link href="/dashboard/financial-statements/income-statement">Visualizar Relatório</Link>
                 </Button>
              </CardFooter>
          </Card>
           <Card>
              <CardHeader>
                  <div className='flex items-start justify-between'>
                      <div>
                          <CardTitle className="font-headline text-lg flex items-center gap-2"><LineChart/> Demonstração de Fluxos de Caixa</CardTitle>
                          <CardDescription>Análise das entradas e saídas de caixa.</CardDescription>
                      </div>
                      <FileText className='h-6 w-6 text-muted-foreground'/>
                  </div>
              </CardHeader>
              <CardFooter>
                 <Button asChild className="w-full">
                    <Link href="/dashboard/financial-statements/cash-flow-statement">Visualizar Relatório</Link>
                 </Button>
              </CardFooter>
          </Card>
           <Card>
              <CardHeader>
                  <div className='flex items-start justify-between'>
                      <div>
                          <CardTitle className="font-headline text-lg flex items-center gap-2"><BookOpen/> Extrato de Conta (Razão)</CardTitle>
                          <CardDescription>Visualize todos os movimentos de uma conta PGC.</CardDescription>
                      </div>
                      <FileText className='h-6 w-6 text-muted-foreground'/>
                  </div>
              </CardHeader>
              <CardFooter>
                 <Button asChild className="w-full">
                    <Link href="/dashboard/financial-statements/account-ledger">Visualizar Relatório</Link>
                 </Button>
              </CardFooter>
          </Card>
      </div>

    </>
  );
}
