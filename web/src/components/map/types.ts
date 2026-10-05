export type MapMarker = {
  id: string
  lat: number
  lng: number
  label?: string
  variant?: 'origin' | 'destination' | 'station' | 'user'
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
}
