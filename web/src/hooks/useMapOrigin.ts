import { useMemo } from 'react'
import { DEFAULT_MAP_CENTER, type LatLng } from '../data/mapPlaces'
import { resolveOriginPoint } from '../lib/placeCoords'
import { useAppStore } from '../store/appStore'
import { useTripStore } from '../store/tripStore'

/** Map center / range ring anchor for the current trip start. */
export function useMapOrigin(): LatLng {
  const draft = useTripStore((s) => s.draft)
  const userLocation = useAppStore((s) => s.userLocation)

  return useMemo(() => {
    const coords =
      draft.origin_lat != null && draft.origin_lng != null
        ? { lat: draft.origin_lat, lng: draft.origin_lng }
        : null
    return resolveOriginPoint(draft.origin, coords, userLocation, DEFAULT_MAP_CENTER)
  }, [draft.origin, draft.origin_lat, draft.origin_lng, userLocation])
}
