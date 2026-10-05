import { Navigation } from 'lucide-react'
import type { FuelStation } from '../data/mockStations'

export function FuelStationCard({
  station,
  cheapest,
  onNavigate,
}: {
  station: FuelStation
  cheapest?: boolean
  onNavigate?: () => void
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-4">
      <div className="w-14 shrink-0">
        <p className="readout text-2xl text-fg">{station.distanceKmFromStart}</p>
        <p className="unit">km</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-fg">{station.name}</p>
        <p className="mt-0.5 flex items-center gap-2 text-sm text-fg-2">
          <span className="font-medium text-fg">{station.pricePerLiter}</span>
          <span className="unit">FCFA/L</span>
          {cheapest && (
            <span className="ml-1 flex items-center gap-1.5 text-xs font-semibold text-fg-2">
              <span className="lamp text-ok" aria-hidden /> cheapest
            </span>
          )}
        </p>
      </div>
      <button type="button" onClick={onNavigate} className="icon-btn h-10 w-10" aria-label={`Navigate to ${station.name}`}>
        <Navigation className="h-4 w-4" />
      </button>
    </div>
  )
}
