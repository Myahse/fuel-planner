import { Link } from 'react-router-dom'
import { MapView } from '../components/map/MapView'
import { PLACES, resolvePlace } from '../data/mapPlaces'
import { interpolateRoute } from '../components/map/routeGeometry'
import { useTripStore } from '../store/tripStore'
import { PageHeader } from '../components/layout/PageHeader'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { formatConsumption, formatDuration, formatFcfa, formatKm, formatLiters } from '../lib/format'
import { ProgressBar } from '../components/ProgressBar'

export function TripSummaryPage() {
  const { draft, lastResult } = useTripStore()
  const origin = resolvePlace(draft.origin) ?? PLACES.abidjan
  const dest = resolvePlace(draft.destination) ?? PLACES.yamoussoukro

  return (
    <div className="space-y-5">
      <PageHeader title="Trip Summary" backTo="/app" />
      <p className="font-bold text-lg">{draft.origin} → {draft.destination}</p>
      <p className="text-sm text-muted capitalize">{draft.trip_type.replace('_', ' ')} • Oct 3, 2026</p>

      <div className="h-40 overflow-hidden rounded-3xl shadow-card">
        <MapView className="h-full" route={{ points: interpolateRoute(origin, dest) }} />
      </div>

      <div className="space-y-3 rounded-3xl bg-white p-5 shadow-card text-sm">
        {[
          ['Total distance', formatKm(lastResult?.distance_km ?? 490)],
          ['Total time', formatDuration(lastResult?.estimated_duration_seconds ?? 20280)],
          ['Fuel used', formatLiters(36.1)],
          ['Average consumption', formatConsumption(7.4)],
          ['Total cost', formatFcfa(31600)],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <span className="text-muted">{k}</span>
            <span className="font-semibold text-ink">{v}</span>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-card">
        <p className="text-sm font-semibold text-muted">Fuel level</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted">Start</p>
            <p className="font-bold">{formatLiters(30)}</p>
            <ProgressBar percent={60} className="mt-2" />
          </div>
          <div>
            <p className="text-xs text-muted">End</p>
            <p className="font-bold">{formatLiters(4.2)}</p>
            <ProgressBar percent={8} className="mt-2" />
          </div>
        </div>
      </div>

      <Link to="/app/history">
        <PrimaryButton fullWidth>Save to History</PrimaryButton>
      </Link>
    </div>
  )
}
