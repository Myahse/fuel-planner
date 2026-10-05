import { MAPBOX_TOKEN } from '../config/mapbox'

type ReverseFeature = {
  properties: { name?: string; place_formatted?: string; full_address?: string }
}

/** Turn coordinates into a short place label for the origin field. */
export async function reverseGeocodeLabel(lat: number, lng: number): Promise<string> {
  if (!MAPBOX_TOKEN) {
    return `My location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
  }
  const params = new URLSearchParams({
    longitude: String(lng),
    latitude: String(lat),
    language: 'fr,en',
    access_token: MAPBOX_TOKEN,
  })
  const res = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?${params}`)
  if (!res.ok) throw new Error(`reverse geocode ${res.status}`)
  const data = (await res.json()) as { features: ReverseFeature[] }
  const f = data.features[0]?.properties
  if (!f) return `My location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
  if (f.name && f.place_formatted) return `${f.name}, ${f.place_formatted}`
  return f.full_address ?? f.name ?? `My location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
}
