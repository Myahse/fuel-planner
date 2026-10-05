import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { MapViewProps } from './types'
import { MapSkeleton } from '../Skeleton'
import { colors } from '../../design/tokens'
import 'leaflet/dist/leaflet.css'

const markerIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:999px;background:${color};border:3px solid ${colors.espresso};box-shadow:0 2px 0 ${colors.espresso}"></div>`,
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

export default function LeafletMapView({
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
    <div className={`relative overflow-hidden bg-panel-2 ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        className="h-full w-full min-h-[inherit] z-0"
        style={{ minHeight: 'inherit' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {routePoints.length > 1 && (
          <>
            <Polyline positions={routePoints.map((p) => [p.lat, p.lng])} pathOptions={{ color: colors.signal, weight: 5, opacity: 1 }} />
            <FitBounds points={routePoints} />
          </>
        )}
        {rangeCircle && (
          <Circle
            center={[rangeCircle.center.lat, rangeCircle.center.lng]}
            radius={rangeCircle.radiusMeters}
            pathOptions={{ color: colors.signal, fillColor: colors.signal, fillOpacity: 0.06, weight: 1, dashArray: '4 6' }}
          />
        )}
        {markers.map((m) => {
          const color =
            m.variant === 'origin'
              ? colors.mustard
              : m.variant === 'destination'
                ? colors.signal
                : m.variant === 'station'
                  ? colors.teal
                  : '#7cc4ff'
          return <Marker key={m.id} position={[m.lat, m.lng]} icon={markerIcon(color)} />
        })}
      </MapContainer>
    </div>
  )
}
