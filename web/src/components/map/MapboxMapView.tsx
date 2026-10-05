import { useEffect, useRef, useState } from 'react'
import mapboxgl, { type GeoJSONSource, type LngLatLike } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { MapMarker, MapViewProps } from './types'
import { MAPBOX_TOKEN, MAP_STYLES } from '../../config/mapbox'
import { colors } from '../../design/tokens'

mapboxgl.accessToken = MAPBOX_TOKEN

const ROUTE = 'fuelgo-route'
const RANGE = 'fuelgo-range'
const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

const markerColor = (v: MapMarker['variant']) =>
  v === 'origin' ? colors.fg : v === 'destination' ? colors.signal : v === 'station' ? colors.ok : '#7cc4ff'

function markerElement(m: MapMarker) {
  const el = document.createElement('div')
  const c = markerColor(m.variant)
  el.style.cssText = `width:14px;height:14px;border-radius:999px;background:${c};border:3px solid ${colors.bg};box-shadow:0 0 14px ${c}`
  if (m.label) el.title = m.label
  return el
}

/** Geodesic-enough circle polygon for the range ring (64 segments). */
function circle(center: { lat: number; lng: number }, radiusMeters: number): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = []
  const dLat = radiusMeters / 111_320
  const dLng = radiusMeters / (111_320 * Math.cos((center.lat * Math.PI) / 180))
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * 2 * Math.PI
    coords.push([center.lng + dLng * Math.cos(a), center.lat + dLat * Math.sin(a)])
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } }
}

function addLayers(map: mapboxgl.Map) {
  map.addSource(ROUTE, { type: 'geojson', data: EMPTY })
  map.addSource(RANGE, { type: 'geojson', data: EMPTY })
  map.addLayer({ id: `${RANGE}-fill`, type: 'fill', source: RANGE, paint: { 'fill-color': colors.signal, 'fill-opacity': 0.1 } })
  map.addLayer({
    id: `${RANGE}-line`,
    type: 'line',
    source: RANGE,
    paint: { 'line-color': colors.signal, 'line-width': 1, 'line-dasharray': [2, 3], 'line-opacity': 0.8 },
  })
  map.addLayer({
    id: `${ROUTE}-casing`,
    type: 'line',
    source: ROUTE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': colors.bg, 'line-width': 9, 'line-opacity': 0.8 },
  })
  map.addLayer({
    id: ROUTE,
    type: 'line',
    source: ROUTE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': colors.signal, 'line-width': 5 },
  })
}

export default function MapboxMapView({
  center = { lat: 5.36, lng: -4.01 },
  zoom = 7,
  markers = [],
  route,
  rangeCircle,
  className = '',
  interactive = true,
  mode = 'default',
}: MapViewProps) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRefs = useRef<mapboxgl.Marker[]>([])
  const [ready, setReady] = useState(false)

  // Create the map once; style changes recreate it.
  useEffect(() => {
    if (!container.current) return
    const map = new mapboxgl.Map({
      container: container.current,
      style: MAP_STYLES[mode],
      center: [center.lng, center.lat],
      zoom,
      pitch: mode === 'navigation' ? 55 : 0,
      interactive,
      attributionControl: false,
      cooperativeGestures: false,
    })
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
    if (interactive) map.addControl(new mapboxgl.NavigationControl({ showCompass: mode === 'navigation' }), 'top-left')
    // 'style.load' fires once the style is parsed; 'load' also waits for every first tile, which can stall on slow networks.
    map.on('style.load', () => {
      addLayers(map)
      setReady(true)
    })
    mapRef.current = map
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(container.current)
    return () => {
      ro.disconnect()
      setReady(false)
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, interactive])

  // Parents pass fresh arrays every render; only redraw and re-frame when the data actually changes.
  const points = route?.points ?? []
  const dataKey = JSON.stringify([
    points.length,
    points[0],
    points[points.length - 1],
    markers.map((m) => [m.id, m.lat, m.lng]),
    rangeCircle,
    center.lat,
    center.lng,
    zoom,
  ])
  const latest = useRef({ points, markers, rangeCircle, center, zoom })
  latest.current = { points, markers, rangeCircle, center, zoom }

  // Data: route, range ring, markers, framing.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const { points, markers, rangeCircle, center, zoom } = latest.current

    ;(map.getSource(ROUTE) as GeoJSONSource).setData(
      points.length > 1
        ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: points.map((p) => [p.lng, p.lat]) } }
        : EMPTY,
    )
    ;(map.getSource(RANGE) as GeoJSONSource).setData(rangeCircle ? circle(rangeCircle.center, rangeCircle.radiusMeters) : EMPTY)

    markerRefs.current.forEach((m) => m.remove())
    markerRefs.current = markers.map((m) => new mapboxgl.Marker({ element: markerElement(m) }).setLngLat([m.lng, m.lat]).addTo(map))

    const framePoints = points.length > 1 ? points : markers
    if (framePoints.length > 1) {
      const bounds = new mapboxgl.LngLatBounds()
      framePoints.forEach((p) => bounds.extend([p.lng, p.lat] as LngLatLike))
      map.fitBounds(bounds, { padding: 48, duration: 600, pitch: mode === 'navigation' ? 55 : 0 })
    } else if (rangeCircle) {
      const ring = circle(rangeCircle.center, rangeCircle.radiusMeters).geometry.coordinates[0]
      const bounds = new mapboxgl.LngLatBounds()
      ring.forEach((c) => bounds.extend(c as LngLatLike))
      map.fitBounds(bounds, { padding: 24, duration: 600 })
    } else {
      map.easeTo({ center: [center.lng, center.lat], zoom, duration: 600 })
    }
  }, [ready, dataKey, mode])

  return <div ref={container} className={`relative overflow-hidden bg-bg ${className}`} />
}
