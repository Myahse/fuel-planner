import { formatDuration, formatFcfa, formatKm, formatLiters } from '../lib/format'
import type { TripCalculateResult } from '../api/types'

export function TripResultCard({ result }: { result: TripCalculateResult }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-2xl bg-surface px-3 py-4 text-center">
        <p className="text-[10px] font-medium uppercase text-muted">Distance</p>
        <p className="mt-1 text-lg font-bold text-ink">{formatKm(result.distance_km)}</p>
      </div>
      <div className="rounded-2xl bg-surface px-3 py-4 text-center">
        <p className="text-[10px] font-medium uppercase text-muted">Est. time</p>
        <p className="mt-1 text-lg font-bold text-ink">{formatDuration(result.estimated_duration_seconds)}</p>
      </div>
      <div className="rounded-2xl bg-surface px-3 py-4 text-center">
        <p className="text-[10px] font-medium uppercase text-muted">Fuel needed</p>
        <p className="mt-1 text-lg font-bold text-ink">{formatLiters(result.fuel_required_liters)}</p>
      </div>
      <div className="col-span-3 rounded-2xl border border-slate-100 bg-white px-4 py-4">
        <p className="text-sm text-muted">Estimated cost</p>
        <p className="text-2xl font-bold text-brand-800">≈ {formatFcfa(result.estimated_fuel_cost)}</p>
      </div>
    </div>
  )
}
