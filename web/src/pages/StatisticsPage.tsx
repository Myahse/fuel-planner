import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { FuelBarChart, FuelLineChart } from '../components/FuelChart'

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
const consumption = [7.6, 8.1, 7.9, 8.4, 7.7, 8.0, 7.8].map((value, i) => ({ label: daily[i].label, value }))

type Period = 'week' | 'month' | 'year'

export function StatisticsPage() {
  const [period, setPeriod] = useState<Period>('month')

  return (
    <div className="space-y-7">
      <PageHeader title="Statistics" backTo="/app" />

      <div className="seg" role="group" aria-label="Period">
        {(['week', 'month', 'year'] as Period[]).map((p) => (
          <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)} className="capitalize">
            {p}
          </button>
        ))}
      </div>

      <dl className="grid grid-cols-2 border-y border-line">
        {[
          ['distance', '1,240', 'km'],
          ['fuel used', '98.5', 'L'],
          ['spent', '86,190', 'FCFA'],
          ['average', '7.9', 'L/100km'],
        ].map(([k, v, u], i) => (
          <div key={k} className={`py-4 ${i % 2 ? 'border-l border-line pl-4' : ''} ${i > 1 ? 'border-t border-line' : ''}`}>
            <dt className="unit">{k}</dt>
            <dd className="readout mt-2 text-4xl text-fg">
              {v}
              <span className="unit ml-1">{u}</span>
            </dd>
          </div>
        ))}
      </dl>

      <FuelBarChart data={daily} title="Fuel used per day" subtitle="litres" format={(v) => `${v.toFixed(1)} L`} />
      <FuelLineChart
        data={costTrend}
        title="Fuel spend"
        subtitle="FCFA per day"
        format={(v) => `${Math.round(v).toLocaleString('en-US')}`}
      />
      <FuelLineChart data={consumption} title="Consumption" subtitle="L/100 km" format={(v) => v.toFixed(1)} />
      <p className="unit">sample data — your own numbers appear as you log trips and fill-ups</p>
    </div>
  )
}
