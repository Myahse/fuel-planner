import { useEffect, useRef, useState } from 'react'
import mapboxgl, { type GeoJSONSource, type LngLatLike } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { MapMarker, MapViewProps } from './types'
import { routePinHtml } from './routePin'
import { MAPBOX_TOKEN, mapStyleFor } from '../../config/mapbox'
import { themeColors, type ThemeColors } from '../../design/tokens'
import { useResolvedTheme } from '../../hooks/useResolvedTheme'

mapboxgl.accessToken = MAPBOX_TOKEN

const ROUTE = 'fuelgo-route'
const RANGE = 'fuelgo-range'
const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

const markerColor = (v: MapMarker['variant'], palette: ThemeColors) =>
  v === 'origin'
    ? palette.fg
    : v === 'destination' || v === 'waypoint'
      ? palette.signal
      : v === 'station'
        ? palette.ok
        : '#4a90d9'

function markerElement(m: MapMarker, palette: ThemeColors, onClick?: (id: string) => void) {
  const routeHtml = routePinHtml(m)
  if (routeHtml) {
    const wrap = document.createElement('div')
    wrap.innerHTML = routeHtml
    const el = wrap.firstElementChild as HTMLElement
    if (onClick) {
      el.style.cursor = 'pointer'
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onClick(m.id)
      })
    }
    return el
  }
  if (m.variant === 'station') {
    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'map-station-pin'
    el.setAttribute('aria-pressed', String(Boolean(m.selected)))
    el.title = m.label ?? 'Fuel station'
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      onClick?.(m.id)
    })
    return el
  }
  if (m.variant === 'city') {
    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'city-pin'
    el.dataset.tone = m.tone ?? 'ok'
    el.setAttribute('aria-pressed', String(Boolean(m.selected)))
    el.append(document.createElement('i'), m.label ?? '')
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      onClick?.(m.id)
    })
    return el
  }
  const el = document.createElement('div')
  const c = markerColor(m.variant, palette)
  el.style.cssText = `width:14px;height:14px;border-radius:4px;background:${c};border:2px solid ${palette.bg}`
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

function addLayers(map: mapboxgl.Map, palette: ThemeColors) {
  map.addSource(ROUTE, { type: 'geojson', data: EMPTY })
  map.addSource(RANGE, { type: 'geojson', data: EMPTY })
  map.addLayer({ id: `${RANGE}-fill`, type: 'fill', source: RANGE, paint: { 'fill-color': palette.signal, 'fill-opacity': 0.1 } })
  map.addLayer({
    id: `${RANGE}-line`,
    type: 'line',
    source: RANGE,
    paint: { 'line-color': palette.signal, 'line-width': 1, 'line-dasharray': [2, 3], 'line-opacity': 0.8 },
  })
  map.addLayer({
    id: `${ROUTE}-casing`,
    type: 'line',
    source: ROUTE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': palette.bg, 'line-width': 9, 'line-opacity': 0.8 },
  })
  map.addLayer({
    id: ROUTE,
    type: 'line',
    source: ROUTE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': palette.signal, 'line-width': 5 },
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
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRefs = useRef<mapboxgl.Marker[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!container.current) return
    const map = new mapboxgl.Map({
      container: container.current,
      style: mapStyleFor(resolvedTheme, mode),
      center: [center.lng, center.lat],
      zoom,
      pitch: mode === 'navigation' ? 55 : 0,
      interactive,
      attributionControl: false,
      cooperativeGestures: false,
    })
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
    if (interactive) map.addControl(new mapboxgl.NavigationControl({ showCompass: mode === 'navigation' }), 'top-left')
    map.on('style.load', () => {
      addLayers(map, palette)
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
  }, [mode, interactive, resolvedTheme])

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
  const latest = useRef({ points, markers, rangeCircle, center, zoom, onMarkerClick, onMapClick, palette, cameraLock })
  latest.current = { points, markers, rangeCircle, center, zoom, onMarkerClick, onMapClick, palette, cameraLock }
  const markerKey = JSON.stringify(
    markers.map((m) => [m.id, m.lat, m.lng, m.variant, m.tone, m.selected, m.label, m.stopIndex]),
  )

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    markerRefs.current.forEach((m) => m.remove())
    markerRefs.current = latest.current.markers.map((m) =>
      new mapboxgl.Marker({
        element: markerElement(m, latest.current.palette, (id) => latest.current.onMarkerClick?.(id)),
        anchor: m.variant === 'city' ? 'left' : 'center',
        offset: m.variant === 'city' ? [-8, 0] : [0, 0],
      })
        .setLngLat([m.lng, m.lat])
        .addTo(map),
    )
  }, [ready, markerKey, resolvedTheme])

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

    const followUser = cameraLock === 'user' && mode !== 'navigation'
    if (followUser) {
      map.easeTo({ center: [center.lng, center.lat], zoom, duration: 400, pitch: 0 })
      return
    }
    const framePoints = points.length > 1 ? points : rangeCircle ? [] : markers
    if (framePoints.length > 1) {
      const bounds = new mapboxgl.LngLatBounds()
      framePoints.forEach((p) => bounds.extend([p.lng, p.lat] as LngLatLike))
      map.fitBounds(bounds, { padding: 48, duration: 600, pitch: mode === 'navigation' ? 55 : 0 })
    } else if (rangeCircle) {
      const ring = circle(rangeCircle.center, rangeCircle.radiusMeters).geometry.coordinates[0]
      const bounds = new mapboxgl.LngLatBounds()
      ring.forEach((c) => bounds.extend(c as LngLatLike))
      map.fitBounds(bounds, { padding: 32, duration: 600, maxZoom: 10 })
    } else {
      map.easeTo({ center: [center.lng, center.lat], zoom, duration: 600 })
    }
  }, [ready, dataKey, mode, cameraLock])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !recenterTick) return
    const { center, zoom } = latest.current
    map.flyTo({ center: [center.lng, center.lat], zoom, duration: 900, pitch: 0, essential: true })
  }, [recenterTick, ready])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !focusPoint) return
    map.easeTo({
      center: [focusPoint.lng, focusPoint.lat],
      zoom: focusZoom,
      duration: 500,
      pitch: mode === 'navigation' ? 55 : 0,
    })
  }, [focusPoint?.lat, focusPoint?.lng, focusZoom, ready, mode])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const onClick = (e: mapboxgl.MapMouseEvent) => {
      if (!latest.current.onMapClick) return
      const target = e.originalEvent.target as HTMLElement
      if (target.closest('.city-pin, .map-station-pin, .map-route-pin, .mapboxgl-ctrl, .mapboxgl-marker')) return
      latest.current.onMapClick(e.lngLat.lat, e.lngLat.lng)
    }
    map.on('click', onClick)
    return () => {
      map.off('click', onClick)
    }
  }, [ready, mapClickActive, onMapClick])

  return <div ref={container} className={`relative h-full w-full min-h-[inherit] overflow-hidden bg-bg ${className}`} />
}
