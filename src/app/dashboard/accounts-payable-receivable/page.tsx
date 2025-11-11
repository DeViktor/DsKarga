
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Scale } from "lucide-react";

export default function AccountsPayableReceivablePage() {
  return (
    <>
      <DashboardHeader title="Contas a Pagar/Receber" />
      <Card className="text-center py-16">
        <CardHeader>
          <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit">
            <Scale className="h-12 w-12" />
          </div>
          <CardTitle className="font-headline mt-4">Contas a Pagar e a Receber</CardTitle>
          <CardDescription>
            Gestão de faturas de fornecedores e controlo de recebimentos de clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve...</p>
        </CardContent>
      </Card>
    </>
  );
}
