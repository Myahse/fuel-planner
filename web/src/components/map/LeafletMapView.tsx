import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { MapViewProps } from './types'
import { routePinHtml } from './routePin'
import { MapSkeleton } from '../Skeleton'
import { themeColors } from '../../design/tokens'
import { useResolvedTheme } from '../../hooks/useResolvedTheme'
import 'leaflet/dist/leaflet.css'

const markerIcon = (color: string, border: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:4px;background:${color};border:2px solid ${border}"></div>`,
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

function FollowCenter({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom, { animate: true })
  }, [map, center.lat, center.lng, zoom])
  return null
}

function MapClickLayer({ onMapClick, active }: { onMapClick?: (lat: number, lng: number) => void; active: boolean }) {
  useMapEvents({
    click(e) {
      if (!active || !onMapClick) return
      const t = e.originalEvent.target as HTMLElement
      if (t.closest('.city-pin, .map-station-pin, .map-route-pin, .leaflet-control')) return
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function FocusPoint({ point, zoom }: { point: { lat: number; lng: number } | null; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    if (!point) return
    map.flyTo([point.lat, point.lng], zoom, { duration: 0.5 })
  }, [map, point?.lat, point?.lng, zoom])
  return null
}

function RecenterOnTick({
  center,
  zoom,
  tick,
}: {
  center: { lat: number; lng: number }
  zoom: number
  tick: number
}) {
  const map = useMap()
  useEffect(() => {
    if (!tick) return
    map.flyTo([center.lat, center.lng], zoom, { duration: 0.9 })
  }, [tick, center.lat, center.lng, zoom, map])
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
  cameraLock = 'user',
  recenterTick = 0,
  mapClickActive = false,
  onMapClick,
  onMarkerClick,
  focusPoint = null,
  focusZoom = 15,
}: MapViewProps) {
  const resolvedTheme = useResolvedTheme()
  const palette = themeColors(resolvedTheme)
  const routePoints = useMemo(() => route?.points ?? [], [route?.points])
  const tiles =
    resolvedTheme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

  if (loading) {
    return <MapSkeleton />
  }

  return (
    <div className={`relative h-full w-full min-h-[inherit] overflow-hidden bg-bg ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        className="h-full w-full min-h-[inherit] z-0"
        style={{ minHeight: 'inherit', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tiles}
        />
        {cameraLock === 'user' ? <FollowCenter center={center} zoom={zoom} /> : null}
        <RecenterOnTick center={center} zoom={zoom} tick={recenterTick} />
        <FocusPoint point={focusPoint} zoom={focusZoom} />
        <MapClickLayer onMapClick={onMapClick} active={mapClickActive} />
        {routePoints.length > 1 && (
          <>
            <Polyline positions={routePoints.map((p) => [p.lat, p.lng])} pathOptions={{ color: palette.signal, weight: 5, opacity: 1 }} />
            {cameraLock === 'content' ? <FitBounds points={routePoints} /> : null}
          </>
        )}
        {rangeCircle && (
          <Circle
            center={[rangeCircle.center.lat, rangeCircle.center.lng]}
            radius={rangeCircle.radiusMeters}
            pathOptions={{ color: palette.signal, fillColor: palette.signal, fillOpacity: 0.06, weight: 1, dashArray: '4 6' }}
          />
        )}
        {markers.map((m) => {
          const routeHtml = routePinHtml(m)
          if (routeHtml) {
            const size = m.variant === 'destination' ? 36 : 32
            const icon = L.divIcon({
              className: '',
              html: routeHtml,
              iconSize: [size, size],
              iconAnchor: [size / 2, size / 2],
            })
            return (
              <Marker
                key={m.id}
                position={[m.lat, m.lng]}
                icon={icon}
                zIndexOffset={m.variant === 'waypoint' ? 400 : 300}
                eventHandlers={{ click: () => onMarkerClick?.(m.id) }}
              />
            )
          }
          if (m.variant === 'station') {
            const icon = L.divIcon({
              className: '',
              html: `<button type="button" class="map-station-pin" aria-pressed="${Boolean(m.selected)}" title="${m.label ?? ''}"></button>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            })
            return (
              <Marker
                key={m.id}
                position={[m.lat, m.lng]}
                icon={icon}
                zIndexOffset={m.selected ? 500 : 0}
                eventHandlers={{ click: () => onMarkerClick?.(m.id) }}
              />
            )
          }
          if (m.variant === 'city') {
            const icon = L.divIcon({
              className: '',
              html: `<button type="button" class="city-pin" data-tone="${m.tone ?? 'ok'}" aria-pressed="${Boolean(m.selected)}"><i></i>${m.label ?? ''}</button>`,
              iconSize: undefined,
              iconAnchor: [8, 12],
            })
            return <Marker key={m.id} position={[m.lat, m.lng]} icon={icon} eventHandlers={{ click: () => onMarkerClick?.(m.id) }} />
          }
          const color =
            m.variant === 'origin'
              ? palette.fg
              : m.variant === 'destination' || m.variant === 'waypoint'
                ? palette.signal
                : '#4a90d9'
          return <Marker key={m.id} position={[m.lat, m.lng]} icon={markerIcon(color, palette.bg)} />
        })}
      </MapContainer>
    </div>
  )
}
