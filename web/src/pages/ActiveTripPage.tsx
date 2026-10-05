import { useNavigate } from 'react-router-dom'
import { MapView } from '../components/map/MapView'
import { PLACES, resolvePlace } from '../data/mapPlaces'
import { interpolateRoute } from '../components/map/routeGeometry'
import { useTripStore } from '../store/tripStore'
import { Mic, Settings, ZoomIn, LocateFixed } from 'lucide-react'
import { fuelLevelStatus } from '../lib/fuelStatus'
import { formatKm, formatLiters } from '../lib/format'

export function ActiveTripPage() {
  const navigate = useNavigate()
  const { draft } = useTripStore()
  const origin = resolvePlace(draft.origin) ?? PLACES.abidjan
  const dest = resolvePlace(draft.destination) ?? PLACES.yamoussoukro
  const fuel = fuelLevelStatus(25, 12.4)

  return (
    <div className="fixed inset-0 z-40 flex flex-col">
      <div className="absolute left-4 right-4 top-4 z-10 rounded-2xl bg-white/95 px-4 py-3 shadow-float">
        <p className="font-bold text-ink">Stay on A3</p>
        <p className="text-sm text-muted">120 km to destination</p>
      </div>

      <MapView
        className="flex-1"
        zoom={9}
        route={{ points: interpolateRoute(origin, dest) }}
        markers={[
          { id: 'u', lat: 5.9, lng: -4.5, variant: 'user' },
          { id: 'd', lat: dest.lat, lng: dest.lng, variant: 'destination' },
        ]}
      />

      <div className="absolute right-4 top-28 z-10 flex flex-col gap-2">
        {[Mic, Settings, ZoomIn, LocateFixed].map((Icon, i) => (
          <button key={i} type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-card">
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <div className="relative z-10 m-4 space-y-3">
        <div className="rounded-3xl bg-white p-4 shadow-float">
          <div className="grid grid-cols-3 text-center">
            <div><p className="text-xl font-bold">2h 15m</p><p className="text-xs text-muted">Time</p></div>
            <div><p className="text-xl font-bold">147 km</p><p className="text-xs text-muted">Left</p></div>
            <div><p className="text-xl font-bold">11:20 AM</p><p className="text-xs text-muted">ETA</p></div>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-float">
          <p className="text-xs font-semibold uppercase text-muted">Estimated remaining fuel</p>
          <p className="text-2xl font-bold">{formatLiters(12.4)} <span className="text-base text-muted">25%</span></p>
          <p className="mt-2 text-sm">{fuel.emoji} {fuel.label} • Range {formatKm(165)}</p>
          <button
            type="button"
            onClick={() => navigate('/app/trip-summary')}
            className="mt-4 w-full rounded-2xl bg-red-600 py-3 font-semibold text-white"
          >
            End Trip
          </button>
        </div>
      </div>
    </div>
  )
}
