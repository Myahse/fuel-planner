import type { Vehicle } from '../api/types'

export type VehicleBodyType = 'sedan' | 'suv' | 'hatchback'

export type VehicleModelConfig = {
  bodyType: VehicleBodyType
  /** When set, load this GLB; otherwise use built-in stylized 3D car */
  glbUrl: string | null
  scale: number
  yOffset: number
  paint: string
  useGltf: boolean
}

const PAINT: Record<string, string> = {
  toyota: '#f8fafc',
  hyundai: '#1e3a5f',
  kia: '#dc2626',
  honda: '#94a3b8',
  default: '#f1f5f9',
}

export const PAINT_PRESETS = [
  { id: 'pearl', label: 'Pearl white', value: '#f8fafc' },
  { id: 'forest', label: 'Forest green', value: '#166534' },
  { id: 'midnight', label: 'Midnight blue', value: '#1e3a5f' },
  { id: 'graphite', label: 'Graphite', value: '#374151' },
  { id: 'crimson', label: 'Crimson', value: '#dc2626' },
  { id: 'champagne', label: 'Champagne', value: '#d4a574' },
] as const

const BODY_DEFAULTS: Record<VehicleBodyType, { scale: number; yOffset: number }> = {
  sedan: { scale: 1, yOffset: 0 },
  hatchback: { scale: 1, yOffset: 0 },
  suv: { scale: 1, yOffset: 0 },
}

export function resolveBodyType(vehicle: Pick<Vehicle, 'make' | 'model' | 'body_style'>): VehicleBodyType {
  if (vehicle.body_style === 'sedan' || vehicle.body_style === 'suv' || vehicle.body_style === 'hatchback') {
    return vehicle.body_style
  }
  const label = `${vehicle.make} ${vehicle.model}`.toLowerCase()
  if (
    label.includes('tucson') ||
    label.includes('sportage') ||
    label.includes('rav4') ||
    label.includes('cr-v') ||
    label.includes('suv') ||
    label.includes('cx-')
  ) {
    return 'suv'
  }
  if (label.includes('golf') || label.includes('yaris') || label.includes('fit') || label.includes('i20')) {
    return 'hatchback'
  }
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

function resolveGlbUrl(vehicle: Pick<Vehicle, 'model_3d_url'>, override?: string): string | null {
  const raw = (override ?? vehicle.model_3d_url ?? '').trim()
  if (!raw) return null
  return raw
}

export function getVehicleModelConfig(
  vehicle: Pick<Vehicle, 'make' | 'model' | 'paint_color' | 'model_3d_url' | 'body_style'>,
  overrides?: { bodyType?: VehicleBodyType; paint?: string; modelUrl?: string },
): VehicleModelConfig {
  const bodyType = overrides?.bodyType ?? resolveBodyType(vehicle)
  const defaults = BODY_DEFAULTS[bodyType]
  const glbUrl = resolveGlbUrl(vehicle, overrides?.modelUrl)
  return {
    bodyType,
    glbUrl,
    useGltf: glbUrl != null,
    scale: defaults.scale,
    yOffset: defaults.yOffset,
    paint: overrides?.paint ?? resolvePaint(vehicle.make, vehicle.paint_color),
  }
}
