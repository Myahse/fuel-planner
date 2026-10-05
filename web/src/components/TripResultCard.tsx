import type { TripCalculateResult } from '../api/types'

/** Trip readings as one instrument row: distance, time, fuel, cost. */
export function TripResultCard({ result }: { result: TripCalculateResult }) {
  const h = Math.floor(result.estimated_duration_seconds / 3600)
  const m = Math.round((result.estimated_duration_seconds % 3600) / 60)
  const cells: [string, string, string][] = [
    ['distance', Math.round(result.distance_km).toLocaleString('en-US'), 'km'],
    ['drive time', `${h}:${String(m).padStart(2, '0')}`, 'h'],
    ['fuel', result.fuel_required_liters.toFixed(1), 'L'],
    ['cost', `≈${Math.round(result.estimated_fuel_cost).toLocaleString('en-US')}`, 'FCFA'],
  ]
  return (
    <dl className="grid grid-cols-2 border-y border-line">
      {cells.map(([label, value, unit], i) => (
        <div
          key={label}
          className={`py-4 ${i % 2 === 1 ? 'border-l border-line pl-4' : ''} ${i >= 2 ? 'border-t border-line' : ''}`}
        >
          <dt className="unit">{label}</dt>
          <dd className="readout mt-2 text-3xl text-fg">
            {value}
            <span className="unit ml-1">{unit}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
