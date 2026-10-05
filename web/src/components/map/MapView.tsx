import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { MapViewProps } from './types'
import { MapSkeleton } from '../Skeleton'
import 'leaflet/dist/leaflet.css'

const markerIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.25)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })

function FitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length < 2) return
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [map, points])
  return null
}

export function MapView({
  center = { lat: 5.36, lng: -4.01 },
  zoom = 7,
  markers = [],
  route,
  rangeCircle,
  className = '',
  interactive = true,
  loading,
}: MapViewProps) {
  const routePoints = useMemo(() => route?.points ?? [], [route?.points])

  if (loading) {
    return <MapSkeleton />
  }

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        className="h-full w-full min-h-[inherit] z-0"
        style={{ minHeight: 'inherit' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {routePoints.length > 1 && (
          <>
            <Polyline positions={routePoints.map((p) => [p.lat, p.lng])} pathOptions={{ color: '#2563EB', weight: 5, opacity: 0.85 }} />
            <FitBounds points={routePoints} />
          </>
        )}
        {rangeCircle && (
          <Circle
            center={[rangeCircle.center.lat, rangeCircle.center.lng]}
            radius={rangeCircle.radiusMeters}
            pathOptions={{ color: '#22C55E', fillColor: '#22C55E', fillOpacity: 0.12, weight: 2 }}
          />
        )}
        {markers.map((m) => {
          const color =
            m.variant === 'origin'
              ? '#166534'
              : m.variant === 'destination'
                ? '#DC2626'
                : m.variant === 'station'
                  ? '#F59E0B'
                  : '#2563EB'
          return <Marker key={m.id} position={[m.lat, m.lng]} icon={markerIcon(color)} />
        })}
      </MapContainer>
    </div>
  )
}
