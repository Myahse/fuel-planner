import type { LatLng } from '../data/mapPlaces'
import type { FuelStation } from '../data/mockStations'

const R = 6371

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

type Projection = { lat: number; lng: number; distanceAlongKm: number; distanceOffKm: number }

/** Closest point on a polyline and how far along the route it is. */
export function nearestOnPolyline(route: LatLng[], point: LatLng): Projection | null {
  if (route.length < 2) return null
  let best: Projection | null = null
  let along = 0
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]
    const b = route[i]
    const segLen = haversineKm(a, b)
    const proj = projectOnSegment(a, b, point)
    const off = haversineKm(point, { lat: proj.lat, lng: proj.lng })
    const at = along + segLen * proj.t
    if (!best || off < best.distanceOffKm) {
      best = { lat: proj.lat, lng: proj.lng, distanceAlongKm: at, distanceOffKm: off }
    }
    along += segLen
  }
  return best
}

function projectOnSegment(a: LatLng, b: LatLng, p: LatLng) {
  const ax = a.lng
  const ay = a.lat
  const bx = b.lng
  const by = b.lat
  const px = p.lng
  const py = p.lat
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
  return { lat: ay + t * dy, lng: ax + t * dx, t }
}

export type RouteStation = FuelStation & {
  /** Position snapped onto the driven route polyline. */
  routeLat: number
  routeLng: number
  distanceKmFromStart: number
}

/** Place stations on the road geometry; drop stops too far from the route corridor. */
export function snapStationsToRoute(
  stations: FuelStation[],
  route: LatLng[],
  tripDistanceKm: number,
  maxDetourKm = 10,
): RouteStation[] {
  if (route.length < 2 || tripDistanceKm <= 0) return []

  let polylineKm = 0
  for (let i = 1; i < route.length; i++) polylineKm += haversineKm(route[i - 1], route[i])
  const scale = polylineKm > 0 ? tripDistanceKm / polylineKm : 1

  const out: RouteStation[] = []
  for (const st of stations) {
    const proj = nearestOnPolyline(route, { lat: st.lat, lng: st.lng })
    if (!proj || proj.distanceOffKm > maxDetourKm) continue
    const km = Math.round(proj.distanceAlongKm * scale)
    if (km <= 0 || km >= tripDistanceKm) continue
    out.push({
      ...st,
      routeLat: proj.lat,
      routeLng: proj.lng,
      lat: proj.lat,
      lng: proj.lng,
      distanceKmFromStart: km,
    })
  }
  return out.sort((a, b) => a.distanceKmFromStart - b.distanceKmFromStart)
}
