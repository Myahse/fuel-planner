import { useEffect, useRef } from 'react'
import { useUserLocation } from '../hooks/useUserLocation'
import { useAppStore } from '../store/appStore'

/** Requests device location on sign-in and keeps coordinates updated while the app is open. */
export function UserLocationSync() {
  const { refresh, userLocation } = useUserLocation()
  const setUserLocation = useAppStore((s) => s.setUserLocation)
  const tried = useRef(false)

  useEffect(() => {
    if (tried.current || userLocation) return
    tried.current = true
    void refresh({ fillOrigin: true })
  }, [refresh, userLocation])

  useEffect(() => {
    if (!navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const prev = useAppStore.getState().userLocation
        if (prev && Math.abs(prev.lat - lat) < 0.00005 && Math.abs(prev.lng - lng) < 0.00005) return
        setUserLocation({
          lat,
          lng,
          label: prev?.label ?? `My location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        })
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 20_000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [setUserLocation])

  return null
}
