import { useNavigate } from 'react-router-dom'
import { LocateFixed, ZoomIn } from 'lucide-react'
import { MapView } from '../components/map/MapView'
import { PLACES, resolvePlace } from '../data/mapPlaces'
import { interpolateRoute } from '../components/map/routeGeometry'
import { useTripStore } from '../store/tripStore'
import { FuelSegments } from '../components/FuelSegments'

/** Bottom heads-up strip shared by the driving screens: three readings and an End button. */
export function DriveHud({ cells, onEnd, children }: { cells: [string, string, string][]; onEnd: () => void; children?: React.ReactNode }) {
  return (
    <div className="border-t border-line bg-panel px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
      {children}
      <div className="flex items-end gap-4">
        <dl className="grid flex-1 grid-cols-3 divide-x divide-line">
          {cells.map(([k, v, u]) => (
            <div key={k} className="px-3 first:pl-0">
              <dt className="unit">{k}</dt>
              <dd className="readout mt-1.5 text-3xl text-fg">
                {v}
                <span className="unit ml-1">{u}</span>
              </dd>
            </div>
          ))}
        </dl>
        <button type="button" onClick={onEnd} className="btn btn-danger btn-sm w-20">
          End
        </button>
      </div>
    </div>
  )
}

export function ActiveTripPage() {
  const navigate = useNavigate()
  const { draft } = useTripStore()
  const origin = resolvePlace(draft.origin) ?? PLACES.abidjan
  const dest = resolvePlace(draft.destination) ?? PLACES.yamoussoukro

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg">
      <div className="border-b border-line bg-panel px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="title text-2xl text-fg">Stay on the A3</p>
        <p className="unit mt-1">120 km to {draft.destination.toLowerCase()}</p>
      </div>

      <div className="relative min-h-0 flex-1">
        <MapView
          className="h-full"
          zoom={9}
          route={{ points: interpolateRoute(origin, dest) }}
          markers={[
            { id: 'u', lat: 5.9, lng: -4.5, variant: 'user' },
            { id: 'd', lat: dest.lat, lng: dest.lng, variant: 'destination' },
          ]}
        />
        <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">
          {[
            { Icon: ZoomIn, label: 'Zoom in' },
            { Icon: LocateFixed, label: 'Recenter' },
          ].map(({ Icon, label }) => (
            <button key={label} type="button" className="icon-btn h-10 w-10 bg-panel" aria-label={label}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      <DriveHud
        cells={[
          ['time left', '2:15', 'h'],
          ['distance', '147', 'km'],
          ['range', '165', 'km'],
        ]}
        onEnd={() => navigate('/app/trip-summary')}
      >
        <div className="mb-4 flex items-center gap-4">
          <p className="readout text-2xl text-fg">
            12.4<span className="unit ml-1">L</span>
          </p>
          <FuelSegments className="flex-1" percent={25} bars={8} />
        </div>
      </DriveHud>
    </div>
  )
}
