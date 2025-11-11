
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Banknote } from "lucide-react";

export default function FinanceDashboardPage() {
  return (
    <>
      <DashboardHeader title="Dashboard Financeiro" />
      <Card className="text-center py-16">
        <CardHeader>
          <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit">
            <Banknote className="h-12 w-12" />
          </div>
          <CardTitle className="font-headline mt-4">Dashboard Financeiro</CardTitle>
          <CardDescription>
            Visão geral e centralizada de toda a atividade financeira da empresa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve...</p>
        </CardContent>
      </Card>
    </>
  );
}
