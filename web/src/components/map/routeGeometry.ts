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
