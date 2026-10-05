import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getFuelCurrent } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { MapView } from '../components/map/MapView'
import { MOCK_STATIONS } from '../data/mockStations'
import { PLACES } from '../data/mapPlaces'
import { estimatedRangeKm } from '../lib/fuelMath'
import { PageHeader } from '../components/layout/PageHeader'

export function MapHomePage() {
  const { vehicle } = useActiveVehicle()
  const fuelQuery = useQuery({
    queryKey: ['fuel-current', vehicle?.id],
    queryFn: () => getFuelCurrent(vehicle!.id),
    enabled: Boolean(vehicle?.id),
  })

  const center = PLACES.abidjan
  const liters = fuelQuery.data?.estimated_fuel_liters ?? 30
  const rangeKm = fuelQuery.data?.estimated_range_km ?? estimatedRangeKm(liters, vehicle?.mixed_consumption ?? 7.5)

  return (
    <div className="space-y-6">
      <PageHeader title="How far can I go?" backTo="/app" />

      <div className="-mx-4 h-[56vh] min-h-[320px] overflow-hidden border-y border-line lg:hidden">
        <MapView
          className="h-full"
          center={center}
          zoom={8}
          rangeCircle={{ center, radiusMeters: rangeKm * 1000 }}
          markers={[
            { id: 'me', lat: center.lat, lng: center.lng, variant: 'user' },
            ...MOCK_STATIONS.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, variant: 'station' as const })),
          ]}
          loading={fuelQuery.isLoading}
        />
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="readout text-6xl text-fg">
            {Math.round(rangeKm)}
            <span className="unit ml-1.5 text-sm">km</span>
          </p>
          <p className="mt-2 text-sm text-fg-3">The dashed ring is how far your tank reaches in a straight line.</p>
        </div>
      </div>

      <Link to="/app/plan" className="btn btn-primary w-full">
        Plan a trip
      </Link>
    </div>
  )
}
