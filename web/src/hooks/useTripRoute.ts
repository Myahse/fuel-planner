import { useMemo } from 'react'
import type { TripCalculateResult } from '../api/types'
import { useTripStore } from '../store/tripStore'
import { PLACES, resolvePlace, type LatLng } from '../data/mapPlaces'
import { interpolateRoute } from '../components/map/routeGeometry'
import { decodePolyline } from '../components/map/polyline'

function storedResult(): TripCalculateResult | null {
  try {
    return JSON.parse(sessionStorage.getItem('lastTripResult') || 'null')
  } catch {
    return null
  }
}

export type TripRoute = { origin: LatLng; destination: LatLng; points: LatLng[]; real: boolean }

/** Route of the last calculated trip: the real road geometry when the backend used Mapbox, else a straight demo line. */
export function routeFromResult(result: TripCalculateResult | null, fallback: { origin: string; destination: string }): TripRoute {
  if (result?.origin_coords && result.destination_coords) {
    const origin = { lat: result.origin_coords[0], lng: result.origin_coords[1] }
    const destination = { lat: result.destination_coords[0], lng: result.destination_coords[1] }
    if (result.route_polyline) {
      return { origin, destination, points: decodePolyline(result.route_polyline), real: true }
    }
    return { origin, destination, points: interpolateRoute(origin, destination), real: false }
  }
  const origin = resolvePlace(result?.origin ?? fallback.origin) ?? PLACES.abidjan
  const destination = resolvePlace(result?.destination ?? fallback.destination) ?? PLACES.yamoussoukro
  return { origin, destination, points: interpolateRoute(origin, destination), real: false }
}

export function useTripRoute(): TripRoute {
  const { draft, lastResult } = useTripStore()
  const result = lastResult ?? storedResult()
  return useMemo(
    () => routeFromResult(result, draft),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result?.route_polyline, result?.origin, result?.destination, draft.origin, draft.destination],
  )
}
