import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTripStore } from '../store/tripStore'
import { MapView } from '../components/map/MapView'
import { PLACES, resolvePlace } from '../data/mapPlaces'
import { interpolateRoute } from '../components/map/routeGeometry'
import { TripResultCard } from '../components/TripResultCard'
import { TripStatusCard } from '../components/StatusCard'
import { PageHeader } from '../components/layout/PageHeader'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { SecondaryButton } from '../components/buttons/SecondaryButton'
import type { TripCalculateResult } from '../api/types'

function loadResult(): TripCalculateResult | null {
  try {
    return JSON.parse(sessionStorage.getItem('lastTripResult') || 'null')
  } catch {
    return null
  }
}

export function TripConfirmPage() {
  const navigate = useNavigate()
  const { draft, lastResult, setNavigationActive } = useTripStore()
  const result = lastResult ?? loadResult()

  useEffect(() => {
    if (!result) navigate('/app/plan', { replace: true })
  }, [result, navigate])
  if (!result) return null

  const origin = resolvePlace(draft.origin) ?? PLACES.abidjan
  const dest = resolvePlace(draft.destination) ?? PLACES.yamoussoukro

  return (
    <div className="space-y-7">
      <PageHeader title="Ready to go?" backTo="/app/trip-result" subtitle={`${result.origin} → ${result.destination} · ${draft.trip_type.replace('_', ' ')}`} />

      <div className="-mx-4 h-48 overflow-hidden border-y border-line lg:hidden">
        <MapView
          className="h-full"
          route={{ points: interpolateRoute(origin, dest) }}
          markers={[
            { id: 'o', lat: origin.lat, lng: origin.lng, variant: 'origin' },
            { id: 'd', lat: dest.lat, lng: dest.lng, variant: 'destination' },
          ]}
        />
      </div>

      <TripStatusCard status={result.assessment.status} shortageLiters={result.assessment.shortage_liters} />
      <TripResultCard result={result} />

      <div className="flex flex-col gap-3">
        <PrimaryButton
          fullWidth
          onClick={() => {
            setNavigationActive(true)
            navigate('/app/navigation')
          }}
        >
          Start navigation
        </PrimaryButton>
        <SecondaryButton fullWidth onClick={() => navigate('/app/stations')}>
          Stations on the route
        </SecondaryButton>
      </div>
    </div>
  )
}
