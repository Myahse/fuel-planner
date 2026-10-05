import { useCallback, useState } from 'react'
import { reverseGeocodeLabel } from '../lib/reverseGeocode'
import { useAppStore } from '../store/appStore'
import { useTripStore } from '../store/tripStore'

export function useUserLocation() {
  const userLocation = useAppStore((s) => s.userLocation)
  const setUserLocation = useAppStore((s) => s.setUserLocation)
  const setDraft = useTripStore((s) => s.setDraft)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(
    (opts?: { fillOrigin?: boolean }) => {
      if (!navigator.geolocation) {
        setError('Location is not supported in this browser.')
        return Promise.resolve(null)
      }
      setLoading(true)
      setError(null)
      return new Promise<{ lat: number; lng: number; label: string } | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude
            const lng = pos.coords.longitude
            try {
              const label = await reverseGeocodeLabel(lat, lng)
              const loc = { lat, lng, label }
              setUserLocation(loc)
              const draft = useTripStore.getState().draft
              if (opts?.fillOrigin !== false && !draft.origin.trim()) {
                setDraft({ origin: label, origin_lat: lat, origin_lng: lng })
              }
              setLoading(false)
              resolve(loc)
            } catch {
              const loc = { lat, lng, label: `My location (${lat.toFixed(4)}, ${lng.toFixed(4)})` }
              setUserLocation(loc)
              setLoading(false)
              resolve(loc)
            }
          },
          (err) => {
            setLoading(false)
            const msg =
              err.code === err.PERMISSION_DENIED
                ? 'Allow location access in your browser to use your position.'
                : 'Could not get your location. Try again.'
            setError(msg)
            resolve(null)
          },
          { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
        )
      })
    },
    [setDraft, setUserLocation],
  )

  const applyToOrigin = useCallback(() => {
    if (userLocation) {
      setDraft({ origin: userLocation.label, origin_lat: userLocation.lat, origin_lng: userLocation.lng })
      return Promise.resolve(userLocation)
    }
    return refresh({ fillOrigin: true })
  }, [refresh, setDraft, userLocation])

  return { userLocation, loading, error, refresh, applyToOrigin }
}
