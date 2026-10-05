import { parseLatLngString } from '../lib/placeCoords'

export type LatLng = { lat: number; lng: number }

export const PLACES: Record<string, LatLng & { label: string }> = {
  abidjan: { label: 'Abidjan', lat: 5.3599517, lng: -4.0082563 },
  yamoussoukro: { label: 'Yamoussoukro', lat: 6.827621, lng: -5.289343 },
}

/** Default map center (Côte d'Ivoire) when no user position is known. */
export const DEFAULT_MAP_CENTER = PLACES.abidjan

export function resolvePlace(name: string): LatLng | null {
  const parsed = parseLatLngString(name)
  if (parsed) return parsed
  const key = name.trim().toLowerCase()
  if (key.includes('abidjan')) return PLACES.abidjan
  if (key.includes('yamoussoukro')) return PLACES.yamoussoukro
  return null
}
