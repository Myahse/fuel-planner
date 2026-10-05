import { Navigation } from 'lucide-react'
import { formatKm, formatPricePerLiter } from '../lib/format'
import type { FuelStation } from '../data/mockStations'

export function FuelStationCard({
  station,
  onNavigate,
}: {
  station: FuelStation
  onNavigate?: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-lg font-bold text-amber-700">
        ⛽
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{station.name}</p>
        <p className="text-xs text-muted">{formatKm(station.distanceKmFromStart)} from start</p>
        <p className="mt-1 text-sm font-bold text-brand-800">{formatPricePerLiter(station.pricePerLiter)}</p>
      </div>
      <button
        type="button"
        onClick={onNavigate}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-800 text-white"
        aria-label="Navigate to station"
      >
        <Navigation className="h-4 w-4" />
      </button>
    </div>
  )
}
