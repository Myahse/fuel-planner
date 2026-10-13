import { useEffect, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import civ from '../../assets/civ.geo.json'
import type { Sim } from '../../lib/types'
import { CIV_BOUNDS, Pin, type Bounds, type PinData } from './pins'

type Props = { token: string; pins: PinData[]; bounds: Bounds; night: boolean; sim: Sim | null }

// Everything outside Côte d'Ivoire is dimmed so the country reads like a
// game board.
function worldMask(): GeoJSON.Feature<GeoJSON.Polygon> {
  const holes = (civ.features[0].geometry.coordinates as number[][][][]).map((poly) => poly[0])
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]], ...holes] },
  }
}

export function MapboxMap({ token, pins, bounds, night, sim }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<{ marker: mapboxgl.Marker; root: Root }[]>([])

  useEffect(() => {
    mapboxgl.accessToken = token
    const m = new mapboxgl.Map({
      container: container.current!,
      style: 'mapbox://styles/mapbox/standard',
      config: { basemap: { lightPreset: night ? 'night' : 'day', showPointOfInterestLabels: false } },
      bounds: CIV_BOUNDS,
      maxBounds: [CIV_BOUNDS[0] - 4, CIV_BOUNDS[1] - 3, CIV_BOUNDS[2] + 4, CIV_BOUNDS[3] + 3],
      pitch: 0,
      attributionControl: false,
    })
    m.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
    m.on('load', () => {
      m.addSource('civ', { type: 'geojson', data: civ as GeoJSON.FeatureCollection })
      m.addSource('mask', { type: 'geojson', data: worldMask() })
      m.addLayer({ id: 'mask', type: 'fill', source: 'mask', paint: { 'fill-color': '#0a2622', 'fill-opacity': 0.6 } })
      m.addLayer({ id: 'civ-glow', type: 'line', source: 'civ', paint: { 'line-color': '#f77f00', 'line-width': 10, 'line-opacity': 0.25, 'line-blur': 6 } })
      m.addLayer({ id: 'civ-line', type: 'line', source: 'civ', paint: { 'line-color': '#f77f00', 'line-width': 2.5 } })
    })
    map.current = m
    return () => m.remove()
    // Created once; the effects below keep it in sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    map.current?.fitBounds(bounds, { padding: { top: 110, bottom: 200, left: 40, right: 40 }, duration: 1600, essential: true })
  }, [bounds])

  useEffect(() => {
    const m = map.current
    if (!m) return
    const apply = () => m.setConfigProperty('basemap', 'lightPreset', night ? 'night' : 'day')
    if (m.isStyleLoaded()) apply()
    else m.once('style.load', apply)
  }, [night])

  useEffect(() => {
    const m = map.current
    if (!m) return
    for (const p of pins) {
      const el = document.createElement('div')
      el.style.zIndex = p.variant === 'sim' ? '5' : p.lift ? '1' : '2'
      const root = createRoot(el)
      root.render(<Pin pin={p} sim={sim} />)
      markers.current.push({ marker: new mapboxgl.Marker({ element: el, anchor: 'bottom' }).setLngLat([p.lng, p.lat]).addTo(m), root })
    }
    return () => {
      const old = markers.current
      markers.current = []
      queueMicrotask(() => old.forEach(({ marker, root }) => (root.unmount(), marker.remove())))
    }
  }, [pins, sim])

  return <div ref={container} className="absolute inset-0" />
}
