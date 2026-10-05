export type LatLng = { lat: number; lng: number }

export const PLACES: Record<string, LatLng & { label: string }> = {
  abidjan: { label: 'Abidjan', lat: 5.3599517, lng: -4.0082563 },
  yamoussoukro: { label: 'Yamoussoukro', lat: 6.827621, lng: -5.289343 },
}

export function resolvePlace(name: string): LatLng | null {
  const key = name.trim().toLowerCase()
  if (key.includes('abidjan')) return PLACES.abidjan
  if (key.includes('yamoussoukro')) return PLACES.yamoussoukro
  return null
}
