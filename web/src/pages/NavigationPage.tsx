import { useNavigate } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { MapView } from '../components/map/MapView'
import { useTripStore } from '../store/tripStore'
import { MOCK_STATIONS } from '../data/mockStations'
import { DriveHud } from './ActiveTripPage'
import { useTripRoute } from '../hooks/useTripRoute'

/** Turn-by-turn view. Maneuver text is a placeholder until a routing provider is connected. */
export function NavigationPage() {
  const navigate = useNavigate()
  const { lastResult } = useTripStore()
  const trip = useTripRoute()
  const origin = trip.origin
  const dest = trip.destination
  const hours = Math.floor((lastResult?.estimated_duration_seconds ?? 20400) / 3600)
  const mins = Math.round(((lastResult?.estimated_duration_seconds ?? 20400) % 3600) / 60)

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg lg:relative lg:h-screen">
      <div className="flex items-center gap-4 border-b border-line bg-panel px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-signal text-signal-ink">
          <ArrowUp className="h-8 w-8" strokeWidth={2.5} />
        </span>
        <div>
          <p className="readout text-4xl text-fg">
            500<span className="unit ml-1">m</span>
          </p>
          <p className="text-sm text-fg-2">Continue on the A3</p>
        </div>
      </div>

      <MapView
        className="min-h-0 flex-1"
        zoom={8}
        mode="navigation"
        markers={[
          { id: 'o', lat: origin.lat, lng: origin.lng, variant: 'origin' },
          { id: 'd', lat: dest.lat, lng: dest.lng, variant: 'destination' },
          ...MOCK_STATIONS.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, variant: 'station' as const })),
        ]}
        route={{ points: trip.points }}
      />

      <DriveHud
        cells={[
          ['arrive in', `${hours}:${String(mins).padStart(2, '0')}`, 'h'],
          ['left', '245', 'km'],
          ['on arrival', (lastResult?.assessment.remaining_fuel ?? 4.2).toFixed(1), 'L'],
        ]}
        onEnd={() => navigate('/app/trip-summary')}
      />
    </div>
  )
}
