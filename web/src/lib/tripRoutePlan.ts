import { DEFAULT_MAP_CENTER, resolvePlace, type LatLng } from '../data/mapPlaces'
import { parseLatLngString, resolveOriginPoint } from './placeCoords'
import type { TripPlanDraft } from '../store/tripStore'
import { waypointsForApi, waypointsQueryKey } from './tripWaypoints'

export function loadStoredTripPlan(): TripPlanDraft | null {
  try {
    return JSON.parse(sessionStorage.getItem('lastTripPlan') || 'null') as TripPlanDraft | null
  } catch {
    return null
  }
}

/** True when the last calculated trip used the same stops and endpoints as the current draft. */
export function draftMatchesStoredPlan(draft: TripPlanDraft, stored: TripPlanDraft | null): boolean {
  if (!stored) return false
  if (draft.trip_type !== stored.trip_type) return false
  if (draft.origin.trim() !== stored.origin.trim() || draft.destination.trim() !== stored.destination.trim()) {
    return false
  }
  if (draft.origin_lat !== stored.origin_lat || draft.origin_lng !== stored.origin_lng) return false
  if (draft.destination_lat !== stored.destination_lat || draft.destination_lng !== stored.destination_lng) {
    return false
  }
  if (draft.trip_type !== 'multi_stop') return true
  const a = waypointsForApi(draft.waypoints)
  const b = waypointsForApi(stored.waypoints)
  return waypointsQueryKey(a) === waypointsQueryKey(b)
}

function resolveDestination(draft: TripPlanDraft): LatLng | null {
  if (draft.destination_lat != null && draft.destination_lng != null) {
    return { lat: draft.destination_lat, lng: draft.destination_lng }
  }
  const fromText = parseLatLngString(draft.destination.trim())
  if (fromText) return fromText
  const named = resolvePlace(draft.destination.trim())
  return named ?? null
}

/** Ordered path: start → stops (multi-stop) → end. Null if the end is not resolved yet. */
export function draftRouteStops(
  draft: TripPlanDraft,
  userLocation: { lat: number; lng: number } | null | undefined,
): LatLng[] | null {
  const origin = resolveOriginPoint(
    draft.origin,
    draft.origin_lat != null && draft.origin_lng != null
      ? { lat: draft.origin_lat, lng: draft.origin_lng }
      : null,
    userLocation,
    DEFAULT_MAP_CENTER,
  )
  const destination = resolveDestination(draft)
  if (!destination) return null

  const stops: LatLng[] = [origin]
  if (draft.trip_type === 'multi_stop') {
    for (const w of draft.waypoints) {
      if (w.lat != null && w.lng != null) stops.push({ lat: w.lat, lng: w.lng })
    }
  }
  stops.push(destination)
  return stops.length >= 2 ? stops : null
}

export function routeStopsKey(stops: LatLng[] | null): string {
  if (!stops) return ''
  return stops.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|')
}
