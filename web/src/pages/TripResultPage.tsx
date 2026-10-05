import { Link, useNavigate } from 'react-router-dom'
import type { TripCalculateResult } from '../api/types'
import { useTripStore } from '../store/tripStore'
import { PageHeader } from '../components/layout/PageHeader'
import { MapView } from '../components/map/MapView'
import { PLACES, resolvePlace } from '../data/mapPlaces'
import { interpolateRoute } from '../components/map/routeGeometry'
import { TripResultCard } from '../components/TripResultCard'
import { TripStatusCard } from '../components/StatusCard'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { SecondaryButton } from '../components/buttons/SecondaryButton'
import { formatFcfa, formatLiters } from '../lib/format'

function loadResult(): TripCalculateResult | null {
  const raw = sessionStorage.getItem('lastTripResult')
  if (!raw) return null
  try {
    return JSON.parse(raw) as TripCalculateResult
  } catch {
    return null
  }
}

export function TripResultPage() {
  const navigate = useNavigate()
  const { lastResult } = useTripStore()
  const result = lastResult ?? loadResult()

  if (!result) {
    return (
      <div>
        <PageHeader title="Trip Result" backTo="/app/plan" />
        <p className="text-muted">No trip result yet.</p>
        <Link to="/app/plan" className="mt-4 inline-block text-brand-800 font-semibold">Plan a trip</Link>
      </div>
    )
  }

  const origin = resolvePlace(result.origin) ?? PLACES.abidjan
  const dest = resolvePlace(result.destination) ?? PLACES.yamoussoukro
  const a = result.assessment
  const shortage = a.shortage_liters ?? Math.max(0, a.fuel_required - a.starting_fuel)

  return (
    <div className="space-y-0 lg:space-y-4">
      <PageHeader title="Trip Result" backTo="/app/plan" />

      <div className="-mx-4 h-[42vh] min-h-[240px] overflow-hidden lg:hidden">
        <MapView
          className="h-full"
          markers={[
            { id: 'o', lat: origin.lat, lng: origin.lng, variant: 'origin' },
            { id: 'd', lat: dest.lat, lng: dest.lng, variant: 'destination' },
          ]}
          route={{ points: interpolateRoute(origin, dest) }}
        />
      </div>

      <div className="space-y-4 pt-4 lg:pt-0">
        <p className="text-lg font-bold text-ink">{result.origin} → {result.destination}</p>
        <TripResultCard result={result} />
        <TripStatusCard status={a.status} shortageLiters={shortage} />

        <div className="rounded-2xl bg-white p-4 shadow-card text-sm space-y-2">
          <div className="flex justify-between"><span className="text-muted">Starting fuel</span><span className="font-semibold">{formatLiters(a.starting_fuel)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Required</span><span className="font-semibold">{formatLiters(a.fuel_required)}</span></div>
          {a.status === 'insufficient' && (
            <div className="flex justify-between text-red-700"><span>Shortage</span><span className="font-semibold">{formatLiters(shortage)}</span></div>
          )}
          <div className="flex justify-between border-t pt-2"><span className="text-muted">Estimated cost</span><span className="font-bold text-brand-800">≈ {formatFcfa(result.estimated_fuel_cost)}</span></div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <SecondaryButton fullWidth onClick={() => navigate('/app/stations')}>Find Fuel Stations</SecondaryButton>
          <PrimaryButton fullWidth onClick={() => navigate('/app/trip-confirm')}>Start Navigation</PrimaryButton>
        </div>
      </div>
    </div>
  )
}
