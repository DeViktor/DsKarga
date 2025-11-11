
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GanttChart } from "lucide-react";

export default function KpiAnalysisPage() {
  return (
    <>
      <DashboardHeader title="Análise de KPIs" />
      <Card className="text-center py-16">
        <CardHeader>
          <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit">
            <GanttChart className="h-12 w-12" />
          </div>
          <CardTitle className="font-headline mt-4">Análise de KPIs</CardTitle>
          <CardDescription>
            Acompanhe os principais indicadores de desempenho do seu negócio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve...</p>
        </CardContent>
      </Card>
    </>
  );
}
