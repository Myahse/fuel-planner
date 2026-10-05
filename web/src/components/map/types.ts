export type MapMarker = {
  id: string
  lat: number
  lng: number
  label?: string
  /** 'city' draws a labelled pin coloured by `tone` that can be tapped. */
  variant?: 'origin' | 'destination' | 'station' | 'waypoint' | 'user' | 'city'
  tone?: 'ok' | 'low' | 'out'
  selected?: boolean
  /** 1-based stop number for `waypoint` markers on multi-stop trips */
  stopIndex?: number
}

export type MapRoute = {
  points: { lat: number; lng: number }[]
}

export type MapViewProps = {
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: MapMarker[]
  route?: MapRoute
  rangeCircle?: { center: { lat: number; lng: number }; radiusMeters: number }
  className?: string
  interactive?: boolean
  loading?: boolean
  onMarkerClick?: (id: string) => void
  /** 'navigation' tilts the camera and uses the night-driving style (Mapbox only) */
  mode?: 'default' | 'navigation'
  /** `user` keeps the camera on `center` (your GPS). `content` fits the route or markers. */
  cameraLock?: 'user' | 'content'
  /** Bumped by the recenter control to fly the camera back to `center`. */
  recenterTick?: number
  showRecenter?: boolean
  /** Tap map to set destination (when pin mode is on in MapView). */
  allowMapPin?: boolean
  onMapClick?: (lat: number, lng: number) => void
  /** When true, map clicks call `onMapClick` (used internally for pin mode). */
  mapClickActive?: boolean
  /** When set, the map eases to this point (e.g. selected fuel station). */
  focusPoint?: { lat: number; lng: number } | null
  focusZoom?: number
  /** Use trip store for pin target/mode (plan page: stops + destination). */
  syncTripPin?: boolean
}
