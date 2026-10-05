import { useMemo } from 'react'
import { DEFAULT_MAP_CENTER, type LatLng } from '../data/mapPlaces'
import { useAppStore } from '../store/appStore'

/** Camera anchor: live GPS when available, otherwise country default. */
export function useUserMapCenter(): LatLng {
  const userLocation = useAppStore((s) => s.userLocation)
  return useMemo(
    () => (userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : DEFAULT_MAP_CENTER),
    [userLocation?.lat, userLocation?.lng],
  )
}
