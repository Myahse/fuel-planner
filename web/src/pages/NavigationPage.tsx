import { useNavigate } from 'react-router-dom'
import { MapView } from '../components/map/MapView'
import { PLACES, resolvePlace } from '../data/mapPlaces'
import { interpolateRoute } from '../components/map/routeGeometry'
import { useTripStore } from '../store/tripStore'
import { formatDuration, formatKm, formatLiters } from '../lib/format'
import { MOCK_STATIONS } from '../data/mockStations'

export function NavigationPage() {
  const navigate = useNavigate()
  const { draft, lastResult } = useTripStore()
  const origin = resolvePlace(draft.origin) ?? PLACES.abidjan
  const dest = resolvePlace(draft.destination) ?? PLACES.yamoussoukro
  const result = lastResult

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-900 lg:relative lg:min-h-[calc(100vh-4rem)] lg:rounded-3xl lg:overflow-hidden">
      <div className="absolute left-4 right-4 top-4 z-10 rounded-2xl bg-brand-800 px-4 py-3 text-white shadow-float">
        <p className="text-2xl font-bold">500 m</p>
        <p className="text-sm opacity-90">Continue on A3</p>
      </div>

      <MapView
        className="flex-1 min-h-0"
        zoom={8}
        markers={[
          { id: 'o', lat: origin.lat, lng: origin.lng, variant: 'origin' },
          { id: 'd', lat: dest.lat, lng: dest.lng, variant: 'destination' },
          ...MOCK_STATIONS.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, variant: 'station' as const })),
        ]}
        route={{ points: interpolateRoute(origin, dest) }}
      />

      <div className="relative z-10 m-4 rounded-3xl bg-white p-4 shadow-float">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xl font-bold">{result ? formatDuration(result.estimated_duration_seconds) : '5h 40m'}</p>
            <p className="text-xs text-muted">ETA</p>
          </div>
          <div>
            <p className="text-xl font-bold">{formatKm(245)}</p>
            <p className="text-xs text-muted">Remaining</p>
          </div>
          <div>
            <p className="text-xl font-bold">10:25 AM</p>
            <p className="text-xs text-muted">Arrival</p>
          </div>
        </div>
        <div className="mt-4 flex justify-between rounded-2xl bg-surface px-3 py-2 text-sm">
          <span>{result ? formatLiters(result.fuel_required_liters) : '36.8 L'} required</span>
          <span className="font-semibold text-amber-700">4.2 L • 8%</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/app/trip-summary')}
          className="mt-4 w-full rounded-2xl bg-red-600 py-3 font-semibold text-white"
        >
          End
        </button>
      </div>
    </div>
  )
}
