"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { format, startOfYear, endOfYear } from "date-fns"
import { pt } from "date-fns/locale"
import { getSupabaseClient } from "@/lib/supabase/client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";

type ChartItem = { month: string; revenue: number; expenses: number }

const chartConfig = {
  revenue: {
    label: "Receita",
    color: "hsl(var(--primary))",
  },
  expenses: {
    label: "Despesas",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export function OverviewChart() {
  const [data, setData] = useState<ChartItem[]>([])

  useEffect(() => {
    let isMounted = true
    async function fetchOverview() {
      try {
        const supabase = getSupabaseClient()
        const now = new Date()
        const from = startOfYear(now)
        const to = endOfYear(now)

        const revenueMap = new Map<string, number>()
        const expenseMap = new Map<string, number>()

        const { data: billing, error: billingError } = await supabase
          .from('billing')
          .select('total_amount, issue_date, status')
          .gte('issue_date', from.toISOString())
          .lte('issue_date', to.toISOString())
          .in('status', ['Emitida', 'Pago', 'Parcialmente Pago'])

        if (!billingError && Array.isArray(billing)) {
          for (const row of billing) {
            const d = row.issue_date ? new Date(row.issue_date) : now
            const idx = d.getMonth()
            const key = monthLabels[idx]
            const val = Number(row.total_amount) || 0
            revenueMap.set(key, (revenueMap.get(key) || 0) + val)
          }
        }

        const { data: expenses, error: expensesError } = await supabase
          .from('cash_flow_transactions')
          .select('amount, transaction_date, type')
          .gte('transaction_date', from.toISOString())
          .lte('transaction_date', to.toISOString())
          .eq('type', 'despesa')

        if (!expensesError && Array.isArray(expenses)) {
          for (const row of expenses) {
            const d = row.transaction_date ? new Date(row.transaction_date) : now
            const idx = d.getMonth()
            const key = monthLabels[idx]
            const val = Number(row.amount) || 0
            expenseMap.set(key, (expenseMap.get(key) || 0) + val)
          }
        }

        const merged: ChartItem[] = monthLabels.map(label => ({
          month: label,
          revenue: revenueMap.get(label) || 0,
          expenses: expenseMap.get(label) || 0,
        }))

        if (isMounted) setData(merged)
      } catch {
        if (isMounted) setData(monthLabels.map(l => ({ month: l, revenue: 0, expenses: 0 })))
      }
    }
    fetchOverview()
    return () => { isMounted = false }
  }, [])

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="font-headline">Visão Geral Financeira</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={data}>
            <XAxis
              dataKey="month"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `Kz ${Number(value) / 1000}k`}
            />
            <ChartTooltip
              cursor={{ fill: "hsl(var(--accent) / 0.2)" }}
              content={<ChartTooltipContent />}
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} name="Revenue" />
            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} name="Expenses" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
