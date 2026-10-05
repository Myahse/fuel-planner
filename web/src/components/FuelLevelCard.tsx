import { Fuel, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProgressBar } from './ProgressBar'
import { formatKm, formatLiters } from '../lib/format'
import { barsFilled } from '../lib/fuelMath'

type Props = {
  percent: number
  liters: number
  tankLiters: number
  rangeKm: number
  bars?: number
  to?: string
}

export function FuelLevelCard({ percent, liters, tankLiters, rangeKm, bars = 10, to }: Props) {
  const filled = barsFilled(bars, percent)
  const content = (
    <div className="card-surface card-featured card-interactive p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
            <Fuel className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <span className="text-sm font-semibold text-ink">Fuel level</span>
        </div>
        {to && <ChevronRight className="h-5 w-5 text-slate-400" />}
      </div>
      <p className="mt-4 text-lg font-semibold text-ink">
        {filled} bars <span className="font-normal text-muted">(≈{Math.round(percent)}%)</span>
      </p>
      <ProgressBar percent={percent} className="mt-3" />
      <p className="mt-3 text-sm text-muted">
        <span className="font-semibold text-ink">{formatLiters(liters)}</span> of {formatLiters(tankLiters, 0)}
      </p>
      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="text-[2.75rem] font-extrabold leading-none tracking-tight text-brand-800 sm:text-5xl">
          {formatKm(rangeKm)}
        </p>
        <p className="mt-1 text-sm font-medium text-muted">Estimated range</p>
      </div>
    </div>
  )

  if (to) {
    return <Link to={to} className="block">{content}</Link>
  }
  return content
}
