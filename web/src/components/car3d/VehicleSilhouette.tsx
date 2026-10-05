import type { VehicleBodyType } from '../../config/vehicleModels'
import { CAR_PROFILES } from './carProfiles'

type Props = {
  bodyType: VehicleBodyType
  paint: string
  className?: string
  title?: string
}

/** Flat side-profile drawing. Lists use this so they never spin up a WebGL context per row. */
export function VehicleSilhouette({ bodyType, paint, className = '', title }: Props) {
  const s = CAR_PROFILES[bodyType]
  return (
    <svg viewBox="0 0 120 48" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <line x1="2" x2="118" y1="44.5" y2="44.5" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
      <path d={s.body} fill={paint} stroke="rgb(255 255 255 / 0.18)" strokeWidth="0.75" strokeLinejoin="round" />
      <path d={s.glass} fill="#0a0b0d" fillOpacity="0.85" />
      {s.wheels.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={44 - s.r} r={s.r} fill="#0a0b0d" stroke="rgb(255 255 255 / 0.15)" strokeWidth="0.75" />
          <circle cx={cx} cy={44 - s.r} r={s.r * 0.48} fill="#8d929a" />
        </g>
      ))}
    </svg>
  )
}
