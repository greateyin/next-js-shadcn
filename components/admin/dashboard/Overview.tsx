'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  {
    name: "Jan",
    users: 25,
    applications: 5,
  },
  {
    name: "Feb",
    users: 35,
    applications: 8,
  },
  {
    name: "Mar",
    users: 45,
    applications: 10,
  },
  {
    name: "Apr",
    users: 55,
    applications: 12,
  },
  {
    name: "May",
    users: 65,
    applications: 15,
  },
  {
    name: "Jun",
    users: 75,
    applications: 18,
  },
]

export function Overview() {
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