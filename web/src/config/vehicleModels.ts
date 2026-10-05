import type { Vehicle } from '../api/types'
import generated from './carModels.generated.json'

export type VehicleBodyType = 'sedan' | 'hatchback' | 'suv' | 'pickup' | 'minivan'

export const BODY_TYPES: { value: VehicleBodyType; label: string }[] = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'suv', label: 'SUV' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'minivan', label: 'Minivan' },
]

/**
 * How paint is applied to a loaded model:
 * - `texture-mask`: Meshy models are baked white; recolour bright, unsaturated texels only (keeps tyres, glass, lights).
 * - `named-material`: custom GLBs; recolour materials whose name contains "paint" or "body".
 */
export type PaintMode = 'texture-mask' | 'named-material'

export type VehicleModelConfig = {
  bodyType: VehicleBodyType
  /** When set, load this GLB; otherwise render the built-in procedural car */
  glbUrl: string | null
  rotationY: number
  paint: string
  paintMode: PaintMode
}

type GeneratedEntry = { url: string; rotationY?: number }
const GENERATED = generated as Partial<Record<VehicleBodyType, GeneratedEntry>>

const PAINT: Record<string, string> = {
  toyota: '#e9eaec',
  hyundai: '#2b3a55',
  kia: '#9e1b1b',
  honda: '#8d939b',
  default: '#d9dbdf',
}

export const PAINT_PRESETS = [
  { id: 'glacier', label: 'Glacier white', value: '#e9eaec' },
  { id: 'graphite', label: 'Graphite', value: '#3a3d42' },
  { id: 'obsidian', label: 'Obsidian', value: '#141518' },
  { id: 'steel', label: 'Steel blue', value: '#2b3a55' },
  { id: 'oxide', label: 'Oxide red', value: '#9e1b1b' },
  { id: 'sand', label: 'Savanna sand', value: '#b89a6a' },
  { id: 'signal', label: 'Signal amber', value: '#e89a12' },
] as const

const BODY_STYLES = new Set<string>(BODY_TYPES.map((b) => b.value))

export function resolveBodyType(vehicle: Pick<Vehicle, 'make' | 'model' | 'body_style'>): VehicleBodyType {
  if (vehicle.body_style && BODY_STYLES.has(vehicle.body_style)) return vehicle.body_style as VehicleBodyType
  const label = `${vehicle.make} ${vehicle.model}`.toLowerCase()
  if (/hilux|ranger|navara|l200|d-max|pickup|tacoma|amarok/.test(label)) return 'pickup'
  if (/sienna|odyssey|sharan|carnival|previa|minivan|alphard|hiace/.test(label)) return 'minivan'
  if (/tucson|sportage|rav4|cr-v|suv|cx-|prado|land cruiser|fortuner|x-trail/.test(label)) return 'suv'
  if (/golf|yaris|fit|i20|polo|picanto|clio/.test(label)) return 'hatchback'
  return 'sedan'
}

export function resolvePaint(make: string, paintColor?: string | null) {
  if (paintColor && /^#[0-9A-Fa-f]{6}$/.test(paintColor)) return paintColor
  const key = make.trim().toLowerCase()
  for (const [brand, color] of Object.entries(PAINT)) {
    if (key.includes(brand)) return color
  }
  return PAINT.default
}

export function getVehicleModelConfig(
  vehicle: Pick<Vehicle, 'make' | 'model' | 'paint_color' | 'model_3d_url' | 'body_style'>,
  overrides?: { bodyType?: VehicleBodyType; paint?: string; modelUrl?: string },
): VehicleModelConfig {
  const bodyType = overrides?.bodyType ?? resolveBodyType(vehicle)
  const custom = (overrides?.modelUrl ?? vehicle.model_3d_url ?? '').trim()
  const paint = overrides?.paint ?? resolvePaint(vehicle.make, vehicle.paint_color)
  if (custom) {
    return { bodyType, glbUrl: custom, rotationY: 0, paint, paintMode: 'named-material' }
  }
  const gen = GENERATED[bodyType]
  return {
    bodyType,
    glbUrl: gen?.url ?? null,
    rotationY: gen?.rotationY ?? 0,
    paint,
    paintMode: 'texture-mask',
  }
}
