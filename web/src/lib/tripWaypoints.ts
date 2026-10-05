import { formatLatLngQuery } from './placeCoords'
import type { TripWaypoint } from '../store/tripStore'

/** Ordered waypoint queries for `/trips/calculate` (coords preferred). */
export function waypointsForApi(waypoints: TripWaypoint[]): string[] {
  const out: string[] = []
  for (const w of waypoints) {
    if (w.lat != null && w.lng != null) {
      out.push(formatLatLngQuery({ lat: w.lat, lng: w.lng }))
    } else if (w.label.trim()) {
      out.push(w.label.trim())
    }
  }
  return out
}

/** Every filled stop must have coordinates so routing matches the map pins. */
export function multiStopReadyForCalc(waypoints: TripWaypoint[]): boolean {
  const filled = waypoints.filter((w) => w.label.trim() || (w.lat != null && w.lng != null))
  if (filled.length === 0) return false
  return filled.every((w) => w.lat != null && w.lng != null)
}

export function waypointsQueryKey(queries: string[]): string {
  return queries.join('\0')
}
