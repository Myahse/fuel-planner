import { useQuery } from '@tanstack/react-query'
import type { LatLng } from '../data/mapPlaces'
import { decodePolyline } from '../components/map/polyline'
import { MAPBOX_TOKEN } from '../config/mapbox'
import { routeStopsKey } from '../lib/tripRoutePlan'

function drivingProfile(preference: 'fastest' | 'efficient' | 'cheapest'): string {
  return preference === 'fastest' ? 'driving-traffic' : 'driving'
}

/** Road geometry through all draft stops (Mapbox Directions, public token). */
export function useMapboxRoutePreview(
  stops: LatLng[] | null,
  preference: 'fastest' | 'efficient' | 'cheapest',
  enabled = true,
) {
  const key = routeStopsKey(stops)
  return useQuery({
    queryKey: ['mapbox-route-preview', key, preference],
    queryFn: async (): Promise<LatLng[]> => {
      const profile = drivingProfile(preference)
      const coordPath = stops!.map((p) => `${p.lng},${p.lat}`).join(';')
      const url =
        `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordPath}` +
        `?geometries=polyline6&overview=full&alternatives=false&access_token=${encodeURIComponent(MAPBOX_TOKEN)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`directions ${res.status}`)
      const data = (await res.json()) as {
        code?: string
        routes?: { geometry?: string }[]
      }
      const geometry = data.routes?.[0]?.geometry
      if (data.code !== 'Ok' || !geometry) throw new Error(data.code ?? 'no route')
      return decodePolyline(geometry)
    },
    enabled: enabled && Boolean(MAPBOX_TOKEN && stops && stops.length >= 2),
    staleTime: 60_000,
    retry: 1,
  })
}
