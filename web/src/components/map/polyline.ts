import type { LatLng } from '../../data/mapPlaces'

/** Decodes a Google-encoded polyline (Mapbox `polyline6` uses precision 6). */
export function decodePolyline(encoded: string, precision = 6): LatLng[] {
  const factor = 10 ** precision
  const points: LatLng[] = []
  let index = 0
  let lat = 0
  let lng = 0

  const next = () => {
    let result = 0
    let shift = 0
    let byte: number
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    return result & 1 ? ~(result >> 1) : result >> 1
  }

  while (index < encoded.length) {
    lat += next()
    lng += next()
    points.push({ lat: lat / factor, lng: lng / factor })
  }
  return points
}

/** Encodes coordinates for Mapbox / Google polyline6. */
export function encodePolyline(points: LatLng[], precision = 6): string {
  const factor = 10 ** precision
  let lastLat = 0
  let lastLng = 0
  let out = ''

  const append = (num: number) => {
    let v = num < 0 ? ~(num << 1) : num << 1
    while (v >= 0x20) {
      out += String.fromCharCode((0x20 | (v & 0x1f)) + 63)
      v >>= 5
    }
    out += String.fromCharCode(v + 63)
  }

  for (const p of points) {
    const lat = Math.round(p.lat * factor)
    const lng = Math.round(p.lng * factor)
    append(lat - lastLat)
    append(lng - lastLng)
    lastLat = lat
    lastLng = lng
  }
  return out
}
