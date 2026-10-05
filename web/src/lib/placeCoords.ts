import type { LatLng } from '../data/mapPlaces'

/** Parse `lat,lng` strings (same format the Go API accepts). */
export function parseLatLngString(text: string): LatLng | null {
  const parts = text.split(',')
  if (parts.length !== 2) return null
  const lat = Number.parseFloat(parts[0].trim())
  const lng = Number.parseFloat(parts[1].trim())
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null
  }
  return { lat, lng }
}

export function formatLatLngQuery({ lat, lng }: LatLng): string {
  return `${lat},${lng}`
}

export type UserLocation = { lat: number; lng: number; label?: string }

/** Best map/API point for the trip start: explicit coords, geocoded name, then device location. */
export function resolveOriginPoint(
  originText: string,
  originCoords: LatLng | null | undefined,
  userLocation: Pick<UserLocation, 'lat' | 'lng'> | null | undefined,
  fallback: LatLng,
): LatLng {
  if (originCoords) return originCoords
  const fromText = parseLatLngString(originText) ?? null
  if (fromText) return fromText
  if (userLocation) return { lat: userLocation.lat, lng: userLocation.lng }
  return fallback
}

/** Origin string sent to `/trips/calculate` (coords when known). */
export function originForApi(
  originText: string,
  originCoords: LatLng | null | undefined,
  userLocation: UserLocation | null | undefined,
): string {
  const trimmed = originText.trim()
  if (originCoords) return formatLatLngQuery(originCoords)
  if (parseLatLngString(trimmed)) return trimmed
  if (!trimmed && userLocation) return formatLatLngQuery(userLocation)
  return trimmed
}
