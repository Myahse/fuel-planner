import { useNavigate } from 'react-router-dom'
import { useTripStore } from '../store/tripStore'
import { MapView } from '../components/map/MapView'
import { PLACES, resolvePlace } from '../data/mapPlaces'
import { interpolateRoute } from '../components/map/routeGeometry'
import { TripResultCard } from '../components/TripResultCard'
import { TripStatusCard } from '../components/StatusCard'
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
  if (!result) {
    navigate('/app/plan')
    return null
  }

  const origin = resolvePlace(draft.origin) ?? PLACES.abidjan
  const dest = resolvePlace(draft.destination) ?? PLACES.yamoussoukro

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Ready to go?</h1>

      <div className="h-44 overflow-hidden rounded-3xl shadow-card lg:hidden">
        <MapView
          className="h-full"
          route={{ points: interpolateRoute(origin, dest) }}
          markers={[
            { id: 'o', lat: origin.lat, lng: origin.lng, variant: 'origin' },
            { id: 'd', lat: dest.lat, lng: dest.lng, variant: 'destination' },
          ]}
        />
      </div>

      <p className="font-semibold">{draft.origin} → {draft.destination}</p>
      <p className="text-sm capitalize text-muted">{draft.trip_type.replace('_', ' ')}</p>

      <TripResultCard result={result} />
      <TripStatusCard status={result.assessment.status} shortageLiters={result.assessment.shortage_liters} />

      <PrimaryButton
        fullWidth
        onClick={() => {
          setNavigationActive(true)
          navigate('/app/navigation')
        }}
      >
        Start Navigation
      </PrimaryButton>
      <SecondaryButton fullWidth onClick={() => navigate('/app/stations')}>
        Find Fuel Stations
      </SecondaryButton>
    </div>
  )
}
