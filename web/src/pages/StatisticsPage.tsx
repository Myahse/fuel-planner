import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { StatCard } from '../components/StatCard'
import { FuelBarChart, FuelLineChart } from '../components/FuelChart'
import { formatConsumption, formatFcfa, formatKm, formatLiters } from '../lib/format'

const daily = [
  { label: '1', value: 2.1 },
  { label: '5', value: 4.2 },
  { label: '10', value: 3.8 },
  { label: '15', value: 5.1 },
  { label: '20', value: 2.9 },
  { label: '25', value: 6.2 },
  { label: '30', value: 4.5 },
]

const costTrend = daily.map((d, i) => ({ label: d.label, value: d.value * 875 + i * 200 }))

type Period = 'week' | 'month' | 'year' | 'custom'

export function StatisticsPage() {
  const [period, setPeriod] = useState<Period>('month')

  return (
    <div className="space-y-6">
      <PageHeader title="Statistics" backTo="/app" />

      <select
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"
        value={period}
        onChange={(e) => setPeriod(e.target.value as Period)}
      >
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="year">This Year</option>
        <option value="custom">Custom</option>
      </select>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Distance" value={formatKm(1240)} />
        <StatCard label="Fuel Used" value={formatLiters(98.5)} />
        <StatCard label="Fuel Cost" value={formatFcfa(86190)} />
        <StatCard label="Avg Consumption" value={formatConsumption(7.9)} />
      </div>

      <FuelBarChart data={daily} title="Daily Fuel Usage (L)" />
      <FuelLineChart data={costTrend} title="Fuel Cost" />
      <FuelLineChart data={daily.map((d) => ({ ...d, value: d.value * 1.05 }))} title="Consumption over time" />
    </div>
  )
}
