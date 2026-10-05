import type { LatLng } from '../../data/mapPlaces'

/** Simple interpolated route for demo — replace with routing API */
export function interpolateRoute(origin: LatLng, destination: LatLng, steps = 24) {
  const points: LatLng[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    points.push({
      lat: origin.lat + (destination.lat - origin.lat) * t,
      lng: origin.lng + (destination.lng - origin.lng) * t,
    })
  }
  return points
}

/** Straight-line legs through each stop in order (fallback when no road geometry). */
export function routeThroughStops(stops: LatLng[], stepsPerLeg = 18): LatLng[] {
  if (stops.length < 2) return stops
  const points: LatLng[] = []
  for (let i = 0; i < stops.length - 1; i++) {
    const seg = interpolateRoute(stops[i], stops[i + 1], stepsPerLeg)
    if (points.length === 0) points.push(...seg)
    else points.push(...seg.slice(1))
  }
  return points
}
