import type { MapMarker } from './types'

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/** HTML for trip endpoint / multi-stop pins (Leaflet divIcon + Mapbox DOM markers). */
export function routePinHtml(m: MapMarker): string | null {
  const title = escapeAttr(m.label ?? '')
  if (m.variant === 'origin') {
    return `<span class="map-route-pin map-route-pin--origin" title="${title}"><span class="map-route-pin__glyph">A</span></span>`
  }
  if (m.variant === 'destination') {
    return `<span class="map-route-pin map-route-pin--destination" title="${title}"><span class="map-route-pin__glyph">B</span></span>`
  }
  if (m.variant === 'waypoint') {
    const n = m.stopIndex != null ? String(m.stopIndex) : '·'
    const picking = m.selected ? ' map-route-pin--picking' : ''
    return `<span class="map-route-pin map-route-pin--stop${picking}" title="${title}"><span class="map-route-pin__glyph">${n}</span></span>`
  }
  return null
}

export function isRoutePinVariant(v: MapMarker['variant']): boolean {
  return v === 'origin' || v === 'destination' || v === 'waypoint'
}
