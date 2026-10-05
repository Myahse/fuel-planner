import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getStationsAlongRoute } from '../api/endpoints'
import { encodePolyline } from '../components/map/polyline'
import { apiStationToRouteStation } from '../lib/fuelStation'
import type { RouteStation } from '../lib/routeGeometry'
import { useTripStore } from '../store/tripStore'
import { STATIONS_MAX_DETOUR_KM } from '../config/stations'
import { useTripRoute } from './useTripRoute'

/** Polyline for station search: backend result first, else encoded preview geometry. */
function routePolylineForStations(
  stored: string | undefined,
  trip: ReturnType<typeof useTripRoute>,
): string | undefined {
  if (stored?.trim()) return stored
  if (trip.points.length > 1) return encodePolyline(trip.points)
  return undefined
}

function stationsQueryKey(polyline: string | undefined, distance: number) {
  return ['stations-along-route', polyline, distance, STATIONS_MAX_DETOUR_KM] as const
}

/** Fuel stops from the API only (Mapbox POIs when the backend uses Mapbox). No demo corridor data. */
export function useRouteStations(tripDistanceKm?: number): RouteStation[] {
  const trip = useTripRoute()
  const lastResult = useTripStore((s) => s.lastResult)
  const distance = tripDistanceKm ?? lastResult?.distance_km ?? 0
  const polyline = routePolylineForStations(lastResult?.route_polyline, trip)
  const canFetchLive = Boolean(polyline && distance > 0 && trip.points.length > 1)

  const liveQuery = useQuery({
    queryKey: stationsQueryKey(polyline, distance),
    queryFn: () =>
      getStationsAlongRoute({
        route_polyline: polyline!,
        distance_km: distance,
        max_detour_km: STATIONS_MAX_DETOUR_KM,
      }),
    enabled: canFetchLive,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  return useMemo(() => {
    if (!canFetchLive) return []
    if (liveQuery.data?.map_provider === 'mock') return []
    if (liveQuery.data?.stations?.length) {
      return liveQuery.data.stations.map(apiStationToRouteStation)
    }
    return []
  }, [canFetchLive, liveQuery.data])
}

export function useRouteStationsMeta() {
  const trip = useTripRoute()
  const lastResult = useTripStore((s) => s.lastResult)
  const distance = lastResult?.distance_km ?? 0
  const polyline = routePolylineForStations(lastResult?.route_polyline, trip)
  const canFetchLive = Boolean(polyline && distance > 0 && trip.points.length > 1)

  const liveQuery = useQuery({
    queryKey: stationsQueryKey(polyline, distance),
    queryFn: () =>
      getStationsAlongRoute({
        route_polyline: polyline!,
        distance_km: distance,
        max_detour_km: STATIONS_MAX_DETOUR_KM,
      }),
    enabled: canFetchLive,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  const liveCount = liveQuery.data?.stations?.length ?? 0
  const isMockApi = liveQuery.data?.map_provider === 'mock'

  return {
    isLoading: liveQuery.isLoading || liveQuery.isFetching,
    isLive: Boolean(liveQuery.data?.map_provider === 'mapbox' && liveCount > 0),
    isMockApi,
    needsMapbox: isMockApi || (!polyline && distance > 0),
    fetchFailed: Boolean(liveQuery.isError),
    disclaimer: liveQuery.data?.disclaimer,
    error: liveQuery.error,
  }
}
