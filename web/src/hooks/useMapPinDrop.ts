import { useCallback } from 'react'
import { reverseGeocodeLabel } from '../lib/reverseGeocode'
import { useTripStore } from '../store/tripStore'

/** Apply a map tap to the active pin target (origin, destination, or a multi-stop waypoint). */
export function useMapPinDrop() {
  const setDraft = useTripStore((s) => s.setDraft)
  const setMapPinMode = useTripStore((s) => s.setMapPinMode)

  return useCallback(
    async (lat: number, lng: number) => {
      const { mapPinTarget, draft } = useTripStore.getState()
      let label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      try {
        label = await reverseGeocodeLabel(lat, lng)
      } catch {
        /* keep coordinate label */
      }

      if (mapPinTarget.kind === 'destination') {
        setDraft({ destination: label, destination_lat: lat, destination_lng: lng })
      } else if (mapPinTarget.kind === 'origin') {
        setDraft({ origin: label, origin_lat: lat, origin_lng: lng })
      } else if (mapPinTarget.kind === 'waypoint') {
        setDraft({
          waypoints: draft.waypoints.map((w) =>
            w.id === mapPinTarget.id ? { ...w, label, lat, lng } : w,
          ),
        })
      }

      setMapPinMode(false)
    },
    [setDraft, setMapPinMode],
  )
}
