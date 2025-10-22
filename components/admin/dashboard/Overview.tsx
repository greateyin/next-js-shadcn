'use client'

import { Skeleton } from "@/components/ui/skeleton"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

export interface OverviewDatum {
  name: string
  users: number
  applications: number
}

interface OverviewProps {
  data: OverviewDatum[]
  isLoading?: boolean
}

export function Overview({ data, isLoading = false }: OverviewProps) {
  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />
  }

  if (!data.length) {
    return (
      <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
        No data available.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
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
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip />
        <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="applications" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
