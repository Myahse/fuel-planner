import { useMemo } from 'react'
import type { TripCalculateResult } from '../api/types'
import { useTripStore } from '../store/tripStore'
import { DEFAULT_MAP_CENTER, resolvePlace, type LatLng } from '../data/mapPlaces'
import { resolveOriginPoint } from '../lib/placeCoords'
import { useAppStore } from '../store/appStore'
import { interpolateRoute, routeThroughStops } from '../components/map/routeGeometry'
import { decodePolyline } from '../components/map/polyline'
import {
  draftMatchesStoredPlan,
  draftRouteStops,
  loadStoredTripPlan,
} from '../lib/tripRoutePlan'
import { useMapboxRoutePreview } from './useMapboxRoutePreview'

function storedResult(): TripCalculateResult | null {
  try {
    return JSON.parse(sessionStorage.getItem('lastTripResult') || 'null')
  } catch {
    return null
  }
}

export type TripRoute = { origin: LatLng; destination: LatLng; points: LatLng[]; real: boolean }

function endpointsFromStops(stops: LatLng[]): { origin: LatLng; destination: LatLng } {
  return { origin: stops[0], destination: stops[stops.length - 1] }
}

/** Route line for the map: calculated polyline, live preview through stops, or straight legs. */
export function useTripRoute(): TripRoute {
  const { draft, lastResult } = useTripStore()
  const userLocation = useAppStore((s) => s.userLocation)
  const result = lastResult ?? storedResult()
  const storedPlan = loadStoredTripPlan()

  const stops = useMemo(() => draftRouteStops(draft, userLocation), [draft, userLocation])
  const planMatches = draftMatchesStoredPlan(draft, storedPlan)
  const polylineTrusted = Boolean(result?.route_polyline) && planMatches
  const draftWaypointCount =
    draft.trip_type === 'multi_stop'
      ? draft.waypoints.filter((w) => w.lat != null && w.lng != null).length
      : 0
  const resultMissingStops =
    draft.trip_type === 'multi_stop' &&
    draftWaypointCount > 0 &&
    planMatches &&
    (result?.waypoint_count ?? 0) < draftWaypointCount

  const preview = useMapboxRoutePreview(
    stops,
    draft.preference,
    !polylineTrusted || resultMissingStops,
  )

  return useMemo(() => {
    if (
      polylineTrusted &&
      !resultMissingStops &&
      result?.route_polyline &&
      result.origin_coords &&
      result.destination_coords
    ) {
      const origin = { lat: result.origin_coords[0], lng: result.origin_coords[1] }
      const destination = { lat: result.destination_coords[0], lng: result.destination_coords[1] }
      return {
        origin,
        destination,
        points: decodePolyline(result.route_polyline),
        real: true,
      }
    }

    if (stops && stops.length >= 2) {
      const { origin, destination } = endpointsFromStops(stops)

      if (preview.data && preview.data.length > 1) {
        return { origin, destination, points: preview.data, real: true }
      }

      return {
        origin,
        destination,
        points: routeThroughStops(stops),
        real: false,
      }
    }

    if (result?.origin_coords && result.destination_coords) {
      const origin = { lat: result.origin_coords[0], lng: result.origin_coords[1] }
      const destination = { lat: result.destination_coords[0], lng: result.destination_coords[1] }
      if (result.route_polyline) {
        return { origin, destination, points: decodePolyline(result.route_polyline), real: true }
      }
      return { origin, destination, points: interpolateRoute(origin, destination), real: false }
    }

    const originName = (result?.origin ?? draft.origin).trim()
    const destName = (result?.destination ?? draft.destination).trim()
    const originCoords =
      draft.origin_lat != null && draft.origin_lng != null
        ? { lat: draft.origin_lat, lng: draft.origin_lng }
        : null
    const origin = resolveOriginPoint(originName, originCoords, userLocation, DEFAULT_MAP_CENTER)
    const destination = resolvePlace(destName)
    if (!destName || !destination) {
      return { origin, destination: origin, points: [], real: false }
    }
    return { origin, destination, points: interpolateRoute(origin, destination), real: false }
  }, [
    stops,
    polylineTrusted,
    resultMissingStops,
    result?.waypoint_count,
    result?.route_polyline,
    result?.origin_coords,
    result?.destination_coords,
    result?.origin,
    result?.destination,
    preview.data,
    draft.origin,
    draft.destination,
    draft.origin_lat,
    draft.origin_lng,
    userLocation?.lat,
    userLocation?.lng,
  ])
}
