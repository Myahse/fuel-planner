import { useEffect, useState } from 'react'
import { MAPBOX_COUNTRY, MAPBOX_TOKEN } from '../config/mapbox'

export type PlaceSuggestion = { id: string; name: string; context: string; lat: number; lng: number }

export function placeSuggestionLabel(p: PlaceSuggestion): string {
  const name = p.name.trim()
  const ctx = p.context.trim()
  return ctx ? `${name}, ${ctx}` : name
}

type GeocodeFeature = {
  id: string
  geometry: { coordinates: [number, number] }
  properties: { name: string; place_formatted?: string }
}

/**
 * Debounced place autocomplete from the Mapbox Geocoding API v6, biased to the app's country.
 * Returns nothing when no token is configured, so inputs degrade to plain text.
 */
export function usePlaceSuggestions(query: string, enabled: boolean) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const q = query.trim()

  useEffect(() => {
    if (!MAPBOX_TOKEN || !enabled || q.length < 2) {
      setSuggestions([])
      return
    }
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          q,
          autocomplete: 'true',
          limit: '5',
          country: MAPBOX_COUNTRY,
          language: 'fr,en',
          access_token: MAPBOX_TOKEN,
        })
        const res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, { signal: ctrl.signal })
        if (!res.ok) throw new Error(String(res.status))
        const data = (await res.json()) as { features: GeocodeFeature[] }
        setSuggestions(
          data.features.map((f) => ({
            id: f.id,
            name: f.properties.name,
            context: f.properties.place_formatted ?? '',
            lng: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
          })),
        )
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [q, enabled])

  return { suggestions, loading }
}
