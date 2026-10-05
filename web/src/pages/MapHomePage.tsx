import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getFuelCurrent } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { MapView } from '../components/map/MapView'
import { MOCK_STATIONS } from '../data/mockStations'
import { PLACES } from '../data/mapPlaces'
import { estimatedRangeKm } from '../lib/fuelMath'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
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
    <div className="space-y-4">
      <PageHeader title="Map" backTo="/app" />

      <div className="h-[55vh] min-h-[320px] overflow-hidden rounded-3xl shadow-card lg:hidden">
        <MapView
          className="h-full"
          center={center}
          zoom={9}
          rangeCircle={{ center, radiusMeters: rangeKm * 1000 }}
          markers={[
            { id: 'me', lat: center.lat, lng: center.lng, variant: 'user' },
            ...MOCK_STATIONS.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, variant: 'station' as const })),
          ]}
          loading={fuelQuery.isLoading}
        />
      </div>

      <p className="text-sm text-muted">
        Green circle shows your estimated driving range ({Math.round(rangeKm)} km) from your current area.
      </p>

      <Link to="/app/plan">
        <PrimaryButton fullWidth>Plan a Trip →</PrimaryButton>
      </Link>
    </div>
  )
}
