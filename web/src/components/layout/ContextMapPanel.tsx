import { useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { MapView } from '../map/MapView'
import { useTripStore } from '../../store/tripStore'
import { useRouteStations } from '../../hooks/useRouteStations'
import { stationMapPosition } from '../../lib/fuelStation'
import { useActiveVehicle } from '../../hooks/useActiveVehicle'
import { useQuery } from '@tanstack/react-query'
import { getFuelCurrent } from '../../api/endpoints'
import { estimatedRangeKm } from '../../lib/fuelMath'
import { useTripRoute } from '../../hooks/useTripRoute'
import { useUserMapCenter } from '../../hooks/useUserMapCenter'
import { ROAD_FACTOR } from '../../data/cities'
import { planTripMapHasContent, planTripMapMarkers } from '../../lib/planTripMapMarkers'

export function ContextMapPanel() {
  const { pathname } = useLocation()
  const { draft, selectedFuelStationId, setSelectedFuelStationId, mapPinTarget, mapPinMode } = useTripStore()
  const { vehicle } = useActiveVehicle()
  const trip = useTripRoute()
  const userCenter = useUserMapCenter()
  const routeStations = useRouteStations()

  const fuelQuery = useQuery({
    queryKey: ['fuel-current', vehicle?.id],
    queryFn: () => getFuelCurrent(vehicle!.id),
    enabled: Boolean(vehicle?.id),
  })

  const mapProps = useMemo(() => {
    const dest =
      draft.destination_lat != null && draft.destination_lng != null
        ? { lat: draft.destination_lat, lng: draft.destination_lng }
        : trip.destination
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

    const onStations = pathname.includes('/stations')
    const selectedStation = routeStations.find((s) => s.id === selectedFuelStationId)

    const onPlan = pathname.includes('/plan')
    const showTripMarkers =
      onPlan ||
      pathname.includes('/trip-result') ||
      pathname.includes('/trip-confirm') ||
      pathname.includes('/stations')

    const tripMarkers = onPlan
      ? planTripMapMarkers({ draft, trip, userCenter, mapPinTarget, mapPinMode })
      : [
          { id: 'me', lat: userCenter.lat, lng: userCenter.lng, variant: 'user' as const, label: 'You' },
          ...(showTripMarkers
            ? [{ id: 'o', lat: trip.origin.lat, lng: trip.origin.lng, variant: 'origin' as const, label: draft.origin || 'Start' }]
            : []),
          ...(draft.trip_type === 'multi_stop' && showTripMarkers
            ? draft.waypoints
                .filter((w) => w.lat != null && w.lng != null)
                .map((w, i) => ({
                  id: w.id,
                  lat: w.lat!,
                  lng: w.lng!,
                  variant: 'waypoint' as const,
                  label: w.label || `Stop ${i + 1}`,
                  stopIndex: i + 1,
                }))
            : []),
          ...(showTripMarkers
            ? [{ id: 'd', lat: dest.lat, lng: dest.lng, variant: 'destination' as const, label: draft.destination || 'Destination' }]
            : []),
        ]

    const markers = [
      ...tripMarkers,
      ...(showRoute && routeStations.length > 0
        ? routeStations.map((s) => ({
            id: s.id,
            ...stationMapPosition(s),
            variant: 'station' as const,
            label: `${s.name} · ${s.town}`,
            selected: onStations && s.id === selectedFuelStationId,
          }))
        : []),
    ]

    const navigating = pathname.includes('/navigation') || pathname.includes('/active-trip')
    const frameRoute = showRoute && routePoints.length > 1
    const planFrame = onPlan && (planTripMapHasContent(draft) || routePoints.length > 1)

    return {
      center: userCenter,
      zoom: navigating ? 14 : 12,
      cameraLock: navigating || frameRoute || planFrame ? 'content' as const : 'user' as const,
      markers,
      route: showRoute && routePoints.length > 1 ? { points: routePoints } : undefined,
      rangeCircle:
        pathname === '/app' || pathname === '/app/map'
          ? { center: userCenter, radiusMeters: (rangeKm / ROAD_FACTOR) * 1000 }
          : undefined,
      loading: fuelQuery.isLoading && Boolean(vehicle),
      mode: navigating ? ('navigation' as const) : ('default' as const),
      focusPoint: onStations && selectedStation ? stationMapPosition(selectedStation) : null,
      onMarkerClick: onStations ? (id: string) => setSelectedFuelStationId(id) : undefined,
    }
  }, [
    pathname,
    trip,
    draft,
    vehicle,
    fuelQuery.data,
    fuelQuery.isLoading,
    userCenter,
    routeStations,
    selectedFuelStationId,
    setSelectedFuelStationId,
    mapPinTarget,
    mapPinMode,
  ])

  const onPlan = pathname.includes('/plan')

  const hiddenOnMobile =
    pathname.includes('/navigation') ||
    pathname.includes('/active-trip') ||
    pathname.includes('/fuel/level') ||
    pathname === '/app/map'

  return (
    <aside
      className={`hidden border-l border-line lg:block ${hiddenOnMobile ? 'lg:hidden' : ''} ${
        pathname.includes('/plan') || pathname.includes('/trip-result') ? 'lg:w-[min(52%,720px)]' : 'lg:w-[min(40%,520px)]'
      }`}
    >
      <div className="sticky top-0 h-screen">
        <MapView className="h-full w-full min-h-[320px]" allowMapPin syncTripPin={onPlan} {...mapProps} />
        <p className="unit pointer-events-none absolute right-4 top-4 z-[500] rounded-xs bg-bg/80 px-2 py-1 backdrop-blur">
          {mapProps.route ? 'route' : 'range'} · live
        </p>
      </div>
    </aside>
  )
}
