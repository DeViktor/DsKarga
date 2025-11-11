"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";

const data = [
  { month: "Jan", revenue: 1860, expenses: 800 },
  { month: "Fev", revenue: 3050, expenses: 2000 },
  { month: "Mar", revenue: 2370, expenses: 1200 },
  { month: "Abr", revenue: 730, expenses: 1900 },
  { month: "Mai", revenue: 2090, expenses: 1300 },
  { month: "Jun", revenue: 2140, expenses: 1400 },
  { month: "Jul", revenue: 2500, expenses: 1500 },
  { month: "Ago", revenue: 3200, expenses: 1800 },
  { month: "Set", revenue: 2800, expenses: 1600 },
  { month: "Out", revenue: 3500, expenses: 2000 },
  { month: "Nov", revenue: 2900, expenses: 1700 },
  { month: "Dez", revenue: 4200, expenses: 2200 },
]

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

export function OverviewChart() {
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
