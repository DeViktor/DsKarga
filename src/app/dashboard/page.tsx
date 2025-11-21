"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  UserCheck,
  Briefcase,
  DollarSign,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { RecentActivities } from "@/components/dashboard/recent-activities-real";
import { ActivityTest } from "@/components/activity-test";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [workerCount, setWorkerCount] = useState<number | null>(null);
  const [activeContractsCount, setActiveContractsCount] = useState<number | null>(null);
  const [activeServicesCount, setActiveServicesCount] = useState<number | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchMetrics() {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();

        // Workers count
        const workersRes = await supabase
          .from('workers')
          .select('*', { count: 'exact', head: true });
        if (isMounted) setWorkerCount(workersRes.count ?? 0);

        // Active contracts (assuming workers with status 'Ativo')
        try {
          const activeContractsRes = await supabase
            .from('workers')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Ativo');
          if (isMounted) setActiveContractsCount(activeContractsRes.count ?? 0);
        } catch (e) {
          if (isMounted) setActiveContractsCount(workersRes.count ?? 0);
        }

        // Active services (assuming table 'service_requisitions' with status 'Ativo')
        try {
          const servicesRes = await supabase
            .from('service_requisitions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Ativo');
          if (isMounted) setActiveServicesCount(servicesRes.count ?? 0);
        } catch (e) {
          if (isMounted) setActiveServicesCount(0);
        }

        // Monthly revenue from billing
        try {
          const now = new Date();
          const from = new Date(now.getFullYear(), now.getMonth(), 1);
          const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          const { data: billing, error } = await supabase
            .from('billing')
            .select('total_amount,issue_date,status')
            .gte('issue_date', from.toISOString())
            .lte('issue_date', to.toISOString())
            .in('status', ['Emitida', 'Pago', 'Parcialmente Pago']);
          if (error) throw error;
          const revenue = (billing || []).reduce((sum, inv: any) => sum + (Number(inv.total_amount) || 0), 0);
          if (isMounted) setMonthlyRevenue(revenue);
        } catch (e: any) {
          console.error('Erro ao carregar faturas do dashboard:', e);
          if (e?.code === 'PGRST205') {
            console.warn('Tabela de faturas não encontrada - métricas de receita não disponíveis');
          }
          if (isMounted) setMonthlyRevenue(0);
        }
      } catch (err) {
        console.error('Erro ao carregar métricas do Supabase', err);
        if (isMounted) {
          setWorkerCount(0);
          setActiveContractsCount(0);
          setActiveServicesCount(0);
          setMonthlyRevenue(0);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchMetrics();
    return () => { isMounted = false; };
  }, []);

  const formatCurrency = (value: number | null) => {
    const v = value ?? 0;
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(v);
  };

  return (
    <>
      <ActivityTest />
      <DashboardHeader title="Painel" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Trabalhadores
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (workerCount ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Contagem real do Supabase</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contratos Ativos
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (activeContractsCount ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Status 'Ativo' em trabalhadores</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (activeServicesCount ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Serviços com status 'Ativo'</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita Mensal
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatCurrency(monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">Soma de faturas do mês (Emitidas/Pagas)</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
        <OverviewChart />
        <RecentActivities />
      </div>
    </>
  );
}
