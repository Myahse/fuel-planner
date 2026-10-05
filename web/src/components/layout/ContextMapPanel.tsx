import { useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { MapView } from '../map/MapView'
import { useTripStore } from '../../store/tripStore'
import { MOCK_STATIONS } from '../../data/mockStations'
import { useActiveVehicle } from '../../hooks/useActiveVehicle'
import { useQuery } from '@tanstack/react-query'
import { getFuelCurrent } from '../../api/endpoints'
import { estimatedRangeKm } from '../../lib/fuelMath'
import { useTripRoute } from '../../hooks/useTripRoute'

export function ContextMapPanel() {
  const { pathname } = useLocation()
  const { draft } = useTripStore()
  const { vehicle } = useActiveVehicle()
  const trip = useTripRoute()

  const fuelQuery = useQuery({
    queryKey: ['fuel-current', vehicle?.id],
    queryFn: () => getFuelCurrent(vehicle!.id),
    enabled: Boolean(vehicle?.id),
  })

  const mapProps = useMemo(() => {
    const origin = trip.origin
    const dest = trip.destination
    const routePoints = trip.points
    const showRoute =
      pathname.includes('/plan') ||
      pathname.includes('/trip-result') ||
      pathname.includes('/trip-confirm') ||
      pathname.includes('/navigation') ||
      pathname.includes('/active-trip') ||
      pathname.includes('/trip-summary') ||
      pathname.includes('/stations')

    const liters = fuelQuery.data?.estimated_fuel_liters ?? vehicle?.estimated_fuel_liters ?? 30
    const consumption = vehicle?.mixed_consumption ?? 7.5
    const rangeKm = fuelQuery.data?.estimated_range_km ?? estimatedRangeKm(liters, consumption)

    const markers = [
      { id: 'o', lat: origin.lat, lng: origin.lng, variant: 'origin' as const, label: draft.origin },
      { id: 'd', lat: dest.lat, lng: dest.lng, variant: 'destination' as const, label: draft.destination },
      ...(pathname.includes('/stations')
        ? MOCK_STATIONS.map((s) => ({
            id: s.id,
            lat: s.lat,
            lng: s.lng,
            variant: 'station' as const,
            label: s.name,
          }))
        : []),
    ]

    return {
      center: origin,
      zoom: showRoute ? 7 : 10,
      markers,
      route: showRoute ? { points: routePoints } : undefined,
      rangeCircle:
        pathname === '/app' || pathname === '/app/map'
          ? { center: origin, radiusMeters: rangeKm * 1000 }
          : undefined,
      loading: fuelQuery.isLoading && Boolean(vehicle),
    }
  }, [pathname, trip, draft, vehicle, fuelQuery.data, fuelQuery.isLoading])

  const hiddenOnMobile =
    pathname.includes('/navigation') ||
    pathname.includes('/active-trip') ||
    pathname.includes('/fuel/level')

  return (
    <aside
      className={`hidden border-l border-line lg:block ${hiddenOnMobile ? 'lg:hidden' : ''} ${
        pathname.includes('/plan') || pathname.includes('/trip-result') ? 'lg:w-[min(52%,720px)]' : 'lg:w-[min(40%,520px)]'
      }`}
    >
      <div className="sticky top-0 h-screen">
        <MapView className="h-full min-h-[320px]" {...mapProps} />
        <p className="unit pointer-events-none absolute right-4 top-4 z-[500] rounded-xs bg-bg/80 px-2 py-1 backdrop-blur">
          {mapProps.route ? 'route' : 'range'} · live
        </p>
      </div>
    </aside>
  )
}
