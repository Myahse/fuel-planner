import { useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { MapView } from '../map/MapView'
import { useTripStore } from '../../store/tripStore'
import { PLACES, resolvePlace } from '../../data/mapPlaces'
import { interpolateRoute } from '../map/routeGeometry'
import { MOCK_STATIONS } from '../../data/mockStations'
import { useActiveVehicle } from '../../hooks/useActiveVehicle'
import { useQuery } from '@tanstack/react-query'
import { getFuelCurrent } from '../../api/endpoints'
import { estimatedRangeKm } from '../../lib/fuelMath'

export function ContextMapPanel() {
  const { pathname } = useLocation()
  const { draft, lastResult } = useTripStore()
  const { vehicle } = useActiveVehicle()

  const fuelQuery = useQuery({
    queryKey: ['fuel-current', vehicle?.id],
    queryFn: () => getFuelCurrent(vehicle!.id),
    enabled: Boolean(vehicle?.id),
  })

  const mapProps = useMemo(() => {
    const origin = resolvePlace(draft.origin) ?? PLACES.abidjan
    const dest = resolvePlace(draft.destination) ?? PLACES.yamoussoukro
    const routePoints = interpolateRoute(origin, dest)
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
  }, [pathname, draft, vehicle, fuelQuery.data, fuelQuery.isLoading, lastResult])

  const hiddenOnMobile =
    pathname.includes('/navigation') ||
    pathname.includes('/active-trip') ||
    pathname.includes('/fuel/level')

  return (
    <aside
      className={`hidden border-l border-slate-200/80 bg-slate-100 lg:block ${
        hiddenOnMobile ? 'lg:hidden' : ''
      } ${pathname.includes('/plan') || pathname.includes('/trip-result') ? 'lg:w-[min(58%,720px)]' : 'lg:w-[min(42%,520px)]'}`}
    >
      <div className="sticky top-0 h-screen p-4 pl-2">
        <div className="relative h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card">
          <div className="absolute left-4 top-4 z-[500] rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-brand-800 shadow-sm backdrop-blur">
            Live map
          </div>
          <MapView className="h-full min-h-[320px]" {...mapProps} />
        </div>
      </div>
    </aside>
  )
}
