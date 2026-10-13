import type { Sim, World } from '../../lib/types'
import { SimAvatar } from '../SimAvatar'
import { Plumbob } from '../Plumbob'
import { mood, moodColor } from '../../game/rules'

export type Focus = { cityId?: string; communeId?: string }

export type PinData = {
  id: string
  lat: number
  lng: number
  label: string
  icon: string
  variant: 'city' | 'commune' | 'place' | 'sim'
  active?: boolean
  hasSim?: boolean
  /** Extra stem length (px) so labels that would collide stack upwards. */
  lift?: number
  onClick?: () => void
}

export type Bounds = [west: number, south: number, east: number, north: number]

export const CIV_BOUNDS: Bounds = [-8.7, 4.3, -2.4, 10.8]

export type MapHandlers = {
  onCity: (cityId: string) => void
  onCommune: (cityId: string, communeId: string) => void
  onPlace: (placeId: string) => void
}

// Home is not a real place in the world data: it sits next to the centre of
// the Sim's home commune.
export const homePosition = (lat: number, lng: number) => ({ lat: lat - 0.004, lng: lng + 0.006 })

export function pinsFor(world: World, focus: Focus, sim: Sim | null, selectedPlace: string | null, h: MapHandlers): PinData[] {
  const city = world.cities.find((c) => c.id === focus.cityId)
  const commune = city?.communes.find((c) => c.id === focus.communeId)
  const pins: PinData[] = []

  if (!city) {
    for (const c of world.cities) {
      pins.push({ id: c.id, lat: c.lat, lng: c.lng, label: c.name, icon: c.id === sim?.homeCity ? '🏠' : '📍', variant: 'city', onClick: () => h.onCity(c.id) })
    }
  } else if (!commune) {
    for (const cm of city.communes) {
      pins.push({
        id: cm.id, lat: cm.lat, lng: cm.lng, label: cm.name,
        icon: cm.id === sim?.homeCommune && city.id === sim?.homeCity ? '🏠' : '🏘️',
        variant: 'commune', onClick: () => h.onCommune(city.id, cm.id),
      })
    }
  } else {
    for (const p of commune.places) {
      pins.push({ id: p.id, lat: p.lat, lng: p.lng, label: p.name, icon: world.kinds[p.kind]?.icon ?? '📍', variant: 'place', active: selectedPlace === p.id, onClick: () => h.onPlace(p.id) })
    }
    if (sim && sim.homeCity === city.id && sim.homeCommune === commune.id) {
      const pos = homePosition(commune.lat, commune.lng)
      pins.push({ id: 'home', ...pos, label: 'Chez toi', icon: '🏠', variant: 'place', active: selectedPlace === 'home', onClick: () => h.onPlace('home') })
    }
  }

  // The player's Sim shows on the pin of where they are; inside a commune
  // they stand as their own marker among the places.
  if (sim) {
    const here = pins.find((p) => (!city ? p.id === sim.city : !commune ? city.id === sim.city && p.id === sim.commune : false))
    if (here) here.hasSim = true
    if (commune && city?.id === sim.city && commune.id === sim.commune) {
      pins.push({ id: 'sim', lat: commune.lat + 0.0015, lng: commune.lng - 0.002, label: sim.firstName, icon: '', variant: 'sim' })
    }
  }
  return pins
}

// Greedy label de-collision: walking north to south, a pin whose bubble would
// overlap one already placed gets a longer stem. Computed against a nominal
// viewport, which is close enough for both the Mapbox and offline maps.
export function liftOverlaps(pins: PinData[], b: Bounds, w = 1000, h = 600): PinData[] {
  const placed: { x: number; y: number; half: number }[] = []
  return [...pins]
    .sort((a, z) => z.lat - a.lat)
    .map((p) => {
      if (p.variant === 'sim') return p
      const x = ((p.lng - b[0]) / (b[2] - b[0])) * w
      const half = 22 + p.label.length * 3.8
      let lift = 0
      while (lift < 120 && placed.some((q) => Math.abs(q.x - x) < q.half + half && Math.abs(q.y - (((b[3] - p.lat) / (b[3] - b[1])) * h - lift)) < 32)) lift += 34
      placed.push({ x, y: ((b[3] - p.lat) / (b[3] - b[1])) * h - lift, half })
      return lift ? { ...p, lift } : p
    })
}

export function boundsFor(world: World, focus: Focus): Bounds {
  const city = world.cities.find((c) => c.id === focus.cityId)
  if (!city) return CIV_BOUNDS
  const commune = city.communes.find((c) => c.id === focus.communeId)
  const pts = commune ? [commune, ...commune.places] : city.communes.flatMap((c) => [c, ...c.places])
  const lats = pts.map((p) => p.lat)
  const lngs = pts.map((p) => p.lng)
  const pad = commune ? 0.012 : 0.03
  return [Math.min(...lngs) - pad, Math.min(...lats) - pad, Math.max(...lngs) + pad, Math.max(...lats) + pad]
}

function Face({ sim, size }: { sim: Sim; size: number }) {
  return (
    <span className="block overflow-hidden rounded-full bg-[var(--color-sand)]" style={{ width: size, height: size }}>
      <span className="block" style={{ marginTop: -size * 0.02, marginLeft: -size * 0.2 }}>
        <SimAvatar look={sim.look} gender={sim.gender} size={size * 1.4} />
      </span>
    </span>
  )
}

export function Pin({ pin, sim }: { pin: PinData; sim: Sim | null }) {
  if (pin.variant === 'sim' && sim) {
    return (
      <div className="pin pointer-events-none" style={{ zIndex: 5 }}>
        <Plumbob size={14} color={moodColor(mood(sim.needs))} />
        <div className="-mt-1 rounded-full bg-white/90 p-0.5 shadow-lg ring-2 ring-[var(--color-orange)]">
          <Face sim={sim} size={44} />
        </div>
      </div>
    )
  }
  return (
    <button type="button" className="pin" data-variant={pin.variant} data-active={pin.active ? 'true' : undefined} onClick={pin.onClick}>
      {pin.hasSim && sim && <Plumbob size={12} color={moodColor(mood(sim.needs))} className="mb-0.5" />}
      <span className="pin-bubble">
        {pin.hasSim && sim ? <Face sim={sim} size={26} /> : <span className="pin-icon">{pin.icon}</span>}
        {pin.label}
      </span>
      <span className="pin-stem" style={pin.lift ? { height: 12 + pin.lift } : undefined} />
    </button>
  )
}
