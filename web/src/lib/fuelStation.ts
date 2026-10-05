import type { FuelStation } from '../data/mockStations'
import type { RouteStation } from './routeGeometry'

export type ApiFuelStation = {
  id: string
  name: string
  brand: string
  town: string
  lat: number
  lng: number
  route_lat: number
  route_lng: number
  distance_km_from_start: number
  price_per_liter: number
  currency: string
  fuel_type: string
}

export function apiStationToRouteStation(s: ApiFuelStation): RouteStation {
  return {
    id: s.id,
    name: s.name,
    brand: s.brand,
    town: s.town || s.name,
    distanceKmFromStart: Math.round(s.distance_km_from_start),
    pricePerLiter: s.price_per_liter,
    lat: s.lat,
    lng: s.lng,
    routeLat: s.route_lat || s.lat,
    routeLng: s.route_lng || s.lng,
  }
}

/** Map pin at the real POI; route snap is only used for km along the trip. */
export function stationMapPosition(s: Pick<RouteStation, 'lat' | 'lng'>) {
  return { lat: s.lat, lng: s.lng }
}

export function formatStationPrice(pricePerLiter: number, fallback?: number): string {
  if (pricePerLiter > 0) return String(Math.round(pricePerLiter))
  if (fallback != null && fallback > 0) return `~${Math.round(fallback)}`
  return '—'
}

export function stationSortPrice(a: FuelStation | RouteStation, b: FuelStation | RouteStation, fallback: number) {
  const pa = a.pricePerLiter > 0 ? a.pricePerLiter : fallback
  const pb = b.pricePerLiter > 0 ? b.pricePerLiter : fallback
  return pa - pb
}
